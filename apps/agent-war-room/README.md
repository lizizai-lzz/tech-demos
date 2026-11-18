# AGENT MESH · 作战室（干跑演示）

赛博朋克风格的 **Agent 网格运维大盘**：模拟智能体 ↔ 工具之间的数据流、脉冲动画与实时日志。视觉灵感来自 viral 的 agent-ops 作战室截图（本仓库 PR 参考图），品牌为 **AGENT MESH**，**不是**生产级编排器，也**不**连接真实 LLM / API。

## 运行

```bash
cd apps/agent-war-room
bun install
bun run dev
```

浏览器打开 Vite 提示的本地地址（建议 1920×1080 桌面视口）。

## 脚本

| 命令 | 说明 |
|------|------|
| `bun run dev` | 开发服务器 |
| `bun run build` | 生产构建 |
| `bun test` | 模拟调度器单元测试 |
| `bun run preview` | 预览构建产物 |

## 交互（均为假数据）

- 边上线条脉冲、计数器漂移、底部控制台滚动
- 悬停 Agent：高亮相关连线和工具，其余变淡
- 点击 Agent：右侧抽屉（模拟指标 + 最近 5 次运行）
- 暂停 / 1x / 2x 速度（`localStorage` 记住暂停与倍速）
- 点击左侧 **INTERNET / TASK / MEMORY / FILES** 可偏置下一批触发的 Agent 集群

## 结构

- `src/data/` — 种子 Agent、工具、边
- `src/sim/` — 可测试的 tick 调度逻辑
- `src/components/` — 作战室 UI + SVG 网格

## 明确不做

真实多 Agent 运行时、WebSocket 后端、鉴权、多用户、i18n 框架、移动端精修、生产部署。
