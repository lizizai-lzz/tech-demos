# HEAVEN WORKS 天工开物

**Dry-run 可视化演示** — 灵感来自 HEAVEN WORKS 风格 Agent 作战室大屏；**不是**真实卫星或多 Agent 编排。

## 运行

```bash
cd apps/heaven-works
bun install
bun run dev
```

建议桌面宽屏（Chrome / Chromium）查看。底部全息为 **VP9 透明 WebM** 循环贴图。

## 构建

```bash
bun run build
bun run preview
```

## 功能概览

- 赛博朋克 FUI 侧栏 + 模拟 tick
- **混合 3D：** 网格 / 卫星与单元 / 阶段卡 / 光柱为 **实时 R3F**
- **底部全息：** 运行时播放 `public/hologram-devices-additive.webm`（alpha 母带 `hologram-devices.webm` 合成到黑底后的 VP9 yuv420p）+ **AdditiveBlending**（避免 Chromium WebGL 误处理 VP9 alpha premul）
- Bloom 后处理；顶栏视角切换与假指标

## 浏览器说明

- **Chrome / Edge / Chromium：** VP9 alpha WebM 正常透明叠加在网格上。
- **Safari：** 可能无法正确显示 WebM alpha；后续可接 qtrle MOV 回退（本仓库未包含 ~127MB 资产）。

## 技术栈

Vite · React · TypeScript · Bun · Three.js · R3F · drei · postprocessing · Tailwind

## 免责声明

仅 UI/3D 概念验证 demo，无后端、认证或生产部署。
