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

- 左侧面板：搜索 / 地标 / 画幅 / **白模 / 贴面** / **实景 / 程序化** / **飞行音效** / 录制。
- 输入城市或点地标后，镜头自己飞过去。呼啸声是 WebAudio 合成的，没有音频文件；「关」会静音。离线成片不播放声音。
- **贴面**（默认）：程序化窗格（没有贴图文件）。超高塔是间距更大的蓝灰反射幕墙，住宅是砖色小窗加阳台，多层是混凝土，首层店铺会亮。屋顶是深色。地标单独编号（明珠和茧是玻璃，帝国大厦是石材开窗，铁塔是格构）。**白模**把同一套几何涂回浅色。
- **预设城市**：面板里按地区筛选，大约 40 座。标了「程序化」的是中国大陆，不会请求实景。其余城市以及搜索框里的地点都会试实景；落地后如果几秒内看不到高细节建筑，就回到程序化。
- **漫游**（默认「掠过」）：掠过、环绕、巡礼、升起，都是斜俯视，不抬头。「自由浏览」或 Esc、拖拽、滚轮会停下：左键平移，右键或 Ctrl 拖拽旋转，滚轮朝光标缩放。镜头不会钻到地面下面。
- **录制模式**：隐藏全部 UI。进入城市后约 3.6 秒，贴面从下往上长出来，然后按当前漫游方式移动。离线成片用同一条时间轴。
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

程序化城市和 Google 实景用的是同一个开关。实景画面上的 Google 标志和瓦片版权字符串也默认不画。公开发布的视频，以及任何对外部署，必须打开，包括：

```bash
bun run shoot:photoreal --attribution
```

## 实景模式

有 Google 覆盖的城市可以改看 Cesium ion 上的 Google Photorealistic 3D Tiles（资产 `2275207`）。瓦片只在内存里流式加载，不落盘，也不导出模型。一次打开页面只创建一次瓦片集，换城市只改坐标。

这些城市下降时不显示 MapLibre 的灰色挤出楼。瓦片在下降中段开始流入，并和地球交叉淡化；镜头从地球连续落到斜俯视，位置、朝向和俯角都不跳。离线拍摄会在逐帧开始前先预加载这段下降。

覆盖不是一张写死的城市名单。中国大陆（不含香港、澳门、台湾）直接程序化。其他地方先用同一个瓦片集去看：可见瓦片的几何误差要小于约 48 米，而且网格要有明显高度，才算有建筑。安静大约 8 秒还没有，就改回程序化，瓦片集仍然留着。陡坡可能被当成建筑；网络一直在加载时，这 8 秒会计时暂停。

预设 id（`shoot:photoreal --city=` 用这些）：

东亚 `tokyo-shinjuku` `tokyo-shibuya` `osaka-umeda` `kyoto-station` `hongkong-central` `taipei-101` `seoul-city-hall` `shanghai-lujiazui`（程序化） `beijing-cbd`（程序化）

东南亚与大洋洲 `singapore-marina-bay` `bangkok-sathorn` `sydney-opera` `melbourne-cbd`

中东与非洲 `dubai-burj` `istanbul-sultanahmet` `cairo-pyramids` `cape-town`

美洲 `nyc-midtown` `nyc-downtown` `chicago-loop` `san-francisco` `los-angeles` `las-vegas` `seattle-downtown` `toronto-downtown` `mexico-city` `rio-copacabana` `miami-downtown` `vancouver-downtown`

欧洲 `london-westminster` `paris-eiffel` `rome-colosseum` `barcelona-sagrada` `madrid-gran-via` `berlin-alex` `amsterdam-canals` `prague-old-town` `vienna-stephansdom` `venice-san-marco` `lisbon-baixa` `athens-acropolis`

中国大陆（陆家嘴、国贸，以及搜索到的大陆地点）没有这套实景，会自动回到程序化城市。没有令牌、令牌无效，或根瓦片加载失败时也一样。面板上的「实景 / 程序化」可以手动切回去。

Cesium ion 的 Community 账号只给个人、非商业用途。根瓦片每个月大约 1000 次请求，所以不要反复刷新页面。

```bash
cd apps/fly-to-city
cp .env.example .env.local
# 编辑 .env.local，填上 VITE_CESIUM_ION_TOKEN，不要提交这个文件
```

在 [Cesium ion](https://ion.cesium.com/tokens) 里把这个令牌的允许 URL 限制为 `localhost`。改完 `.env.local` 后重启 `bun run dev`，交互页面才会读到令牌。

用令牌拍新宿和香港（一个页面、大约 15 秒 720p 预览，外加两张定格）。先开着开发服务器：

```bash
bun run dev
bun run shoot:photoreal
bun run shoot:photoreal -- --city=paris-eiffel --roam=tour
```

`--roam` 可以是 `flyover`（默认）、`orbit`、`tour`、`rise`。不写 `--city` 时仍是新宿飞入，再定格新宿和香港。写了就只拍这一座。

离线成片同样可以指定漫游，预览默认掠过：

```bash
bun run render:preview -- --roam=orbit
bun run render:16x9 -- --roam=flyover
```

输出默认在 `apps/fly-to-city/photoreal-out/`（`shinjuku-preview.mp4`、`shinjuku.png`、`hongkong.png`、`globe-midflight.png`）。目录可用 `RENDER_OUT` 改。没有令牌时这条命令会直接退出，不会打开浏览器。

`render:16x9`、`render:9x16`、`render:preview` 也会读 `.env.local`。有令牌时，有覆盖的城市会等瓦片加载完再截；没有令牌时地址栏带 `photoreal=0`，成片仍是程序化城市。令牌只注入页面，不出现在地址栏里。

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
- 实景模式：[Google Photorealistic 3D Tiles](https://developers.google.com/maps/documentation/tile/3d-tiles)（Cesium ion 资产 2275207），经 [3d-tiles-renderer](https://github.com/NASA-AMMOS/3DTilesRendererJS) 流式显示。署名打开时，版权字符串以瓦片自己报告的为准

## 局限

- 大陆超高层往往不在 CMAB / CNBH 里。CNBH 在这几个 CBD 的 zonal mean 大约到 45 米，CMAB 按 IoU>0.5 对上的楼不多，塔楼高度仍靠 Overture 和手工地标。
- 香港地政总署三维数据是网格场景，没有逐栋高度。巴黎没有 IGN 账号，高度来自 Overture 和楼层数。
- 新宿 PLATEAU LOD2 贴图和当前挤出体不是同一套几何，所以没有贴上去。
- 卫星被矢量盖住的地方（路、公园、水面）以矢量颜色为准；没有盖住的地面能看到放大后的 14 级影像。
- 车道线是主干道上的中心线，不是逐车道标线。
- 速度线画在地球上面的透明层里，不会去模糊 MapLibre 那张画布。视场只在飞行途中拉开，进城后回到斜俯视。
- 实景是流式网格，锚在城市中心的椭球面上。镜头高度相对这个锚点，不是相对屋顶。推荐误差保持插件给的 20，没有把瓦片缓存到磁盘。
- 这台机器没有 ion 令牌，所以这里的预览只验证了没有令牌时的程序化回退。真实实景要在你自己的机器上用 `bun run shoot:photoreal` 看。建筑探测的误差阈值没有用真瓦片核对过。
