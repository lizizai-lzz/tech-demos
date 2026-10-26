# seedance-skill-os — Seedance 导演台（空跑版）

灵感来源（形态与工作流，**不复制上游 skill 文案或代码**）：

- [Emily2040/seedance-2.0](https://github.com/Emily2040/seedance-2.0) — Seedance 2.0 Skill OS：面试澄清 → 分镜表 → 可执行提示词 → 续拍/排障
- 书签帖：[搞 AI 视频生成的，这个 GitHub 仓库…](https://x.com/bkdgiffug/status/2112303527720530034)（@bkdgiffug）

本 demo 在浏览器里用 **纯 TypeScript 模板 + 假延迟** 模拟「导演模型」流水线，输出分镜表与 Seedance 风格提示词；**不调用任何付费视频 API**。

## Goal

单页导演台：用户输入一句中文场景想法（或选示例），按步骤得到 brief、分镜表、可复制的生产级提示词，并可对「糊、抖、跑题」等假结果走排障提示。

## MVP

### In

- 纵向步骤条：想法 → 澄清问答（1–2 题）→ Brief → 分镜表（3–5 镜）→ 提示词 →（可选）排障
- 至少 3 个中文示例种子（短剧对白戏、产品开箱、城市夜景 B-roll）
- 每镜展示：镜号、景别、运镜、时长、画面意图、对白/音效备注
- 一键复制整段提示词 / 导出 JSON（brief + shots + prompt）
- 本地空跑开关默认开；假延迟可感知「agent 在编译」
- 中文 UI；Bun + Vite + React + TS；shadcn/ui；`bunfig.toml` 含 `minimumReleaseAge = 259200`
- `cd apps/seedance-skill-os && bun install && bun run dev` 可跑通

### Outs

真实 Seedance / 即梦 / 其它视频生成 API、鉴权、多用户、后端持久化、克隆 seedance-2.0 skill 原文、收费积分、i18n。

## Tasks（垂直切片）

1. **脚手架** — Vite+React+TS；`bunfig.toml`；shadcn 基础壳；本 `PLAN.md` + README。
2. **导演流水线** — `src/pipeline/`：interview → brief → shots → prompt（模板字符串，确定性假数据）；可选 troubleshoot 映射表。
3. **导演台 UI** — 步骤条、示例切换、粘贴想法、开始/单步/重跑；右侧或下方展示分镜表与提示词卡片。
4. **导出与测试** — JSON 下载；`bun test` 覆盖阶段顺序与镜数；PR 附至少 1 张截图 + 1 段运行视频。

## Stack rationale

- **Bun + Vite + React + TS**：无后端 SPA，符合 monorepo AGENTS.md。
- **本地模板流水线**：对齐「Skill OS 把意图编译成提示词」的卖点，又避开付费生成与无卡限制。
- **shadcn/ui**：与同仓其它 demo 视觉一致。

## Deferred

- 接真实视频提供商（BYOK）。
- 续拍（continuation）时间线对照上一镜参考图。
- 版权/品牌安全检查器（seedance-copyright 类）。
