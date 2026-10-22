# Fly to City · 全屏白模城市

MapLibre 地球飞入 → 无缝切换为 **铺满视口** 的 three.js 白模城市（约 3.5km 范围 OSM 数据 + 远景雾），支持 8 地标预烘焙、Photon 搜索、录制模式与标题叠层。

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
- **离线成片**（推荐，避免实时录屏抖动）：

```bash
bun run dev
bun run render -- 16:9
bun run render -- 9:16
```

`?render=1&fps=30&duration=42` 用固定时间轴逐帧截 `#stage`，再由 ffmpeg 合成。画面只有应用画布。

## 数据致谢

- OpenStreetMap © 贡献者（[ODbL](https://www.openstreetmap.org/copyright)）
- [OpenFreeMap](https://openfreemap.org)
- [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/)（Terrarium）
- Photon 地理编码（Komoot）
