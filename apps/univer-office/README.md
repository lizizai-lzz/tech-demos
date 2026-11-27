# univer-office — 内容周报 + 脚本 Agent（空跑）

在浏览器中嵌入 **Univer Sheets 开源核心**，演示「表格 + 无模型 Agent 时间线」协作形态。仅本地运行，不接商业插件、Server SDK 或官方 AI 扩展。

## 运行

```bash
cd apps/univer-office
bun install
bun run dev
```

其他命令：

- `bun test` — 工作簿 fixture 与阅读量合计
- `bun run build` — 生产构建

## 灵感与上游

- 灵感帖（公开 X 备选，非书签）：<https://x.com/univerHQ/status/2123083740511617424>
- 上游开源仓库：<https://github.com/dream-num/univer>（Apache-2.0 包）
- 官网：<https://univer.ai>

## 许可边界（重要）

本 demo **仅安装** `@univerjs/presets` 与 `@univerjs/preset-sheets-core` 等开源 npm 包，**不**包含：

- 商业 Web 插件
- Univer Server SDK
- 官方 AI 扩展

侧栏 Agent 为 **固定脚本步骤**（写单元格 / 公式 / 高亮），**不调用任何 LLM API**。

## MVP 范围

- 预置 fictional「内容周报」三表：本周选题、渠道数据、周报汇总（含跨表 `SUM`）
- 用户可继续编辑单元格，公式会重算
- 无登录、无 XLSX 导入导出

详见 [PLAN.md](./PLAN.md)。