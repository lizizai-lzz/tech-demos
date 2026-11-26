# AI 直播间弹幕调度台（空跑版）

灵感来自开源项目 [ai-live-avatar](https://github.com/garycaogan/ai-live-avatar)（MIT）：上游使用 Vidu S2 实时数字人、弹幕过滤调度、衣柜换装与 OBS 叠层。本仓库 **仅演示中间层**——在浏览器里模拟中文弹幕流入，经过滤、分类、排队后依次调度到占位主播，**不调用** Vidu / 任何大模型 API，无 TTS、无真实推流、无真人素材。

## 运行

```bash
cd apps/ai-live-room
bun install
bun run dev
```

单元测试（管线逻辑）：

```bash
bun test
```

构建：

```bash
bun run build
```

## 功能概览

- **舞台**：9:16 手机画布 + 1.2:1 横屏占位 SVG 主播、字幕、功能清单、队列长度
- **弹幕**：内置模拟器（1–3 秒一条）+ 手动输入；状态：已过滤 / 排队中 / 正在回复 / 已完成
- **管线**（`src/pipeline/`）：过滤低俗与引流 → 分类（聊天 / 换装 / 动作 / 礼物 / 不支持）→ FIFO 队列（礼物不插队、近重复合并）→ 模拟回复 / 换装 / 动作
- **暖场**：队列空闲一段时间后从话题池不重复抽取
- **工作台**：人设、衣柜、过滤词等可编辑，设置保存在 `localStorage`

## 与上游的差异

| 能力 | 上游 ai-live-avatar | 本 demo |
|------|---------------------|---------|
| 实时数字人 | Vidu S2 | CSS/SVG 占位 |
| 弹幕来源 | 平台接入 | 内置模拟 + 手输 |
| 回复生成 | 模型 | 模板话术 |
| OBS / 推流 | 支持 | 无 |

感谢 [garycaogan/ai-live-avatar](https://github.com/garycaogan/ai-live-avatar) 提供的产品思路与开源实现参考。
