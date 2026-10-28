# agent-war-room — AGENT MESH 作战室

Visual reference: cyberpunk agent-ops dashboard (GROK MESH–style war room); demo branded **AGENT MESH**, dry-run only.

## Goal
A cyberpunk Agent War Room / mesh ops dashboard with live simulated data-flow animation and no real backends.

## MVP
In:
- Single full-viewport war room: sources → core hub → leadership cards → agent pills → dense tool chip grid + SVG mesh edges.
- Top bar (AGENT MESH, tabs, project id, live counters), bottom scrolling console log.
- Simulated tick loop: pulses on edges, counter drift, agent/tool flash, hover highlight + click drawer, pause / 1x / 2x speed, optional source-node bias.
- Seed data in `src/data/`; small `bun test` for scheduler/edge logic; README; PR screenshot + video.

Out:
- Real multi-agent runtime, WebSocket/API backends, auth, multi-user, i18n framework, mobile polish, production deploy.

## Tasks (vertical slices)
1. **Scaffold** — `bunfig.toml`, `bunx create-vite` (react-ts), Tailwind, minimal shadcn (Sheet, Button, Tabs); dark cyberpunk base styles + monospace font.
2. **Layout shell** — TopBar, main grid (sources, hub, leadership, agents, tools), ConsoleLog, speed controls; static seed data visible.
3. **Mesh + simulation** — SVG edge layer with curved paths, pulse animation, tick scheduler (extracted + tested), counters/logs updating.
4. **Interactivity** — Hover dim/highlight, agent click → Sheet drawer (fake metrics), source click bias, localStorage for pause/speed.
5. **Polish + ship** — Performance pass (canvas tool grid if needed), `bun run build`, README, screenshot + screen recording for PR.

## Stack rationale
- **Bun + Vite + React + TS**: repo default; fast SPA, no server.
- **Tailwind + sparse shadcn**: drawer/tabs/buttons only; custom cyberpunk chrome for density.
- **SVG mesh**: curved edges + `stroke-dashoffset` pulses at 60fps without hundreds of animated DOM wrappers.
- **Canvas (optional) for tool grid**: many chips, single draw call if DOM is heavy.
- **Pure `src/sim/` module**: testable tick + path selection without React.

## Deferred
- Real agent orchestration, WebSocket live feeds, editable graph, Runs/Logs tab content, 3D WebGL mesh, mobile layout.
