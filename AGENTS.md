# AGENTS.md — rules for cloud coding agents

1. **Scope:** Only touch `apps/<slug>/` for the demo you were assigned. Do not edit other apps, root files, `skills/`, or `tracking/` unless explicitly told to.
2. **Plan first:** Follow `skills/project-planning/SKILL.md` and write `apps/<slug>/PLAN.md` before writing code.
3. **Runtime:** Use Bun. Scaffold with official `bunx create-*` generators (e.g. `bunx create-vite`, `bunx create-next-app`).
4. **Supply-chain guard:** Before *any* install, create `apps/<slug>/bunfig.toml` containing:
   ```toml
   [install]
   minimumReleaseAge = 259200
   ```
5. **UI:** shadcn/ui, minimalist styling.
6. **Self-contained:** `cd apps/<slug> && bun install && bun run dev` must work.
7. **Pull requests:** Exactly one PR per demo. The PR **must** include at least one **screenshot** AND at least one **video** of the running app.
8. **Never create new repositories.** All work lands in this repo via PR.
