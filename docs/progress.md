# Progress

Status board for Life Tracker. Short by design. See `life-tracker-plan.md` for the plan itself.

## Now

Nothing in progress. Phase 5 step 3 (meals) is finished, tested on the phone and
approved on 2026-09-02.

**The next session starts by proposing phase 5 step 4 — Today.** Do not start building
it. Propose the approach with a recommendation, the alternatives and what each costs,
then wait. The decisions that need putting to Andrei are listed under Next — note that
this is the first step that needs a way to *set* the targets, which nothing does yet.

## Waiting on me (Andrei)

Nothing. No SQL to run, no environment variables to add, no decisions owed. Migrations
0001–0003 are all in, and no migration is pending.

## Done

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
- 2026-09-01 — Phase 1 complete. Skeleton, PWA and database, all tested on the phone and approved.
- 2026-09-01 — Phase 1 step 3b: `lib/supabase.ts` and the `/check` screen. Reading, writing and the 401-without-a-key check all verified against the real project. Tested on the phone, approved.
- 2026-09-01 — Phase 1 step 3a: database schema, all tables except gym, RLS on. SQL run in Supabase, nine tables confirmed.
- 2026-09-01 — Phase 1 step 2: PWA icon set, manifest, iOS home-screen support. Tested on the phone, approved.
- 2026-09-01 — Phase 1 step 1: Next.js skeleton, dark theme, `progress.md` and `architecture.md`. Tested on the phone, approved.

## Next

**Phase 5 — nutrition.** By far the biggest phase, so it is broken into five steps,
each approved on the phone before the next starts:

1. ~~**Products**~~ — done and approved 2026-09-02.
2. ~~**Recipes**~~ — done and approved 2026-09-02.
3. ~~**Meals**~~ — done and approved 2026-09-02.
4. **Today** — daily totals and progress against targets. **← next**
5. **Repeat** — copying a past meal onto today, following `replaced_by`.

### Step 4 — what to put to Andrei before writing anything

Nothing here has been decided. Recommendation, alternatives and costs for each, as
always:

- **Where Today lives.** The day screen at `/meals` was built so that step 4 adds
  totals and progress to it rather than making a second screen. Worth confirming that's
  still what's wanted, and whether the home screen gets a summary too.
- **The targets themselves.** `settings` has `calorie_target`, `protein_target`,
  `added_sugar_max`, `fibre_min` and `daily_budget`, all empty, and there is no screen
  that sets any of them. Step 4 needs either a settings screen or a decision to put the
  numbers in by SQL for now.
- **What a progress bar does when a target is missing**, which today is all of them.
- **How far the totals go.** Calories and cost are obvious. Whether protein, fibre and
  added sugar get bars, plain numbers, or nothing is a real choice — the plan is clear
  that nothing in this app is ever red about what you ate.

### Settled already, so don't re-ask

- The arithmetic lives in `lib/nutrition.ts` as pure functions that take rows and
  return numbers — no database access, so it can be checked directly.
- Missing nutrition values are summed as if zero, and totals are shown as plain
  numbers. The plan accepts the consequence: a fibre or sugar total can read lower
  than what was really eaten. Calories are never affected, because calories are
  required on every product.
- 1 ml counts as 1 g when a recipe's raw weight is added up. No densities are stored.
- A recipe contains products only. A recipe can never contain another recipe.

Two things that shape the whole phase and are worth keeping in view:

- **Replacing a product must be faster than editing one.** Part 4 rule 1 is the
  honesty rule the whole app rests on; if the correct path is the slower one, the
  rule quietly stops holding. A UX problem with data consequences, not a form.
- **The arithmetic is the risk, not the screens.** Per-serving nutrition, shrinkage,
  1 ml as 1 g, piece conversion, totals with missing values. Nothing derived is
  stored, so one wrong helper is wrong on every screen and in every week of history
  at once — and it looks fine. Part 7 of the plan rules out tests in the repo, so it
  gets verified in the scratchpad and thrown away, as in phases 3 and 4.

`lib/day.ts` needs `localTimestamp` back for meal times (see Deferred).

Then phase 6 (sleep and smoking), 7 (charts and stats), 8 (gym).

## Where things stand technically

For a session picking this up cold, after reading the plan and this file:

- The app is Next.js 16 at the repo root, deployed on Vercel, tested by Andrei on an
  iPhone home screen. `npm run build` and `npm run lint` both pass.
- Screens so far: `/login` (the PIN screen), `/` (a list of destinations), `/weight`,
  `/products` (list, `new`, `[id]`), `/recipes` (list, `new`, `[id]`), `/meals` (a day,
  and `[id]`) and `/export`. The temporary `/check` page has been deleted.
- Everything except `/login`, the icons and the manifest is behind the PIN — including
  `/api/export`, which is the URL that hands over the whole database.
- The database has ten tables: the nine in the plan plus `login_attempts`. Sample data
  goes in and out by hand with the scripts in `supabase/sample-data/`; the app never
  creates data by itself. As of 2026-09-02 it holds **mostly `seed.sql` sample data
  plus a few things Andrei added himself**, so `wipe.sql` may refuse if something real
  now uses a sample product — that's it doing its job. Ask rather than assume.
- Nothing in this repo has ever written to Supabase except through the app itself, and
  Claude has never created a row there. Every database check has been run against a
  throwaway Postgres in the session scratchpad.
- The last commit was `57a2d0a`, "update /docs/progress". `git log` is readable and is
  the fastest way to confirm what actually shipped.
- Four environment variables, in `.env.local` and in Vercel: `SUPABASE_URL`,
  `SUPABASE_SECRET_KEY`, `PIN_HASH`, `SESSION_SECRET`.
- Migrations `0001`, `0002` and `0003` have all been run. A new migration means a new
  numbered file in `supabase/migrations/` for Andrei to paste in himself.

- Git: Andrei runs every git command. Reading history (`git log`, `git status`,
  `git show`) is fine and useful; anything that writes is not.

Worth knowing about how this has gone so far: **eight** mistakes were caught only
because things were tested rather than assumed — a batch of constraint tests that
silently proved nothing; a login flow that would have let anyone in with the lockout
switched off if the database were unreachable; an export that would have saved the
login page as your backup once the session expired; a wipe script catching the wrong
Postgres error code; a `Database` type that silently switched off all table-name
checking; a product replacement that reported success while leaving an orphan; and a
deletion refusal that blamed the wrong thing, telling you a recipe had been eaten when
what actually blocked it was an older recipe pointing at it; and a date helper that
stored every meal logged before the October clock change an hour late. Every one of
them looked fine. Test against the real thing before reporting a step as done.

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
2026-09-01 — The reminder is a line on the home screen linking to `/export`, which holds the button. Quiet under 7 days, amber at 7, red at 14.
2026-09-01 — The export is all-or-nothing: if one table can't be read the whole thing fails, rather than handing over a file with a table silently missing.
2026-09-01 — `login_attempts` is left out of the backup. Timestamps for the lockout, worthless to restore.
2026-09-01 — Tables are written in restore order, so the file can be turned back into rows top to bottom. There is deliberately no import screen yet — Andrei was told, and left it alone.
2026-09-01 — Sample data is a pair of SQL scripts in `supabase/sample-data/` (`seed.sql`, `wipe.sql`) that Andrei runs when he wants them — **not** anything the app does. A first attempt had the export button seed an empty database itself; Andrei rejected it as messy and was right. The app now has no idea sample data exists, so the code behaves identically against invented and real data, with no "if the database is empty" branch to get wrong. Anything similar in future goes in SQL, not in the app.
2026-09-01 — `wipe.sql` refuses and rolls back if something real already uses a sample product, rather than cascading. Note for later: `on delete restrict` raises `restrict_violation` (23001), not `foreign_key_violation` (23503) — caught by testing, not by reading.
2026-09-01 — `lib/day.ts` is the only place dates are built, always in Europe/Bucharest.
2026-09-01 — The weight screen holds the form and the last 14 entries together; logging a day that already exists updates it rather than refusing, and the button reads Update. Safe because nothing points at a weigh-in — unlike products and recipes, which are frozen once used.
2026-09-01 — Home screen is a plain list of destinations, one line per phase as they land. A bottom tab bar was considered and deliberately deferred until there are four or five real screens (around phase 6) — the tab set will change several times before then.
2026-09-01 — `lib/types.ts` describes the database to TypeScript, written by hand because the Supabase CLI is off limits. **It must be updated by hand with every migration.** Note: `Views: Record<string, never>` silently disables table-name checking, because an empty Record is keyed by any string — use `{ [_ in never]: never }`. Caught by deliberately typing a wrong table name and finding no error.
2026-09-02 — The product form follows EU-label order (energy, fat, saturates, carbs, sugars, fibre, protein, salt), not database order, so you can type straight down the packet. One long form, not a wizard: iOS drops a home-screen app's state on relaunch, so a form split across screens can lose half your typing.
2026-09-02 — Price per 100 is shown live under the price and package-size fields. It's the only cheap guard against typing 100 g for a 1 kg bag, which silently corrupts the cost of every meal that product ever appears in.
2026-09-02 — What you may change is decided by whether the product has been used: unused means fully editable and deletable, used means frozen except the name. Replace opens the add form pre-filled with a copy and steps the name ("oats" → "oats 2"). Replacing has to be as fast as editing, or the honesty rule quietly stops holding.
2026-09-02 — Creating a replacement and retiring the original are two writes with no transaction available. If the second doesn't happen the first is undone. **Note for any future two-step write: updating a row that doesn't exist is not an error — it silently matches nothing. Ask for the changed rows back with `.select()` and check you got any.** Found by testing, after the action reported success while leaving an orphan.
2026-09-01 — Weight input accepts a comma as a decimal point and rounds past two decimals, matching what the column stores. Future dates are refused; past dates are not, because backfill is required everywhere.
2026-09-01 — Two colours added to `globals.css`, `--warn` and `--danger`, used only to say a backup is overdue. Nothing in this app is ever red about what you ate.
2026-09-02 — A recipe is one screen. Name and servings are saved first, then the ingredients are added to the saved recipe underneath: search, type a quantity, Add. Nothing is spread across two screens, because iOS drops a home-screen app's state on relaunch. Accepted cost: a recipe can sit there empty, which the list shows as "no ingredients". That state is honest anyway — the cooked weight can't be filled in until the pan has been weighed, usually a different day.
2026-09-02 — Shrinkage is shown as grams *and* a percentage. The percentage is what you compare between cooks; the grams are what tell you a figure was mistyped. A pan that got heavier is reported as such rather than hidden — adding water to a stew is real, and so is a typo.
2026-09-02 — Per-serving nutrition and cost sit on the recipe screen itself, right under the ingredients, because that's the one moment you can still spot a wrong number and fix it. The whole-batch figures are one muted line beneath.
2026-09-02 — The cooked weight stays editable forever, even on a recipe that's been eaten. A meal records *servings*, so per-serving calories and cost come from the ingredients divided by the servings and the cooked weight is never part of that sum. It only says what a portion weighs. Weighing the pan a week later rewrites no history. Servings and ingredients are frozen once eaten; name and notes are always editable.
2026-09-02 — Replace copies the ingredients, and any line pointing at a retired product is followed through `replaced_by` to the current version. The replace screen lists which lines moved before you save. Copying retired products across would mean replacing them again immediately; following the chain silently would hide a change in the numbers.
2026-09-02 — Retired products are hidden from the ingredient search, the same as when logging a meal. A new recipe should be built from what you buy today.
2026-09-02 — The ingredient search rewrites the URL rather than fetching in the browser, so the server does the searching and a reload doesn't lose your place. Adding an ingredient redirects back to the recipe with the box empty, ready for the next one.
2026-09-02 — All food arithmetic lives in `lib/nutrition.ts` as pure functions with no database access, and following a replacement chain lives in `lib/replacements.ts`. Both are checkable on their own, which is the point: nothing derived is stored, so one wrong function would be wrong everywhere at once and still look fine.
2026-09-02 — A deletion refused by the database now says *why*. Several different things point at a product or a recipe with `on delete restrict` — a recipe that uses it, a meal that ate it, and an older version replaced by it — and they need different answers. Found by testing: the first version told you a recipe had been eaten when nobody had eaten it. Fixed in recipes and, at Andrei's request, in products too, where the same wrong message had shipped in step 1.
2026-09-02 — The meals screen shows one day at a time, and "today" means the day you're currently logging towards rather than the calendar date — at 02:00 you're still filling in yesterday. Step 4 adds totals and progress to this same screen instead of making a second one.
2026-09-02 — Tapping Add creates the meal immediately, with the time set to now and the day worked out by the 04:00 rule, and drops you inside it. No form between you and typing what you ate; this screen gets used several times a day. Accepted cost: a mis-tap leaves an empty meal, which is one tap to delete.
2026-09-02 — One search box returns products and recipes together, recipes tagged and showing calories a serving. Deciding which of the two something is before you can look for it is a tap that shouldn't exist.
2026-09-02 — A meal line stores what was typed, not the conversion: a number plus whether it meant the product's own unit or pieces. The box counts pieces by default for any product that says what one weighs, and shows the grams live. Recipe lines are servings and take halves.
2026-09-02 — Backfilled meals get **midday** on the day being looked at, not the current clock time. Logging yesterday's dinner at 01:30 tonight would otherwise land before the 04:00 rule and count towards the day before yesterday. Logging as you eat still gets the real time.
2026-09-02 — Under the "counts towards" field, the meal screen says what the 04:00 rule makes of the date and time as typed, with a one-tap button to accept it. Makes a 02:20 snack landing on the previous day visible rather than surprising.
2026-09-02 — A local time that never existed (spring change) resolves to just after the jump; one that happened twice (autumn change) resolves to the second occurrence. Documented rather than accidental — both land the same side of the 04:00 rule, and being the same answer every time is what matters.
2026-09-02 — Nothing about a meal is ever frozen. Nothing in the database points at a meal, so every line, quantity, time and note stays editable and deletable forever, and deleting a meal takes only its own lines.
2026-09-02 — `agentRules: false` in `next.config.ts`. `next dev` was appending its own block of instructions to `CLAUDE.md` and re-adding it whenever it was removed; that file is written by hand and says what it needs to say.
2026-09-01 — Icon files are split by job: `app/icon.png` and `app/apple-icon.png` for the browser and iOS (Next.js writes the link tags automatically), `public/icon-192.png` and `public/icon-512.png` for the manifest, which needs fixed paths.

## Deferred

- `AGENTS.md`, which the scaffolder wanted to add, was dropped. `CLAUDE.md` already covers it and two files of instructions would drift apart.
- The scaffold's demo homepage and its five unused demo images were removed rather than kept.
- Rubber-band scroll bouncing at the top and bottom of the screen is left as-is. It only looks wrong once there are real scrolling screens; worth revisiting then, not now.
- The icons and the manifest are deliberately reachable without the PIN. iOS fetches them when you add the app to the home screen, before there's any way to have logged in. They give nothing away.
- A custom lock-screen-style keypad for the PIN. The plain field works; revisit only if it annoys you in daily use.
- No import or restore screen. Restoring from a backup today means working from the
  JSON by hand. Andrei was told and chose to leave it; the file is shaped so an
  importer would be straightforward to add later.
- The export writes to the database on a GET request — it sets `last_export_at`.
  Nothing links to that URL, so nothing can trigger it by prefetching. Worth
  remembering if a link to it is ever added.
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
  reads as a bug.
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
