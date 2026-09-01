# Progress

Status board for Life Tracker. Short by design. See `life-tracker-plan.md` for the plan itself.

## Now

Nothing in progress. Phase 3 is finished and approved.

**Next session starts by proposing phase 4 — weight, the first real screen.** Propose
the approach with recommendations and alternatives, then wait. See Next.

## Waiting on me (Andrei)

Nothing.

## Done

- 2026-09-01 — Phase 3 complete: the JSON export. One button, every row in the
  database, delivered through the iOS share sheet with a download fallback. The home
  screen shows how long it's been, from `last_export_at` on `settings`. Migration
  0003 run. Sample data for development is two SQL scripts run by hand, deliberately
  not anything the app does. Tested and approved.
- 2026-09-01 — Phase 2 complete: the PIN gate. Six digits, scrypt hash in an
  environment variable, signed three-month cookie, database-backed lockout after five
  failures, failing closed if the database is unreachable. Gate lives in `proxy.ts`.
  Tested on the phone and confirmed working.
- 2026-09-01 — Phase 1 complete. Skeleton, PWA and database, all tested on the phone and approved.
- 2026-09-01 — Phase 1 step 3b: `lib/supabase.ts` and the `/check` screen. Reading, writing and the 401-without-a-key check all verified against the real project. Tested on the phone, approved.
- 2026-09-01 — Phase 1 step 3a: database schema, all tables except gym, RLS on. SQL run in Supabase, nine tables confirmed.
- 2026-09-01 — Phase 1 step 2: PWA icon set, manifest, iOS home-screen support. Tested on the phone, approved.
- 2026-09-01 — Phase 1 step 1: Next.js skeleton, dark theme, `progress.md` and `architecture.md`. Tested on the phone, approved.

## Next

**Phase 4 — weight.** The first real screen, and the one that proves the whole chain
end to end on a table where a mistake costs nothing. One number a day.

Decisions to put to Andrei before writing any of it — recommendation, alternatives
and costs for each, as always:

- **What the screen holds**: today's entry plus a list of recent ones, versus
  splitting adding and reviewing across two screens.
- **How you get to it.** The home screen is still a placeholder with one link on it.
  A proper bottom tab bar is the iOS-native answer but is premature with two screens;
  worth deciding now whether to do it once, later, or grow into it.
- **What happens when a day is already logged.** The database refuses a second row
  for the same date, so the form has to either overwrite or send you to the existing
  entry. Part 4 rule 5 says everything is editable, which points one way.
- **Whether to hand-write the database types**, since generating them needs the
  Supabase CLI and that's off limits (see Deferred).

Three things already flagged as due in this phase: run `wipe.sql` before logging
anything real, delete the temporary `/check` page, and give TypeScript the shape of
the database so column names are checked.

Then phase 5 (nutrition), 6 (sleep and smoking), 7 (charts and stats), 8 (gym).

## Where things stand technically

For a session picking this up cold, after reading the plan and this file:

- The app is Next.js 16 at the repo root, deployed on Vercel, tested by Andrei on an
  iPhone home screen. `npm run build` and `npm run lint` both pass.
- Screens so far: `/login` (the PIN screen), `/` (a placeholder, now also showing when
  you last backed up) and `/export` (the backup screen). `/check` is a temporary
  database-connection test page.
- Everything except `/login`, the icons and the manifest is behind the PIN — including
  `/api/export`, which is the URL that hands over the whole database.
- The database has ten tables: the nine in the plan plus `login_attempts`. All empty
  except `settings`, which holds its single row. Sample data goes in and out by hand
  with the scripts in `supabase/sample-data/`; the app never creates data by itself.
- Four environment variables, in `.env.local` and in Vercel: `SUPABASE_URL`,
  `SUPABASE_SECRET_KEY`, `PIN_HASH`, `SESSION_SECRET`.
- Migrations `0001`, `0002` and `0003` have all been run. A new migration means a new
  numbered file in `supabase/migrations/` for Andrei to paste in himself.

Worth knowing about how this has gone so far: four mistakes were caught only because
things were tested rather than assumed — a batch of constraint tests that silently
proved nothing, a login flow that would have let anyone in with the lockout switched
off if the database were unreachable, an export that would have saved the login page
as your backup once the session expired, and a wipe script catching the wrong
Postgres error code. Test against the real thing before reporting a step as done.

**How to test database code without touching Supabase.** Phase 3 ran the real
`lib/backup.ts` against a throwaway local Postgres — loaded with the actual
migrations — by compiling it to JavaScript and swapping `lib/supabase.ts` for a small
stand-in that speaks SQL. The `.sql` scripts were run against the same database
directly. That catches constraint and ordering bugs for real, in a scratchpad,
without going near Andrei's project. Worth repeating for anything that writes.

## Decisions made while building

2026-09-01 — Next.js 16 with the App Router, React 19, TypeScript, Tailwind v4, ESLint. Standard scaffold, no extras.
2026-09-01 — App lives at the repo root, not in a subfolder. Vercel needs no configuration this way.
2026-09-01 — npm as the package manager.
2026-09-01 — App code in `app/`, no `src/` folder, `@/*` import alias.
2026-09-01 — Turbopack as the bundler (the current Next.js default).
2026-09-01 — Dark theme only, hard-coded. No light mode, no system-preference switching. Colours are CSS variables in `app/globals.css` so the whole app restyles from one place.
2026-09-01 — Geist as the interface font (comes with the scaffold, loaded at build time so the phone never waits on a font download).
2026-09-01 — Icon: a 3×3 grid of rounded squares in the accent blue on near-black, brightening along the diagonal — the calendar heatmap idea from the plan. Generated by a script kept out of the repo; the PNGs are committed.
2026-09-01 — Home-screen label is "Life", not "Life Tracker". iOS truncates at roughly 12 characters.
2026-09-01 — Status bar style `black`: the clock sits on a black strip above the app rather than the app running underneath it. Avoids a whole class of layout bugs at the top of every screen.
2026-09-01 — PIN hashing uses `scrypt`, built into Node. No dependency. One guess costs about 80ms of server time.
2026-09-01 — Brute force is stopped by a lockout counted in the database: five failures inside fifteen minutes and login refuses until the oldest ages out. Only the time of each failure is stored — no PIN, no attempted PIN, no IP address.
2026-09-01 — If the database can't be reached, login refuses rather than letting you in without the lockout. The app is useless without the database anyway, so failing closed costs nothing.
2026-09-01 — The session cookie is an expiry date plus an HMAC signature of that date, made with Node's built-in crypto. No JWT library. Changing `SESSION_SECRET` in Vercel invalidates every session at once — that's the emergency log-out.
2026-09-01 — The gate lives in `proxy.ts` at the repo root, so everything built from now on is behind the PIN automatically. Next.js 16 renamed `middleware.ts` to `proxy.ts`; the old name still works but warns.
2026-09-01 — The login screen is a plain field that summons the number pad and submits itself on the sixth digit. A custom keypad was considered and deferred — the screen appears roughly four times a year.
2026-09-01 — The PIN is six digits, as the plan settled. A four-digit PIN was hashed by mistake and re-done rather than loosening the code: four digits is 10,000 combinations against a million, and the lockout would only have held an attacker to about ten days.
2026-09-01 — Losing the PIN has no recovery screen, by design. The fix is to generate a new hash and replace `PIN_HASH` in Vercel — the command is in `architecture.md`, under the PIN gate.
2026-09-01 — There is no log-out button, and no in-app PIN change screen. Both are in the plan as deliberate omissions.
2026-09-01 — `@supabase/supabase-js` is how the server talks to the database. Chosen over talking to Postgres directly because it can't run out of database connections when Vercel starts many copies of the app at once. Known cost: it can't wrap several writes in one transaction, so saving a meal and its lines is two steps and the app has to tidy up after itself if the second fails. Revisit if that ever actually bites.
2026-09-01 — The database key lives in exactly one file, `lib/supabase.ts`, which refuses to load if it ever ends up in browser code.
2026-09-01 — Environment variables are named `SUPABASE_URL` and `SUPABASE_SECRET_KEY`. Deliberately not prefixed `NEXT_PUBLIC_`, which would ship them to the phone.
2026-09-01 — The icon-drawing script is deliberately NOT in the repo. The PNGs are final; changing the icon means drawing a new one.
2026-09-01 — Row IDs are plain counting numbers (1, 2, 3…), not the long random UUIDs Supabase sometimes defaults to. Smaller, readable in a URL, and there's only ever one device writing.
2026-09-01 — Money and nutrition are stored as exact decimals, not floating-point. Floating-point would make 0.1 + 0.2 come out as 0.30000000000000004, which is unacceptable for a monthly food spend.
2026-09-01 — `unit`, meal `type` and `quantity_unit` are plain text with a rule attached rather than database enums. Enums are painful to add a value to later; text with a rule is not.
2026-09-01 — Meal lines record what you actually typed: a number plus whether it meant grams/ml or pieces. Storing "2 pieces" rather than the converted "120 g" means the line still reads "2 eggs" in a year.
2026-09-01 — Every table carries a `created_at`. It's never shown anywhere; it exists so that if the data ever looks wrong, there's a record of when each row appeared.
2026-09-01 — The schema was tested by running it against a real throwaway Postgres locally and attempting to break each rule in Part 4. All nine tables, the deletion refusals, the one-row settings table, the duplicate-day blocks and the RLS lockdown were confirmed. The test database was deleted afterwards; Supabase was never touched.
2026-09-01 — The backup file reaches the phone through the iOS share sheet, falling back to a plain download where there isn't one. Downloads inside a home-screen app are unpredictable, which is the wrong behaviour for the one feature whose job is making sure the file really got saved.
2026-09-01 — "Backed up X days ago" comes from a new `last_export_at` column on `settings`, not from the phone. iOS wipes a home-screen app's stored data after about a week of not opening it — precisely when the reminder would matter.
2026-09-01 — That timestamp records that the file was handed over, not that it was saved. Cancel the share sheet and the clock still resets. Accepted knowingly; the alternative depends on a success signal iOS reports unreliably.
2026-09-01 — The reminder is a line on the home screen linking to `/export`, which holds the button. Quiet under 7 days, amber at 7, red at 14.
2026-09-01 — The export is all-or-nothing: if one table can't be read the whole thing fails, rather than handing over a file with a table silently missing.
2026-09-01 — `login_attempts` is left out of the backup. Timestamps for the lockout, worthless to restore.
2026-09-01 — Tables are written in restore order, so the file can be turned back into rows top to bottom. There is deliberately no import screen yet — Andrei was told, and left it alone.
2026-09-01 — Sample data is a pair of SQL scripts in `supabase/sample-data/` (`seed.sql`, `wipe.sql`) that Andrei runs when he wants them — **not** anything the app does. A first attempt had the export button seed an empty database itself; Andrei rejected it as messy and was right. The app now has no idea sample data exists, so the code behaves identically against invented and real data, with no "if the database is empty" branch to get wrong. Anything similar in future goes in SQL, not in the app.
2026-09-01 — `wipe.sql` refuses and rolls back if something real already uses a sample product, rather than cascading. Note for later: `on delete restrict` raises `restrict_violation` (23001), not `foreign_key_violation` (23503) — caught by testing, not by reading.
2026-09-01 — `lib/day.ts` is the only place dates are built, always in Europe/Bucharest.
2026-09-01 — Two colours added to `globals.css`, `--warn` and `--danger`, used only to say a backup is overdue. Nothing in this app is ever red about what you ate.
2026-09-01 — Icon files are split by job: `app/icon.png` and `app/apple-icon.png` for the browser and iOS (Next.js writes the link tags automatically), `public/icon-192.png` and `public/icon-512.png` for the manifest, which needs fixed paths.

## Deferred

- `AGENTS.md`, which the scaffolder wanted to add, was dropped. `CLAUDE.md` already covers it and two files of instructions would drift apart.
- The scaffold's demo homepage and its five unused demo images were removed rather than kept.
- Rubber-band scroll bouncing at the top and bottom of the screen is left as-is. It only looks wrong once there are real scrolling screens; worth revisiting then, not now.
- `/check` is now behind the PIN like everything else. Still gets deleted in phase 4 when the real weight screen replaces it.
- The icons and the manifest are deliberately reachable without the PIN. iOS fetches them when you add the app to the home screen, before there's any way to have logged in. They give nothing away.
- A custom lock-screen-style keypad for the PIN. The plain field works; revisit only if it annoys you in daily use.
- No import or restore screen. Restoring from a backup today means working from the
  JSON by hand. Andrei was told and chose to leave it; the file is shaped so an
  importer would be straightforward to add later.
- The export writes to the database on a GET request — it sets `last_export_at`.
  Nothing links to that URL, so nothing can trigger it by prefetching. Worth
  remembering if a link to it is ever added.
- A tested Europe/Bucharest wall-clock-to-timestamp helper (`localTimestamp`,
  `shiftDays`) was written for the rejected sample-data code and removed with it,
  rather than left in as dead code. Phase 5 needs it back for meal times. Test it
  against both daylight-saving changes and against a 02:20 meal, which is where it
  goes wrong.
- TypeScript doesn't yet know the shape of the database — table and column names aren't checked when writing queries. Worth generating properly when the first real screen lands in phase 4, not for a throwaway check page.
