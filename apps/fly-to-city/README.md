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
- **录制模式**：隐藏全部 UI，自动播放上海 → 东京（飞入 → 环绕 → 定格）。可加 `?autorecord=1` 便于录屏。

## 数据致谢

- OpenStreetMap © 贡献者（[ODbL](https://www.openstreetmap.org/copyright)）
- [OpenFreeMap](https://openfreemap.org)
- [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/)（Terrarium）
- Photon 地理编码（Komoot）
