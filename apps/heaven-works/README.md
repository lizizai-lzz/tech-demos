# HEAVEN WORKS 天工开物

**Dry-run 可视化演示** — 灵感来自网络上流行的 HEAVEN WORKS 风格 Agent 作战室大屏；**不是**真实的卫星或多 Agent 编排系统，所有数据均为本地模拟 tick。

## 运行

```bash
cd apps/heaven-works
bun install
bun run dev
```

浏览器打开终端提示的本地地址（默认 `5173`）。建议 **桌面宽屏** 查看左右 FUI 面板与中央 Three.js 场景。

## 构建

```bash
bun run build
bun run preview
```

## 功能概览

- 赛博朋克 FUI 作战室布局：Loop Units、LOOP.PY 滚动控制台、项目管线、SILK 热力图、交付日志
- 中央 **React Three Fiber** 场景：遥控卫星 + 8 单元无人机、阶段卡片平台、**底部粒子全息网站线框**（桌面 / 平板 / 手机）与透视网格地面
- **光柱**从单元 → 阶段卡 → 全息投影点；Bloom 后处理增强粒子发光
- 顶栏 **视角切换** 切换三种相机预设；指标 FPS / Heartbeat / Knots 等为假数据循环

## 技术栈

Vite · React · TypeScript · Bun · Three.js · @react-three/fiber · @react-three/drei · @react-three/postprocessing · Tailwind CSS

## 免责声明

本项目仅用于 UI/3D 概念验证与 monorepo demo，不包含后端、认证、持久化或生产部署配置。
