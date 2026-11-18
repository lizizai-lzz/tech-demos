# lemo-edit-doc — 剪辑与纪实风格台（空跑版）

单页演示：在浏览器里点选八种「剪辑与纪实」风格，查看短循环 Canvas/CSS 预览，并复制中文 brief 模板。灵感来自 Lemo Opuscar 的形态与语法索引，**不复制上游 STYLE 原文或样片代码**。

## 本地运行

```bash
cd apps/lemo-edit-doc
bun install
bun run dev
```

浏览器打开终端提示的地址（默认 `http://localhost:5173`）。

## 脚本

| 命令 | 说明 |
|------|------|
| `bun run dev` | 开发服务器 |
| `bun run build` | 生产构建 |
| `bun test` | 风格注册表单元测试 |
| `bun run lint` | oxlint |

## 结构

- `src/styles/registry.ts` — 8 种风格元数据与口诀
- `src/components/previews/` — 各风格循环预览
- `src/themes/example-themes.ts` — 全局示例主题（本周 AI / 城市一天）

详见同目录 `PLAN.md`。
