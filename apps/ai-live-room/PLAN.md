# ai-live-room — AI 直播间弹幕调度台（空跑版）

Source: X bookmark 「抖音千人在线的 AI 实时美女主播，我也搭了一个（已开源）」 by @GaryAIytb — https://x.com/GaryAIytb/status/2112422551150620733
Upstream project (inspiration only, MIT): https://github.com/garycaogan/ai-live-avatar — Vidu S2 实时数字人 + 弹幕过滤调度 + 衣柜换装 + OBS 叠层. This demo re-implements only the middle layer (danmaku filter → queue → dispatch) in the browser, with a mock avatar; no Vidu calls, no code copied.

## Goal
A single-page "dry-run" AI live room where simulated danmaku flow in, get filtered and classified, wait in a queue, and are dispatched one at a time to a mock streamer whose state (talking / outfit / action / warm-up) is shown on a stream-style overlay.

## MVP
In:
- Stage panel: a placeholder streamer (CSS/SVG character or gradient card, no real person assets) inside a 1.2:1 landscape frame on a 9:16 phone-style canvas, with overlay: current subtitle at the bottom, "功能清单" card (聊天 ✅ / 换装 ✅ / 小动作 ✅ / 唱歌 ✗ / 带货 ✗), current outfit name, queue length.
- Danmaku feed: a simulator that emits a realistic Chinese comment every 1–3 s from a built-in pool (chat questions, outfit requests by wardrobe name, actions like 比心/挥手/眨眼, gifts, vulgar/引流 spam, unsupported asks like 唱歌/换背景/查天气), plus a text box so the user can type their own danmaku.
- Pipeline (pure TS module, the critical logic):
  1. Filter: block vulgar / 引流 (links, 加V, 私信) via an editable keyword list; blocked items shown greyed with reason.
  2. Classify: chat | outfit(name) | action(name) | gift | unsupported, via keyword rules editable in a settings sheet.
  3. Queue: one item at a time; next item only after the current "utterance" finishes (simulated duration ≈ text length × speed, ~20 s pacing knob); gifts are thanked but never cut in line; duplicate/near-duplicate danmaku merged.
  4. Dispatch: chat → templated reply from persona + opening line; outfit → ~6 s "换装中" transition then outfit switch; action → short animation (heart, wave, blink); unsupported → polite chat-style fallback reply.
  5. Warm-up: when the queue is idle for N seconds, pick from a topic pool without repeats until the pool is exhausted.
- Workbench side panel: persona name/description/opening line, wardrobe list (add/remove outfit names + color), action keywords, filter keywords, pacing slider, start/stop dry-run button, event log with timestamps.
- UI in Chinese, single user, state in memory (+ optional localStorage for settings).

Outs: real Vidu / Evolink / any model API, TTS audio, real streaming or OBS/RTMP, real platform danmaku ingest (Douyin/YouTube), auth, backend, multi-user, real character photos, singing/selling/background swaps.

## Tasks (vertical slices)
1. Scaffold (bunfig.toml first, `bunx create-vite` react-ts, Tailwind + shadcn/ui). Stage + one hard-coded danmaku typed in the input box → filtered → classified as chat → mock reply subtitle appears on the overlay. End-to-end path visible.
2. Extract the pipeline into `src/pipeline/` (filter, classify, queue, dispatch) with unit tests (bun test) for filter, classification, queue ordering (gift no cut-in, one-at-a-time, dedupe) and warm-up no-repeat.
3. Danmaku simulator + feed list with status chips (已过滤 / 排队中 / 正在回复 / 已完成), queue length on overlay, pacing slider.
4. Outfit switching (wardrobe, ~6 s transition) and actions (比心/挥手/眨眼 animations); unsupported fallback; 功能清单 overlay card.
5. Warm-up topic pool when idle; workbench settings sheet (persona, wardrobe, keywords) with localStorage; event log.
6. README (run steps, what's mocked vs. the upstream Vidu project), polish; record screenshot + video of a ~60 s dry-run session for the PR.

## Stack rationale
- Bun + Vite + React + TS (`bunx create-vite`): zero-backend SPA; `bun install && bun run dev` per AGENTS.md.
- shadcn/ui (Card, Badge, Button, Input, Textarea, Slider, Sheet, Tabs, ScrollArea), minimalist: prebuilt controls for the workbench.
- Plain CSS/Framer-free keyframes or `motion` for overlay animations — small and sufficient.
- `bunfig.toml` minimumReleaseAge = 259200: supply-chain guard.
- Tests only for the pipeline (filter/classify/queue/warm-up) — that's the logic the upstream project is about.

## Deferred
- Plug in a real LLM for replies (OpenAI-compatible endpoint, key in local env).
- Optional Vidu S2 real-time connection behind an explicit key, mirroring upstream.
- Real danmaku ingest (YouTube Live chat API).
- TTS voice, OBS browser-source overlay mode, auto-recover after disconnect.
- Cross-session memory of returning viewers.
