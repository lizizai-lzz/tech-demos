# Fly to City — 城市沙盘飞行 + 剖切 demo

## Goal
输入任意城市地址或点选标志性区域，镜头从地球飞到该城市，落地后把地标区域「切」成一块带剖面的白模沙盘，并能用剖切面横扫建筑露出楼层截面，适合直接录成吸睛短视频。

## 参考
- 视频号《做城市设计，别再从零搭建场地模型了》（jifto.com）：白模建筑 + 绿色团状树 + 浅蓝水面，矩形/切块沙盘悬浮在纯白背景，切口有厚度（浅灰蓝底座），强方向光软阴影 + 重 AO，低角度慢环绕 + 缓推，2.5–3 秒硬切，上方大字城市名 + 灰色地标小字（如 "TOKYO / Shinjuku Station - Japan"）。
- 社媒爆款 "Fly to Anywhere"：输入地址，从地球视角一路飞到目的地。
- 我们要更高：① 地球→城市→地标的连续飞行；② 沙盘侧面是真实地形剖面（分层地层色带）；③ 可交互剖切平面横扫建筑，切口露出楼板分层（红/橙截面盖）；④ 一键录制模式出片。

## MVP（in）
1. **地球飞行**：MapLibre GL（v5 globe 投影）+ OpenFreeMap 免 Key 底图。搜索框（Photon/Nominatim 免费地理编码，带节流）或预设地标卡片 → `flyTo` 弧线飞行，途中 3D 建筑渐显。
2. **落地切块**：到达后淡出地图，切换到 three.js 沙盘场景（同一画布或叠层，过渡要顺）。沙盘约 1.2km × 1.2km（可调 0.6–2km），方形或圆角方形。
3. **数据（免费、无 Key）**：
   - 建筑：OSM Overpass（`building` 轮廓 + `height` / `building:levels`×3.2m，缺省按类型给默认高度）。
   - 树：`natural=tree` 点 + `leisure=park` / `landuse=grass|forest` 面内撒点 → 绿色团状球体（InstancedMesh）。
   - 水：`natural=water`、`waterway=riverbank`、海岸线 → 浅蓝平面。
   - 地形：AWS Terrarium 高程瓦片（免费）→ 网格地面；**侧壁剖面**按深度画 3–4 层地层色带（表土/黏土/砂岩/基岩，柔和配色），顶面道路浅灰。
   - **预设地标预烘焙**：脚本 `scripts/bake.ts` 把预设区域的数据抓成 `public/data/<id>.json` 提交进仓库，保证录视频时不依赖 Overpass 在线；任意地址则在线现抓 + 加载进度。
4. **预设地标（至少 8 个）**：上海·陆家嘴、北京·国贸 CBD、香港·中环/维港、东京·新宿站、新加坡·滨海湾金沙、悉尼·歌剧院与岩石区、纽约·曼哈顿中城、巴黎·埃菲尔铁塔/战神广场。
5. **渲染质感**：纯白/极浅灰背景，方向光软阴影（PCFSoft，阴影贴图够大），N8AO 或 SSAO 后处理，轻微色调映射；建筑纯白、树 pastel 绿、水浅蓝。目标是建筑模型那种「微缩沙盘」质感。
6. **剖切（亮点）**：一个竖直剖切平面（three.js clippingPlanes + stencil 截面盖）可沿 X/Y 方向拖动或自动横扫；建筑生成内部楼板（每 3.5m 一层），被切开时截面显示红/橙色实心盖 + 楼层分层线；沙盘侧面也同步显示地层截面。开关：整体剖切 / 只切建筑。
7. **镜头与录制模式**：慢环绕 + 缓推；标题叠层（大字城市名英文 + 中文、灰色地标小字）；「录制模式」隐藏 UI、按 16:9 或 9:16 画幅、自动走：飞入 → 落地切块 → 环绕 → 剖切横扫 → 定格。用 `MediaRecorder` 导出 webm（可选）。
8. **UI**：shadcn/ui 极简：搜索框、地标卡片条、沙盘尺寸滑杆、剖切开关/滑杆、画幅切换、录制按钮。中文界面。

## Outs
登录、账号、后端服务、付费数据源（Google 3D Tiles/Cesium ion 等需 Key 的）、日照/风环境等真实分析、数据下载导出（GLB/DXF 留到 Deferred）、移动端适配。

## Tasks（垂直切片）
1. 脚手架（`bunx create-vite` react-ts + shadcn + bunfig.toml）+ MapLibre 地球 + 搜索/地标 → flyTo 能飞。
2. 预烘焙一个地标（新宿）→ three.js 沙盘：建筑白模 + 地面 + 光影 AO，从地图无缝切过去。
3. 地形 + 侧壁地层剖面 + 树 + 水，质感对齐参考视频。
4. 剖切平面 + 截面盖 + 楼板分层，自动横扫动画。
5. 其余 7 个地标预烘焙 + 任意地址在线现抓（进度、失败兜底提示）。
6. 标题叠层 + 录制模式（16:9 / 9:16）+ 导出。
7. 打磨：过渡丝滑、帧率（InstancedMesh/合并几何）、README、截图与录屏进 PR。

## Stack rationale
- MapLibre GL v5 + OpenFreeMap：免 Key 地球与飞行。
- three.js（可用 @react-three/fiber + drei + postprocessing/N8AO）：沙盘、阴影、AO、剖切与 stencil。
- OSM Overpass + AWS Terrarium：免费真实数据；预烘焙保证演示稳定。
- Bun + Vite + shadcn：仓库约定。

## Validation（PR 必须）
- 至少 2 张截图（沙盘环绕、剖切横扫各一）+ 至少 1 段录屏（飞入→切块→剖切全流程，≥30 秒）。
- `bun install && bun run dev` 一条命令可跑；`bun run build` 通过。

## Deferred
GLB/OBJ 导出、日照阴影时间轴、夜景灯光模式、中国城市高精度建筑数据源、多块沙盘拼排、配乐卡点自动剪辑。
