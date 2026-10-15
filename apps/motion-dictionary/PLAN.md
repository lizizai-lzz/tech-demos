# motion-dictionary — 网页动效词典

Source: X bookmark "Vibe Coding 网页动效词典（上篇）" — https://x.com/AdrianPunk115/status/2099485951701721585 (inspiration only; all descriptions original).

## Goal
An interactive Chinese dictionary of web motion terms where each entry shows a replayable live preview, tweakable params, and a copyable vibe-coding prompt.

## MVP
In:
- Static data file of ~10–12 entries: 淡入 fade-in, 缓动 easing, 弹簧 spring, 视差 parallax, 交错 stagger, 滚动触发 scroll-triggered, 悬停 hover, 页面转场 page transition, 骨架屏 skeleton, 微交互 micro-interaction, 缩放 scale, 滑入 slide-in.
- Each entry card: 中文 + English term, one-line original description, live preview with Replay button, controls (duration / easing / delay; spring stiffness/damping where relevant), prompt snippet that updates with the params + Copy button.
- Search/filter by term (中文 or English).
- UI in Chinese, single page, single user.

Outs: backend, auth, accounts, persistence beyond local, user-submitted entries, i18n toggle, mobile-specific polish, analytics.

## Tasks (vertical slices)
1. Scaffold (bunfig.toml first, `bunx create-vite` react-ts, Tailwind + shadcn/ui, Motion) and render ONE complete entry (淡入): card, preview, Replay, duration/easing/delay controls, live prompt + copy.
2. Generalize to a data-driven entry list; add easing, spring, slide-in, scale, stagger.
3. Add scroll-triggered and parallax (preview inside a scrollable mini-viewport).
4. Add hover, micro-interaction, skeleton, page transition.
5. Search/filter bar + category tags; README with run instructions; screenshot + video for the PR.

## Stack rationale
- Bun + Vite + React + TS (`bunx create-vite`): fastest zero-config SPA, matches repo defaults.
- shadcn/ui (Card, Slider, Select, Button, Input, Badge), minimalist: prebuilt accessible controls.
- Motion (motion.dev, `motion` package): declarative tween/spring/stagger/scroll/hover APIs cover every entry with little custom code.
- `bunfig.toml` minimumReleaseAge = 259200: supply-chain guard per AGENTS.md.
- Tests: only for the prompt-snippet generator (pure function).

## Deferred
- 下篇 terms (path drawing, morphing, 3D, physics, cursor-follow).
- Side-by-side compare of two easings; cubic-bezier curve editor.
- Export snippet as CSS / Motion code, not just prose prompt.
- Shareable URL state for params; dark mode toggle.
