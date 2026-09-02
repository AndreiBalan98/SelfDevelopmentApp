# Life Tracker

A personal, single-user life tracking app. Nutrition, weight, sleep and smoking now;
gym later. Runs as a PWA on an iPhone home screen.

**This document is the single source of truth.** It replaces `plan.md`,
`database-design.md` and `life-tracker-specs.md` entirely — keep those as background
reading only. Where anything disagrees with this file, this file wins.

Every decision in here has been made deliberately. Nothing is a placeholder.

---

# Part 1 — How we work

## Roles

**Me — product owner.** I decide everything: architecture, data model, UI/UX, naming,
libraries, scope, what ships and what doesn't. I don't write code and I don't read it.
I run every git command. I run every SQL statement. I own the Supabase project and
the Vercel deployment.

**Claude Code — executor.** Writes all the code. Decides nothing that isn't purely
mechanical. Explains everything in plain language.

## The rule that makes this work

Claude Code never guesses. But it also never drops a bare question on me.

**Every decision point arrives as: a recommendation, the alternatives, and what each
one costs.** Not "how do you want to handle X?" — instead "I'd do X, because Y. The
alternative is Z, which is better if you care about W. Your call."

I make the decision. I don't do the research.

Genuinely trivial things — a variable name, a file location with no consequence —
get batched into a list at the end of the step instead of stopping the work.

## What Claude Code must never do

1. **No git commands.** No add, commit, push, branch, merge, or anything that writes
   history. At the end of each step it reports what changed and **suggests a commit
   message**; I run it.
2. **No touching Supabase.** No CLI, no login, no pushed migrations, no dashboard
   automation. It writes `.sql` files and explains what each one does; I paste them
   into the SQL editor myself.
3. **No installing a dependency without asking.** Name it, why it's needed, what it
   costs, what the alternative is.
4. **No unrequested work.** No extra pages, no helpful placeholders, no "I also
   added…". If something looks missing, say so and wait.
5. **No secrets in the repo.** `.env.local` is gitignored from the first commit. Keys
   live in Vercel's environment variables and nowhere else.

## Working loop

1. Claude Code proposes the approach for the current step, with recommendation and
   alternatives, and asks whatever it needs to ask
2. I decide
3. It implements **that step only**
4. It reports: what changed, which files, what I'll see on screen, what to test on my
   phone, and a suggested commit message
5. I commit and push → Vercel deploys → I test on the phone
6. I approve, or ask for changes → next step

Steps stay small enough that a bad one is cheap to throw away.

## Keeping me in the picture

I want to understand the architecture, not just trust it.

- Explanations are in plain language: what it does and why, not how the code works.
- `docs/architecture.md` stays current — a short map of what lives where, and how a
  piece of data travels from a form on my phone to a row in Postgres. Updated as part
  of the step that changes it.
- "Why is this here?" is a real question, not a challenge. Answer it.

## Tracking progress across sessions

Claude Code remembers nothing between sessions. `docs/progress.md` is how a new
session picks up where the last one stopped. It's created in the first step of phase
1 and maintained from then on.

It's a status board, not a diary. It stays short.

**Sections:**

- **Now** — the phase and step in progress, one line.
- **Waiting on me** — everything I have to do before work can continue: SQL to run,
  environment variables to add, something to test on my phone, a decision I owe.
  This is the most important section — it's where sessions actually stall.
- **Done** — completed steps, newest first, one line each.
- **Next** — the remaining steps of the current phase, then the next phase.
- **Decisions made while building** — the small calls that aren't in this plan:
  library choices, naming conventions, anything I approved in passing. This stops a
  later session from quietly undoing them or asking me the same thing twice.
- **Deferred** — things noticed and deliberately not done, each with a one-line
  reason, so they're not lost and not silently picked up either.

**Rules:**

- Updated as part of the step that changes it, never as a separate chore afterwards.
- A step is marked done only after **I've tested and approved it** — not when the
  code is written.
- Nothing is deleted from Done or Decisions. The file is appended to.
- If Done gets long, old phases collapse into a one-line summary each.

## Starting a session

1. Read this plan
2. Read `docs/progress.md`
3. Tell me in a few lines: where we are, what's waiting on me, and what it proposes
   to do next
4. Wait for me

Never start work off the back of an assumption about where we left things.

## Ending a session

Before I close the terminal:

1. Update `docs/progress.md`
2. Suggest the commit message
3. Restate anything waiting on me

## What lives in the repo

```
docs/
  life-tracker-plan.md    this file — the source of truth
  progress.md             where we are, maintained by Claude Code
  architecture.md         what lives where, maintained by Claude Code
supabase/
  migrations/             SQL files I paste into the Supabase editor myself
```

Plus the Next.js app itself. `.env.local` is gitignored from the first commit.

---

# Part 2 — Architecture

## Stack

- **Next.js**, App Router, TypeScript
- **Tailwind**
- **Vercel** — deployed from day one so I can test on my phone immediately
- **Supabase** (Postgres)
- **PWA** on an iPhone home screen. **No service worker** (see Part 6).
- Mobile-first, dark by default. Metric throughout (kg, g, ml). Europe/Bucharest.

## How data moves

There is no separate backend. The server half lives inside the Next.js project.

```
Phone (browser)  →  Next.js server action  →  Supabase Postgres
                    (running on Vercel)
```

**The browser never receives a Supabase key.** Every read and write goes through a
server action or route handler running on Vercel, using the `service_role` key from
an environment variable. Row Level Security is on, deny-all for the anon role, so a
leaked URL gets nothing.

This isn't optional. A PIN checked in the browser protects nothing if the browser is
holding a database key.

## What is computed, never stored

Nothing derived is written to the database. Meal totals, daily totals, weekly
averages, weight interpolation, moving averages, cooking shrinkage, TDEE — all
calculated in TypeScript when the page is read.

At one user's data volume this costs nothing measurable, and it means a fixed
calculation is fixed everywhere at once, with no stale summary tables to reconcile.

---

# Part 3 — Data model

## The shape

**Products** → what I buy. Entered once each.
**Recipes** → built from products, make N servings.
**Meals** → what I ate. Contains products, recipe servings, or both.

A meal is a container. Its price and nutrition are added up from its lines.

## products

| field | notes |
|---|---|
| `name` | editable freely — cosmetic only |
| `unit` | `g` or `ml`, whichever the label uses |
| `package_price` | what I paid |
| `package_quantity` | how much was in the package |
| `ingredients_text` | optional, copied off the packet |
| `piece_grams` | optional. 1 egg = 60. Empty for things sold loose. |
| `retired` | boolean |
| `replaced_by` | optional link to the product that superseded this one |

Nutrition per 100 units:

| field | required? |
|---|---|
| `calories` | **required** |
| `protein` · `carbs` · `sugars_total` · `sugars_added` · `fibre` · `fat` · `saturated_fat` · `salt` | optional |

Sugars are two numbers I type myself, and **they overlap**. `sugars_total` is the
packet's "of which sugars" line, copied straight across — natural and added together.
`sugars_added` is my own estimate of how much of *that same figure* was added rather
than naturally there; it is never on an EU label, and it's left blank when I can't
tell.

**They are never summed.** Added is a part of the total, not an amount on top of it,
so adding them would count the added sugar twice. Natural sugar, if it's ever wanted,
is `sugars_total - sugars_added`, computed and never stored — and only meaningful
where I filled both in.

This is the reading that keeps the honest path the fast one: I copy one number off the
packet without doing arithmetic in my head, and leaving the estimate blank still leaves
the total correct. The alternative — two disjoint halves — would make me subtract at
the packet every time, and a blank estimate would silently assert that all of it was
natural.

## recipes

`name` · `servings` · `cooked_weight` · `notes` · `retired` · `replaced_by`, plus
lines of product + quantity.

`cooked_weight` I type in after weighing the pan. Raw weight is **calculated** from
the lines, and the difference is the shrinkage. When summing raw weight, **1 ml counts
as 1 g** — no densities stored.

Portions are logged as servings. I eat every serving of anything I cook, so uneven
portions cancel out across the batch and the weekly totals stay exact.

**A recipe contains products only.** A recipe cannot contain another recipe.

## meals

| field | notes |
|---|---|
| `eaten_at` | full timestamp |
| `day` | which day it counts towards |
| `type` | `meal` or `snack` |
| `note` | optional |
| `score` | optional, 1–10 |

`day` is auto-filled from `eaten_at` using a **04:00 cutoff** — anything before 04:00
belongs to the previous day. It's an ordinary editable field, so a 05:00 kebab after
a long night moves with one tap.

Each meal line references **either** a product (quantity in the product's unit, or in
pieces via `piece_grams`) **or** a recipe (number of servings).

**Repeat.** Any past meal can be copied onto today, then adjusted. When a copied line
points at a retired product or recipe, the app follows `replaced_by` and uses the
current version.

**Totals are shown as plain numbers**, even when some products had no value for a
given nutrient. Accepted consequence: a fibre or sugar total can be lower than what I
actually ate. Calories are always complete, because calories are required.

## sleep · weight · smoking

Flat, one row per day, `date` unique — which also stops me double-logging.

| table | fields |
|---|---|
| `sleep` | `date` (the **wake-up** date), `bedtime`, `wake_time`, `quality` 1–10, `notes` |
| `weight` | `date`, `kg`, `notes` |
| `smoking` | `date`, `count`, `notes` |

**Weight** — one entry per day. The chart draws a straight line across skipped days;
those interpolated points are marked visually and **excluded from any TDEE
calculation**, because they're invented rather than observed.

**Smoking** — a count typed at the end of the day. The chart shows the daily count
plus 4-day and 7-day moving averages, because the trend is the point, not the bad
days.

## settings

One row: `calorie_target`, `protein_target`, `added_sugar_max`, `fibre_min`,
`daily_budget`, `day_boundary_hour` (default 04:00).

Targets are set from the start and revised once the app can estimate real TDEE.

## Tables created in phase 1

`settings` · `products` · `recipes` · `recipe_items` · `meals` · `meal_items` ·
`sleep` · `weight` · `smoking`

Not the gym module — it hasn't been designed and won't be needed for months.

---

# Part 4 — The rules that keep the data honest

These aren't preferences. Break one and the historical data quietly becomes fiction,
which destroys the point of the app.

### 1. Never edit a product that's been used

Meals point at products, so editing a product rewrites every meal that used it.

When a price or a nutritional value changes: **create a new product** ("oats 2"),
mark the old one retired, and set `replaced_by` to point at the new one.

Editing the **name** is fine — that's cosmetic. Price, quantity and nutrition are not.

### 2. The same rule applies to recipes

A recipe that's been logged is frozen. Change the burrito recipe and every burrito I
ever ate changes with it. Duplicate, retire the old one, link the replacement.

### 3. Retired means hidden, never deleted

Retired products and recipes stay in the database forever so old meals still
calculate. They're hidden from search when logging — **including when backfilling a
past date**. If I want the old one deliberately, I go and find it.

The `replaced_by` chain also gives me a price history: oats → oats 2 → oats 3 shows
what a kilo has cost me over time.

### 4. Deletion is refused, never cascaded

Deleting a product or recipe that appears in any meal is refused, with a message
pointing at retirement instead. Never cascade — a cascade would silently destroy
meals. Deleting an unused product is fine. Deleting a meal is always fine.

### 5. Everything is editable and deletable

Every entry, from day one. I will mis-log things.

### 6. Backfill everywhere

Every form defaults to today but accepts any past date. Sleep, weight, cigarettes and
meals can all be entered retroactively. The unique-date constraint warns instead of
silently duplicating.

I have roughly a month of existing cigarette history to enter, so smoking needs a
fast way to log several days in a row.

### 7. Local time, not UTC

The 04:00 cutoff and every date boundary are computed in Europe/Bucharest, which
observes daylight saving. Getting this wrong shifts entries by an hour twice a year
and corrupts totals around the boundary.

---

# Part 5 — Roadmap

| Phase | What |
|---|---|
| **1** | `progress.md`, then skeleton, PWA, database — all tables except gym |
| **2** | PIN gate |
| **3** | JSON export button + "last export was X days ago" reminder |
| **4** | Weight |
| **5** | Nutrition — products → recipes → meals → Today screen → repeat button |
| **6** | Sleep and smoking, plus backfilling my cigarette history |
| **7** | Charts, stats, gamification, TDEE estimate |
| **8** | Gym |
| later | Barcode lookup, automatic backups, money module, to-do list |

**Why this order.**

The gate comes before the export because an export endpoint with no gate is a URL
that hands the whole database to anyone who finds it. It's also the easier build:
put the gate on an empty skeleton where there's nothing to break, and everything
built afterwards is behind it automatically.

The export comes early because the Supabase free tier keeps **no backups at all**
(Part 6). It's one endpoint, and it's the only safety net this app will ever have.

Weight goes before nutrition because it's one number a day and one screen, so it
proves the whole chain end to end on a table where a mistake costs nothing — and
every week without weight data is a week the TDEE calculation can't use.

## PIN gate — settled

A 6-digit PIN, checked on the server, stored **hashed in an environment variable**.
On success the server issues a signed httpOnly cookie; every page checks it. Session
lasts **three months**. Changing the PIN means editing the Vercel environment
variable — there's no in-app change screen, because I'll essentially never do it.

## Gamification — settled

Included:

- **Days logged counter** — only goes up
- **Calendar heatmap** — a dot per day, coloured by how completely it was logged
- **Weekly digest** — one card: average sleep, cigarette trend, food spend, average
  calories
- **Progress bars against targets** — built with nutrition in phase 5; the rest in
  phase 7
- **Milestones** — "lowest weight in three months", "first week under 40 cigarettes"
- **Food spend this month**
- **Logging streak with a grace day** — one missed day a week doesn't break it. The
  streak is on *logging*, never on hitting a target: I control whether I write it
  down, not what I ate.

Deliberately excluded: badges, points, levels, and anything red or scolding.

## The TDEE goal

The long-term reason all of this exists:

```
TDEE ≈ average daily intake + (weight change in kg × 7700) / days
```

To be worth anything it needs the 7-day moving average of weight rather than raw
values — daily swings of ±1.5 kg from water and glycogen would otherwise destroy the
estimate — a window of at least 14 days and ideally 21–28, interpolated days
excluded, and a confidence range rather than a single confident number.

This is why the honesty rules in Part 4 exist, and why it's phase 7 rather than
phase 1.

---

# Part 6 — Constraints and known gotchas

## Supabase free tier keeps zero backups

There are no snapshots anywhere. If a table gets wiped or a migration goes wrong,
the data is gone permanently. This is the reason the JSON export is phase 3.

## Supabase free projects pause after 7 days of inactivity

No database activity for a week and the project is paused: the app loads but every
data screen errors. Nothing is lost — restoring is a button in the Supabase dashboard
and takes a couple of minutes.

Daily use prevents this entirely. **Accepted risk**: if I go quiet for over a week
I'll restore it by hand. An automatic daily ping would remove the problem and is
noted as a possible later addition.

## iOS PWA reality

- **No install prompt.** Add to Home Screen from the Safari share sheet, manually,
  and it has to be Safari — not an in-app browser.
- **State is not preserved between launches.** Reopening restarts the app, so a
  half-filled form is gone. Forms stay short enough that this doesn't hurt.
- **Aggressive cache eviction.** Anything cached on the phone can be wiped after
  about a week of not opening the app. The phone is never treated as storage.
- **No service worker.** Service workers on iOS are notorious for serving the old
  version after a deploy, which is confusing and fixed only by clearing Safari's site
  data. The app installs on the home screen with just a manifest and icons, so
  there's no reason to have one. If offline is ever wanted, add it deliberately.
- **No offline.** Every write goes through the server; no signal means no logging.
  Accepted — this is not a field app.

## Privacy

Sleep, weight and smoking data are health data. Nothing sensitive goes in the repo,
which is fine because the data lives in Supabase, not in git. Keys stay in Vercel's
environment variables.

---

# Part 7 — Explicitly out of scope

Not "later" — not being built, and not to be suggested unprompted:

- Real authentication, accounts, login
- Offline support and background sync
- Push notifications and reminders
- Multi-user anything
- Tests and CI — single user, I test on my phone
- Badges, points, levels
- Micronutrient tracking of any kind
- Barcode scanning and automatic nutrition lookup. Deliberately excluded for now:
  typing the numbers in myself is how I learn what's in my food, so that eventually I
  can estimate it without the app. Revisit only once everything else is done.
- The money module and the to-do list