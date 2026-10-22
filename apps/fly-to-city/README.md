# Fly to City · 飞入彩色城市

搜索或点地标后，镜头从地球第一人称冲向目的地：细速度线从画面中心散开，穿过云层，速度最高时视场略拉开，再减速俯冲进铺满视口的 three.js 城市（约 3.5km）。地面是 OpenFreeMap 矢量（道路、公园、水面、广场）叠在 EOX Sentinel-2 卫星影像上烘焙出来的，阴影落在这张图上。建筑默认是彩色立面，白模只是开关。支持 8 地标预烘焙、Photon 搜索、录制模式与标题叠层。

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

- 左侧面板：搜索 / 地标 / 画幅 / **白模 / 贴面** / **飞行音效** / 录制。
- 输入城市或点地标后，镜头自己飞过去。呼啸声是 WebAudio 合成的，没有音频文件；「关」会静音。离线成片不播放声音。
- **贴面**（默认）：程序化窗格（没有贴图文件）。超高塔是间距更大的蓝灰反射幕墙，住宅是砖色小窗加阳台，多层是混凝土，首层店铺会亮。屋顶是深色。地标单独编号（明珠和茧是玻璃，帝国大厦是石材开窗，铁塔是格构）。**白模**把同一套几何涂回浅色。
- **录制模式**：隐藏全部 UI。进入城市后约 3.6 秒，贴面从下往上长出来，镜头沿同一俯角收进定稿机位。离线成片用同一条时间轴。
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

## 署名

开发和预览默认**不**叠署名，方便先看干净画面。公开发布的视频，以及任何对外部署，必须打开署名：画面左下角会出现 Google 标志，以及 OpenStreetMap、OpenFreeMap、Overture、EOX Sentinel-2 的数据来源。

三种开法，任一即可：

```bash
# 地址栏
http://localhost:5173/?attribution=1

# 本地或部署环境
VITE_SHOW_ATTRIBUTION=1 bun run dev

# 离线成片（render:16x9、render:9x16、render:preview 同样）
bun run render:16x9 --attribution
```

`?attribution=0` 会强制关掉，即使环境变量已经打开。

## 数据致谢

- [Overture Maps](https://overturemaps.org) 建筑轮廓与高度，release 2026-10-21.0（底层含 OpenStreetMap © 贡献者，[ODbL](https://www.openstreetmap.org/copyright)）
- 上海、北京楼高：[CMAB](https://figshare.com/articles/dataset/CMAB-The_World_s_First_National-Scale_Multi-Attribute_Building_Dataset/27992417)（CC BY 4.0），对不上的用 [CNBH-10m](https://zenodo.org/records/7923866)
- 香港：CNBH-10m。地政总署三维空间数据是网格场景，没有逐栋高度
- 东京新宿：[PLATEAU 新宿区 2025 CityGML](https://www.geospatial.jp/ckan/dataset/plateau-13104-shinjuku-ku-2025) 的 measuredHeight。LOD2 贴图是另一套 3D Tiles（约 560MB），和当前挤出体不是同一几何，所以新宿贴面仍用程序化窗格
- 纽约：[NYC Building Footprints](https://data.cityofnewyork.us/Housing-Development/Building-Footprints/5zhs-2jue) 的 `height_roof`（英尺换算成米）
- 巴黎：IGN BD TOPO 需要账号，高度来自 Overture 和楼层数，没有官方覆盖
- [OpenFreeMap](https://openfreemap.org) / [OpenMapTiles](https://openmaptiles.org) 地面矢量（道路、水系、绿地、铁路）。© OpenStreetMap 贡献者，[ODbL](https://www.openstreetmap.org/copyright)
- 卫星底图：[Sentinel-2 cloudless 2020 by EOX](https://s2maps.eu)（CC BY 4.0），含修改过的 Copernicus Sentinel 数据。当前 WMTS 没有 2016 图层，所以用同一产品的 2020 版，并且只请求到 14 级，城市范围会略放大
- 呼啸声：WebAudio 实时合成，没有采样。画面上的速度线和云也是程序画的
- [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/)（Terrarium）
- Photon 地理编码（Komoot）

## 局限

- 大陆超高层往往不在 CMAB / CNBH 里。CNBH 在这几个 CBD 的 zonal mean 大约到 45 米，CMAB 按 IoU>0.5 对上的楼不多，塔楼高度仍靠 Overture 和手工地标。
- 香港地政总署三维数据是网格场景，没有逐栋高度。巴黎没有 IGN 账号，高度来自 Overture 和楼层数。
- 新宿 PLATEAU LOD2 贴图和当前挤出体不是同一套几何，所以没有贴上去。
- 卫星被矢量盖住的地方（路、公园、水面）以矢量颜色为准；没有盖住的地面能看到放大后的 14 级影像。
- 车道线是主干道上的中心线，不是逐车道标线。
- 速度线画在地球上面的透明层里，不会去模糊 MapLibre 那张画布。视场只在飞行途中拉开，进城后回到斜俯视。
