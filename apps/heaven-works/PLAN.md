# HEAVEN WORKS 天工开物 — Agent 作战室 Dry-Run

Inspired by viral HEAVEN WORKS–style agent ops dashboards. **Dry-run visualization only** — not a real satellite orchestrator.

## Goal
One-page cyberpunk FUI war room with R3F orbit/stage/beams and a bottom **hybrid hologram**: Blender pre-rendered VP9 alpha WebM (monitor / tablet / phone) embedded on a video plane over the grid.

## MVP
In:
- FUI panels + simulated tick loop (unchanged).
- Live R3F: grid, satellite fleet, stage cards, fiber/dotted beams, bloom.
- **Bottom tier:** looped `public/hologram-devices.webm` (1280×720, alpha) — not live point-cloud devices.

Out:
- Real orchestration, auth, persistence, production deploy; Safari alpha fallback (qtrle MOV) deferred.

## Stack rationale
- **Bun + Vite + React + TS** — repo SPA default.
- **Hybrid hologram:** Cycles/Geometry-Nodes particle devices → **VP9 WebM alpha** → `VideoTexture` plane in R3F; host scene stays live for HUD/orbit/beams without WebGL point budget limits.
- **@react-three/fiber + drei + postprocessing** — orbit layer, cards, beams, bloom.
- **Chromium** plays VP9 alpha; **Safari** may need a future qtrle/MOV fallback (not committed — ~127MB).

## Deferred
- Safari video fallback; real agent feeds; i18n; deploy.
