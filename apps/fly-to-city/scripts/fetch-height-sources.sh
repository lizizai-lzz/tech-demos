#!/usr/bin/env bash
# 下载真实楼高的离线数据到 /tmp/height-data（约 2GB，不要提交进 git）。
# 下完再执行：python3 scripts/enrich-heights.py
set -euo pipefail
mkdir -p /tmp/height-data
cd /tmp/height-data
curl -fL --retry 3 -o cnbh-hk.tif "https://zenodo.org/api/records/7923866/files/CNBH10m_X115Y23.tif/content"
curl -fL --retry 3 -o cnbh-bj.tif "https://zenodo.org/api/records/7923866/files/CNBH10m_X117Y39.tif/content"
curl -fL --retry 3 -o cnbh-sh.tif "https://zenodo.org/api/records/7923866/files/CNBH10m_X121Y31.tif/content"
curl -fL --retry 3 -o cmab-bj.zip "https://ndownloader.figshare.com/files/53666768"
curl -fL --retry 3 -o cmab-sh.zip "https://ndownloader.figshare.com/files/53799290"
curl -fL --retry 3 -o plateau-shinjuku.zip "https://assets.cms.plateau.reearth.io/assets/db/2866b9-e3c2-4bc4-83d3-b7b42e9b85a1/13104_shinjuku-ku_pref_2025_citygml_1_op.zip"
ls -lh
