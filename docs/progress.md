# Progress

Status board for Life Tracker. Short by design. See `life-tracker-plan.md` for the plan itself.

## Now

**Phase 7, step 7.1 (speed and scroll bugs) is built and waiting for Andrei to test it on
the phone.** Phases 1–6 are complete and the app has been in daily use since 2026-09-01.
Step 7.0 (the plan rewrite) is committed. No library has been added in phase 7.

### How phase 7 got here

On 2026-09-11 Andrei committed `docs/phase-7-spec.md` and `docs/phase-7-mockups.html`.
The spec is the list the previous session was waiting for, **and the one-item-at-a-time
review agreed on 2026-09-08 had already been done** — he did it himself, covering every
item of the old phase 7 as well. Don't run that review again.

In step 7.0 the spec was merged into Part 5 of `life-tracker-plan.md` as **Phase 7 — in
detail**, and the other parts of the plan it replaced were rewritten (Part 3's weight and
settings, Part 5's gamification and TDEE). From now on the plan is the source of truth for
phase 7, and the spec file is background. The mockups stay the visual reference: the plan
wins on behaviour, the mockups win on looks.

Every item of the old phase 7 checklist is accounted for in the table at the top of the
plan's phase 7 section. Nothing was dropped silently.

`architecture.md` was deliberately **not** changed. It describes the app as it stands,
and none of the app has changed yet; it's updated step by step as the code is.

**Phase 8 (gym) stays out of scope**, apart from the Workout placeholder tab in phase 7.
Don't design it or raise it.

## Waiting on me (Andrei)

1. **Commit and push step 7.1, then test it on the phone.** What to check:
   - **Meal builder:** open a meal with a few lines, scroll down to the search box, type.
     Results appear as you type, and the page stays where it is. Type an amount, tap
     Add: the line appears in the list above, the search box empties, and the page does
     not jump to the top.
   - **Recipe builder:** the same, on a recipe nobody has eaten yet.
   - **Products and Recipes lists:** scroll down a little, type in the search box — no
     jump. "Show retired" still shows the old versions.
   - **Skeletons:** from the home screen, open each screen. Grey pulsing blocks under the
     real title should appear the moment you tap, then fill in. The day arrows on Meals,
     and tapping an older entry on Weight, Sleep or Cigarettes, should do the same.
   - **Saving:** save a weigh-in — no skeleton, and "Saved …" stays on screen.
   - **Speed in general:** does any tap still feel slow? If so, which one.

Migrations 0001–0004 have all been run. Step 7.1 has no migration.

Andrei will enter his August cigarette history himself, when he chooses. It isn't
tracked here and doesn't need raising.

## Done

- 2026-09-12 — **Phase 7 step 7.0 complete: the plan is rewritten.** Andrei's
  `phase-7-spec.md` merged into Part 5 of the plan as "Phase 7 — in detail", and the
  parts of the plan it replaced rewritten. Then every open point settled one at a time,
  in conversation: chart drawing and icons, the step breakdown, Duplicate as a new
  feature, the spec's six assumptions, the four places it disagreed with the app, and
  the small calls. Each is under Decisions with its reason. Documents only; no code.
- 2026-09-08 — **Both pre-phase-7 issues closed.** The form-width fix was tested on the
  phone and approved. Migration 0004 was run, and the app has been in real daily use for
  a week since — which exercises every product, recipe and meal screen against the
  renamed `sugars_total` column. Phase 7 is now unblocked.

- 2026-09-02 — **Phase 6 complete: sleep and smoking.** Both steps tested on the phone
  and approved. Every table in the plan except gym now has a screen behind it.
- 2026-09-02 — Phase 6 step 2 complete: cigarettes. A day, a count, a note, the last
  fortnight, and the 4-day and 7-day averages with one flat sentence about the trend
  when they differ. Zero is a real entry and an empty box is refused. No backfill
  machinery, by decision. Tested on the phone and approved.
- 2026-09-02 — Phase 6 step 1 complete: sleep. Pick the morning, type the two times,
  score it out of ten. The length is worked out live as you type and never stored, and
  crossing midnight is arithmetic rather than a question. The last fortnight underneath,
  each editable and deletable, with the average over the last seven nights above them —
  said out loud when the week has gaps. Brought in `lib/sleep.ts` and `lib/series.ts`.
  Tested on the phone and approved.
- 2026-09-02 — **Phase 5 complete: nutrition.** Products, recipes, meals, the day's
  totals against targets, and repeat. All five steps tested on the phone and approved.
  The honesty rules in Part 4 hold throughout: nothing that has been used can be
  edited, nothing derived is stored, and retiring and replacing is always faster than
  editing would have been.
- 2026-09-02 — Phase 5 step 5 complete: repeat. A button on any past meal, and a
  "Repeat something recent" list on the day screen with identical meals collapsed.
  Copies the lines and the meal/snack type but not the note or score, follows retired
  products and recipes to their current version, and says which lines moved. Tested on
  the phone and approved.
- 2026-09-02 — Phase 5 step 4 complete: the day's totals and targets. Calories as a
  headline with a bar, then protein, fibre, added sugar and spend, then the full nine
  figures below the meals. Works for any day, not just today. A target that isn't set
  shows the number with no bar. New `/settings` screen holds the five targets, all
  optional and clearable. The home screen's Meals line shows today's calories. Every
  bar is the same colour — nothing here is ever red about what you ate. Tested on the
  phone and approved.

- 2026-09-02 — Phase 5 step 3 complete: meals. One day at a time, with arrows and a
  date box; Add creates the meal and drops you inside it; one search box for products
  and recipes together; pieces counted by default where a product says what one weighs;
  per-line and whole-meal nutrition and cost; time, day, type, note and score, all
  editable forever. Backfilled meals land at midday so they can't fall the wrong side
  of the 04:00 rule. `lib/day.ts` gained `localTimestamp` and the rest of the local-time
  helpers. Tested on the phone and approved.

- 2026-09-02 — Phase 5 step 2 complete: recipes. One screen per recipe — name,
  servings, cooked weight, then ingredients searched and added underneath. Raw weight,
  shrinkage in grams and percent, and per-serving nutrition and cost are all worked out
  live, never stored. Servings and ingredients freeze once a recipe has been eaten;
  name, notes and cooked weight stay editable forever. Replace copies the ingredients
  and follows retired products to their current version. Brought in `lib/nutrition.ts`,
  `lib/recipe-fields.ts` and `lib/replacements.ts`. Tested on the phone and approved.
- 2026-09-02 — A deletion refused by the database now names the real reason, in both
  products and recipes. Previously a product or recipe that an older one pointed at as
  its replacement was wrongly reported as having been used or eaten. Found by testing.
- 2026-09-02 — `agentRules: false` in `next.config.ts`, so `next dev` stops appending
  its own instructions to `CLAUDE.md`.
- 2026-09-02 — Phase 5 step 1 complete: products. List with search and a retired
  toggle, add, edit, retire, delete, and retire-and-replace. The form follows
  EU-label order and shows price per 100 live. What you may change depends on
  whether the product has been used. Tested on the phone and approved.
- 2026-09-01 — Phase 4 complete: weight. Pick a day, type a number, save; the last
  fortnight underneath, each editable and deletable. Logging a day twice updates it
  rather than failing. Home screen became a list of destinations, `/check` deleted,
  and `lib/types.ts` now gives TypeScript the shape of the database. Tested on the
  phone and approved.
- 2026-09-01 — Phase 3 complete: the JSON export. One button, every row in the
  database, delivered through the iOS share sheet with a download fallback. The home
  screen shows how long it's been, from `last_export_at` on `settings`. Migration
  0003 run. Sample data for development is two SQL scripts run by hand, deliberately
  not anything the app does. Tested and approved.
- 2026-09-01 — Phase 2 complete: the PIN gate. Six digits, scrypt hash in an
  environment variable, signed three-month cookie, database-backed lockout after five
  failures, failing closed if the database is unreachable. Gate lives in `proxy.ts`.
  Tested on the phone and confirmed working.
- 2026-09-01 — Phase 1 complete, in four steps: Next.js skeleton and dark theme; the
  PWA icon set and manifest for the iOS home screen; the database schema, all tables
  except gym with RLS on, run by hand in Supabase; and `lib/supabase.ts`, verified
  against the real project including the 401-without-a-key check. All tested on the
  phone and approved.

## Next

**Build phase 7**, one step at a time. What it contains is in Part 5 of the plan.

### Step breakdown — approved 2026-09-12

The spec's Part 15 was a starting proposal. This version, approved by Andrei as it
stands, differs from it in four places:

- **The speed and scroll bugs move from last to first.** Every step tested in between
  would otherwise be tested on the slow app. The region check costs nothing. And the
  scroll jumps live in the meal screen that 7.4 restyles, so it's better to fix them
  before restyling than after.
- **The chart base is built together with the first real chart (Smoking)**, rather than
  on its own in the shell step. A chart frame with no chart in it is scaffolding that
  can't be tested on the phone.
- **The Workout placeholder moves into the settings step.** All it reads is the gym date
  that step adds. Until then the tab bar has four tabs.
- **TDEE gets its own step**, separate from the weight chart. It's the reason the app
  exists, and the arithmetic is the risk.

| Step | Work |
|---|---|
| 7.0 | Rewrite the plan and this file from the spec; proposals *(done)* |
| 7.1 | Speed and scroll bugs: check where Vercel and Supabase each run, stop search and Add jumping to the top, make taps faster *(built, waiting on the phone test)* |
| 7.2 | App shell: new palette, tab bar with icons (Sleep · Smoking · Nutrition · Settings), Nutrition opens by default with its four sub-tabs over the existing screens, Sleep, Smoking and Weight moved to the 04:00 day, the smoking form opening on yesterday, red dots for missing logs, the backup dot, Settings tab holding the current targets and the export, old home screen and `/export` retired, rubber-band check |
| 7.3 | Settings: migration 0005 with every new field, the full Settings tab, timezone in the export, and the Workout tab with its countdown |
| 7.4 | Nutrition → Today: target rules, hero, nutrient bars with the fat split, meal rows, day details, "+" with tap and hold |
| 7.5 | Calendar heatmap with the streak and the days-logged counter |
| 7.6 | "Where did it come from?" panels (on Today; the stats section reuses them later) |
| 7.7 | Recipes and Products: sort pills, lei per 30 g protein and per 1,000 kcal, and Duplicate |
| 7.8 | Smoking tab: the shared range control and the chart base with its rotate button, proven on the bar chart with its two averages, and the list |
| 7.9 | Weight: dots chart, averages, invented points, goal line, list |
| 7.10 | TDEE estimate and the formula comparison |
| 7.11 | Sleep: the clock, night and period |
| 7.12 | Sleep: chart view |
| 7.13 | Stats, part 1: digest cards (with the weekly digest's content), food spend this month, range, average boxes, chart with metric buttons |
| 7.14 | Stats, part 2: meals vs snacks, days on target |
| 7.15 | Stats, part 3: timing card |
| 7.16 | Milestones |

### Details to settle at the step that builds them

Not needed now, and written here so they aren't lost:

- **TDEE (7.10):** what counts as a "day of data" for the 7-day threshold and the
  accuracy label: days with a weigh-in, days with meals, or both. And what shows with
  fewer than three weigh-ins. A trend line needs two points and a ± range needs three.
- **Duplicate (7.7):** where the button sits (next to Replace on the item's screen is the
  obvious place), what the copy is called, and whether a duplicated recipe's retired
  ingredients follow `replaced_by` to the current version the way Replace does.
- **Streak (7.5):** is "one missed day per week" counted per calendar week (Monday to
  Sunday) or across any seven days in a row?
- **Where did it come from (7.6):** a recipe line counts as the recipe as a whole
  ("Burritos"), not its ingredients. The mockups show it that way; confirm when building.
- **Weekly digest (7.13):** is "the previous week" the seven days before the last
  seven, or the previous calendar week?
- **Milestones (7.16):** Claude proposes the full list.

One piece of context for TDEE: it wants three to four weeks of weight and food, and as
of 2026-09-11 there is roughly ten days of real logging. By step 7.10 there should
probably be enough for "Fair". That's why it sits where it does, not a reason to drop it.

Then 8 (gym), which is deliberately parked.

### Settled already, so don't re-ask

These came out of phase 5 and hold from here on:

- All arithmetic lives in `lib/` as pure functions that take rows and return numbers,
  with no database access, so it can be checked on its own. `nutrition.ts` for food,
  `targets.ts` for progress, `day.ts` for anything with a date in it.
- Missing nutrition values are summed as if zero, and totals are shown as plain
  numbers. The plan accepts the consequence: a fibre or sugar total can read lower
  than what was really eaten. Calories are never affected, because calories are
  required on every product.
- 1 ml counts as 1 g when a recipe's raw weight is added up. No densities are stored.
- A recipe contains products only. A recipe can never contain another recipe.
- Every date and time goes through `lib/day.ts`, in Europe/Bucharest. Nothing anywhere
  else builds one.
- **Changed in phase 7:** red means a missing log, a missed target, or an overdue
  backup; amber means only a backup that's getting old. Nothing else is ever red or
  amber. (Until 2026-09-11 this said nothing was ever red or amber about what was
  logged — that rule is gone.)

Two things that shaped phase 5 and are worth keeping in view:

- **The honest path has to be the fast one.** Replacing a product is quicker than
  editing one would have been, deliberately. If the correct path is ever the slower
  one, the rule it protects quietly stops holding. That's a UX problem with data
  consequences, not a preference.
- **The arithmetic is the risk, not the screens.** Nothing derived is stored, so one
  wrong helper is wrong on every screen and in every week of history at once — and it
  looks fine. Part 7 of the plan rules out tests in the repo, so it gets verified in
  the scratchpad against a throwaway Postgres and thrown away. That has now caught a
  bug in every phase it's been used on.

## Where things stand technically

For a session picking this up cold, after reading the plan and this file:

- The app is Next.js 16 at the repo root, deployed on Vercel, tested by Andrei on an
  iPhone home screen. `npm run build` and `npm run lint` both pass.
- Screens so far: `/login` (the PIN screen), `/` (a list of destinations), `/weight`,
  `/products` (list, `new`, `[id]`), `/recipes` (list, `new`, `[id]`), `/meals` (a day
  with its totals, and `[id]`), `/sleep`, `/smoking`, `/settings` (the five targets) and
  `/export`. The temporary `/check` page has been deleted.
- Everything except `/login`, the icons and the manifest is behind the PIN — including
  `/api/export`, which is the URL that hands over the whole database.
- Every screen that reads the database has a `loading.tsx` skeleton next to it, and
  every search box filters on the phone (both from step 7.1; see `architecture.md`).
- The database has ten tables: the nine in the plan plus `login_attempts`. Sample data
  goes in and out by hand with the scripts in `supabase/sample-data/`; the app never
  creates data by itself. **The sample data is gone** — Andrei ran `wipe.sql` before he
  started logging properly, so as of 2026-09-09 the database holds about a week of real
  data and nothing invented. Anything phase 7 reads is now his own.
- Nothing in this repo has ever written to Supabase except through the app itself, and
  Claude has never created a row there. Every database check has been run against a
  throwaway Postgres in the session scratchpad.
- `git log` is readable and is the fastest way to confirm what actually shipped. Phase
  5 was committed as five steps, one per approved step, plus the two side fixes.
- Four environment variables, in `.env.local` and in Vercel: `SUPABASE_URL`,
  `SUPABASE_SECRET_KEY`, `PIN_HASH`, `SESSION_SECRET`.
- Migrations `0001` to `0004` have all been run. A new migration means a new
  numbered file in `supabase/migrations/` for Andrei to paste in himself.

- Git: Andrei runs every git command. Reading history (`git log`, `git status`,
  `git show`) is fine and useful; anything that writes is not.

Worth knowing about how this has gone so far: **nine** mistakes were caught only
because things were tested rather than assumed — a batch of constraint tests that
silently proved nothing; a login flow that would have let anyone in with the lockout
switched off if the database were unreachable; an export that would have saved the
login page as your backup once the session expired; a wipe script catching the wrong
Postgres error code; a `Database` type that silently switched off all table-name
checking; a product replacement that reported success while leaving an orphan; a
deletion refusal that blamed the wrong thing, telling you a recipe had been eaten when
what actually blocked it was an older recipe pointing at it; a date helper that
stored every meal logged before the October clock change an hour late; and a meal
search box that was meant to empty itself after Add but had never once done so. Every
one of them looked fine. Test against the real thing before reporting a step as done.

### How to test database code without touching Supabase

This has now caught a bug in every phase it's been used on, so it's worth doing again
rather than reinventing. All of it happens in the session scratchpad and is deleted
afterwards; Supabase is never involved. Part 7 of the plan rules out tests *in the
repo*, and this respects that — nothing is committed.

1. `initdb` a throwaway cluster in the scratchpad and start it on `127.0.0.1:55433`.
   A Unix socket path inside the scratchpad is too long for Postgres, so listen on a
   port instead.
2. Create a database, `alter database … set timezone='UTC'` to match Supabase, and
   run `supabase/migrations/000*.sql` into it. The `revoke … from anon` lines fail
   locally because those Supabase roles don't exist — that's expected and harmless.
3. Compile the real modules with
   `npx tsc <files> --outDir <scratch> --module commonjs --target es2022 --moduleResolution node --skipLibCheck --esModuleInterop`.
   The `@/…` import errors are expected; the JavaScript is still emitted.
4. `sed` the emitted `@/lib/supabase` imports to a hand-written stand-in that speaks
   SQL to that Postgres through the `pg` driver, implementing only the slice of
   supabase-js the app uses. Set the driver's `date`/`time`/`timestamp` parsers to
   return raw strings, because that's what PostgREST does.
5. Server actions also import `next/cache` and `next/navigation`. Stub them via
   `Module._resolveFilename`; make `redirect()` throw a marker so the success path is
   observable.
6. Run the checks, then stop the cluster and delete the data directory.

Two traps this setup has already exposed, both worth re-checking in any new code: an
`update` that matches no rows is **not** an error, and `on delete restrict` raises
`restrict_violation` (23001), not `foreign_key_violation` (23503).

Notes from doing it again in step 2, so the next session doesn't rediscover them:

- The stand-in has to wrap every statement in `with t as (…) select json_agg(t) from t`,
  not in a plain subquery, or `insert … returning` won't parse.
- `psql` on its own is enough — no `pg` driver, so nothing gets installed anywhere.
  `json_agg` renders numerics as JSON numbers, which is what PostgREST does too.
- Compile with `--strict`, or the standalone `tsc` narrows union types differently
  from the real build and invents errors that aren't there.
- Two things point at a recipe with `on delete restrict`: `meal_items` and another
  recipe's `replaced_by`. Matching on "foreign key" alone can't tell them apart, so
  the error message has to look at *which* constraint failed.

From step 7.1, for checking how screens *behave* rather than what a function returns —
scrolling, skeletons, what a tap does:

- Copy the repo into the scratchpad (not `.git`, not `.env.local`), put a stand-in
  `lib/supabase.ts` in the copy that runs each query through `psql` against the
  throwaway Postgres (the query builder it needs is about 150 lines: select, insert,
  upsert, update, delete, eq/in/ilike/gt/lt, order, limit, single/maybeSingle, and
  `count: "exact", head: true`), set `typescript.ignoreBuildErrors` in the copy's
  `next.config.ts`, then `next build` and `next start`. Copy `node_modules` rather
  than symlinking it.
- A made-up `SESSION_SECRET` in the copy's `.env` lets the test forge its own session
  cookie (`<expiry>.<HMAC-SHA256 hex of expiry>`), so the PIN gate stays switched on.
- Playwright is already in the npx cache (`~/.npm/_npx/*/node_modules/playwright`), with
  Chromium in `~/.cache/ms-playwright`. The iPhone 13 profile on Chromium is close
  enough for layout and scroll; it can't show iOS-only behaviour.
- A delay added to every stand-in query (300 ms) makes loading states visible and
  measurable.
- To show that a fix works, run the same check against the code as committed
  (`git archive HEAD | tar -x` into another folder is read-only) and watch it fail
  there. The scroll checks did.
- Don't stop the test server with `pkill -f "next start …"`: it matches the shell
  running the command and kills that too. Find the process number with `ss -ltnp`.

From step 3, on dates specifically:

- The clock-change checks need no database at all — `lib/day.ts` is pure — so they run
  in a second and are worth running on any change to it. Check **every hour** of both
  clock-change days, not a few samples: the bug that shipped into the first version was
  at 01:20 and 02:20 on the October morning, hours the obvious tests don't cover.
- The 2026 changes are 29 March and 25 October. Bucharest is UTC+2 in winter, UTC+3 in
  summer.

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
2026-09-01 — The reminder is a line on the home screen linking to `/export`, which holds the button. Quiet under 7 days, amber at 7, red at 14. **Superseded 2026-09-11 (phase 7):** same thresholds, but shown as a dot on the Settings tab icon and on the Export row in Settings; the home screen and `/export` go.
2026-09-01 — The export is all-or-nothing: if one table can't be read the whole thing fails, rather than handing over a file with a table silently missing.
2026-09-01 — `login_attempts` is left out of the backup. Timestamps for the lockout, worthless to restore.
2026-09-01 — Tables are written in restore order, so the file can be turned back into rows top to bottom. There is deliberately no import screen yet — Andrei was told, and left it alone.
2026-09-01 — Sample data is a pair of SQL scripts in `supabase/sample-data/` (`seed.sql`, `wipe.sql`) that Andrei runs when he wants them — **not** anything the app does. A first attempt had the export button seed an empty database itself; Andrei rejected it as messy and was right. The app now has no idea sample data exists, so the code behaves identically against invented and real data, with no "if the database is empty" branch to get wrong. Anything similar in future goes in SQL, not in the app.
2026-09-01 — `wipe.sql` refuses and rolls back if something real already uses a sample product, rather than cascading. Note for later: `on delete restrict` raises `restrict_violation` (23001), not `foreign_key_violation` (23503) — caught by testing, not by reading.
2026-09-01 — `lib/day.ts` is the only place dates are built, always in Europe/Bucharest.
2026-09-01 — The weight screen holds the form and the last 14 entries together; logging a day that already exists updates it rather than refusing, and the button reads Update. Safe because nothing points at a weigh-in — unlike products and recipes, which are frozen once used.
2026-09-01 — Home screen is a plain list of destinations, one line per phase as they land. A bottom tab bar was considered and deliberately deferred until there are four or five real screens (around phase 6) — the tab set will change several times before then. **Superseded 2026-09-11 (phase 7):** a five-tab bar replaces the home screen, and the app opens on Nutrition.
2026-09-01 — `lib/types.ts` describes the database to TypeScript, written by hand because the Supabase CLI is off limits. **It must be updated by hand with every migration.** Note: `Views: Record<string, never>` silently disables table-name checking, because an empty Record is keyed by any string — use `{ [_ in never]: never }`. Caught by deliberately typing a wrong table name and finding no error.
2026-09-02 — The product form follows EU-label order (energy, fat, saturates, carbs, sugars, fibre, protein, salt), not database order, so you can type straight down the packet. One long form, not a wizard: iOS drops a home-screen app's state on relaunch, so a form split across screens can lose half your typing.
2026-09-02 — Price per 100 is shown live under the price and package-size fields. It's the only cheap guard against typing 100 g for a 1 kg bag, which silently corrupts the cost of every meal that product ever appears in.
2026-09-02 — What you may change is decided by whether the product has been used: unused means fully editable and deletable, used means frozen except the name. Replace opens the add form pre-filled with a copy and steps the name ("oats" → "oats 2"). Replacing has to be as fast as editing, or the honesty rule quietly stops holding.
2026-09-02 — Creating a replacement and retiring the original are two writes with no transaction available. If the second doesn't happen the first is undone. **Note for any future two-step write: updating a row that doesn't exist is not an error — it silently matches nothing. Ask for the changed rows back with `.select()` and check you got any.** Found by testing, after the action reported success while leaving an orphan.
2026-09-01 — Weight input accepts a comma as a decimal point and rounds past two decimals, matching what the column stores. Future dates are refused; past dates are not, because backfill is required everywhere.
2026-09-01 — Two colours added to `globals.css`, `--warn` and `--danger`, used only to say a backup is overdue. Nothing in this app is ever red about what you ate. **Superseded 2026-09-11 (phase 7):** red now also means a missing log or a missed target.
2026-09-02 — A recipe is one screen. Name and servings are saved first, then the ingredients are added to the saved recipe underneath: search, type a quantity, Add. Nothing is spread across two screens, because iOS drops a home-screen app's state on relaunch. Accepted cost: a recipe can sit there empty, which the list shows as "no ingredients". That state is honest anyway — the cooked weight can't be filled in until the pan has been weighed, usually a different day.
2026-09-02 — Shrinkage is shown as grams *and* a percentage. The percentage is what you compare between cooks; the grams are what tell you a figure was mistyped. A pan that got heavier is reported as such rather than hidden — adding water to a stew is real, and so is a typo.
2026-09-02 — Per-serving nutrition and cost sit on the recipe screen itself, right under the ingredients, because that's the one moment you can still spot a wrong number and fix it. The whole-batch figures are one muted line beneath.
2026-09-02 — The cooked weight stays editable forever, even on a recipe that's been eaten. A meal records *servings*, so per-serving calories and cost come from the ingredients divided by the servings and the cooked weight is never part of that sum. It only says what a portion weighs. Weighing the pan a week later rewrites no history. Servings and ingredients are frozen once eaten; name and notes are always editable.
2026-09-02 — Replace copies the ingredients, and any line pointing at a retired product is followed through `replaced_by` to the current version. The replace screen lists which lines moved before you save. Copying retired products across would mean replacing them again immediately; following the chain silently would hide a change in the numbers.
2026-09-02 — Retired products are hidden from the ingredient search, the same as when logging a meal. A new recipe should be built from what you buy today.
2026-09-02 — The ingredient search rewrites the URL rather than fetching in the browser, so the server does the searching and a reload doesn't lose your place. Adding an ingredient redirects back to the recipe with the box empty, ready for the next one. **Superseded 2026-09-12 (step 7.1):** every search box filters on the phone, and Add redraws in place instead of redirecting — both were what made the page jump to the top.
2026-09-02 — All food arithmetic lives in `lib/nutrition.ts` as pure functions with no database access, and following a replacement chain lives in `lib/replacements.ts`. Both are checkable on their own, which is the point: nothing derived is stored, so one wrong function would be wrong everywhere at once and still look fine.
2026-09-02 — A deletion refused by the database now says *why*. Several different things point at a product or a recipe with `on delete restrict` — a recipe that uses it, a meal that ate it, and an older version replaced by it — and they need different answers. Found by testing: the first version told you a recipe had been eaten when nobody had eaten it. Fixed in recipes and, at Andrei's request, in products too, where the same wrong message had shipped in step 1.
2026-09-02 — The meals screen shows one day at a time, and "today" means the day you're currently logging towards rather than the calendar date — at 02:00 you're still filling in yesterday. Step 4 adds totals and progress to this same screen instead of making a second one.
2026-09-02 — Tapping Add creates the meal immediately, with the time set to now and the day worked out by the 04:00 rule, and drops you inside it. No form between you and typing what you ate; this screen gets used several times a day. Accepted cost: a mis-tap leaves an empty meal, which is one tap to delete.
2026-09-02 — One search box returns products and recipes together, recipes tagged and showing calories a serving. Deciding which of the two something is before you can look for it is a tap that shouldn't exist.
2026-09-02 — A meal line stores what was typed, not the conversion: a number plus whether it meant the product's own unit or pieces. The box counts pieces by default for any product that says what one weighs, and shows the grams live. Recipe lines are servings and take halves.
2026-09-02 — Backfilled meals get **midday** on the day being looked at, not the current clock time. Logging yesterday's dinner at 01:30 tonight would otherwise land before the 04:00 rule and count towards the day before yesterday. Logging as you eat still gets the real time.
2026-09-02 — Under the "counts towards" field, the meal screen says what the 04:00 rule makes of the date and time as typed, with a one-tap button to accept it. Makes a 02:20 snack landing on the previous day visible rather than surprising.
2026-09-02 — A local time that never existed (spring change) resolves to just after the jump; one that happened twice (autumn change) resolves to the second occurrence. Documented rather than accidental — both land the same side of the 04:00 rule, and being the same answer every time is what matters.
2026-09-02 — Sleep and smoking get separate screens, not a shared one. They're logged at opposite ends of the day — sleep when you wake up, cigarettes when you go to bed — and share a shape and nothing else.
2026-09-02 — A night's length is never stored. It's worked out from the two times and shown live under the fields, which is what catches a mistyped time while you can still see it. Crossing midnight is arithmetic, not a question: if bedtime is later on the clock than the wake-up, the night crossed midnight. The app never asks which day bedtime was on.
2026-09-02 — Averages over days count only the days that have an entry, and say how many when the window isn't full ("over the 6 you logged"). A missing day is a day not logged, not a day of zero — filling gaps with zero would flatter a cigarette count, and treating a half-empty window as complete would lie about it. `lib/series.ts`, reused by phase 7 for the 7-day weight average.
2026-09-02 — On the cigarettes screen a zero is a real entry and an empty box is refused. The schema keeps "not logged" and "smoked nothing" apart deliberately, and the field starts empty rather than at zero so a zero is always something you typed. If empty quietly meant none, every forgotten day would read as a perfect one.
2026-09-02 — The cigarettes screen carries one interpreted sentence — "The last four days are below the week", or above it — shown only when the two averages differ. It's the only place in the app that interprets rather than reports, it exists because the plan says the trend is the point, and it stays neutral in both directions: no congratulation, no colour. **Superseded 2026-09-11 (phase 7):** the sentence and the two averages above the list are removed; the chart's two average lines replace them.
2026-09-02 — **No backfill machinery for cigarettes.** A grid of thirty editable days was proposed and Andrei turned it down: he'll enter his month of history one day at a time, and the smoking screen is the weight screen's shape exactly. Don't re-propose it.
2026-09-02 — Repeat has two entry points: a button on any past meal, and a "Repeat something recent" list on the day screen. The button alone is what the plan literally asks for, but it's only reachable by remembering which day you ate the thing; the list is what makes it a daily feature. Ranked by recency, not frequency — recency is exact, and "how often" needs a definition of "the same meal" that belongs with phase 7's statistics. **Changed 2026-09-11 (phase 7):** the list moves into a sheet opened by holding the "+" on Today; the button on a past meal stays; still ranked by recency.
2026-09-02 — A repeat copies the lines and the meal/snack type, but not the note or the score. A score is a judgement about one particular plate of food, and carrying it forward would fill the history with scores that were never given — which matters, because phase 7 reads them.
2026-09-02 — A repeated line pointing at something retired follows `replaced_by`, and the copy says which lines moved. That notice is worked out by comparing the copy against the meal it came from, because the copy itself points only at the current versions — a moment later the information is gone. Something retired with nothing after it is copied as it stands and called out separately, rather than failing the whole repeat over one line.
2026-09-02 — The day's totals live at the top of the meals day screen, not on a separate "Today" page, so they work for any day rather than only for today. Backfilling Saturday shows Saturday's totals. A today-only screen would have needed a second copy of the same arithmetic.
2026-09-02 — The home screen's Meals line shows today's calories rather than a fixed label. One extra query on the home screen, for the number the app is most often opened to check. **Superseded 2026-09-11 (phase 7):** the home screen goes; the app opens on Nutrition → Today, where calories are the hero.
2026-09-02 — `/settings` holds the five targets, all optional and clearable. They live in the database rather than in code because the plan expects them to be revised once TDEE can be estimated — and if changing them meant the Supabase SQL editor, they'd quietly go stale. `day_boundary_hour` is deliberately not on that screen; it changes how past data reads, not what it's measured against. **Extended 2026-09-11 (phase 7):** the Settings tab adds carbs, fat, the fat ratio, goal phase and weight, body figures, the gym date and the export; `day_boundary_hour` stays hidden.
2026-09-02 — Every bar on the day screen is the same colour, including the ones you've gone past. No amber, no red, ever, about what was eaten — Part 5 of the plan rules it out, and amber is reserved for an overdue backup, which is an actual problem. Going over fills the bar and says "past it" in plain text. **Superseded 2026-09-11 (phase 7):** bars keep their nutrient colour, and the part past a ceiling or above a ±10% zone turns red, as does the number; protein and fibre stop being floors.
2026-09-02 — A target that isn't set shows the number with no bar and a link to the targets screen, rather than hiding the row. You want to watch a number for a fortnight before deciding what it should be.
2026-09-02 — Nothing about a meal is ever frozen. Nothing in the database points at a meal, so every line, quantity, time and note stays editable and deletable forever, and deleting a meal takes only its own lines.
2026-09-02 — `agentRules: false` in `next.config.ts`. `next dev` was appending its own block of instructions to `CLAUDE.md` and re-adding it whenever it was removed; that file is written by hand and says what it needs to say.
2026-09-02 — **The two sugar figures overlap, and nothing may ever add them.** `sugars_total` is the packet's "of which sugars" line — natural and added together. `sugars_added` is Andrei's estimate of how much of *that same figure* was added. Natural sugar is the difference, computed and never stored. Chosen over the plan's original "two disjoint halves" reading for two reasons: it never asks for a subtraction while copying a packet, which is the phase 5 principle that the honest path has to be the fast one; and it is the only reading where leaving "added" blank still leaves the total correct, instead of silently asserting that all of it was natural. The plan (Part 3) and `architecture.md` were rewritten to match. **Phase 7 must not sum them** — the note is in `lib/nutrition.ts` too.
2026-09-02 — Migration 0004 renames `products.sugars_natural` to `sugars_total`, along with its check constraint, and puts the meaning in a `comment on column` so it travels with the database. No data moves; the form has always asked for the packet figure, so what is already stored is already a total. The rename was done rather than skipped because the old name described the opposite of what the column holds, and this project has twice been bitten by a name that lied. Verified against a throwaway Postgres: values intact, old column gone, renamed constraint still refusing negatives, every column list the app selects with still resolving, and `seed.sql` and `wipe.sql` both still running clean.
2026-09-02 — Any row that puts two inputs side by side gets `min-w-0` on each half. A text input carries a built-in width of roughly 20 characters, and a flex column will not shrink below its contents unless told to, so two of them insisted on 478px inside a screen that has at most 408 and as little as 335. Measured in a real browser at every iPhone width rather than eyeballed. Applies to the product form, the recipe form and the rename row; the sleep and meal date/time rows were measured too and fit, so they were left alone.
2026-09-09 — **Phase 7 is rewritten from Andrei's own list before it is built.** A week of
real use produced a list of what he wants next, and the plan changes to match rather than
the list being fitted into the plan. Agreed process: the whole list at once, then one item
at a time in conversation, each compared against the existing phase 7 and decided
keep/change/remove, ending in a rewritten phase 7 in Part 5. He asked for it slowly and
explicitly, decision after decision, and specifically asked that nothing already in phase
7 be lost just because he forgot to mention it — so every existing item is accounted for
by an explicit decision, and removals are written down with their reason. Phase 8 is out
of scope for the rewrite. **Done 2026-09-11:** Andrei ran the review himself; see below.
2026-09-01 — Icon files are split by job: `app/icon.png` and `app/apple-icon.png` for the browser and iOS (Next.js writes the link tags automatically), `public/icon-192.png` and `public/icon-512.png` for the manifest, which needs fixed paths.
2026-09-11 — **The phase 7 review was done by Andrei himself**, before the session, and delivered as `docs/phase-7-spec.md` with `docs/phase-7-mockups.html`. Claude doesn't re-run it. The spec was merged into Part 5 of the plan as **Phase 7 — in detail**; the spec file is background from now on, and the mockups stay the visual reference (the plan wins on behaviour, the mockups on looks).
2026-09-11 — What phase 7 replaced, so nobody finds two rules and guesses (each old line above is marked where it applies): red now means a missing log, a missed target or an overdue backup, and amber only an ageing backup; targets are ceilings (calories on a cut, spend, added sugar) or ±10% zones (protein, carbs, fibre, fat, and calories on maintain or bulk), no longer budgets and floors; TDEE fits a trend line through real weigh-ins and shows from 7 days with an accuracy label, instead of 7-day averages after 14 days; the weight chart shows skipped days as hollow grey invented points instead of a line across them; a five-tab bar replaces the home screen and the app opens on Nutrition; the smoking screen's averages and trend sentence go, replaced by the chart; "Repeat something recent" moves to holding the "+"; Settings gains every target, the goal, body figures, the gym date and the export.
2026-09-11 — The original plan's TDEE formula had its sign backwards: with "weight change" read as end minus start, losing weight would have lowered the estimate. The phase 7 formula, `TDEE = average intake − slope × 7700`, has it right. Worth checking the sign against a made-up losing week when 7.10 is built.
2026-09-11 — `architecture.md` describes the app as it is, not as it will be, so it changes step by step as phase 7's code lands. It was not rewritten in step 7.0.
2026-09-12 — **Charts are drawn by hand as SVG, with no charting library.** Chosen over Recharts: several of phase 7's charts are things no library draws (the 12-hour sleep clock, a time axis across midnight, ±10% zone bands with red overflow, hollow invented weight points), and server-drawn SVG sends the phone no extra code. Cost accepted: axes, labels and tappable bars are written by hand. The chart arithmetic lives in `lib/` as pure functions and is checked in the scratchpad like the rest.
2026-09-12 — **Tabler icons are copied into one file in the app as SVG**, with Tabler's licence notice at the top, rather than added as the `@tabler/icons-react` dependency or loaded as the icon font the mockups use (which would send the phone thousands of icons). A new icon means copying one more in.
2026-09-12 — **Duplicate is a new feature on Products and Recipes**, built in 7.7. It opens the add form pre-filled with a copy (a recipe brings its ingredients) and saving creates a new, separate item; unlike Replace, the original is not retired and not linked. For creating something much like an item that already exists. The spec's "tap to duplicate" meant this, not Replace.
2026-09-12 — `fibre_min` is renamed `fibre_target` in migration 0005, because it's now a ±10% target rather than a minimum. `added_sugar_max` and `daily_budget` keep their names; they're still accurate.
2026-09-12 — The fat-ratio limit follows the setting: with 1 : N, saturated fat is over when it's more than 1 ÷ (1 + N) of total fat. The spec's "⅓" is that rule at the default 1 : 2.
2026-09-12 — Never having exported shows red, the same as 14+ days. It showed amber before.
2026-09-12 — The export file keeps `format: 1` when it gains `tz`. Adding a field changes nothing already in the file.
2026-09-12 — `docs/phase-7-spec.md` stays in the repo as background reading. The plan wins where they differ.
2026-09-12 — The phase 7 step breakdown under Next is approved as written, including the speed and scroll bugs moving from last to first (7.1).
2026-09-12 — The Nutrition stats range opens on 7 days: a week always holds one weekend, so the averages compare like with like, and it matches the weekly digest above it.
2026-09-12 — "Low protein" means protein supplies under 10% of an item's calories, at 4 kcal a gram. Chosen over 5% (rice and bananas would stay in the ranking with meaningless prices) and 15% (bread, pasta and oats would drop out). The calorie sort's counterpart, "low calorie", is under 20 kcal per 100 g or ml; for a recipe, per 100 g of its ingredients added up.
2026-09-12 — In the stats, days with no meals logged are grey in Days on target and left out of every average. A forgotten day counted as zero would be red on the zone targets, green on the ceilings, and would drag average calories — and TDEE — down.
2026-09-12 — The stats cover complete days only, ending yesterday; Custom can't end later. Today's half-finished numbers would pull every average down each morning, and they're already live at the top of the same screen. Food spend this month is a running total and does include today.
2026-09-12 — A logged day, for the streak, the days-logged counter and a full-strength calendar dot, means all four logs exist: that morning's sleep, that day's cigarettes, that day's weigh-in, at least one meal. Worked out up to yesterday, since smoking is logged the next day. Chosen over three-of-four knowingly: it's strict — a trip of two or more days without a scale breaks the streak — but the streak means "I logged everything", and TDEE needs both weight and meals.
2026-09-12 — Milestones are proposed by Claude at step 7.16, not now, so the list can be checked against a month or more of real data.
2026-09-12 — **Sleep, Smoking and Weight move to the 04:00 day**, like meals, in step 7.2: their red dots, the day their forms open on, and the "that date is in the future" check. Until now they went by the midnight date (`today()` in `lib/day.ts`), which would have put a red sleep dot up at 00:30 for a night not yet slept. Accepted cost: a weigh-in typed between midnight and 04:00 opens on the previous day.
2026-09-12 — The smoking form opens on yesterday (by the 04:00 rule), not today, from step 7.2 — the same step as its red dot. Smoking is logged a day behind, and a form that opened on today would put the count on the wrong day whenever the date wasn't changed. Logging today early means changing the date.
2026-09-12 — The search box on the Products and Recipes lists stays, above the sort pills, although the mockups leave it out. The lists only grow, every price change adds another version, and search is how an old retired one is found for its price history.
2026-09-12 — Each meal row on Today keeps its calories, beside the cost, although the mockup's row leaves them out: when the day's total looks high, the first question is which meal did it. Accepted cost: a busier first line, and long names cut short sooner.
2026-09-12 — The Sleep tab keeps a permanent "+" in its header, alongside the big "+" on the clock. The big one only covers last night; the header one reaches any night, including from the period view, and matches Smoking and Weight.
2026-09-12 — **The Vercel functions run in Dublin, beside Supabase in `eu-west-1` (Ireland).** They were in North America, so every database question crossed the Atlantic, and each screen asks two or three in a row. Andrei moved the region in the Vercel dashboard himself and confirmed it's faster. It's set there, not in the repo. If either side ever moves, the other moves with it.
2026-09-12 — **Every search box filters on the phone** (step 7.1): the food search in a meal, the ingredient search in a recipe, and the Products and Recipes lists. The screen arrives with the full list and typing only filters it, so nothing reloads and nothing jumps. Andrei chose this over keeping the server search with the jump switched off, because each pause in typing still waited on the server. Accepted cost: a half-typed search, and the Show-retired toggle, are forgotten when you leave the screen. The two lists were included because Andrei said to fix the jump everywhere it happens, and testing showed the Products list jumped too.
2026-09-12 — Adding a food to a meal or an ingredient to a recipe saves and redraws the screen in place, rather than redirecting back to it. A redirect re-opens the page, and re-opening scrolls to the top. The search box empties itself once the save has worked; on a failure it keeps what you typed and shows the reason. (The old version never actually emptied the box either — found by testing.)
2026-09-12 — **Every screen that reads the database has a loading skeleton** (`loading.tsx` beside it, built from `app/skeleton.tsx`): the real title, headings and labels, with grey pulsing blocks where the data will go. Andrei asked for skeletons specifically, over a plain "Loading…". Meals, Weight, Sleep and Cigarettes also show theirs when the date changes without leaving the screen, through a boundary keyed on the date. Saving never shows one. **When a phase 7 step redesigns a screen, it redesigns that screen's skeleton too.**
2026-09-12 — The skeleton blocks appear at once and pulse, rather than fading in after a delay. On the date-keyed screens one skeleton is swapped for an identical one partway through arriving, and a fade-in would make that swap blink. On a real connection every load is long enough to see them anyway.
2026-09-12 — The meal, day and recipe screens ask the database their independent questions all at once instead of one after another. The product screen still asks three in a row; it isn't opened often enough to matter.

## Deferred

- `AGENTS.md`, which the scaffolder wanted to add, was dropped. `CLAUDE.md` already covers it and two files of instructions would drift apart.
- The scaffold's demo homepage and its five unused demo images were removed rather than kept.
- Rubber-band scroll bouncing at the top and bottom of the screen is left as-is. It only looks wrong once there are real scrolling screens; worth revisiting then, not now. **Picked up by phase 7:** the fixed tab bar makes it real; checked on the phone in the shell step.
- The icons and the manifest are deliberately reachable without the PIN. iOS fetches them when you add the app to the home screen, before there's any way to have logged in. They give nothing away.
- A custom lock-screen-style keypad for the PIN. The plain field works; revisit only if it annoys you in daily use.
- No import or restore screen. Restoring from a backup today means working from the
  JSON by hand. Andrei was told and chose to leave it; the file is shaped so an
  importer would be straightforward to add later.
- The export writes to the database on a GET request — it sets `last_export_at`.
  Nothing links to that URL, so nothing can trigger it by prefetching. Worth
  remembering if a link to it is ever added.
- The recent list looks back through the last 40 meals to find 10 distinct ones. If a
  day ever holds more than 40 meals, older distinct ones stop appearing. Not a real
  situation, but that's why the number is there.
- Two meals count as identical for that list only if the same things are in them in the
  same amounts. 150 g of apple and 300 g of apple are two rows, which is right, but it
  does mean a slightly different portion of the same breakfast won't collapse.
- Each meal's calories are rounded on its own row, so a day of 171.6 + 727.9 shows as
  172 and 728 with a total of 899, not 900. Rounding the total from the exact figures
  is the correct behaviour; it just looks like an arithmetic slip at a glance.
- The no-target branch of the day screen was checked as logic but never rendered here,
  because the database has the sample targets set. Clearing a field on the Targets
  screen is the way to see it.
- The cigarettes trend sentence was checked as logic but never rendered here: in the
  sample data the 4-day and 7-day averages are both exactly 9.3, so it correctly says
  nothing. It appears as soon as they differ. **Moot from phase 7:** the sentence is
  removed.
- `settings.day_boundary_hour` is not read by anything. The app uses a constant of 4.
  Nothing can change the column yet, so reading it would only be scaffolding — but if a
  settings screen ever lands, `lib/day.ts` is the one place that has to change.
- Meals can be logged on a future day by typing the date into a meal's own form. The day
  screen won't navigate past today, and backfill has to stay open, so this is left as
  it is rather than half-blocked.
- `lib/types.ts` is written by hand and does not update itself. Every migration from
  now on has to change it too, or it starts lying. Worth reconsidering the Supabase
  CLI if that ever slips.
- Product search uses SQL `ilike`, so a `%` or `_` typed into the search box acts as a
  wildcard rather than a literal character. Harmless today; escape the term if it ever
  reads as a bug. **Moot from step 7.1:** searching happens on the phone as plain text
  matching, with no wildcards.
- Search matching is exact about accents: "ciorba" won't find "ciorbă". It always
  was. Worth changing only if it bites.
- There is no confirmation step on any Delete button — a product, a weigh-in, a
  recipe. They're single-user actions on recoverable data, and the database refuses
  the dangerous ones outright. Revisit if something is ever lost by a mis-tap.
- A recipe ingredient is typed in grams or millilitres, never in pieces. `recipe_items`
  has no `quantity_unit` column, so three eggs has to be typed as 180 g. The search
  result shows "one piece is 60 g" as a reminder. Meals are different — `meal_items`
  does store what you typed. Revisit only if it annoys you; it would need a migration.
- The same product can be added to a recipe twice rather than being merged into one
  line. Harmless — the totals add up either way — and two additions of the same thing
  at different stages is a real way to write a recipe.
- The products screen was only checked for the deletion messages, not re-tested end to
  end, when that fix went in. Nothing else in it was touched.
- **Nothing stops `sugars_added` being typed larger than `sugars_total`**, which is a
  contradiction now that added is a part of the total. A check constraint or a form
  check would catch it. Deliberately not added: it wasn't asked for, and it would be a
  new rule rather than part of the rename. Worth doing if a typo ever slips through.
- Export files taken **before** migration 0004 carry `sugars_natural`; ones taken after
  carry `sugars_total`. The export is `select *`, so it followed the rename by itself.
  There is no import screen, so nothing breaks today — but an old backup restored by
  hand would need that one key renamed.
- The sleep form accepts a night with only one of the two times. Phase 7 doesn't handle
  that case specially: Andrei doesn't log nights that way, and may deal with it later —
  for instance by having the form refuse one time on its own.
- The export writes on a GET request (noted above). Phase 7 moves its button into
  Settings. It has to stay a button that fetches, never a link, or the browser could
  trigger an export just by prefetching the page.

**Left out of phase 7 by Andrei's decision** (2026-09-11, the spec's Part 13, also listed
in the plan). Where no reason is given, the reason is his decision in the review:

- A variety card (distinct foods, top-two share, fruit and veg servings, days since a
  new product), and the product `category` field it would need.
- A score card (nutrition by score band, repeated low scorers).
- A per-snack protein target.
- A protein g/kg label. Protein is shown in grams only.
- An ultra-processed / NOVA flag on products.
- A `cooking_additions` field on recipes. Oil and salt go in as ordinary recipe
  ingredients instead.
- A daily cigarette limit.
- A sleep hours target.
- Separate target sets per goal phase. There's one set, edited by hand when the phase
  changes.
- A second sleep chart (hours and quality).
- Rich animations: bars filling, numbers counting up, the sleep arc drawing itself,
  gliding tabs. Later, not now.
- A separate monthly budget setting. Food spend this month uses the daily spend target ×
  the days in the month.
- The smoking screen's averages text and trend sentence. The chart's two lines replace
  them.
- A banner on Today for an overdue backup. The reminder is the dot on the Settings tab.
- A "time not real" flag on backfilled meals. Accepted, because meals are rarely
  backfilled.
