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

## 操作

- 左侧面板：搜索 / 地标 / 画幅 / 录制。
- **录制模式**：隐藏全部 UI。
- **离线成片**（逐帧截 `#stage`，画面只有应用画布，不要用桌面录屏）。正式成片请在有 GPU 的机器上跑，一条命令即可：

```bash
bun run dev
bun run render:16x9   # 1920×1080，30fps，42s，地球 → 陆家嘴 → 东京
bun run render:9x16   # 1080×1920，30fps，24s
```

短预览（1280×720，24fps，15s，只含地球飞入和陆家嘴环绕，阴影贴图 2048，像素比 1）：

```bash
bun run render:preview
```

无独立 GPU 的环境可加 `SWIFTSHADER=1`，会慢非常多，不适合正式成片。浏览器路径用 `CHROME_PATH`，输出目录用 `RENDER_OUT`（默认 `/opt/cursor/artifacts`）。

## 数据致谢

- OpenStreetMap © 贡献者（[ODbL](https://www.openstreetmap.org/copyright)）
- [OpenFreeMap](https://openfreemap.org)
- [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/)（Terrarium）
- Photon 地理编码（Komoot）
