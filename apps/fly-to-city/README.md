# Fly to City · 全屏白模城市

MapLibre 地球飞入 → **铺满视口** 的 three.js 白模城市（约 3.5km 范围 OSM 建筑）。地面是同一套 OpenFreeMap 矢量瓦片烘焙出的浅色地图（道路、公园、水面，无标注、无建筑），阴影落在这张图上。支持 8 地标预烘焙、Photon 搜索、录制模式与标题叠层。

## 运行

```bash
cd apps/fly-to-city
bun install
bun run dev
```

```bash
bun run build
```

## 预烘焙

```bash
bun run bake:all
```

数据在 `public/data/*.json`（默认抓取半径约 3.5km）。

楼高（离线烘焙，运行时不再请求这些数据源）：

```bash
bun run bake:heights
```

`bake:heights` 先用 Overture Maps 建筑（2026-10-21.0）写轮廓和已有高度，再按优先级补测高：官方测量 > Overture 高度 > 楼层数 × 3.2 > CMAB > CNBH-10m > 启发式。CMAB、CNBH、PLATEAU 的原始文件大约 2GB，不进仓库。需要重跑后两级时，先执行 `bash scripts/fetch-height-sources.sh`（下到 `/tmp/height-data`），再执行 `python3 scripts/enrich-heights.py`。开发模式打开控制台可以看到每个城市的高度来源占比。

## 操作

- 左侧面板：搜索 / 地标 / 画幅 / **白模 / 贴面** / 录制。
- **贴面**：程序化窗格（没有贴图文件）。办公塔是玻璃幕墙，住宅是小窗加阳台带，低层首层是大玻璃。地标有单独的材质（明珠和茧是玻璃，帝国大厦是石材开窗，铁塔是格构）。
- **录制模式**：隐藏全部 UI。进入城市后约 3.6 秒，贴面从下往上长出来。离线成片用同一条时间轴。
- **离线成片**（逐帧截 `#stage`，画面只有应用画布，不要用桌面录屏）。正式成片请在有 GPU 的机器上跑，一条命令即可：

```bash
bun run dev
bun run render:16x9   # 1920×1080，30fps，42s，地球 → 陆家嘴 → 东京
bun run render:9x16   # 1080×1920，30fps，24s
```

城市段落的前 3.6 秒，贴面会从下往上长出来。短预览（1280×720，24fps，15s，只含地球飞入和陆家嘴环绕，阴影贴图 2048，像素比 1）：

```bash
bun run render:preview
bun run render:reveal   # 只要陆家嘴贴面长出的 4 秒，12fps，用来检查
```

无独立 GPU 的环境可加 `SWIFTSHADER=1`，会慢非常多，不适合正式成片。浏览器路径用 `CHROME_PATH`，输出目录用 `RENDER_OUT`（默认 `/opt/cursor/artifacts`）。

## 数据致谢

- [Overture Maps](https://overturemaps.org) 建筑轮廓与高度，release 2026-10-21.0（底层含 OpenStreetMap © 贡献者，[ODbL](https://www.openstreetmap.org/copyright)）
- 上海、北京楼高：[CMAB](https://figshare.com/articles/dataset/CMAB-The_World_s_First_National-Scale_Multi-Attribute_Building_Dataset/27992417)（CC BY 4.0），对不上的用 [CNBH-10m](https://zenodo.org/records/7923866)
- 香港：CNBH-10m。地政总署三维空间数据是网格场景，没有逐栋高度
- 东京新宿：[PLATEAU 新宿区 2025 CityGML](https://www.geospatial.jp/ckan/dataset/plateau-13104-shinjuku-ku-2025) 的 measuredHeight。LOD2 贴图是另一套 3D Tiles（约 560MB），和当前挤出体不是同一几何，所以新宿贴面仍用程序化窗格
- 纽约：[NYC Building Footprints](https://data.cityofnewyork.us/Housing-Development/Building-Footprints/5zhs-2jue) 的 `height_roof`（英尺换算成米）
- 巴黎：IGN BD TOPO 需要账号，高度来自 Overture 和楼层数，没有官方覆盖
- [OpenFreeMap](https://openfreemap.org) 地面
- [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/)（Terrarium）
- Photon 地理编码（Komoot）
