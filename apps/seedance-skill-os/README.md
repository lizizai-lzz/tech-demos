# Seedance 导演台（空跑版）

单页「导演台」demo：在浏览器里用 **TypeScript 模板 + 可选假延迟** 模拟 Skill OS 式流水线——澄清问答 → Brief → 分镜表 → Seedance 风格提示词 → 可选排障。**不调用任何付费视频生成 API。**

## 快速开始

```bash
git clone <本 monorepo 地址>
cd tech-demos/apps/seedance-skill-os
bun install
bun run dev
```

浏览器打开终端里显示的本地地址（通常为 `http://localhost:5173`）。

## 功能

- 纵向步骤：想法 → 澄清问答（1–2 题）→ Brief → 分镜表（3–5 镜）→ 提示词 → 可选排障
- 三个中文示例种子：短剧对白、产品开箱、城市夜景 B-roll
- 每镜字段：镜号、景别、运镜、时长、画面意图、对白/音效
- 复制整段提示词、导出 JSON（`brief` + `shots` + `prompt`）
- 「模拟延迟」开关：感知 agent 编译过程

## 脚本

| 命令 | 说明 |
|------|------|
| `bun run dev` | 开发服务器 |
| `bun run build` | 生产构建 |
| `bun test` | 流水线单元测试 |
| `bun run lint` | oxlint |

## 说明

实现细节见同目录 `PLAN.md`。上游 [Emily2040/seedance-2.0](https://github.com/Emily2040/seedance-2.0) 仅作工作流形态参考，未复制其 skill 文案或代码。
