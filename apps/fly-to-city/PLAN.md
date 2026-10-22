# Fly to City — 全屏白模城市飞行 demo

## Goal
从地球飞到地标，无缝切入**铺满全屏**的白模城市（无沙盘边缘、无剖切），斜俯视电影感环绕（向下约 17°，与东京参考机位同俯角，高度约低 25%），适合录短视频。

离线成片：`bun run dev` 后执行 `bun run render -- 16:9` 与 `bun run render -- 9:16`（`?render=1` 固定时钟 + 逐帧截图 + ffmpeg）。

## MVP（in）
1. MapLibre GL v5 地球 + OpenFreeMap；Photon 搜索 + 8 地标卡片 → 弧线飞入。
2. 落地后全屏 three.js 场景（100vw×100vh）：约 **3.5km** 半径 OSM 建筑/树/水 + 超大浅灰地面，远景雾化为白/浅灰。
3. 预烘焙 `public/data/*.json`（Overpass + Terrarium）；自定义地址在线抓取。
4. 白建筑、pastel 绿树、浅蓝水面、软阴影 + 明显 N8AO；斜俯视慢环绕 + 缓推（俯角保持，不抬头）。
5. 标题叠层；录制模式（16:9 / 9:16）隐藏全部 UI，自动：飞入 → 白模城市 → 环绕 → 定格（可串联多地标）。
6. 左侧可折叠极简控制面板，不遮挡画面。

## Outs
剖切/地层沙盘、付费 3D Tiles、后端、移动端深度适配。

## Validation
- PR：全屏环绕截图（上海、东京各一）+ 9:16 一帧 + ≥30s 全流程录屏。
- `bun install && bun run dev`；`bun run build` 通过。

## Deferred
瓦片流式加载、GLB 导出、夜景、配乐卡点。
