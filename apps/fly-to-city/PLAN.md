# Fly to City — 实景与程序化城市

## Goal
从地球第一人称冲进一座城市，有 Google 实景覆盖时看流式实景，没有覆盖或没有 token 时落到现有的程序化城市，最后都停在定稿的斜俯视机位。

## MVP（in）
1. MapLibre 地球 + OpenFreeMap；Photon 搜索和 8 个地标。搜索或点地标后，镜头沿弧线飞向目的地。
2. 飞行是第一人称：速度线从目的地散开、穿过云层、速度最高时视场略拉开，再沿同一俯角减速收进城市。呼啸声用 WebAudio 合成，面板可静音。离线成片走同一条时间轴。
3. 实景模式：用 3d-tiles-renderer 在现有 three.js 场景里流式加载 Cesium ion 上的 Google Photorealistic 3D Tiles（资产 2275207）。一次会话只创建一次瓦片集。下降时机位连续，实景交叉淡入，不显示 MapLibre 灰色挤出楼。Google 标志和版权字符串走署名开关，默认关闭。
4. 面板可在实景 / 程序化之间切换。中国大陆城市（陆家嘴、国贸）没有实景覆盖，没有 token 时也自动回到程序化城市。程序化城市仍是彩色立面、地图地面、树和定稿机位。
5. 标题、可折叠面板、录制模式，以及 `render:16x9` / `render:9x16` / `render:preview`。有 token 时成片会等实景瓦片加载完再截。`shoot:photoreal` 在一次会话里拍新宿、香港和一段 15 秒预览。

## Outs
剖切、地层沙盘、把瓦片烘焙或导出到磁盘、付费 ion 套餐、Mapbox / 百度 / 高德影像、后端、移动端深度适配。

## Tasks
1. 实景瓦片接进现有场景：token、覆盖判断、一次创建、城市切换只改坐标、程序化模型在实景范围内隐藏。
2. 署名：程序化和实景共用 `?attribution=1` / `VITE_SHOW_ATTRIBUTION=1` / `--attribution`，默认关闭。公开发布必须打开。
3. 成片和 `shoot:photoreal`：从 `.env.local` 读 token，下降前预加载瓦片，逐帧等加载完成，单页会话不超过数次根请求。

## Stack rationale
- 3d-tiles-renderer：NASA-AMMOS 的 3D Tiles 渲染器，带 Cesium ion / Google 插件，直接放进现有 three.js 场景，飞行和机位代码不用换引擎。
- 不换 CesiumJS：它会变成第二套地球和相机，和 MapLibre 地球、R3F 后处理叠在一起。
- Cesium ion 资产 2275207：Google Photorealistic 3D Tiles，只流式请求，不落盘。
- Bun + Vite + React、MapLibre、three.js / R3F、WebAudio、shadcn/ui：和原来的演示一致。

## Deferred
瓦片磁盘缓存、GLB 导出、夜景、配乐卡点、逐车道标线、PLATEAU LOD2 贴图（和挤出体不是同一套几何）、更紧的屏幕误差（会多下子瓦片）。

## 局限
- 令牌不进仓库。Community 许可只覆盖个人、非商业使用。根瓦片每月大约 1000 次，一次页面会话只加载一次。
- 大陆城市没有实景覆盖。没有令牌或加载失败时回到程序化城市。
- 没有把瓦片写到磁盘。KTX2 只在内存里解码。实景材质如果不是 unlit，场景里的暖色光可能给它染色；这台环境没有令牌，不能在这里确认。
- 镜头锚在椭球面，不跟地形抬高。定稿机位仍然是原来的斜俯视。
