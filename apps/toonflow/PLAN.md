# toonflow — 双引擎创作工作室（小说 / 短剧 · 空跑版）

灵感参考（仅形态与流水线，**未复制任何上游 UI 或代码**）：

- [Creation Studio](https://github.com/eropendown/creation-studio) — 小说工作台 + 漫剧/短剧工作台双引擎
- Novelix / ProseForge 类流程 — 设定/世界观 → 章纲 → 章节正文
- [Toonflow-app](https://github.com/HBAI-Ltd/Toonflow-app)、Dralo、ArcReel 类流程 — 大纲 → 角色 → 剧本 → 分镜

本 demo 在浏览器内用 **纯 TypeScript 模板 + 假延迟** 模拟两条流水线，共享种子原文与角色卡数据结构，**无需付费 API**。

## Goal

单页双模式工作室：用户选择 **写小说** 或 **写短剧**，粘贴 ≤800 字中文种子（或切换示例），在无限画布上按阶段生成节点，可暂停/单步/单节点重生成，模式选择持久化到 `localStorage`。

## MVP

### In

| 能力 | 小说模式 | 短剧模式 |
|------|----------|----------|
| 阶段 | 设定/世界观 → 章纲(3–5) → 角色 → 正文样章 → **一致性审核 → 敏感话题 → 去AI味 → 质检裁定 → 改写** | 大纲 → 角色 → 剧本(3–5场) → 分镜 |
| 画布 | `@xyflow/react` 节点 + 连线 | 同左（沿用） |
| 工作台 | 模式切换、示例、粘贴、进度徽章、开始/暂停/单步 | 同左 |
| 详情 Sheet | 本地编辑 + 按阶段重生成 | 同左 |
| 测试 | 阶段顺序、章纲数量、样章与章纲对齐 | 阶段顺序、角色数量、分镜与场次对齐 |
| 可选 | 导出当前产物 JSON（小说形或短剧形） | 同左 |

- 中文 UI；Bun + Vite + React + TS；shadcn/ui；`bunfig.toml` 保留 `minimumReleaseAge = 259200`。
- 至少 2 个小说专用示例种子（其一为校园黑道题材）；短剧保留原有 3 个示例。

### Outs

真实 LLM / 图像 / 视频 API、Docker、鉴权、多用户、克隆 Toonflow 或 Creation Studio 代码、MP4 导出、后端持久化。

## Tasks（垂直切片）

1. **规划与模式壳** — 重写本 `PLAN.md`；`StudioMode` + localStorage；工作台顶部 **小说 / 短剧** 切换。
2. **短剧流水线** — 保持现有 `src/pipeline/`（extract → characters → script → storyboard）行为不变，接入模式感知 runner。
3. **小说流水线** — 质检五段；**刃牙式凡人地下格斗高校**（非修真）；样例「地下高校·青龙会」。
4. **共享与导出** — 角色卡结构复用；`exportArtifacts(mode, state)` 下载 JSON。
5. **测试与文档** — `bun test src` 覆盖双流水线；README 说明模式切换与 mock 范围；PR 截图 + 视频（切换模式、小说跑通、短剧仍可用）。

## Stack rationale

- **Bun + Vite + React + TS**：无后端 SPA，符合 AGENTS.md 自包含运行。
- **@xyflow/react**：无限画布平移缩放，双模式共用节点组件。
- **shadcn/ui**：模式切换、工作台、Sheet 一致视觉。
- **双 pipeline 模块**：模式感知 runner 分发，避免整仓重写；仅对关键逻辑写单元测试。

## Deferred

- 可选 OpenAI 兼容端点（用户自备 Key）。
- 真实分镜图 / Remotion 导出。
- 跨模式同步更多产物（如短剧角色一键带入小说章纲）。
