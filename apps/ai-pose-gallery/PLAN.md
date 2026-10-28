# ai-pose-gallery — AI 姿势参考台（空跑版）

灵感来源（形态与交互，**不镜像上游 659MB 素材、不搬原站 HTML**）：

- [anhao/ai-pose-gallery-zh](https://github.com/anhao/ai-pose-gallery-zh) — 中文 AI 姿势参考图库（1439 组 / 多视角 / 零依赖静态画廊）
- 书签帖：[1439 个AI美女 姿势 参考图…](https://x.com/anhao_ai/status/2115070903386296398)（@anhao_ai）

本 demo 在浏览器里用 **SVG 火柴人 / 几何占位 + 假数据** 演示「姿势检索 → 多视角预览 → 一键复制生图提示词」工作流；**不下载上游图片、不托管真人/生成图素材**。

## Goal

单页姿势台：按体系/分类/视角筛姿势，灯箱里切角度，并把当前姿势打成可复制的中英提示词，给 AI 生图用。

## MVP

### In

- 顶部：搜索（姿势名 / 分类关键词，`/` 聚焦）+ 体系页签（至少 2 个：全身·标准系、上半身）+ 视角筛选（正面 / 斜侧 / 侧面 / 俯视 / 仰视，可多选）+ 一键重置
- 主区双模式：**按姿势分组**（卡片带多角度缩略占位）/ **逐张浏览**（网格）
- 卡片与灯箱：主图为 SVG 火柴人姿态示意（角度变化可见差异即可）；灯箱支持 `←/→` 切角度、`Esc` 关闭、复制 ID、复制提示词
- 「复制提示词」：根据姿势名 + 视角 + 构图字段拼一段中英双语提示（自写模板，不抄上游文案）；复制成功有 toast
- 样例数据：本地 JSON，约 **24–36 条姿势**、每条 2–5 个视角；字段含 id、中文名、体系、分类、视角列表、简短构图备注
- 中文 UI；Bun + Vite + React + TS；shadcn/ui；`bunfig.toml` 含 `minimumReleaseAge = 259200`
- `cd apps/ai-pose-gallery && bun install && bun run dev` 可跑通

### Outs

克隆/镜像上游仓库与图片、Cloudflare Pages 部署、真实 PNG/JPG 素材、性感系/双人等内容分级页、后端、鉴权、多用户、i18n、真实 Midjourney/Flux 调用。

## Tasks（垂直切片）

1. **脚手架** — Vite+React+TS；`bunfig.toml`；shadcn 基础壳；本 `PLAN.md` + README（说明灵感来源与「空跑/无上游素材」）。
2. **数据 + 筛选** — `src/data/poses.json` + 体系/分类/视角类型；搜索与筛选 hook；`bun test` 覆盖 id 唯一与筛选正确性。
3. **画廊 + 灯箱** — 分组/逐张模式；SVG 姿态占位组件（按视角略变构图）；灯箱键盘导航。
4. **提示词导出** — 复制提示词模板；PR 附至少 1 张截图 + 1 段运行视频（搜一次、切视角、复制提示词）。

## Stack rationale

- **Bun + Vite + React + TS**：无后端 SPA，符合 monorepo AGENTS.md。
- **SVG 占位而非镜像图**：对齐「姿势参考 → 生图提示」卖点，又避开大体积与版权/分级素材问题。
- **shadcn/ui**：与同仓其它 demo 视觉一致。

## Deferred

- 接真实姿势图 CDN / 用户自有参考图上传。
- 导出到 Remotion / 栏目封面「姿势变体」工作流。
- 与 avatar-cover skill 的一键姿势包交接。
