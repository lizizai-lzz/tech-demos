---
name: project-planning
description: Opinionated MVP-first planning for small demos. Use before writing any code for a new app.
---

# Project Planning (MVP-first)

## Steps
1. **Goal in one sentence.** If it needs two, the scope is too big.
2. **MVP:** single user, happy path only. List explicit **outs** (auth, multi-user, persistence beyond local, i18n, etc.).
3. **Tasks as vertical slices:** each task delivers a visible, working end-to-end piece (UI → logic → data). No "set up all models first" tasks.
4. **Prefer prebuilt:** existing libraries, APIs, shadcn components over custom code.
5. **Stack defaults:**
   - Bun runtime/package manager.
   - Scaffold with official `bunx create-*`.
   - `bunfig.toml` at app root before any install:
     ```toml
     [install]
     minimumReleaseAge = 259200
     ```
   - shadcn/ui, minimalist.
6. **Tests only for critical logic** (parsers, algorithms, money/data correctness). No UI snapshot suites.
7. **Small git hooks:** fast lint/format/typecheck only; nothing slow.

## Output (write to `apps/<slug>/PLAN.md`)
- **Goal** — one sentence
- **MVP** — what's in, and explicit outs
- **Tasks** — ordered vertical slices
- **Stack rationale** — why each choice, briefly
- **Deferred** — ideas parked for later
