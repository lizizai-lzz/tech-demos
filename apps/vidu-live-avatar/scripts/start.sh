#!/usr/bin/env bash
# Helpers for the ai-live-avatar server. Run from anywhere.
#   scripts/start.sh server   start the server in the background (idempotent), wait until /api/state answers
#   scripts/start.sh dry      free dry run: start (dry_run=true) -> 5 s -> stop. Never calls Vidu.
#   scripts/start.sh real     PAID: preflight (key, network, stage page) -> watchdog FIRST -> start (dry_run=false)
#                             -> stays in the foreground until the watchdog/session ends. Ctrl-C = stop session.
# Env: PORT (28900)  PROFILE (from config)  MODEL (vidu-s2)  VIDEO_TIMEOUT (20)  HARD_LIMIT (90 s, raise for
#      longer shows, never above safety.max_session_minutes*60)  SKIP_NETWORK_CHECK=1  REQUIRE_STAGE=0
set -euo pipefail
KIT="$(cd "$(dirname "$0")/.." && pwd)"
UP="$KIT/ai-live-avatar"
PORT="${PORT:-28900}"
BASE="http://127.0.0.1:$PORT"
PY="$UP/.venv/bin/python"
mkdir -p "$KIT/logs"
export NO_PROXY="127.0.0.1,localhost${NO_PROXY:+,$NO_PROXY}" no_proxy="127.0.0.1,localhost${no_proxy:+,$no_proxy}"
CURL=(curl -s --noproxy '*' -m 15)

state() { "${CURL[@]}" "$BASE/api/state"; }
field() { python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('$1'))"; }

server() {
  if state >/dev/null 2>&1; then echo "[start] server already up at $BASE/workbench"; return 0; fi
  [ -x "$PY" ] || { echo "[start] $PY missing - run ./setup.sh first" >&2; exit 1; }
  (cd "$UP" || exit 1; nohup "$PY" server.py --port "$PORT" >>"$KIT/logs/server.log" 2>&1 & echo $! >"$KIT/logs/server.pid")
  for _ in $(seq 1 30); do
    if state >/dev/null 2>&1; then echo "[start] server up (pid $(cat "$KIT/logs/server.pid")): $BASE/workbench  log: logs/server.log"; return 0; fi
    sleep 1
  done
  echo "[start] server did not come up; last log lines:" >&2; tail -n 30 "$KIT/logs/server.log" >&2; exit 1
}

body() { # $1 = true|false  -> JSON body for /api/session/start
  DRY="$1" PROFILE="${PROFILE:-}" MODEL="${MODEL:-vidu-s2}" python3 -c '
import json, os
d = {"model": os.environ["MODEL"], "dry_run": os.environ["DRY"] == "true"}
if os.environ["PROFILE"]:
    d["profile"] = os.environ["PROFILE"]
print(json.dumps(d))'
}

dry() {
  server
  echo "[dry] start (free, no Vidu call)"
  "${CURL[@]}" -X POST "$BASE/api/session/start" -H 'Content-Type: application/json' -d "$(body true)" | field status
  sleep 5
  echo "[dry] state: $(state | field status)"
  "${CURL[@]}" -X POST "$BASE/api/session/stop" -H 'Content-Type: application/json' -d '{}' | field status
  echo "[dry] OK"
}

real() {
  server
  local s; s="$(state)"
  [ "$(echo "$s" | field has_api_key)" = "True" ] || { echo "[real] ABORT: server has no Vidu key (setup.sh with VIDU_API_KEY, then restart server)" >&2; exit 1; }
  case "$(echo "$s" | field status)" in creating|connecting|waiting_stage|live) echo "[real] ABORT: a session is already active" >&2; exit 1;; esac
  if [ "${SKIP_NETWORK_CHECK:-0}" != 1 ]; then
    set +e; python3 "$KIT/scripts/stun_check.py"; rc=$?; set -e
    [ $rc = 1 ] && { echo "[real] ABORT: no UDP/STUN - video would never connect but credits would burn" >&2; exit 1; }
  fi
  if [ "${REQUIRE_STAGE:-1}" = 1 ] && [ "$(echo "$s" | field stage_owner)" != "True" ]; then
    echo "[real] ABORT: no stage page holds the RTC seat. Output mode is '$(echo "$s" | field output_mode)'." >&2
    echo "        local -> open $BASE/workbench (直播间 preview connected); obs -> OBS browser source /stage?obs=1&role=obs&layer=avatar" >&2
    exit 1
  fi
  local wlog="$KIT/logs/watchdog-$(date +%Y%m%d-%H%M%S).log"
  python3 -u "$KIT/scripts/watchdog.py" --base "$BASE" --video-timeout "${VIDEO_TIMEOUT:-20}" \
    --hard-limit "${HARD_LIMIT:-90}" --prelive-limit 60 --wait 120 >"$wlog" 2>&1 &
  local wd=$!
  for _ in $(seq 1 10); do grep -q armed "$wlog" 2>/dev/null && break; sleep 0.5; done
  grep -q armed "$wlog" || { echo "[real] ABORT: watchdog failed to arm" >&2; cat "$wlog" >&2; kill $wd 2>/dev/null; exit 1; }
  cat "$wlog"
  trap 'echo "[real] interrupted -> stopping session"; "${CURL[@]}" -X POST "$BASE/api/session/stop" -d "{}" -H "Content-Type: application/json" >/dev/null; kill $wd 2>/dev/null; exit 130' INT TERM
  echo "[real] PAID start ($(body false)) - 1.5 credits/s ≈ ¥0.047/s"
  local r; r="$("${CURL[@]}" -X POST "$BASE/api/session/start" -H 'Content-Type: application/json' -d "$(body false)")"
  local err; err="$(echo "$r" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('error') or '')" 2>/dev/null || echo "bad response: $r")"
  if [ -n "$err" ]; then echo "[real] start failed: $err (see TROUBLESHOOTING.md)" >&2; kill $wd 2>/dev/null; exit 1; fi
  echo "[real] -> $(echo "$r" | field status)"
  # portable follow (BSD tail has no --pid): print new watchdog lines + a status line every 10 s
  local n=2 l i=0
  while kill -0 $wd 2>/dev/null; do
    sleep 1; i=$((i + 1))
    l=$(wc -l <"$wlog" | tr -d ' ')
    if [ "$l" -ge "$n" ]; then sed -n "${n},${l}p" "$wlog"; n=$((l + 1)); fi
    [ $((i % 10)) = 0 ] && echo "[real] $(state | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['status'], 'elapsed', d.get('elapsed'), 's, stage_joined', d.get('stage_joined'))" 2>/dev/null)"
  done
  sed -n "${n},\$p" "$wlog"
  wait $wd 2>/dev/null || true
  echo "[real] final: $(state | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['status'], d.get('end_reason'), 'elapsed', d.get('elapsed'), 's')")"
}

case "${1:-}" in
  server) server ;;
  dry) dry ;;
  real) real ;;
  *) sed -n '2,9p' "$0"; exit 1 ;;
esac
