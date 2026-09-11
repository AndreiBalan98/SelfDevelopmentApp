# Life Tracker

A personal, single-user life tracking app. Nutrition, weight, sleep and smoking now;
gym later. Runs as a PWA on an iPhone home screen.

**This document is the single source of truth.** It replaces `plan.md`,
`database-design.md` and `life-tracker-specs.md` entirely — keep those as background
reading only. Where anything disagrees with this file, this file wins.

Phase 7 was merged in from `docs/phase-7-spec.md` on 2026-09-11, and that file is
now background reading too. `docs/phase-7-mockups.html` stays the **visual
reference** for phase 7: where it and this plan disagree about behaviour, this plan
wins; where they disagree about looks, the mockups win.

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
  phase-7-mockups.html    how every phase 7 screen looks — the visual reference
  phase-7-spec.md         the phase 7 list as I wrote it; merged into Part 5
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

**Weight** — one entry per day. On the chart, a skipped day gets an **invented
point** halfway between the neighbouring weigh-ins, drawn hollow and grey so it's
clearly not real. Invented points are **excluded from the moving averages and from
any TDEE calculation**, because they're invented rather than observed. (Until phase 7
this said the chart draws a straight line across skipped days.)

**Smoking** — a count typed at the end of the day. The chart shows the daily count
plus 4-day and 7-day moving averages, because the trend is the point, not the bad
days.

## settings

One row. Created in phase 1 with `calorie_target`, `protein_target`,
`added_sugar_max`, `fibre_min`, `daily_budget`, `day_boundary_hour` (default 04:00);
`last_export_at` added in phase 3.

Phase 7 adds the rest of the targets (carbs, fat, the saturated : unsaturated ratio),
the goal (phase and weight), the body figures for the formula estimate, and the gym
start date. The full list is under **Phase 7 → Data model changes** in Part 5.

Targets are all optional, set by hand, and revised once the app can estimate real
TDEE.

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
| **7** | Rewritten from real use: a tab bar and a livelier look; Sleep, Smoking and Nutrition become visual tabs; nutrition stats; the TDEE estimate; gamification folded in. See **Phase 7 — in detail** below |
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

Included, and where each one lives is under **Phase 7 — in detail**:

- **Days logged counter** — only goes up
- **Calendar heatmap** — a dot per day, coloured by how completely it was logged
- **Weekly digest** — one card: average sleep, cigarette trend, food spend, average
  calories
- **Progress bars against targets** — started with nutrition in phase 5; reworked in
  phase 7
- **Milestones** — "lowest weight in three months", "first week under 40 cigarettes"
- **Food spend this month**
- **Logging streak with a grace day** — one missed day a week doesn't break it. The
  streak is on *logging*, never on hitting a target: I control whether I write it
  down, not what I ate.

Deliberately excluded: badges, points, levels.

Until phase 7 this also excluded "anything red or scolding", and nothing in the app
was ever red about what was logged. Phase 7 replaces that with a narrower rule: **red
means a missing log, a missed target, or an overdue backup, and nothing else** (see
Red and amber, below).

## The TDEE goal

The long-term reason all of this exists: knowing how many calories I actually burn in
a day, from what I ate and what my weight did, rather than from a formula.

This is why the honesty rules in Part 4 exist, and why it's phase 7 rather than
phase 1. The method is under **Phase 7 → Nutrition → Weight → TDEE estimate**.

It replaced the original method on 2026-09-11. The original used the 7-day moving
average of weight and waited for 14 days before showing anything; the new one fits a
trend line through the real weigh-ins and shows from 7 days with an accuracy label.
The original formula also had the sign backwards: read with "weight change" as end
minus start, losing weight would have *lowered* the estimate. The new formula has it
the right way round.

## Phase 7 — in detail

Rewritten on 2026-09-11 from my own list, written after ten days of real use of
phases 1–6 and an analysis of the 1–9 September 2026 export, then reviewed item by
item. It replaces the original phase 7 entirely, and every item of the original is
accounted for below. Phase 8 (gym) is out of scope apart from the Workout placeholder.

**Visual reference:** `docs/phase-7-mockups.html`. Read it alongside this section.
Where the two disagree about behaviour, this section wins; where they disagree about
looks, the mockups win.

Everything in this section is decided. The spec's open assumptions, the places where
it disagreed with the app as built, and the choices of chart drawing, icons and steps
were all settled one at a time on 2026-09-11 and 12; each is recorded with its reason
under Decisions in `progress.md`. A few details are deliberately left to the step that
builds them, and are listed there under Next.

### What phase 7 delivers

1. A new app shell: a bottom tab bar with five tabs, a new visual style, a shared
   range control, and a red-dot system.
2. Redesigned Sleep, Smoking and Nutrition tabs. The current screens become entry
   forms behind a "+", and each tab's main view becomes a visualisation.
3. A Nutrition stats section that works out live what the September analysis
   produced by hand.
4. The TDEE estimate, with a formula comparison.
5. The original phase 7 items (gamification), folded into the new tabs.
6. Settings additions, a Workout placeholder, and fixes for the speed and scroll bugs.

### The original phase 7 — where every item went

| Original item | Decision | Where it lives now |
|---|---|---|
| Weight chart over time, interpolated days marked | **Kept, changed:** dots, not a line; a skipped day gets a hollow grey invented point | Nutrition → Weight |
| Cigarettes chart with the 4-day and 7-day moving averages | **Kept** | Smoking tab bar chart |
| Calories against target, charted | **Kept** | Stats chart, Calories button |
| Progress bars against targets | **Kept, reworked** | The nutrient bars on Nutrition → Today |
| Calendar heatmap | **Kept** | The calendar opened from the Nutrition date row. One dot per day, coloured by how many of the four daily logs exist — sleep, smoking, weight, at least one meal. Four is full colour; fewer is fainter |
| Days-logged counter | **Kept** | Header of that calendar |
| Logging streak with a grace day | **Kept** | Header of that calendar. One missed day per week doesn't break it. A day counts as logged by the same four-log definition — all four present — and, because smoking is logged a day late, the streak and the counter are worked out up to yesterday. Three out of four doesn't count, though the calendar still shows it as a fainter dot. The streak is on logging, never on hitting targets |
| Weekly digest | **Kept** | Card at the top of the stats section: average sleep, cigarette trend against the previous week, food spend, average calories |
| Food spend this month | **Kept** | Card at the top of the stats section |
| Milestones | **Kept** | A small card in the relevant tab when one fires — "lowest weight in three months" on Weight, "first week under 40 cigarettes" on Smoking. Claude Code proposes the full list, starting from these two, at step 7.16 — when every tab exists and there's a month or more of real data to check it against |
| TDEE estimate with its constraints | **Kept, method changed:** a trend line, shown from 7 days with an accuracy label. Invented days still excluded | Nutrition → Weight |

### Navigation

- **Bottom tab bar, five tabs, icons only, no text labels**, left to right:
  Sleep · Smoking · Nutrition · Workout · Settings.
- Icons from **Tabler Icons, outline set**: `moon` (Sleep), `smoking` (Smoking),
  `salad` (Nutrition), `barbell` (Workout), `settings` (Settings). **Not a
  dependency:** the icons the app uses are copied as SVG into one file in the app,
  with Tabler's licence notice at the top. A new icon later means copying one more in.
- The active tab's icon is in that tab's accent colour; the others are muted grey. A
  thin hairline divider sits above the bar. The bar respects the iPhone safe area at
  the bottom.
- **The app always opens on Nutrition**, the centre tab. The current home screen — a
  list of destinations, today's calories and the backup line — is replaced by the tab
  bar; `/` lands on Nutrition → Today.
- Rubber-band scroll bouncing was deferred "until there are real scrolling screens".
  With a fixed tab bar there are, so it gets checked on the phone.

### Visual style

- Stays **dark**, but livelier: more colour, more pleasant.
- **One accent colour per tab**, used for its icon, charts and highlights:

  | Tab | Accent |
  |---|---|
  | Sleep | blue `#378ADD` |
  | Smoking | amber `#EF9F27` |
  | Nutrition | green `#639922` |
  | Workout | coral `#D85A30` |
  | Settings | neutral grey |

- **Fixed nutrient colours, used everywhere** — bars, the letters on meal rows,
  charts, labels:

  | Nutrient | Colour |
  |---|---|
  | Protein | `#7F77DD` |
  | Carbs | `#EF9F27` |
  | Added sugar | `#378ADD` |
  | Fibre | `#639922` |
  | Fat | `#1D9E75` |
  | Saturated fat (split bar) | `#0F6E56` |
  | Unsaturated fat (split bar) | `#5DCAA5` |

- Other colours: red `#E24B4A` (a missing log, a missed target, a backup 14+ days
  old); the target zone `#97C459` at about 30% opacity; meals `#639922` against snacks
  `#D85A30` in comparison cards.
- **The font stays Geist.** The mockups use a system font only because they're a
  standalone file.
- New colours go into the CSS variables in `app/globals.css`, as the palette does now.
- **Animation: minimal for now.** Later candidates, not in this phase: bars filling,
  numbers counting up, the sleep arc drawing itself, gliding tab transitions.

The approved layout of Nutrition → Today, in short (the mockups have the rest):

- Header: tab title top-left, medium weight, about 16px.
- Sub-tab segmented control: a rounded grey track, the active segment on a lighter
  raised surface, small labels.
- Date row: centred `‹ Today, 11 Sep ›` with a calendar icon, muted text, about 13px.
- Hero: calories large (about 26px, medium weight) with a small muted "kcal"; money
  beside it, smaller (about 15px), secondary grey, sharing the baseline.
- Nutrient bars: thin (8px), rounded, grey track, filled in the nutrient's colour.
- Primary add action: a round green "+" (46px), floating bottom-right just above the
  tab bar.
- Red dots: 8px on tab icons and header buttons, 6px on sub-tab labels, top-right.

### Red and amber — what they mean

**Red means a missing log, a missed target, or an overdue backup. Amber means only a
backup that's getting old.** Nothing else is ever red or amber. This replaces the
phase 5 rule that nothing is ever red or amber about what was logged.

**Missing-log dots**, using the 04:00 day boundary in Europe/Bucharest. Until phase 7
the Sleep, Smoking and Weight screens went by the midnight date; they move to the
04:00 day with the shell step, for their dots, the day their forms open on, and what
counts as "a future date", so the whole app agrees on what today is:

| Where | A dot appears when |
|---|---|
| Sleep | last night isn't logged (the clock also shows a big "+") |
| Smoking | yesterday isn't logged — smoking is always logged a day behind |
| Weight | today isn't logged |
| Meals | never — a skipped meal and a forgotten one look the same |

Each dot appears **both** on the relevant button inside the tab **and** on the tab's
icon in the bottom bar. A missing weight puts a dot on the Weight sub-tab and on the
Nutrition tab icon. The dot goes as soon as the entry exists.

**Missed-target red** follows the target rules under Nutrition → Today. A target that
isn't set is never red.

**The backup reminder** replaces the line on the old home screen, with the same
thresholds:

- A dot on the **Settings tab icon** once the last export is 7 or more days old:
  **amber at 7 days, red at 14**.
- The Export row in Settings reads `Last export: 12 days ago` in the same amber or
  red, and is quiet under 7 days.
- Never having exported at all is red, the same as 14 days — it's the worst case.

### The shared range control

One component, the same everywhere; only the options change from screen to screen.

- A row of pill buttons under the tab header; the active pill is tinted in the tab's
  accent.
- **Custom** opens a start and end date picker.

| Screen | Options | Default |
|---|---|---|
| Sleep | Night · 7 · 14 · 28 · Custom | Night (last night) |
| Smoking | 7 · 14 · 28 · All · Custom | 28 |
| Weight | 7 · 14 · 28 · All · Custom | 28 |
| Nutrition stats | 4 · 7 · 14 · 28 · Custom | 7 |

On Sleep with **Night** selected, `‹ ›` arrows step between nights and a calendar icon
jumps to any date.

### Charts — the rules every chart follows

- **Drawn by hand as SVG, with no charting library**, the way the mockups are.
  Several of these charts are things no library draws — the sleep clock, a time axis
  running across midnight, zone bands with red overflow, hollow invented points — and
  drawing them on the server means the phone downloads no extra code. The arithmetic
  behind them (averages, axis ranges, the trend line) lives in `lib/` as pure
  functions, checked like the rest.
- **Every chart has a rotate button.** A home-screen app on the iPhone can't rotate
  the screen itself, so the button turns the chart 90° clockwise to fill the screen,
  and I turn the phone to match. Tapping it again returns to portrait. It must work
  with the phone's rotation lock on. While rotated, any list under the chart is
  hidden.
- Y axes fit the data in the selected range; the details are per chart.
- Moving averages, wherever they appear, are 4-day and 7-day.

### Entry forms and backfill

- The current entry screens — sleep, smoking, weight, meal, recipe, product — stay
  working as they do now, restyled to the new look. They open from "+" buttons.
- Every entry form accepts any past date and edits existing entries.

### Sleep tab

**Clock view (the default)**

- A **12-hour clock face** centred on the screen: a clear circle and 12 hour marks.
  Simple, not high-definition.
- A "+" in the header adds or edits any night, always there — the only way to reach
  an older missing night without stepping back to it, and the only way in from the
  period view. When last night is
  missing, a **big "+" on the clock** prompts for it as well. In night view, tapping
  the clock opens that night for editing.
- A night is stored under its **wake-up date**, as now. So "last night" is the row
  dated today, and the date row reads `Night to 11 Sep`.
- Entry form: the current one, restyled — bedtime, wake time, quality 1–10, an
  optional note.

*A single night (Night selected):*

- A thick blue arc on the rim from bedtime to wake time.
- The exact times labelled at both ends of the arc, **always in 24-hour form** (22:15,
  07:50), because every position on a 12-hour face means two times.
- In the centre: hours slept, with the quality score nearby.
- The note under the clock, in italics.

*A period (7 / 14 / 28 / Custom):*

- One translucent arc per night on the same clock. Overlaps build up into a heatmap;
  each arc's opacity is scaled so that full overlap equals the base blue.
- Labels: earliest, latest and average bedtime; earliest, latest and average wake time.
- In the centre: average hours slept and average quality.
- No notes.

*Nights logged without times* (only a score or a note, which the app allows): no arc.
Night view shows the score and note with `Times not logged`. They're left out of the
period arcs and the time averages; their quality still counts.

A night with only *one* of the two times isn't handled specially — I don't log nights
that way. Left for later.

*12-hour face rules:* labels that would collide are pushed apart. A night of 12 hours
or more draws as a full ring, and the centre shows the real length.

**Chart view**

- Switched with a clock/chart icon in the header. Chart view hides the Night pill —
  ranges only.
- X axis: the days in the range. Y axis: time of day, **continuous across midnight**
  (for example 20:00 → 12:00), so 23:30 and 00:30 sit next to each other.
- Two lines, bedtime and wake time (bedtime `#7F77DD`, wake `#EF9F27`).
- **Dashed average lines** for average bedtime and average wake time, labelled.
- **Light blue shading** (`#378ADD`, about 18%) between the two lines, so the band's
  thickness shows how long I slept.
- No second chart.

### Smoking tab

- Named **"Smoking"**, not "Cigarettes".
- The data is always a day behind: today shows counts up to yesterday.
- A header "+" — with a red dot when yesterday is missing — opens the current entry
  screen, restyled: any date, add or edit. **The form opens on yesterday** (by the
  04:00 rule), the day the dot asks for, so a count can't land on today by default.

**The chart**

- **A bar chart.** X axis: days. Y axis: cigarettes, from 0 up to **exactly the
  highest count in the selected range** (a maximum of 13 means the axis stops at 13).
- **4-day and 7-day moving average lines** — the averages matter more than any one
  day.
- Range control: 7 · 14 · 28 · All · Custom, default **28**. Rotate button.
- **Zero is not the same as not logged**, as now: a logged zero shows a small `0` on
  the baseline; a day with no entry has no bar and no label.
- Averages cover only the days that have an entry (`lib/series.ts`, as now).
- **No text line.** The current screen's two averages and its "the last four days are
  below the week" sentence are removed — the chart's two lines replace them.

**The list (portrait only)**

- Under the chart: one row per day, **newest first**, with the count and the note.
- Only the days in the selected range, so it always matches the chart.
- Tapping a row opens that day for editing.
- Hidden while the chart is rotated.

### Nutrition → Today

**Structure**

- **Sub-tabs** (a segmented control) under the title: **Today · Recipes · Products ·
  Weight**. A red dot on Weight when today's weight is missing.
- **A round green "+"** floating above the tab bar on Today.
  - **Tap:** creates a meal straight away and opens it, exactly as "Add a meal" does
    now.
  - **Hold:** opens a sheet of recent meals — today's "Repeat something recent" list,
    the last distinct meals by recency. Tapping one copies it onto the day being
    viewed under the existing repeat rules: lines and type copied, note and score not;
    retired items follow `replaced_by`. iOS Safari's long-press text selection and
    callout are switched off on this button.
  - "Repeat this today" on a past meal's own screen stays.
- Date row: `‹ Today, 11 Sep ›`. The arrows step through days; the calendar icon opens
  the calendar heatmap, with the streak and the days-logged counter in its header.
  "Today" still means the day being logged towards (the 04:00 rule). When viewing
  another day, a "Back to today" link appears.
- Everything works for any day, not only today, as the current day screen does.

Top to bottom: hero → nutrient bars → meal list → full day details → stats section.

**Target rules**

Two kinds of target.

*Ceilings* — fine anywhere under the limit, red once over: calories (on a **cut**),
daily spend, added sugar.

*±10% zones* — a value to land around: protein, carbs, fibre, fat, and calories on
**maintain** or **bulk**.

- Inside the zone: a green tick.
- Above the zone: the part of the bar past the zone turns red, and so does the number.
- Below the zone: **neutral today** (still eating), **red on past days**.

*The fat ratio* (saturated : unsaturated, default 1 : 2) is a ceiling on the
saturated share: with a ratio of 1 : N, red when saturated fat is more than
1 ÷ (1 + N) of total fat — ⅓ at the default 1 : 2. Unsaturated = total fat −
saturated.

*Unset targets* — all targets stay optional, as now — show the number with no bar,
no zone, no tick and no red, plus a quiet link to Settings. An unset target has no row
in Days on target.

*Missing values:* nutrients a product doesn't state are summed as zero, as now. Added
sugar is my own estimate and often blank, so its ceiling can read lower than reality —
accepted.

Display rules:

- Bars always keep their nutrient colour; red appears only on the part that's over and
  on the number.
- A thin marker shows the target; ±10% targets also show the green zone band.
- The bar's track spans about 130% of the target, so the zone and any overflow are
  visible.

**Hero**

- **Calories large**, the money spent today beside it — smaller, still prominent.
- Both follow the target rules: money turns red when it's over the daily spend
  ceiling, for example.

**Nutrient bars**

- Fixed order: **Protein → Carbs → Added sugar → Fibre → Fat**.
- Each row: the name, `value / target`, and a status — a tick, "N to zone", "N over".
- Protein in grams only; no g/kg label.
- **The sugar bar tracks added sugar.** Total sugars appear only in the full day
  details.
- **The fat bar is split**: a saturated segment `#0F6E56` and an unsaturated one
  `#5DCAA5`, with a line of text underneath: `Sat 26 g · Unsat 40 g · 1 : 1.5 (goal
  1 : 2)`. Only the ratio turns red, when the saturated share is over the limit.

**Meal list**

In time order. Each row has two lines:

```
Meal · 13:30 · Burritos    540 kcal · 6.34 lei
P 36 · C 52 · S 1 · Fi 11 · Fa 18
```

- The type is always spelled out, **Meal** or **Snack** (at the moment only Snack is
  labelled).
- **Each row keeps its calories**, beside the cost. The mockup's row leaves them out;
  they stay because when the day's total looks high, the first question is which meal
  did it.
- Macros as a letter and a whole number. **S = added sugar, Fi = fibre, Fa = fat.**
- Each letter in its nutrient colour.

**Full day details**

As now, in EU label order: energy, fat (of which saturates), carbohydrate (of which
sugars, of which added), fibre, protein, salt, cost.

**"Where did it come from?" panels**

- **Tapping any number or bar** — the hero, the nutrient bars, the stats boxes, the
  chart bars — opens a panel from the bottom listing the sources, biggest first: the
  name, the amount, its % of the total, and a small proportional bar.
- Works for calories, spend, protein, carbs, added sugar, fibre, fat and saturated fat.
- On Today it covers that day's items; in stats it covers the selected range.
- The top 5, then "show all".
- **In the spend panel**, an item taking 5% or more of the spend while being low in
  protein gets a small **"low protein"** tag, by the same definition as on Recipes and
  Products.

### Nutrition → Recipes and Products

- Everything that works now stays: the list, the show-retired toggle, replacing,
  adding new, the rules for what may be edited, retiring instead of deleting.
- **The search box stays**, above the sort pills, although the mockups leave it out.
  The lists only grow — every price change adds an "oats 2" — and search is how an old
  retired version is found for its price history. The sort pills reorder the list;
  they don't find things.
- **New: Duplicate.** For creating a product or recipe that's much like one I already
  have. It opens the add form pre-filled with a copy — a recipe brings its ingredients
  — and saving creates a new, separate item. **Unlike Replace, the original is left
  exactly as it was**: not retired, not linked. Where the button sits and what the
  copy is called are settled when it's built.
- **Sort pills: A–Z · Cheapest protein · Cheapest calories.**
- Each row shows two value numbers:
  - **lei per 30 g of protein**
  - **lei per 1,000 kcal**
- Items with negligible protein go to the bottom of the protein sort, labelled "low
  protein" instead of a price. **Low protein = protein supplies under 10% of the
  item's calories** (protein counted at 4 kcal a gram). That puts honey, fruit, sweets
  and white rice below the line, and bread, pasta, oats, dairy, eggs and meat above it.
- The same for the calorie sort: **under 20 kcal per 100 g or ml** is labelled "low
  calorie" and goes to the bottom instead of showing an absurd price per 1,000 kcal —
  salt, spices, diet drinks, black coffee. For a recipe, that's per 100 g of its
  ingredients added up, which is always known even before the pan is weighed.
- Retired items stay hidden unless the toggle is on.
- Costs follow the existing price rules (see Computation rules, below).

### Nutrition → Weight

**Chart and goal**

- A header "+" with a red dot when today is missing; the entry form accepts any date.
- **The chart: a dot per daily weigh-in**, plus **4-day and 7-day moving average
  lines**. No bars.
- **A skipped day gets an invented point**, halfway between the neighbouring
  weigh-ins, drawn as a **hollow grey dot** so it's clearly not real. Invented points
  are only for the eye: they are **excluded from the averages and from TDEE**.
- The Y axis sits tight around the range's data, padded about 1 kg each side (data
  78–82 → axis 77–83).
- Range control: 7 · 14 · 28 · All · Custom, default **28**. Rotate button.
- **A goal line above the chart:** `4.2 kg to goal (75 kg)`, worked out from the
  7-day average weight rather than a single weigh-in.
- The list of weigh-ins under the chart, newest first, keeping the current "difference
  from the entry before" column. Tap to edit.

**TDEE estimate**

Shown under the weight chart.

*Method*

- Window: every available day up to 28; after that, always the latest 28 days.
- Weight change: the slope of a **straight trend line through all the real weigh-ins
  in the window**, in kg per day. Not single readings, not averages at each end, never
  invented points.
- Average intake: mean daily calories over the window, **leaving out days with no
  meals logged**.
- `TDEE = average intake − (slope in kg per day × 7700)`. The slope is negative when
  I'm losing weight, so losing weight puts TDEE above intake.
- Shown with a **± range** worked out from how uncertain the trend line is.

*When it shows*

- It appears after **7 days** of data. Before that: `TDEE available in N days`.
- An accuracy label:

  | Days of data | Label |
  |---|---|
  | 7–13 | Rough |
  | 14–27 | Fair |
  | 28+ | Reliable |

- For example: `2,450 ± 380 kcal · Rough · 9 days`.

*Formula comparison*

- Mifflin–St Jeor, from height, age (from the birth year), sex and the current 7-day
  average weight, multiplied by an activity level: sedentary 1.2, light 1.375,
  moderate 1.55, very active 1.725.
- Shown as: `Formula estimate: 2,427 kcal (light activity) · You: +220`.
- If the body settings are missing, a prompt linking to Settings shows instead.

### Nutrition stats

Below the full day details on Today, in this order.

**Complete days only.** Everything the range control governs — the averages, the
chart, Meals vs snacks, Days on target, Timing, and their "where did it come from?"
panels — covers days up to **yesterday**, never the day in progress. Today's live
numbers are already at the top of the same screen; counting half a day would pull
every average down each morning. "7" means the seven days ending yesterday, and Custom
can't end later than yesterday. Food spend this month is a running total, so it does
include today.

**Days with no meals logged are left out** of everything here — grey squares in Days on
target, not counted in the averages. A day with no meals is a day not logged, not a day
of eating nothing, the same rule `lib/series.ts` applies to sleep and cigarettes.

**Digest cards** — two small cards side by side:

- **Weekly digest** (tap to open): average sleep, cigarette trend against the previous
  week, food spend, average calories.
- **Food spend this month**: the total against the daily spend target × the days in
  the month.

**Range control** — 4 · 7 · 14 · 28 · Custom, with the dates it resolves to and the
number of days underneath (`1–9 Sep · 9 days`).

**Average boxes** (a 2 × 4 grid): Calories / day · Spend / day · Protein / day · Carbs
/ day · Added sugar / day · Fibre / day · Fat / day · Meals · snacks / day.

Nutrient labels in their nutrient colours. Each box opens its "where did it come
from?" panel. Averages cover the days with meals logged and say so when the range
isn't full (`over 6 days logged`) — the same honesty rule as `lib/series.ts`.

**Chart over time**

- **One chart with metric buttons**: Calories · Spend · Protein · Carbs · Sugar ·
  Fibre · Fat. Tapping a button redraws it.
- Daily bars from zero, one per day in the range.
- The target drawn by the target rules: a ceiling line, or a ±10% zone band with the
  target line.
- The part of a bar that's over is red; for zone targets, a past day under the zone
  gets a thin red cap on top of its bar.
- **A dashed average line.**
- Footer: `average X · target Y`.
- Rotate button.

**Meals vs snacks card** — ten rows. The header gives the range and the counts (`28
meals · 17 snacks`), then two columns, Meals (green) and Snacks (coral):

1. Average calories
2. Average protein
3. Average fibre
4. Average added sugar
5. Average cost
6. Protein per leu
7. Average score
8. Share of calories — a split bar with percentages
9. Share of spending — a split bar with percentages
10. Share of added sugar — a split bar with percentages

**Days on target card**

- One row per target: calories, spend, protein, carbs, added sugar, fibre, fat, fat
  ratio.
- Each row: one small square per day — **green = hit, red = missed**, by the target
  rules — and a count on the right (`6/9`).
- Bottom rows: the day numbers, and "targets hit" per day.
- **Days with no meals logged show as grey squares and don't count.** They're also
  left out of the nutrition averages.
- Ranges longer than about 31 days switch to counts only, without squares.
- **A swing line** under the grid: `Calories swing ±391 kcal · Protein swing ±23 g` —
  the standard deviation of the daily values over the range.

**Timing card** — the key numbers for the range:

- Wake → first food: the average, with the shortest and longest (`4 h 45 (3–8 h)`).
  The wake time comes from the sleep log.
- First food: the average time.
- Last food: the average time.
- Eating window: the average length.
- Eaten after 01:00: how many items, and their calories.

Meals added for a past day are saved at 12:00, as now, and the Timing card takes that
time as it stands — accepted, because I rarely backfill meals.

Under the numbers, an **average-day strip** from 04:00 to 04:00, matching the day
boundary:

- Sleep blocks (from the sleep log's averages), the no-food gap after waking, and the
  eating window.
- Above it, bars for the average protein eaten in each hour, which shows up gaps — an
  empty afternoon, say.

### Workout tab (a placeholder)

- A large coral barbell icon.
- **A countdown**: `Gym starts in 23 days`, from the gym start date in Settings.
- No date set: `Set your gym start date`, with a button to Settings.
- Date passed: `Gym started 5 days ago · workout tracking is coming`.
- Static; no animation for now.

### Settings tab

Styled like the rest of the app.

**Goal**

- Goal phase: cut / maintain / bulk. Cut makes calories a ceiling; maintain or bulk
  makes them a ±10% zone.
- Goal weight (kg).

**Daily targets** — one set, edited by hand when the phase changes. All optional and
clearable, as now.

- Calories
- Daily spend (lei)
- Protein (g)
- Carbs (g)
- Added sugar (g)
- Fibre (g)
- Fat (g)
- Saturated : unsaturated ratio (default 1 : 2)

**Body**, for the formula estimate: height (cm), birth year, sex, activity level
(sedentary / light / moderate / very active).

**Workout**: the gym start date.

**Data**: Export everything, with `Last export: N days ago` beside the button — amber
at 7+ days, red at 14+. This replaces the separate `/export` screen as the place to
find the button.

Not shown: the 04:00 day boundary, which stays unchanged and hidden.

### Data model changes

For migrations I run myself in the Supabase SQL editor.

New fields on `settings`:

| Field | Type / values | Notes |
|---|---|---|
| `carbs_target` | numeric | ±10% zone |
| `fat_target` | numeric | ±10% zone |
| `unsat_per_sat` | numeric, default 2 | the ratio 1 : N |
| `goal_phase` | `cut` / `maintain` / `bulk` | switches the calorie rule |
| `goal_weight` | numeric (kg) | |
| `height_cm` | numeric | |
| `birth_year` | integer | |
| `sex` | `male` / `female` | for Mifflin–St Jeor |
| `activity_level` | `sedentary` / `light` / `moderate` / `very_active` | |
| `gym_start_date` | date | |

The existing fields keep working: `calorie_target`, `protein_target`, `daily_budget`,
`added_sugar_max`, `day_boundary_hour`, `last_export_at`. **`fibre_min` is renamed
`fibre_target`** in the same migration: it's now a ±10% target rather than a
minimum, and a column name that says the opposite of what it holds is how a wrong
number reaches every screen. Backups taken after the rename carry the new name, the
same as happened with `sugars_total`.

**The export file** gains the timezone (`"tz": "Europe/Bucharest"`), so its UTC
timestamps can't be misread against the local 04:00 boundary. It keeps `format: 1`:
adding a field changes nothing already in the file.

**No other schema changes.** Streaks, milestones, digests, stats and TDEE are all
worked out from the existing tables.

### Computation rules — these must match what the app already does

1. Nutrition is per 100 g or ml: `value = product[nutrient] × grams / 100`.
2. Quantity: pieces → `grams = quantity × piece_grams`; the product's own unit →
   `grams = quantity`.
3. Price: `cost = grams × package_price / package_quantity`.
4. A recipe serving: the sum of the recipe's lines ÷ `servings`. `cooked_weight` is
   never part of the nutrition maths.
5. A meal's total: the sum of its lines.
6. Which day: `eaten_at` is stored in UTC, converted to Europe/Bucharest (daylight
   saving included), and anything before 04:00 belongs to the previous day.
7. Snack or meal comes from `meals.type`; the score from `meals.score`.
8. Moving averages: 4-day and 7-day, over the days that have an entry.
9. `sugars_total` and `sugars_added` overlap and are **never summed**, as now.
10. A night's length is worked out from its two times, crossing midnight by
    arithmetic (`lib/sleep.ts`), and never stored.

### Deliberately not in phase 7

So no session picks them up by accident:

- A variety card (distinct foods, top-two share, fruit and veg servings, days since a
  new product) and a product `category` field
- A score card (nutrition by score band, repeated low scorers)
- A per-snack protein target
- A protein g/kg label
- An ultra-processed / NOVA flag on products
- A `cooking_additions` field on recipes — oil and salt go in as recipe ingredients
  instead
- A daily cigarette limit
- A sleep hours target
- Separate target sets per goal phase
- A second sleep chart (hours and quality)
- Rich animations (later)
- A separate monthly budget setting
- The smoking averages text and trend sentence (removed from the current screen)
- A banner on Today for an overdue backup
- A "time not real" flag on backfilled meals

### Known bugs — fixed in phase 7

1. **Search jumps to the top.** In the meal builder, typing a product or recipe search
   makes the page jump to the top when the results arrive, as if it reloaded.
2. **Add jumps to the top.** The same jump after tapping Add on a found item
   ("Burritos, 1 serving").
3. **Every tap is slow.**

The likely causes to look at first: the whole page reloading its data after every
save or search, which resets the scroll; and the Vercel function region being far
from the Supabase region (US against EU, say), so every tap crosses the Atlantic. A
request on every keystroke was also suspected, but the search already waits a quarter
of a second after the last keystroke before asking the server.

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