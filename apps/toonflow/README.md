# toonflow — AI 短剧无限画布（空跑版）

浏览器内的 Toonflow 风格工作台：**小说片段 → 大纲 → 角色 → 剧本 → 分镜**，在可平移缩放的无限画布上逐阶段生成节点。所有「生成」均为本地 TypeScript 模板与规则，**不调用任何付费模型 API**，也无需 API Key。

灵感来源（仅参考产品形态，未复制代码）：[HBAI-Ltd/Toonflow-app](https://github.com/HBAI-Ltd/Toonflow-app)（MIT）。

## 运行

```bash
cd apps/toonflow
bun install
bun run dev
```

浏览器打开终端提示的本地地址（通常为 `http://localhost:5173`）。

其他命令：

- `bun run build` — 生产构建
- `bun test src` — 流水线单元测试
- `bun run lint` — Oxlint

## 使用说明

1. 在左侧选择示例项目，或粘贴 ≤800 字的短篇原文。
2. 点击 **开始空跑**：画布按阶段依次出现大纲、角色卡、剧本场次、分镜卡，并用连线表示流向。
3. **暂停 / 单步** 可控制节奏；点击任意节点打开详情 Sheet，可本地改标题与正文，或对关联阶段 **重新生成此节点**（仍为本机模板重掷）。
4. 画布平移/缩放会写入 `localStorage`（上次视口与原文片段）。

## 与上游 Toonflow 的差异

| 能力 | 本 demo | 上游 Toonflow |
|------|---------|----------------|
| 无限画布 | `@xyflow/react` 平移缩放 | 完整节点编辑器 |
| 生成 | 本地规则 + 假延迟 | Agent + 自选 LLM/图像/视频 |
| 部署 | 纯前端 SPA | 可 Docker / 桌面端 |
| 鉴权 / 插件 | 无 | 支持扩展与路由 |

## 技术栈

- Bun + Vite + React + TypeScript
- Tailwind CSS 4 + shadcn/ui
- `@xyflow/react` 画布
- 流水线逻辑：`src/pipeline/`（含 `bun test`）
