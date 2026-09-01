# Progress

Status board for Life Tracker. Short by design. See `life-tracker-plan.md` for the plan itself.

## Now

Phase 1, step 1 — Next.js skeleton. Built, waiting on your test.

## Waiting on me (Andrei)

- Commit and push step 1, connect the repo to Vercel, and open the deployed URL on the phone.
  Expected: a black screen, centred, reading "Life Tracker" with "Skeleton is running. Nothing to log yet." underneath.
- Approve step 1 so it can be marked done.

## Done

Nothing approved yet.

## Next

Phase 1:
- Step 2 — PWA: manifest, icons, home-screen title, dark status bar. Add-to-Home-Screen from Safari works and the app opens without Safari chrome.
- Step 3 — Supabase: the SQL for all tables except gym, plus row-level security. Delivered as `.sql` files for you to run; plus the server-side connection and one screen proving a read and a write work end to end.

Then phase 2 (PIN gate), phase 3 (JSON export).

## Decisions made while building

2026-09-01 — Next.js 16 with the App Router, React 19, TypeScript, Tailwind v4, ESLint. Standard scaffold, no extras.
2026-09-01 — App lives at the repo root, not in a subfolder. Vercel needs no configuration this way.
2026-09-01 — npm as the package manager.
2026-09-01 — App code in `app/`, no `src/` folder, `@/*` import alias.
2026-09-01 — Turbopack as the bundler (the current Next.js default).
2026-09-01 — Dark theme only, hard-coded. No light mode, no system-preference switching. Colours are CSS variables in `app/globals.css` so the whole app restyles from one place.
2026-09-01 — Geist as the interface font (comes with the scaffold, loaded at build time so the phone never waits on a font download).

## Deferred

- The favicon is still the Next.js logo, and there are no home-screen icons. Both get replaced in step 2 with real ones — not worth doing twice.
- `AGENTS.md`, which the scaffolder wanted to add, was dropped. `CLAUDE.md` already covers it and two files of instructions would drift apart.
- The scaffold's demo homepage and its five unused demo images were removed rather than kept. `public/` is empty until step 2 puts the icons in it.
