# Life Tracker — Phase 7 Specification (revised)

This document replaces the original Phase 7 in `docs/life-tracker-plan.md`. It is based
on ~10 days of real use after Phases 1–6 and on an analysis of the 1–9 September 2026
export. Every item below was decided deliberately by the product owner. Items marked
**[assumed]** were filled in during writing and must be confirmed before building
(see Part 12).

Phase 8 (gym) remains out of scope, apart from the placeholder screen in Part 8.

**Visual reference:** `docs/phase-7-mockups.html` shows every screen in this spec, in
dark mode, with the approved layout, colours and icons. Read it alongside this document.
Where the two disagree about behaviour, this spec wins; where they disagree about looks,
the mockups win.

All existing rules in the plan still apply: no git commands, no touching Supabase (write
`.sql` files for me to run), ask before adding any dependency, no unrequested work,
update `docs/progress.md` as part of each step.

## Handover — read this first

`progress.md` says the next session waits for "the list", then reviews it with me one
item at a time. **This document is that list, and the one-item-at-a-time review has
already been done** — every item here, and every item from the old phase 7, was decided
by me in conversation, and this spec was then checked against the current
`life-tracker-plan.md`, `architecture.md` and `progress.md`. Do not run the review again.

What to do with it:

1. Rewrite phase 7 in Part 5 of `life-tracker-plan.md` from this document, and update
   the other parts of the plan this document replaces (Part 16).
2. Record the decisions in `progress.md` (Decisions made while building, Deferred, and
   the removals in Part 13), and update Now / Next.
3. Raise only **genuine contradictions** you find with the code as it actually is —
   anything this document gets wrong about the current app.
4. Then propose, the usual way (recommendation, alternatives, costs): the **charting
   approach** (a library, which would be the first new dependency since the scaffold, vs
   hand-drawn SVG like the mockups), **Tabler Icons**, and the **step breakdown**
   (Part 15 is only a starting proposal).

---

# Part 1 — Scope

## What Phase 7 delivers

1. A new app shell: bottom tab bar with five tabs, a new visual style, a shared range
   control, a red-dot system.
2. Redesigned Sleep, Smoking and Nutrition tabs, where the current screens become entry
   forms behind a "+" and the tab's main view becomes a visualisation.
3. A Nutrition stats section that computes live what the September data analysis
   produced by hand.
4. The TDEE estimate, with a formula comparison.
5. The original Phase 7 items (gamification), folded into the new tabs.
6. Settings additions, a Workout placeholder, and performance/scroll bug fixes.

## Original Phase 7 items — kept, relocated

| Item | New home |
|---|---|
| Charts | Replaced by the per-tab charts in this spec |
| Progress bars against targets | The nutrient bars on Nutrition → Today |
| Calendar heatmap | The calendar opened from the Nutrition date row. One dot per day, coloured by how many of the four daily logs exist: sleep, smoking, weight, at least one meal (4 = full colour, fewer = fainter) |
| Days logged counter | Header of that calendar |
| Logging streak with a grace day | Header of that calendar. One missed day per week doesn't break it. A day counts as logged using the same four-log definition. The streak is on logging, never on hitting targets |
| Weekly digest | Card at the top of the Nutrition stats section: average sleep, cigarette trend vs previous week, food spend, average calories |
| Food spend this month | Card at the top of the Nutrition stats section |
| Milestones | A small card shown in the relevant tab when one fires (e.g. "lowest weight in three months" on Weight, "first week under 40 cigarettes" on Smoking) |
| TDEE estimate | Nutrition → Weight sub-tab (Part 6.3), with a changed method |

## Old phase 7 checklist from `progress.md` — every item accounted for

| Item | Decision |
|---|---|
| Weight chart over time, with interpolated days marked | **Kept, changed:** dots instead of a line; skipped days get an invented point in a different colour (Part 6.2) |
| Cigarettes chart, with 4-day and 7-day moving averages | **Kept:** Smoking tab bar chart (Part 4) |
| Calories against target, charted | **Kept:** stats chart, Calories button (Part 7.4) |
| Days-logged counter | **Kept:** calendar header |
| Calendar heatmap | **Kept:** the Nutrition calendar |
| Logging streak with a grace day | **Kept:** calendar header |
| Weekly digest card | **Kept:** top of stats section |
| Milestones | **Kept:** small card in the relevant tab |
| Food spend this month | **Kept:** top of stats section |
| TDEE estimate with its constraints | **Kept, method changed:** trend line, shows from 7 days with an accuracy label (Part 6.3). Interpolated days still excluded |

---

# Part 2 — Global design

## 2.1 Navigation

- **Bottom tab bar, five tabs, icons only (no text labels)**, left to right:
  Sleep · Smoking · Nutrition · Workout · Settings.
- Icons from **Tabler Icons, outline set** (dependency — ask before adding):
  `moon` (Sleep), `smoking` (Smoking), `salad` (Nutrition), `barbell` (Workout),
  `settings` gear (Settings).
- Active tab icon in that tab's accent colour; inactive icons muted grey. A thin
  hairline divider sits above the bar. Respect the iPhone safe area at the bottom.
- **The app always opens on Nutrition** (centre tab). The current home screen (a list of
  destinations, with today's calories and the backup line) is replaced by the tab bar;
  `/` lands on Nutrition → Today.
- `progress.md` deferred rubber-band scroll bouncing "until there are real scrolling
  screens". With a fixed tab bar there now are — check it on the phone.

## 2.2 Visual style

- Stays **dark**, but livelier: more colour, more pleasant.
- **One accent colour per tab**, used for its icon, charts and highlights:

  | Tab | Accent |
  |---|---|
  | Sleep | blue `#378ADD` |
  | Smoking | amber `#EF9F27` |
  | Nutrition | green `#639922` |
  | Workout | coral `#D85A30` |
  | Settings | neutral grey |

- **Fixed nutrient colours, used everywhere** (bars, meal-row letters, charts, labels):

  | Nutrient | Colour |
  |---|---|
  | Protein | `#7F77DD` |
  | Carbs | `#EF9F27` |
  | Added sugar | `#378ADD` |
  | Fibre | `#639922` |
  | Fat | `#1D9E75` |
  | Saturated fat (split bar) | `#0F6E56` |
  | Unsaturated fat (split bar) | `#5DCAA5` |

- Other colours: red `#E24B4A` (missing log / missed target), target zone `#97C459` at
  ~30% opacity, meals `#639922` vs snacks `#D85A30` in comparison cards.
- **Font stays Geist**, as today. The mockups use a system font only because they're a
  standalone file — that is not a decision to change it.
- New colours go into the CSS variables in `app/globals.css`, as the palette does today.
- **Animation: minimal for now.** Later candidates (not in this phase): bars filling,
  numbers counting up, the sleep arc drawing itself, gliding tab transitions.

## 2.3 Design reference (approved mockup of Nutrition → Today)

The full set of screens is in `docs/phase-7-mockups.html`. Reproduce that layout and
feel; the summary below is the short version.

- Header: tab title top-left, medium weight (~16px).
- Sub-tab segmented control: rounded grey track, active segment on a lighter raised
  surface, small labels.
- Date row: centred `‹ Today, 11 Sep ›` with a calendar icon, muted text (~13px).
- Hero: calories large (~26px, medium weight) with a small muted "kcal" unit; money
  beside it, smaller (~15px), secondary grey, sharing the baseline.
- Nutrient bars: thin (8px), rounded, grey track, fill in the nutrient colour.
- Primary add action: round green "+" button (46px), floating bottom-right just above
  the tab bar.
- Red dots: 8px on tab icons and header buttons, 6px on sub-tab labels, top-right.

## 2.4 Red and amber — what they mean

Red means **a missing log, a missed target, or an overdue backup**. Amber means only **a
backup that's getting old**. Nothing else is red or amber. This replaces the rule that
nothing is ever red or amber about what was logged (Part 16).

**Missing-log dots** (day boundary 04:00, Europe/Bucharest, as today):

| Where | Dot appears when |
|---|---|
| Sleep | last night isn't logged (the clock also shows a big "+") |
| Smoking | yesterday isn't logged (smoking is always logged a day behind) |
| Weight | today isn't logged |
| Meals | never — a skipped meal and a forgotten one look the same |

Each dot appears **both** on the relevant button inside the tab **and** on the tab
icon in the bottom bar. A missing weight puts a dot on the Weight sub-tab and on the
Nutrition tab icon. The dot disappears as soon as the entry exists.

**Missed-target red** follows the target rules in Part 5.2. A target that isn't set is
never red.

**Backup reminder** (replaces the line on the old home screen, same thresholds):
- A dot on the **Settings tab icon** once the last export is 7+ days old: **amber at 7
  days, red at 14**.
- The Export row in Settings reads `Last export: 12 days ago` in the same amber or red;
  quiet under 7 days.

## 2.5 Shared range control

One component, identical everywhere; only the options change per screen.

- A row of pill buttons under the tab header; the active pill is tinted in the tab's
  accent.
- **Custom** opens a start/end date picker.

| Screen | Options | Default |
|---|---|---|
| Sleep | Night · 7 · 14 · 28 · Custom | Night (last night) |
| Smoking | 7 · 14 · 28 · All · Custom | 28 |
| Weight | 7 · 14 · 28 · All · Custom | 28 |
| Nutrition stats | 4 · 7 · 14 · 28 · Custom | 7 **[assumed]** |

On Sleep with **Night** selected: `‹ ›` arrows step between nights and a calendar icon
jumps to any date.

## 2.6 Charts — common rules

- **Every chart has a rotate button.** An iPhone home-screen app can't rotate the
  screen itself, so the button rotates the chart 90° clockwise to fill the screen; I
  turn the phone to match; tapping again returns to portrait. Must work with the
  phone's rotation lock on. In rotated mode, lists under the chart are hidden.
- Y axes fit the data in the selected range (details per chart).
- Moving averages, where used, are 4-day and 7-day.

## 2.7 Entry forms and backfill

- The current entry screens (sleep, smoking, weight, meal, recipe, product) stay
  functionally as they are, restyled to the new look. They open from "+" buttons.
- Every entry form accepts any past date and edits existing entries.

---

# Part 3 — Sleep tab

## 3.1 Clock view (default)

- A **12-hour clock face** centred on screen: clear circle, 12 hour marks. Simple, not
  high-definition.
- A "+" in the header to add or edit any night. When last night is missing, a **big
  "+" on the clock** also prompts entry. In night view, tapping the clock opens that
  night for editing.
- A night is stored under its **wake-up date**, as today. So "last night" is the row
  dated today, and the date row reads `Night to 11 Sep`.
- Entry form (current one, restyled): bedtime, wake time, quality 1–10, optional note.

**Single night (Night selected):**
- A thick blue arc on the rim from bedtime to wake time.
- Exact times labelled at both arc ends, **always in 24-hour format** (e.g. 22:15,
  07:50), since each 12-hour position means two times.
- Centre: hours slept, with the quality score nearby.
- Note under the clock, in italics.

**Period (7 / 14 / 28 / Custom):**
- One translucent arc per night on the same clock. Overlaps form a heatmap; per-arc
  opacity is scaled so that full overlap equals the base blue.
- Labels: earliest, latest and average bedtime; earliest, latest and average wake
  time.
- Centre: average hours slept and average quality.
- No notes.

**Nights logged without times** (only a score or a note, which the app allows): no arc;
night view shows the score and note with `Times not logged`. They're left out of the
period arcs and the time averages; their quality still counts.

**12-hour face rules:**
- Labels that would collide are pushed apart.
- A night of 12 hours or more draws as a full ring; the centre shows the real duration.

## 3.2 Chart view

- Toggle via a clock/chart icon in the header. Chart view hides the Night pill (ranges
  only).
- X axis: days in range. Y axis: time of day, **continuous across midnight** (e.g.
  20:00 → 12:00) so 23:30 and 00:30 plot next to each other.
- Two lines: bedtime and wake time (mockup colours: bedtime `#7F77DD`, wake `#EF9F27`).
- **Dashed average lines** for average bedtime and average wake time, labelled.
- **Light blue shading** (`#378ADD`, ~18%) between the two lines, so band thickness
  shows sleep length.
- No second chart.

---

# Part 4 — Smoking tab

- Named **"Smoking"** (not "Cigarettes").
- Data is always one day behind: today shows counts up to yesterday.
- Header "+" (red dot when yesterday is missing) opens the current entry screen,
  restyled: any date, add or edit.

## 4.1 Chart

- **Bar chart.** X axis: days. Y axis: cigarettes, from 0 up to **exactly the maximum
  in the selected range** (max 13 → axis to 13).
- **4-day and 7-day moving average lines** — the averages matter more than daily
  counts.
- Range control: 7 · 14 · 28 · All · Custom, default **28**.
- Rotate button.
- **Zero is not the same as not logged**, as today: a logged zero shows a small `0` at the
  baseline; a day with no entry has no bar and no label.
- Averages cover only the days that have an entry (`lib/series.ts`, as today).
- **No text line.** The current screen's averages and "the last four days are below the
  week" sentence are removed — the chart's two lines replace them.

## 4.2 List (portrait only)

- Below the chart: one row per day, **newest first**, count and note.
- Shows only days in the selected range, so it always matches the chart.
- Tapping a row opens that day for editing.
- Hidden when the chart is rotated.

---

# Part 5 — Nutrition tab: Today

## 5.1 Structure

- **Sub-tabs** (segmented control) under the title: **Today · Recipes · Products ·
  Weight**. Red dot on Weight when today's weight is missing.
- **Round green "+"** floating above the tab bar on Today.
  - **Tap:** creates a meal immediately and opens it, exactly as Add a meal does today.
  - **Hold:** opens a sheet with recent meals (today's "Repeat something recent" list:
    last distinct meals, by recency). Tapping one copies it onto the day being viewed,
    with the existing repeat rules (lines and type copied, not note or score; retired
    items follow `replaced_by`). Disable iOS Safari's long-press text selection and
    callout on this button.
  - "Repeat this today" on a past meal's screen stays.
- Date row: `‹ Today, 11 Sep ›`, arrows step through days, calendar icon opens the
  calendar heatmap with streak and days-logged counter in its header. "Today" still means
  the day being logged towards (04:00 rule). When viewing another day, a "Back to today"
  link appears.
- Everything works for any day, not only today, as the current day screen does.

Top to bottom on Today: hero → nutrient bars → meal list → full day details → stats
section (Part 7).

## 5.2 Target rules

Two kinds of target:

**Ceilings** — fine anywhere under the limit, red once over:
calories (on a **cut**), daily spend, added sugar.

**±10% zones** — the target is a value to land around:
protein, carbs, fibre, fat, and calories on **maintain** or **bulk**.
- Inside the zone: green tick.
- Above the zone: the part of the bar past the zone turns red, and the number turns red.
- Below the zone: **neutral today** (still eating), **red on past days**.

**Fat ratio** (saturated : unsaturated, default 1:2): a ceiling on saturated share —
red when saturated fat is more than ⅓ of total fat. Unsaturated = total fat −
saturated.

**Unset targets** (all targets stay optional, as today): the number is shown with no
bar, no zone, no tick and no red, plus a quiet link to Settings. Unset targets have no
row in Days on target.

**Missing values:** nutrients a product doesn't state are summed as zero, as today. Added
sugar is my own estimate and often blank, so its ceiling can read lower than reality —
accepted.

Display rules:
- Bars always keep their nutrient colour; red appears only on the over part and the
  number.
- A thin marker shows the target; ±10% targets also show the green zone band.
- Bar track spans ~130% of the target so the zone and overflow are visible.

## 5.3 Hero

- **Calories large**, money spent today beside it (smaller, still prominent).
- Both follow the target rules (e.g. money turns red when over the daily spend
  ceiling).

## 5.4 Nutrient bars

- Fixed order: **Protein → Carbs → Added sugar → Fibre → Fat**.
- Each row: name, `value / target`, status (tick, "N to zone", "N over").
- Protein in grams only (no g/kg label).
- **Sugar bar tracks added sugar.** Total sugars appear only in the full day details.
- **Fat bar is split**: saturated segment `#0F6E56`, unsaturated `#5DCAA5`, with a
  text line underneath: `Sat 26 g · Unsat 40 g · 1 : 1.5 (goal 1 : 2)`. Only the ratio
  turns red when the saturated share is over ⅓.

## 5.5 Meal list

Chronological. Each row, two lines:

```
Meal · 13:30 · Burritos · 6.34 lei
P 36 · C 52 · S 1 · Fi 11 · Fa 18
```

- Type always spelled out: **Meal** or **Snack** (today only Snack is labelled).
- Macros as letter + whole number. **S = added sugar, Fi = fibre, Fa = fat.**
- Each letter in its nutrient colour.

## 5.6 Full day details

As today, EU nutrition-label order: energy, fat (of which saturates), carbohydrates (of
which sugars, of which added), fibre, protein, salt, cost.

## 5.7 "Where did it come from?" panels

- **Tapping any number or bar** (hero, nutrient bars, stats boxes, chart bars) opens a
  bottom panel listing the sources, biggest first: name, amount, % of total, and a
  small proportional bar.
- Works for calories, spend, protein, carbs, added sugar, fibre, fat, saturated fat.
- On Today it covers today's items; in stats it covers the selected range.
- Top 5 shown, then "show all".
- **In the spend panel**, an item taking ≥5% of spend while being low in protein gets a
  small **"low protein"** tag (same definition as Part 6.1).

---

# Part 6 — Nutrition tab: Recipes, Products, Weight

## 6.1 Recipes and Products

- All existing functionality stays: list, show-retired toggle, tap to duplicate, add
  new, edit rules, retire instead of delete.
- **Sort pills: A–Z · Cheapest protein · Cheapest calories.**
- Each row shows two value numbers:
  - **lei per 30 g protein**
  - **lei per 1,000 kcal**
- Items with negligible protein go to the bottom of the protein sort, labelled "low
  protein" instead of a price. **[assumed]** Low protein = protein supplies under 10%
  of the item's calories. Same idea for negligible calories in the calorie sort.
- Retired items stay hidden unless the toggle is on.
- Costs follow the existing price rules (Part 11).

## 6.2 Weight — chart and goal

- Header "+" with red dot when today is missing; entry form accepts any date.
- **Chart: dots for daily weigh-ins**, plus **4-day and 7-day moving average lines**.
  No bars.
- **Skipped days get an invented point** (halfway between the neighbouring weigh-ins),
  drawn as a **hollow grey dot** so it's clearly not real. Invented points are visual
  only: they are **excluded from the averages and from TDEE**.
- Y axis tight around the range's data, padded about 1 kg each side (data 78–82 →
  axis 77–83).
- Range control: 7 · 14 · 28 · All · Custom, default **28**. Rotate button.
- **Goal line above the chart:** `4.2 kg to goal (75 kg)`, computed from the 7-day
  average weight, not a single weigh-in.
- List of weigh-ins below the chart, newest first, keeping today's "difference from the
  entry before" column. Tap to edit.

## 6.3 Weight — TDEE estimate

Shown under the weight chart.

**Method**
- Window: all available days up to 28; after that, always the latest 28 days.
- Weight change: slope of a **linear trend line through all real weigh-ins in the
  window** (kg/day). Not single readings, not end-point averages, never invented points.
  This replaces the plan's 7-day-average method (Part 16).
- Average intake: mean daily calories over the window, **excluding days with no meals
  logged**.
- `TDEE = average intake − (slope_kg_per_day × 7700)` (slope is negative when losing,
  so weight loss raises TDEE above intake).
- Show a **± range** derived from the trend-line uncertainty.

**When it shows**
- Appears after **7 days** of data. Before that: `TDEE available in N days`.
- Accuracy label:

  | Days of data | Label |
  |---|---|
  | 7–13 | Rough |
  | 14–27 | Fair |
  | 28+ | Reliable |

- Example display: `2,450 ± 380 kcal · Rough · 9 days`.

**Formula comparison**
- Mifflin–St Jeor using height, age (from birth year), sex, and the current 7-day
  average weight, × activity multiplier: sedentary 1.2, light 1.375, moderate 1.55,
  very active 1.725.
- Display: `Formula estimate: 2,427 kcal (light activity) · You: +220`.
- If body settings are missing, show a prompt linking to Settings instead.

---

# Part 7 — Nutrition stats section

Below the full day details on Today. Top to bottom:

## 7.1 Digest cards

Two small cards side by side:
- **Weekly digest** (tap to open): average sleep, cigarette trend vs previous week, food
  spend, average calories.
- **Food spend this month**: total vs (daily spend target × days in month).

## 7.2 Range control

4 · 7 · 14 · 28 · Custom, with the resolved dates and day count underneath
(e.g. `1–9 Sep · 9 days`).

## 7.3 Average boxes (2 × 4 grid)

Calories / day · Spend / day · Protein / day · Carbs / day · Added sugar / day ·
Fibre / day · Fat / day · Meals · snacks / day.

Nutrient labels in nutrient colours. Tappable → "where did it come from" panel.
Averages cover the days with meals logged and say so when the range isn't full
(`over 6 days logged`), the same honesty rule as `lib/series.ts`.

## 7.4 Chart over time

- **One chart with metric buttons**: Calories · Spend · Protein · Carbs · Sugar ·
  Fibre · Fat. Tapping a button redraws the chart.
- Daily bars from zero, one per day in range.
- Target drawn per Part 5.2: ceiling line, or ±10% zone band with target line.
- Over part of a bar in red; for zone targets, past days under the zone get a thin red
  cap on top of the bar.
- **Dashed average line.**
- Footer: `average X · target Y`.
- Rotate button.

## 7.5 Meals vs snacks card (10 rows)

Header: range and counts (`28 meals · 17 snacks`). Two columns, Meals (green) and
Snacks (coral):

1. Avg calories
2. Avg protein
3. Avg fibre
4. Avg added sugar
5. Avg cost
6. Protein per leu
7. Avg score
8. Share of calories — split bar with percentages
9. Share of spending — split bar with percentages
10. Share of added sugar — split bar with percentages

## 7.6 Days on target card

- One row per target: calories, spend, protein, carbs, added sugar, fibre, fat, fat
  ratio.
- Each row: one small square per day — **green = hit, red = missed** (Part 5.2 rules) —
  and a count on the right (`6/9`).
- Bottom rows: day numbers, and "targets hit" per day.
- **[assumed]** Days with no meals logged show as grey squares and don't count.
- Ranges longer than ~31 days switch to counts only (no squares).
- **Swing line** under the grid: `Calories swing ±391 kcal · Protein swing ±23 g`
  (standard deviation of daily values over the range).

## 7.7 Timing card

Key numbers for the range:
- Wake → first food: average, with min–max (`4 h 45 (3–8 h)`). Wake time comes from
  the sleep log.
- First food: average time.
- Last food: average time.
- Eating window: average length.
- Eaten after 01:00: item count and calories.

Meals added for a past day are saved at 12:00, as today. The Timing card uses that time
as it is — accepted, because I rarely backfill meals.

**Average-day strip**, 04:00 → 04:00 (matching the day boundary):
- Sleep blocks (from sleep log averages), the no-food gap after waking, the eating
  window.
- Above it, bars for average protein eaten in each hour, which exposes gaps (e.g. an
  empty afternoon).

Order of the section is as listed above.

---

# Part 8 — Workout tab (placeholder)

- Large coral barbell icon.
- **Countdown**: `Gym starts in 23 days`, from the gym start date in Settings.
- No date set: `Set your gym start date` with a button to Settings.
- Date passed: `Gym started 5 days ago · workout tracking is coming`.
- Static (no animation for now).

---

# Part 9 — Settings tab

Styled consistently with the rest of the app.

**Goal**
- Goal phase: cut / maintain / bulk. Cut → calories are a ceiling; maintain or bulk →
  calories are a ±10% zone.
- Goal weight (kg).

**Daily targets** — one set, edited by hand when the phase changes. All optional and
clearable, as today
- Calories
- Daily spend (lei)
- Protein (g)
- Carbs (g)
- Added sugar (g)
- Fibre (g)
- Fat (g)
- Saturated : unsaturated ratio (default 1 : 2)

**Body** (for the formula estimate)
- Height (cm), birth year, sex, activity level (sedentary / light / moderate / very
  active).

**Workout**
- Gym start date.

**Data**
- Export everything, with `Last export: N days ago` next to the button — amber at 7+
  days, red at 14+ (Part 2.4). This replaces the separate `/export` screen as the place
  to find the button.

Not shown: the 04:00 day boundary (unchanged, stays hidden).

---

# Part 10 — Data model changes

For migrations I run myself in the Supabase SQL editor.

## `settings` — new fields

| Field | Type / values | Notes |
|---|---|---|
| `carbs_target` | numeric | ±10% zone |
| `fat_target` | numeric | ±10% zone |
| `unsat_per_sat` | numeric, default 2 | ratio 1 : N |
| `goal_phase` | `cut` / `maintain` / `bulk` | switches calorie rule |
| `goal_weight` | numeric (kg) | |
| `height_cm` | numeric | |
| `birth_year` | integer | |
| `sex` | `male` / `female` | Mifflin–St Jeor |
| `activity_level` | `sedentary` / `light` / `moderate` / `very_active` | |
| `gym_start_date` | date | |

Existing fields keep working: `calorie_target`, `protein_target`, `daily_budget`,
`added_sugar_max`, `fibre_min` (now interpreted as a ±10% fibre target — rename if
Claude Code recommends it, with my approval), `day_boundary_hour`, `last_export_at`.

## Export envelope

Add the timezone (e.g. `"tz": "Europe/Bucharest"`) so exported UTC timestamps can't be
misread against the local 04:00 day boundary.

## No other schema changes

Streaks, milestones, digests, stats and TDEE are computed from existing tables.

---

# Part 11 — Computation rules (must match existing behaviour)

1. Nutrition is per 100 g/ml: `value = product[nutrient] × grams / 100`.
2. Quantity: `piece → grams = quantity × piece_grams`; `unit → grams = quantity`.
3. Price: `cost = grams × package_price / package_quantity`.
4. Recipe serving: sum of resolved recipe items ÷ `servings`. `cooked_weight` is not
   used in nutrition maths.
5. Meal total: sum of resolved items.
6. Day assignment: `eaten_at` stored in UTC, converted to Europe/Bucharest (DST-aware),
   and times before 04:00 belong to the previous day.
7. Snack vs meal comes from `meals.type`; score from `meals.score`.
8. Moving averages: 4-day and 7-day, over the days that have an entry.
9. `sugars_total` and `sugars_added` overlap and are **never summed** (as today).
10. A sleep night's length is computed from its two times, crossing midnight by
    arithmetic (`lib/sleep.ts`), never stored.

---

# Part 12 — Assumptions to confirm before building

These were filled in while writing and were not explicitly decided:

1. Nutrition stats range defaults to **7 days**.
2. Sleep tab has a **header "+"** for any night, in addition to the big "+" on the
   clock.
3. **"Low protein"** = protein supplies under 10% of an item's calories.
4. In Days on target, **days with no meals logged are grey** and excluded; they're
   also excluded from nutrition averages.
5. **Milestones**: Claude Code proposes the full list; the plan's two examples are the
   starting point.
6. **A "logged day"** (for the streak and the days-logged counter) = all four logs
   exist: sleep, smoking, weight, at least one meal. Because smoking is logged a day
   late, the streak and counter are evaluated up to yesterday.
7. **The five targets are set.** `progress.md` notes they may still be empty after the
   wipe; most of this phase reads them, so check before building.

---

# Part 13 — Deliberately not included

So no session picks them up by accident:

- Variety card (distinct foods, top-2 share, fruit & veg servings, days since new
  product) and the product `category` field
- Score card (nutrition by score band, repeated low scorers)
- Per-snack protein target
- Protein g/kg label
- Ultra-processed / NOVA flag on products
- `cooking_additions` field on recipes (add oil and salt as recipe ingredients instead)
- Daily cigarette limit
- Sleep hours target
- Separate target sets per goal phase
- Second sleep chart (hours + quality)
- Rich animations (later)
- A separate monthly budget setting
- The smoking averages text line and trend sentence (removed from the current screen)
- A banner on Today for an overdue backup
- A "time not real" flag on backfilled meals

---

# Part 14 — Known bugs (fix at the end of Phase 7)

1. **Search jumps to top.** In the meal builder, typing a product/recipe search makes
   the page jump to the top when results arrive, as if it refreshed.
2. **Add jumps to top.** Same jump after tapping Add on a found item (e.g. "Burritos,
   1 serving").
3. **Every tap is slow.**

Likely causes to investigate first:
- The whole page reloading its data after every save or search, resetting scroll.
- A server request on every keystroke instead of debounced or local search.
- The Vercel function region and the Supabase region being far apart (e.g. US vs EU),
  so every tap crosses the Atlantic.

---

# Part 15 — Suggested step order

A proposal for `progress.md`; adjust with me at the start of Phase 7.

| Step | Work |
|---|---|
| 7.0 | Rewrite the plan and `progress.md` from this document; propose charting approach, icons and steps |
| 7.1 | Settings migration and Settings tab (Part 9, 10), export timezone, backup reminder |
| 7.2 | App shell: bottom tab bar, colours, icons, red-dot system, shared range control, chart base with rotate button |
| 7.3 | Nutrition → Today: sub-tabs, "+" button (tap and hold), hero, target rules, nutrient bars with fat split, meal rows, day details |
| 7.4 | Calendar heatmap with streak and days-logged counter |
| 7.5 | "Where did it come from?" panels |
| 7.6 | Recipes and Products: sort pills, cost per 30 g protein and per 1,000 kcal |
| 7.7 | Weight sub-tab: dots chart, averages, goal line, TDEE with formula comparison |
| 7.8 | Sleep tab: clock (night and period), chart view |
| 7.9 | Smoking tab: bar chart, averages, list |
| 7.10 | Nutrition stats: digest cards, average boxes, chart with buttons |
| 7.11 | Nutrition stats: Meals vs snacks, Days on target, Timing |
| 7.12 | Weekly digest content and milestones |
| 7.13 | Workout placeholder |
| 7.14 | Performance and scroll bugs (Part 14) |

---

# Part 16 — What this replaces in the current plan and code

So no one finds two documents disagreeing and guesses which one is right.

| Current rule or feature | Where it's written | Replaced by |
|---|---|---|
| Nothing is ever red or amber about what was logged; amber and red only for an overdue backup; every bar the same colour | Plan Part 5 (gamification), `progress.md` Settled + Decisions, `architecture.md` "The bars" | Part 2.4: red = missing log, missed target, overdue backup |
| Protein and fibre are floors ("at least"); calories and money are budgets | `architecture.md`, `lib/targets.ts` | Part 5.2: ceilings and ±10% zones; calories depend on goal phase |
| TDEE from 7-day weight averages, at least 14 days before showing | Plan Part 5, `progress.md` | Part 6.3: trend line, from 7 days, accuracy label |
| Weight chart draws a straight line across skipped days | Plan Part 3 | Part 6.2: hollow grey invented points, excluded from averages and TDEE |
| Home screen: a list of destinations, today's calories, backup line | `architecture.md`, `progress.md` | Tab bar (2.1), backup reminder (2.4), Nutrition opens by default |
| Bottom tab bar deferred | `progress.md` Decisions | Built in this phase |
| Cigarettes screen: averages and trend sentence above the list | `architecture.md`, `progress.md` | Part 4: chart only, no text |
| "Repeat something recent" list on the day screen | `architecture.md` | Part 5.1: hold the + button |
| Five targets on `/settings`; export on `/export` | `architecture.md` | Part 9: Settings tab with all targets, body, goal, gym date, export |
| Phase 7 as written in Part 5 of the plan | Plan Part 5 | This document |

Everything else in the plan, `architecture.md` and `progress.md` still holds — the
honesty rules in Part 4 of the plan, the PIN gate, the export format, `lib/day.ts`, the
04:00 rule, and all Settled items not listed above.
