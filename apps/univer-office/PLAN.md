# univer-office — Univer 表格 + 脚本化 Agent 时间线（空跑版）

灵感来源（形态与交互，**不接入商业插件 / Server SDK / 官方 AI 扩展、不调用任何 LLM**）：

- 上游：[dream-num/univer](https://github.com/dream-num/univer)（Apache-2.0 开源包；官网 https://univer.ai）
- 来源帖（公开 X 备选，非书签）：[UniverHQ 动态](https://x.com/univerHQ/status/2123083740511617424)（@univerHQ）

本 demo 在浏览器内嵌 **开源 Univer Sheets**，预置一份虚构「内容周报」工作簿；侧栏 **脚本化 Agent 时间线**逐步写单元格、套公式、高亮选区，用户仍可手工编辑并看到公式重算。

## Goal

单页本地表格工作台：开源 Univer 嵌入 + 中文 UI + 无模型 Agent 演示时间线，展示「办公表格 + Agent 协作」的空跑形态。

## MVP

### In

- Bun + Vite + React + TS；`bunfig.toml` 含 `minimumReleaseAge = 259200`
- 依赖仅限 `@univerjs/presets`、`@univerjs/preset-sheets-core`（及 peer），**不**克隆 univer 单仓、**不**添加商业 Web 插件、Server SDK、官方 AI 扩展
- 嵌入可编辑电子表格；预置多工作表「内容周报」：本周选题、渠道数据、周报汇总（含跨表 `SUM` 公式）
- 右侧 Agent 时间线：按步骤切换表、写单元格、设置公式、高亮区域；**无 LLM、无登录**
- 中文界面（Univer `zh-CN` 预设语言包 + 应用壳文案）
- `bun test`：工作簿 fixture 结构与渠道阅读量合计逻辑；`bun run build` 通过
- README：运行方式、灵感/上游、空跑与许可边界

### Outs

- XLSX 导入/导出、协同编辑、Univer Server、商业插件与官方 AI 扩展、真实大模型 API、用户认证、持久化后端、克隆上游 monorepo。

## Tasks（垂直切片）

1. **脚手架与 PLAN** — Vite+React；`bunfig.toml`；本 `PLAN.md` + tracking 登记；README 骨架。
2. **工作簿 fixture + Univer 嵌入** — `IWorkbookData` 三表 + 汇总公式；`zh-CN` 预设初始化；用户可编辑。
3. **Agent 侧栏** — 步骤定义与执行器（Facade：`setValue` / `setFormula` / `setBackgroundColor` / `activate`）；播放与重置。
4. **测试与验收** — fixture/合计单测；build；PR 附截图 + 短视频（打开页、改单元格、播放 Agent）。

## Stack rationale

- **Univer preset-sheets-core**：官方推荐 Vite 嵌入路径，Apache-2.0 边界清晰。
- **Bun + Vite + React**：与同仓 AGENTS.md 一致；纯前端、无后端。
- **脚本 Agent**：演示「逐步操作表格」而不触碰许可不明的 AI 扩展。
- **shadcn/ui**：侧栏时间线极简样式，与同仓其它 demo 一致。

## Deferred

- 只读演示 Docs/Slides 预设。
- 本地 JSON 导入替换周报数据。
- 将 Agent 步骤改为用户可编辑脚本（仍不接 LLM）。