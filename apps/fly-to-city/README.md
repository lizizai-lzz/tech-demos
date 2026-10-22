# Fly to City · 城市沙盘飞行

从 MapLibre 地球视角飞到全球任意地址或预设地标，无缝切入 three.js 白模沙盘：地形侧壁地层剖面、浅蓝水面、团状绿树、软阴影与 N8AO，并支持剖切平面横扫露出楼板截面。适合一键录制 16:9 / 9:16 短视频。

## 运行

```bash
cd apps/fly-to-city
bun install
bun run dev
```

浏览器打开终端提示的本地地址。生产构建：

```bash
bun run build
bun run preview
```

## 预烘焙数据

8 个地标数据已提交在 `public/data/*.json`。如需重新抓取 OSM + 地形：

```bash
bun run bake:all
# 或单个：bun run bake tokyo-shinjuku
```

## 数据与版权

- **OpenStreetMap** 建筑/树木/水面轮廓：[ODbL](https://www.openstreetmap.org/copyright)
- **OpenFreeMap** 地球底图样式与矢量瓦片：[openfreemap.org](https://openfreemap.org)
- **AWS Terrain Tiles（Terrarium）** 地形高程：[https://registry.opendata.aws/terrain-tiles/](https://registry.opendata.aws/terrain-tiles/)
- 地理编码：**Photon**（Komoot，免费接口，请合理使用节流）

## 操作提示

- 点击地标卡片或搜索地址后「飞到此处」：地球弧线飞入 → 自动切换沙盘。
- 剖切开关与滑杆可手动横扫；「录制模式」将自动播放飞入、环绕、剖切并尝试导出 WebM（依赖浏览器 `captureStream` 支持）。
