#!/usr/bin/env bash
# One-shot, idempotent setup of garycaogan/ai-live-avatar (pinned) + this kit. macOS & Linux.
#
#   VIDU_API_KEY=vda_xxx AVATAR_IMAGE=/path/to/photo.png ./setup.sh
#
# Env (all optional):
#   VIDU_API_KEY      written to ~/.deepsea/vidu/api.key (chmod 600), never printed
#   OBS_WS_PASSWORD   OBS WebSocket password -> ~/.deepsea/obs/ws.password (chmod 600), never printed
#   AVATAR_IMAGE      photo to crop to 1.2:1 half-body -> ai-live-avatar/assets/avatars/<PROFILE_KEY>.jpg
#   PROFILE_KEY PROFILE_NAME VOICE GREETING BUDGET_CREDITS MAX_SESSION_MINUTES VIDU_ENV   (see scripts/render_config.py)
#   FORCE_CONFIG=1    re-render config.json even if it exists
#   UPSTREAM_URL      git URL of upstream (default GitHub; set a mirror if GitHub is slow)
#   PYTHON            python >= 3.11 to use (auto-detected)
#   PIP_INDEX_URL     e.g. https://pypi.tuna.tsinghua.edu.cn/simple  (honoured by pip)
set -euo pipefail
UPSTREAM_SHA=5559ec5440c93814737155183dbe832df0b9f215
UPSTREAM_URL="${UPSTREAM_URL:-https://github.com/garycaogan/ai-live-avatar.git}"
KIT="$(cd "$(dirname "$0")" && pwd)"
UP="$KIT/ai-live-avatar"
PROFILE_KEY="${PROFILE_KEY:-zizai-demo}"; export PROFILE_KEY
say() { printf '\033[1m[setup]\033[0m %s\n' "$*"; }
die() { printf '\033[31m[setup] ERROR:\033[0m %s\n' "$*" >&2; exit 1; }
warn() { printf '\033[33m[setup] WARN:\033[0m %s\n' "$*" >&2; }

# ---------- 1. prerequisites ----------
for c in git curl; do command -v $c >/dev/null || die "$c not found (macOS: xcode-select --install / brew install $c; Linux: apt install $c)"; done
if [ -z "${PYTHON:-}" ]; then
  for c in python3.13 python3.12 python3.11 python3; do
    if command -v $c >/dev/null && $c -c 'import sys; sys.exit(sys.version_info < (3, 11))' 2>/dev/null; then PYTHON=$c; break; fi
  done
fi
[ -n "${PYTHON:-}" ] || die "need Python >= 3.11 (macOS: brew install python@3.13; Ubuntu: apt install python3.12 python3.12-venv)"
say "python: $($PYTHON --version) ($(command -v $PYTHON))"
if command -v ffmpeg >/dev/null; then
  enc="$(ffmpeg -hide_banner -encoders 2>/dev/null || true)"
  echo "$enc" | grep -q libx264 || warn "ffmpeg lacks libx264 (needed for built-in streaming/recording only)"
  echo "$enc" | grep -qE ' aac ' || warn "ffmpeg lacks aac encoder"
  say "ffmpeg: ok"
else
  warn "ffmpeg not found (brew install ffmpeg / apt install ffmpeg). Needed for built-in streaming/recording; OBS route works without it."
fi

# ---------- 2. upstream at pinned SHA ----------
if [ ! -d "$UP/.git" ]; then
  say "cloning $UPSTREAM_URL"
  git clone --quiet "$UPSTREAM_URL" "$UP" || die "git clone failed. If GitHub is slow, retry or set UPSTREAM_URL to a mirror."
fi
if [ "$(git -C "$UP" rev-parse HEAD)" != "$UPSTREAM_SHA" ]; then
  git -C "$UP" cat-file -e "$UPSTREAM_SHA^{commit}" 2>/dev/null || git -C "$UP" fetch --quiet origin || die "git fetch failed"
  git -C "$UP" diff --quiet || die "$UP has local changes and is not at $UPSTREAM_SHA; move it away and rerun"
  git -C "$UP" -c advice.detachedHead=false checkout --quiet "$UPSTREAM_SHA"
fi
say "upstream: $(git -C "$UP" log -1 --format='%h %s')"

# ---------- 3. venv + deps ----------
[ -x "$UP/.venv/bin/python" ] || { say "creating venv"; $PYTHON -m venv "$UP/.venv"; }
"$UP/.venv/bin/python" -c 'import aiohttp, PIL, numpy' 2>/dev/null || {
  say "pip install -r requirements.txt"
  "$UP/.venv/bin/python" -m pip install --quiet --upgrade pip
  "$UP/.venv/bin/python" -m pip install --quiet -r "$UP/requirements.txt"
}
say "deps: ok"

# ---------- 4. Aliyun RTC web SDK (license: fetched from Aliyun CDN, checksum-verified, never committed) ----------
SDK="$UP/static/vendor/aliyun-rtc-sdk-7.1.9.js"
if [ ! -s "$SDK" ]; then
  say "fetching Aliyun RTC SDK via tools/fetch_vendor.sh"
  if command -v shasum >/dev/null; then (cd "$UP" && sh tools/fetch_vendor.sh)
  else  # some Linux distros ship sha256sum but not shasum
    shim="$(mktemp -d)"; printf '#!/bin/sh\nshift 2; exec sha256sum "$@"\n' >"$shim/shasum"; chmod +x "$shim/shasum"
    (cd "$UP" && PATH="$shim:$PATH" sh tools/fetch_vendor.sh); rm -rf "$shim"
  fi
fi
say "rtc sdk: ok"

# ---------- 5. our patches ----------
for p in "$KIT"/patches/*.patch; do
  [ -e "$p" ] || continue
  if git -C "$UP" apply --reverse --check "$p" 2>/dev/null; then say "patch already applied: $(basename "$p")"
  elif git -C "$UP" apply --check "$p" 2>/dev/null; then git -C "$UP" apply "$p"; say "patch applied: $(basename "$p")"
  else die "patch does not apply: $p"; fi
done

# ---------- 6. persona + config ----------
mkdir -p "$UP/personas" "$UP/assets/avatars"
for f in "$KIT"/personas/*.md; do [ -e "$UP/personas/$(basename "$f")" ] || cp "$f" "$UP/personas/"; done
$PYTHON "$KIT/scripts/render_config.py" "$UP/config.json"

# ---------- 7. Vidu key (never echoed) ----------
KEYF="$HOME/.deepsea/vidu/api.key"
if [ -n "${VIDU_API_KEY:-}" ]; then
  case "$VIDU_API_KEY" in vda_*) ;; *) warn "VIDU_API_KEY does not start with vda_ - double-check it";; esac
  mkdir -p "$(dirname "$KEYF")"; chmod 700 "$HOME/.deepsea" "$(dirname "$KEYF")"
  (umask 077; printf '%s\n' "$VIDU_API_KEY" >"$KEYF"); chmod 600 "$KEYF"
  say "vidu key: written to ~/.deepsea/vidu/api.key (600)"
elif [ -s "$KEYF" ]; then say "vidu key: file present (not shown)"
else warn "no Vidu key yet: rerun with VIDU_API_KEY=vda_... ./setup.sh (free dry runs work without it)"; fi

if [ -n "${OBS_WS_PASSWORD:-}" ]; then
  mkdir -p "$HOME/.deepsea/obs"; chmod 700 "$HOME/.deepsea" "$HOME/.deepsea/obs"
  (umask 077; printf '%s\n' "$OBS_WS_PASSWORD" >"$HOME/.deepsea/obs/ws.password"); chmod 600 "$HOME/.deepsea/obs/ws.password"
  say "obs websocket password: written to ~/.deepsea/obs/ws.password (600)"
fi

# ---------- 8. avatar ----------
IMG="$UP/assets/avatars/$PROFILE_KEY.jpg"
if [ -n "${AVATAR_IMAGE:-}" ]; then
  "$UP/.venv/bin/python" "$KIT/scripts/prepare_avatar.py" "$AVATAR_IMAGE" --name "$PROFILE_KEY" --out-dir "$UP/assets/avatars"
elif [ -s "$IMG" ]; then say "avatar: $IMG present"
else warn "no avatar yet: rerun with AVATAR_IMAGE=/path/to/photo ./setup.sh"; fi

chmod +x "$KIT"/scripts/*.sh "$KIT"/scripts/*.py 2>/dev/null || true
say "done. Next (see AGENTS.md):"
echo "   scripts/start.sh server && scripts/start.sh dry && python3 scripts/stun_check.py"
