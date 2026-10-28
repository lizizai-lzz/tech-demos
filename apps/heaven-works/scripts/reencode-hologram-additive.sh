#!/usr/bin/env bash
# 将 VP9 alpha 母带合成到黑底，供 WebGL AdditiveBlending 播放（Chromium 友好）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ffmpeg -y -f lavfi -i color=c=black:s=1280x720:r=24:d=5 \
  -i "$ROOT/public/hologram-devices.webm" \
  -filter_complex "[0:v][1:v]overlay=0:0:shortest=1:format=auto,format=yuv420p" \
  -c:v libvpx-vp9 -pix_fmt yuv420p -b:v 0 -crf 26 -an \
  "$ROOT/public/hologram-devices-additive.webm"
