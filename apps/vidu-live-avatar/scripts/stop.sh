#!/usr/bin/env bash
#   scripts/stop.sh          stop the current session (free; always safe to run)
#   scripts/stop.sh all      stop session, watchdogs and the server started by start.sh
set -uo pipefail
KIT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="http://127.0.0.1:${PORT:-28900}"
r="$(curl -s --noproxy '*' -m 15 -X POST "$BASE/api/session/stop" -H 'Content-Type: application/json' -d '{}')" \
  && echo "[stop] session: $(echo "$r" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status'))" 2>/dev/null || echo "$r")" \
  || echo "[stop] server not reachable at $BASE"
if [ "${1:-}" = all ]; then
  pkill -f "$KIT/scripts/watchdog.py" 2>/dev/null && echo "[stop] watchdog killed"
  if [ -f "$KIT/logs/server.pid" ] && kill "$(cat "$KIT/logs/server.pid")" 2>/dev/null; then echo "[stop] server stopped"
  elif pkill -f "$KIT/ai-live-avatar/.venv/bin/python server.py" 2>/dev/null; then echo "[stop] server stopped"; fi
  rm -f "$KIT/logs/server.pid"
fi
