# AI 姿势参考台（空跑版）

单页姿势检索台：按体系 / 分类 / 视角筛选姿势，在灯箱中切换角度，并一键复制中英双语 AI 生图提示词。

## 灵感来源（不镜像上游素材）

交互形态参考 [anhao/ai-pose-gallery-zh](https://github.com/anhao/ai-pose-gallery-zh)（中文 AI 姿势参考图库）。**本 demo 为 dry-run**：

- 不克隆上游仓库、不下载其图片、不复制原站 HTML
- 主视觉为 **SVG 火柴人 / 几何占位**
- 数据为 `src/data/poses.json` 本地样例（约 30 条，仅 **全身·标准系** 与 **上半身**）

## 本地运行

```bash
cd apps/ai-pose-gallery
bun install
bun run dev
```

```bash
bun test
bun run build
```

## 功能速览

- 搜索（`/` 聚焦）+ 体系页签 + 视角多选 + 重置
- **按姿势分组** / **逐张浏览** 两种主区布局
- 灯箱：`←` / `→` 切视角、`Esc` 关闭、复制 ID / 复制提示词
