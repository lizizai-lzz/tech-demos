# toonflow — 双引擎创作工作室（小说 / 短剧 · 空跑版）

浏览器内的 Toonflow 风格工作台，支持两种本地模拟流水线：

| 模式 | 阶段 |
|------|------|
| **写短剧** | 种子 → 大纲 → 角色 → 剧本 → 分镜 |
| **写小说** | 种子 → 设定/世界观 → 章纲(3–5) → 角色 → 正文样章 → **一致性审核 / 敏感话题 / 去AI味 / 质检裁定 / 改写** |

默认所有「生成」均为 **TypeScript 模板 + 假延迟**，不调用任何付费模型 API，无需 API Key。可选开启 **OpenAI 兼容文本模型** 与 **生图/生视频媒资提供方**（Skill 任务包 / 火山引擎即梦）。种子原文在两种模式间共享（≤800 字）。

## 运行

```bash
cd apps/toonflow
bun install
bun run dev
```

浏览器打开终端提示的本地地址（通常为 `http://localhost:5173`）。

其他命令：

- `bun run build` — 生产构建
- `bun test src` — 短剧 + 小说流水线单元测试
- `bun run lint` — Oxlint

## 使用说明

1. 在左侧顶部选择 **写小说** 或 **写短剧**（选择会写入 `localStorage` 键 `toonflow:studio-mode`）。
2. 选择当前模式下的示例项目，或粘贴种子原文；切换模式时默认 **保留当前种子**，不会强制换回示例。
3. 点击 **开始空跑**：画布按阶段依次出现节点与连线（会清空当前模式已有进度）。
4. **暂停** 后主按钮变为 **继续**（从下一阶段接着跑，不丢已完成节点）；需要从头时点 **重新开始**（会二次确认）。
5. **单步** 控制节奏；左侧为 **纵向步骤条**（待办 / 进行中 / 已完成）。
6. 点击节点打开详情 Sheet，可本地编辑；有改写对照时大屏 **左右对照**，终稿可编辑保存。
7. **重新生成此节点** 会清空下游阶段产物，避免旧裁定叠在新章纲上。
8. **导出 JSON** 可下载当前模式产物（成功后有 Toast 提示）。
9. 下列内容会写入 `localStorage`：
   - `toonflow:studio-mode`、`toonflow:last-paste`、各模式示例 id
   - `toonflow:runner-snapshot` — 短剧/小说双流水线进度（刷新可恢复）
   - `toonflow:model-settings`、`toonflow:media-settings` — 文本与媒资配置（含密钥，勿提交）
   - `toonflow:viewport` — 画布视口（仅在首次进入、切换模式或重置流水线时自动 fit，不会每帧抢焦点）

### 示例种子

- **短剧**：雨巷重逢、午夜食堂、天台信号
- **小说**：地下高校·青龙会（成人高校 + 刃牙式凡人地下格斗）、墨山手记（另可用雨巷/食堂种子写小说流水线）

## 模型与媒资设置（可选）

工作台左上角 **齿轮 / 「模型设置」** 打开面板，分 **文本模型 | 生图 | 生视频** 三段。

### 文本模型（`toonflow:model-settings`）

| 字段 | 说明 |
|------|------|
| **运行方式** | `本地空跑`（默认）或 `真实模型` |
| **Base URL** | OpenAI 兼容根路径，如 `https://api.deepseek.com/v1` |
| **API Key** | 仅 localStorage，**不会**出现在导出 JSON 中 |
| **Model id** | 如 `deepseek-chat`、`gpt-4o-mini` |
| **Temperature** | 可选，默认 0.7 |

- **真实模型**：短剧四阶段与小说「世界观 / 章纲 / 角色 / 样章」走 `chat/completions`；小说质检环仍用本地规则。缺 Key 时无法开始空跑，会 Toast 并打开设置。

### 生图 / 生视频（`toonflow:media-settings`）

每种媒资可独立选择：

| 提供方 | 行为 |
|--------|------|
| **关闭** | 分镜色块占位（默认） |
| **Skill** | 在分镜节点详情点击 **导出媒资任务**，下载 JSON 任务包；附带一行 Agent 指令（复制到剪贴板）。不发起网络付费 API。 |
| **即梦 API** | 使用火山引擎 **官方 Visual API**（即梦 / Dreamina）：`https://visual.volcengineapi.com`，服务 `cv`，AK/SK HMAC 签名。文档入口：[火山引擎即梦相关文档](https://www.volcengine.com/docs/85621) |

**即梦配置要点：**

- 在火山引擎控制台创建 **AccessKeyId + SecretAccessKey**（与 TTS 等同属 Volcengine 账号体系）。
- 默认 `imageReqKey`: `jimeng_t2i_v40`；`videoReqKey`: `jimeng_t2v_v30`（720p，可改为文档中的 1080p / 图生视频 key）。
- 浏览器无法安全直连即梦（CORS + SK 暴露），需 **`bun run dev`** 启动本应用内置的 Vite 代理：`POST /api/jimeng/image`、`POST /api/jimeng/video`。客户端将 AK/SK 仅通过请求头 `X-Toonflow-Jimeng-Key`（base64 JSON）发给**本机同源**代理。
- 也可在开发机设置环境变量 `JIMENG_ACCESS_KEY_ID`、`JIMENG_SECRET_ACCESS_KEY`（可选 `JIMENG_REGION`），供代理侧演示。
- 无密钥时可在请求体传 `mock: true` 走模拟 URL（用于 UI 演示）；静态 `preview` 无代理时会 Toast 提示需 dev 服务。
- 短剧流水线在 **分镜阶段** 若启用即梦，会尝试为各分镜卡填充关键帧/短片 URL；失败时该卡标记错误并暂停，不清空整条流水线。

**清除密钥与配置** 会同时 wipe 文本 API Key 与即梦 AK/SK。

## 模拟范围（Mock）

- 大纲/章纲：从句子切分与模板句拼装
- 角色：中文姓名频次启发式，2–4 人
- 剧本/样章：固定段落结构 + 种子片段嵌入
- **小说质检环（空跑 · 成人高校网文）**：一致性对 **凡人武学层级（入门/熟手/杀拳/半格/怪力）+ 堂口**，禁止混入修真灵气；敏感仅拦犯罪教程与 &lt;18 framing；狠劲分 + 去 AI 味；裁定后本地改写
- 分镜：每场一条卡片（色块占位，无真实图像）

## 参考链接（仅产品形态，未复制代码）

- [Creation Studio](https://github.com/eropendown/creation-studio) — 小说 + 漫剧/短剧双工作台
- [Toonflow-app](https://github.com/HBAI-Ltd/Toonflow-app)（MIT）— 无限画布短剧 Agent 流程

## 技术栈

- Bun + Vite + React + TypeScript
- Tailwind CSS 4 + shadcn/ui
- `@xyflow/react` 画布
- 流水线：`src/pipeline/`（短剧）、`src/pipeline/novel/`（小说）
