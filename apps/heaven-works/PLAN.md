# HEAVEN WORKS 天工开物 — Agent 作战室 Dry-Run

Inspired by viral HEAVEN WORKS–style agent ops dashboards (reference image in repo root). **Dry-run visualization only** — not a real satellite orchestrator.

## Goal
One-page cyberpunk FUI war room with a React Three Fiber center scene whose signature is a bottom **particle hologram** of a website (desktop + tablet + mobile wireframes) on a glowing grid, fed by animated light beams from simulated agents.

## MVP
In:
- Top bar: HEAVEN WORKS 天工开物, stub controls (视角切换 / 主题 / 退出全屏), live FPS / Units / Heartbeat metrics.
- Left: orbital blurb; Loop Units U01–U08 with progress + DONE/VERIFY; scrolling `LOOP.PY` syntax-highlight console.
- Center 3D: satellite hub + agent drones; mid floating stage cards with OK; **particle hologram + grid floor + beams** (agents → cards → hologram).
- Right: project overview (~88%), pipeline chevrons, task bars, SILK heatmap, delivery log.
- Fake tick loop for all panels; seed data in `src/data/`.
- README + PR screenshot + fullscreen-ish video.

Out:
- Real multi-agent runtime, auth, APIs, persistence, i18n framework, production deploy, mobile WebGL polish.

## Tasks (vertical slices)
1. **Scaffold** — bunfig.toml (done), `bunx create-vite` react-ts, Tailwind, deps (R3F, drei, postprocessing), empty dashboard shell + dark FUI CSS grid.
2. **3D core** — Canvas with grid floor, camera drift, bloom; particle wireframe hologram (desktop/tablet/phone) from generated point cloud.
3. **3D layers** — Satellite + agent orbs + connection lines; stage card platform; animated beams agent → card → hologram targets.
4. **Side panels** — Left/right panels + top bar wired to `src/data/` + `useSimulation` tick hook.
5. **Polish** — Camera presets (视角切换), code console scroll, build pass, README, capture screenshot + video for PR.

## Stack rationale
- **Bun + Vite + React + TS**: repo default; fast SPA for dense UI + WebGL canvas.
- **@react-three/fiber + drei + postprocessing**: required 3D stack; bloom for particle glow at ~60fps with capped point counts.
- **Tailwind**: FUI panel chrome without full shadcn (dense HUD overrides minimalist default for this demo).
- **bunfig.toml** minimumReleaseAge: supply-chain guard per AGENTS.md.

## Deferred
- Real agent orchestration; WebSocket feeds; mobile-optimized 3D; theme switching beyond stub; i18n; deploy.
