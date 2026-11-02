# word-atlas — 词光式插画背词台（空跑版）

灵感来源（形态与交互，**不镜像上游 7k 词库/插画素材、不搬原站**）：

- [designfuchen/word-atlas](https://github.com/designfuchen/word-atlas) — 词光 · Word Atlas（7,298 雅思词 · 插画 · 英美发音 · FSRS）
- 书签帖：[AI 教育开源项目整理（含词光）](https://x.com/slashui/status/2116383058735554610)（@slashui，书签热度很高）

本 demo 在浏览器里用 **自写小样词库 + SVG/几何插画占位 + 简化 FSRS** 演示「看见 → 想起 → 复习排期 → 星图进度」；**不下载上游插画/音频、不托管 CC 词库全文**。

## Goal

单页插画背词台：今日学习、词卡翻面回忆、四选一测验，并把复习间隔用简化 FSRS 排到本地；侧栏星图按话题点亮进度。

## MVP

### In

- 顶部：今日待学 / 待复习计数 + 「开始今日」；目标记忆率滑条（约 0.8–0.95，默认 0.9）
- 学习流（happy path）：词卡正面（插画占位 + 英文词）→ 翻面（中英释义 + 一句例句）→ 「记得 / 模糊 / 忘记」三键；或「看义选词」四选一
- 样例数据：本地 JSON，约 **24–36 词**，分 4–6 个话题（如旅行、学术、情感、科技）；字段含 id、lemma、phonetic、zh、en gloss、example、topic
- 插画：每词一张 SVG/几何插画占位（按话题配色，不抄上游画）
- 简化 FSRS：本地实现最小调度（stability / difficulty / due）；`localStorage` 持久化进度；一键导出/清空进度 JSON
- 星图：话题节点网格或简易 canvas；亮度 = 该话题已掌握比例；点击打开该话题词列表
- 中文 UI；Bun + Vite + React + TS；shadcn/ui；`bunfig.toml` 含 `minimumReleaseAge = 259200`
- `cd apps/word-atlas && bun install && bun run dev` 可跑通

### Outs

克隆/镜像上游仓库与 7k 词库、真实插画 CDN、TTS/英美真人发音、完整 ts-fsrs 全参数、账号同步、iOS App、PWA 离线缓存全量媒体、i18n、后端。

## Tasks（垂直切片）

1. **脚手架** — Vite+React+TS；`bunfig.toml`；shadcn 基础壳；本 `PLAN.md` + README（灵感来源与「空跑/无上游素材」说明）。
2. **词库 + 今日队列** — `src/data/words.json` + 话题类型；今日新词/复习队列 hook；`bun test` 覆盖 id 唯一与队列切片。
3. **词卡学习流** — 翻面卡、记得/模糊/忘记、看义选词；简化 FSRS 更新 due；进度写入 `localStorage`。
4. **星图 + 导出** — 话题进度星图；导出/清空进度；PR 附至少 1 张截图 + 1 段运行视频（学几词、翻面、测验、看星图点亮）。

## Stack rationale

- **Bun + Vite + React + TS**：无后端 SPA，符合 monorepo AGENTS.md。
- **自写小样 + SVG 占位**：对齐「插画背词 + 间隔复习」卖点，又避开上游大数据集与素材体积。
- **简化 FSRS 而非整库移植**：演示调度直觉即可；完整算法可后接 `ts-fsrs`。
- **shadcn/ui**：与同仓其它 demo 视觉一致。

## Deferred

- 接 `ts-fsrs` 全参数与真实目标记忆率曲线。
- 用户自有词表 CSV 导入；Web Speech API 临时发音。
- 与栏目「英语/雅思」竖屏口播的词卡导出。
