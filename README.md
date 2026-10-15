# tech-demos

从 X 收藏（bookmarks）中挑选出的小型技术 Demo 的长期 monorepo。

- 每个 Demo 一个独立目录：`apps/<slug>/`
- 每个 app 自包含，使用 Bun 运行：

```bash
cd apps/<slug>
bun install && bun run dev
```

- 规划与协作规则见 [AGENTS.md](./AGENTS.md) 与 [skills/project-planning/SKILL.md](./skills/project-planning/SKILL.md)
- 已处理的收藏记录在 `tracking/seen-bookmarks.json`

---

**English:** A long-lived monorepo for small tech demos picked from X bookmarks. One app per folder under `apps/<slug>/`, each self-contained and run with Bun (`bun install && bun run dev`).
