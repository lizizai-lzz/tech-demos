# motion-dictionary — 网页动效词典

交互式中文动效术语词典：每条词条包含可重播的 Motion 实时预览、可调参数（时长 / 缓动 / 延迟 / 弹簧等），以及随参数变化的可复制提示词。

## 运行

```bash
cd apps/motion-dictionary
bun install
bun run dev
```

浏览器打开终端显示的本地地址即可。

## 其他命令

```bash
bun run build    # 生产构建
bun run lint     # oxlint
bun test         # 提示词生成器单元测试
```

## 技术栈

- Bun + Vite + React + TypeScript
- [Motion](https://motion.dev)（`motion` 包）
- shadcn/ui（极简样式）
