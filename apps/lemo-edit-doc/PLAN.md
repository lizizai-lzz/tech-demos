# lemo-edit-doc — Lemo「剪辑与纪实」风格台（空跑版）

灵感来源（形态与语法，**不复制上游 STYLE.md / skill 原文或样片代码**）：

- [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) — 代码做片风格工具箱；2026-10-22 新增「剪辑与纪实」8 种风格
- 书签帖：[Lemo-Opuscar 史诗级更新：8种新风格+新改编玩法…](https://x.com/lemomo_ai/status/2113195080517562646)（@lemomo_ai）

本 demo 在浏览器里用 **Canvas / CSS 动效 + 假数据** 演示 8 种「剪辑与纪实」语法的视觉气质；**不调用 Claude / 视频模型 / 上游渲染管线**。

## Goal

单页风格台：点选 8 种「剪辑与纪实」风格之一，立刻看到对应视觉语法的短循环预览，并带一段可读的中文「风格口诀」与可复制 brief 模板。

## MVP

### In

- 左侧（或顶部）风格索引：8 项，中英名 + 文件夹 slug 对齐上游索引（仅作标签，不搬原文）
  - Caption News / 字幕新闻 · `caption-news`
  - 1920s Newsreel / 1920s 新闻影片 · `newsreel`
  - Live Countdown Split-screen / 实时倒计时分屏 · `countdown`
  - Time-lapse Symphony / 延时交响 · `city-symphony`
  - Visual Investigation / 视觉调查 · `visual-investigation`
  - Constructivist Montage / 构成主义蒙太奇 · `kino-montage`
  - Sports Telestrator / 体育战术板 · `telestrator`
  - Broadcast News Package / 电视新闻包装 · `news-package`
- 主舞台：每种风格一个自包含预览组件（约 8–12s 循环），用假素材（几何块、假字幕、假时间轴、假地图/数据点），**一眼能区分语法**
- 右侧卡：一句话卖点 + 3–5 条「口诀」（我们自己写的短句，不抄 STYLE.md）+ 「复制 brief」按钮（中文模板：主题 / 时长 / 素材类型 / 旁白语气）
- 至少 1 个全局示例主题开关（如「本周 AI」或「城市一天」），切换时预览文案跟着变
- 中文 UI；Bun + Vite + React + TS；shadcn/ui；`bunfig.toml` 含 `minimumReleaseAge = 259200`
- `cd apps/lemo-edit-doc && bun install && bun run dev` 可跑通

### Outs

克隆 lemo-opuscar 仓库或 skill 原文、Claude Code 插件、真实逐帧截图 / ffmpeg 成片、上游样片媒体、鉴权、多用户、后端持久化、i18n。

## Tasks（垂直切片）

1. **脚手架** — Vite+React+TS；`bunfig.toml`；shadcn 基础壳；本 `PLAN.md` + README。
2. **风格注册表** — `src/styles/`：8 条元数据（id、中英名、slug、口诀、brief 模板）；`bun test` 覆盖数量与 slug 唯一。
3. **八预览** — 每种一个循环动画组件（可共用时间轴 hook）；主舞台切换无闪断；默认选中 `caption-news`。
4. **主题 + 导出** — 全局示例主题；复制 brief；PR 附至少 1 张截图 + 1 段运行视频（切换 2–3 种风格）。

## Stack rationale

- **Bun + Vite + React + TS**：无后端 SPA，符合 monorepo AGENTS.md。
- **本地 Canvas/CSS 预览**：对齐「代码做片 / 语法可见」卖点，又避开 Claude 与视频模型依赖（云端 agent 也不用 Claude）。
- **shadcn/ui**：与同仓其它 demo 视觉一致。

## Deferred

- 接真实 Remotion / Canvas→ffmpeg 导出。
- 「改成你自己的风格」编辑器（品牌色 / logo / 口吻）。
- 与栏目制作 skill 的一键交接包。