# 词光 · Word Atlas（演示）

浏览器内的**插画背词空跑 demo**：今日队列、翻面词卡、看义选词测验、简化 FSRS 本地排期、话题星图进度。数据与 SVG 几何插画均为**自写小样**，不包含上游 7k 词库、插画或音频。

## 灵感来源（形态参考，非素材镜像）

- [designfuchen/word-atlas](https://github.com/designfuchen/word-atlas) — 词光 · Word Atlas
- [书签帖 @slashui](https://x.com/slashui/status/2116383058735554610)

## 运行

```bash
cd apps/word-atlas
bun install
bun run dev
```

```bash
bun test    # 词库 id 唯一性与队列切片
bun run build
```

## 说明

- 进度保存在 `localStorage`，可导出/清空 JSON。
- FSRS 为教学向简化实现，非完整 [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)。
- 详细范围见同目录 `PLAN.md`。
