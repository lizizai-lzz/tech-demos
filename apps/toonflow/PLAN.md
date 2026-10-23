# toonflow — AI 短剧无限画布（空跑版）

Source: X bookmark 「两个钟头鼓捣出一部AI短剧，成本才120块…开源工具 Toonflow」 by @bkdgiffug — https://x.com/bkdgiffug/status/2112051365606502882
Upstream project (inspiration only, MIT): https://github.com/HBAI-Ltd/Toonflow-app — 无限画布 + Agent + 剧本/分镜/角色/图视频节点，可本地部署与自选模型. This demo re-implements a **browser dry-run** of the happy-path pipeline (novel snippet → outline → script beats → storyboard cards on a canvas), with mocked generation; no code copied, no paid model calls.

## Goal
A single-page "dry-run" Toonflow-style studio where the user pastes a short Chinese novel excerpt, watches a staged pipeline fill an infinite canvas with outline / character / script / storyboard nodes, and can nudge one node at a time without any API key.

## MVP
In:
- Canvas workspace (pan + zoom): nodes for 原文、大纲、角色卡、剧本场次、分镜卡, connected by simple edges; click a node to open a detail sheet.
- Pipeline simulator (pure TS): given a built-in sample excerpt (plus a textarea for the user's own short paste ≤ ~800 chars), run stages with fake latency:
  1. 章节事件提取 → outline bullets
  2. 角色识别 → 2–4 character cards (name, role, look tags)
  3. 剧本改编 → 3–5 scene beats with dialogue lines
  4. 分镜 → one storyboard card per beat (shot type, prompt text, placeholder frame color)
- Workbench: Start / Pause / Step-one-stage, stage progress chips, regenerate-this-node (re-roll from local templates), sample-project switcher (2–3 baked samples).
- UI in Chinese, single user, state in memory (+ optional localStorage for last paste and canvas pan/zoom).

Outs: real LLM / image / video APIs, Docker/desktop client, MCP/plugins, auth, multi-user, persistence beyond localStorage, real asset upload, export to MP4, TF-Router or any paid gateway, cloning upstream UI/code.

## Tasks (vertical slices)
1. Scaffold (bunfig.toml first, `bunx create-vite` react-ts, Tailwind + shadcn/ui). Hard-coded 3 nodes on a pan/zoom canvas + one "开始空跑" button that appends a fourth node after a fake delay. End-to-end visible.
2. Pipeline module `src/pipeline/` (extract → characters → script → storyboard) with unit tests for stage ordering, character count bounds, and storyboard↔beat alignment.
3. Wire pipeline to canvas: nodes appear stage-by-stage with edges; progress chips; Pause / Step.
4. Node detail Sheet (edit title/body locally); regenerate-this-node from templates; sample switcher + user paste textarea (cap length).
5. README (run steps, what's mocked vs. upstream Toonflow), polish; record screenshot + video of a ~60 s dry-run for the PR.

## Stack rationale
- Bun + Vite + React + TS (`bunx create-vite`): zero-backend SPA; `bun install && bun run dev` per AGENTS.md.
- Lightweight canvas: `@xyflow/react` (or plain SVG/div pan-zoom if lighter) for infinite-canvas feel without shipping a full editor.
- shadcn/ui (Card, Badge, Button, Textarea, Sheet, Tabs, ScrollArea), minimalist workbench chrome.
- `bunfig.toml` minimumReleaseAge = 259200: supply-chain guard.
- Tests only for the pipeline (ordering / bounds / alignment) — the demo's critical logic.

## Deferred
- Optional OpenAI-compatible endpoint behind an explicit local key for real outline/script.
- Image placeholders → real image model.
- Export storyboard JSON / Remotion pack for the 李自在AI 实战栏目.
- Plugin/MCP node stubs matching upstream marketing surface.
