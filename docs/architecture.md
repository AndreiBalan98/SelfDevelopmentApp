# Architecture

A map of what lives where. Kept current as the app grows — updated by the step that
changes it. Plain language: what each piece does and why it's there.

## The shape of the thing

There is no separate backend. One Next.js project holds both halves: the pages your
phone draws, and the server code that talks to the database. Vercel runs both.

```
Phone (Safari)  →  Vercel  →  Next.js server code  →  Supabase Postgres
```

The phone never holds a database key. Every read and write goes through server code
running on Vercel.

**Where the key lives.** One file, `lib/supabase.ts`. Nothing else in the app opens a
database connection, and that file refuses to load at all if it ever finds itself
running in a browser. The key comes from an environment variable — `.env.local` on
the laptop, Vercel's settings in production — and is never written down in the repo.

**How a write happens.** You tap a button on a page. That page hands the work to a
*server action*: a function that looks like it's called from the phone but actually
runs on Vercel. The action talks to the database and sends back only the result. The
browser never sees the key, the connection, or the query — only the answer.

This is verified rather than assumed: a request to the database with no key attached
comes back `401 Unauthorized`, so the project URL on its own is worth nothing.

## What's in the repo today

```
app/                 every screen, and the server code behind it
  layout.tsx         the frame every page sits inside: fonts, colours, page title,
                     and the tags that make iOS treat this as an installed app
  globals.css        the colour palette and base styling for the whole app
  page.tsx           the home screen: one line per destination
  login/             the PIN screen
  weight/            logging a weigh-in, and the last fortnight of them
  products/          what you buy: list and search, add, edit, replace
    new/             the add form — also the replace form, pre-filled
    [id]/            one product
  recipes/           what you cook: list and search, add, edit, replace
    new/             the add form — also the replace form, pre-filled
    [id]/            one recipe: its ingredients and what a serving works out at
  meals/             what you ate: one day at a time, with the day's totals
    [id]/            one meal: what was in it, when, and how it was
  sleep/             a night: two times, a score, and the last fortnight
  smoking/           a day's count, the last fortnight, and the two averages
  settings/          the five targets a day is measured against
  export/            the backup screen
  api/export/        the URL that builds the backup file itself
  manifest.ts        the app's name, colours and icons, for the home screen
  icon.png           browser tab icon
  apple-icon.png     the home screen icon on iOS
  favicon.ico        the old-fashioned browser tab icon, for anything that wants it
public/              files served as-is at fixed URLs
  icon-192.png       icons the manifest points at; they need stable paths, which
  icon-512.png       the ones in app/ don't have
proxy.ts             the PIN gate — runs before every request
lib/
  supabase.ts        the only file that holds the database key
  session.ts         issues and checks the cookie that proves you're logged in
  pin.ts             checks a typed PIN against the hash in PIN_HASH
  day.ts             every date, worked out in Europe/Bucharest
  backup.ts          reads every table into one file; tracks when you last did
  types.ts           the shape of the database, so typos are caught while
                     writing rather than on your phone. Updated by hand.
  product-fields.ts  reading a product off a form and checking it, shared by
                     adding, replacing and editing
  recipe-fields.ts   the same, for a recipe
  meal-fields.ts     the same, for a meal and its lines
  meals.ts           reading a meal's lines back: what each was, how much, and
                     what one serving of a recipe works out at
  nutrition.ts       all the food arithmetic: scaling a product to a quantity,
                     adding up a recipe, per serving, cost, shrinkage, meals
  settings.ts        reading the one settings row and the targets on it
  targets.ts         measuring a day against a target, for the bars
  sleep.ts           how long a night was, including crossing midnight
  series.ts          averages over a run of days, honest about the gaps
  replacements.ts    following oats → oats 2 → oats 3 to whatever you buy today
supabase/
  migrations/        SQL you run by hand in the Supabase editor, numbered in order
  sample-data/       seed.sql and wipe.sql — invented data for developing
                     against. Not migrations; run only when you want them.
docs/                the plan, this map, and the progress board
package.json         the list of libraries the app depends on
next.config.ts       Next.js settings — empty, nothing needed yet
tsconfig.json        TypeScript settings, including the `@/` import shortcut
eslint.config.mjs    the code checker's rules
postcss.config.mjs   wires Tailwind into the stylesheet build
```

`node_modules/`, `.next/` and any `.env*` file are gitignored — the first two are
rebuilt from `package.json`, and the third would be secrets.

## How a page gets to your phone

1. You push to GitHub.
2. Vercel notices, runs `next build`, and turns the pages into static HTML where it
   can.
3. The phone requests a URL; Vercel serves it from the edge.

Right now every page is static, so this is fast and free. Once screens read from the
database they stop being static and get rendered per request instead — that's a
normal and expected change, not a regression.

## The PIN gate

One file, `proxy.ts`, runs before every request that reaches the app. If the request
doesn't carry a valid session, it never reaches the page — it's sent to the PIN
screen instead. Because the check sits there rather than inside each page, every
screen built from now on is protected without anyone having to remember to protect
it. That includes the JSON export in phase 3, which is the one URL that would hand
over everything.

Three things are deliberately left reachable without the PIN: the app icons and the
manifest. iOS fetches those the moment you add the app to your home screen, which is
necessarily before you've logged in, and they reveal nothing.

**The PIN itself is never stored.** What's stored, in an environment variable, is a
scrypt hash — a one-way scramble that can't be turned back into the number. When you
type the PIN, the server scrambles your guess the same way and compares the results.
Each guess deliberately costs about 80ms of server time.

**Guessing is capped.** Six digits is only a million combinations, which a determined
attacker could work through if allowed to try freely. Five wrong PINs inside fifteen
minutes and login refuses until the oldest of those failures ages out. The count
lives in the database so it holds no matter how many copies of the app Vercel is
running. Only the *time* of each failure is recorded — never the PIN typed, never an
IP address.

If the database can't be reached, login refuses rather than letting you in with the
lockout quietly disabled.

**Staying logged in.** On success the server hands the browser a cookie that is
simply an expiry date plus a signature of that date. Edit the date and the signature
stops matching, so a browser can't extend its own session or invent one. It lasts
three months, and no script on the page can read it.

Changing `SESSION_SECRET` in Vercel invalidates every session everywhere at once.
That's the emergency log-out, and it's why there isn't a button for one.

### Changing or recovering the PIN

There's no screen for this, on purpose. Run this in the project folder — it doesn't
show the PIN as you type it, and the PIN never reaches your shell history:

```
read -s -p "PIN: " PIN; echo; PIN="$PIN" node -e "const c=require('crypto');const s=c.randomBytes(16);console.log(s.toString('hex')+':'+c.scryptSync(process.env.PIN,s,64).toString('hex'))"; unset PIN
```

Put the line it prints into `PIN_HASH`, in `.env.local` and in Vercel, and redeploy.
It must be six digits — the login screen accepts nothing else.

`SESSION_SECRET` is just noise, regenerated with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Both are worth keeping in a password manager alongside the database password.

## Weight

The first real screen, and the pattern the rest will follow. You pick a day, type a
number, press Save. Underneath, the last fortnight, each one tappable to change or
delete, with the difference from the entry before it in the right-hand column.

**Logging a day twice updates it rather than failing.** The database refuses two rows
for the same date — that's what stops accidental double-logging — so the screen reads
what's already there, fills the field with it, and the button says Update instead of
Save. Nothing points at a weigh-in, so changing one rewrites no history; this is the
"everything is editable" rule from Part 4, and it's why weight is safe to build first.

Changing the date reloads the screen for that date, so the field always shows what
was actually logged rather than a number left over from the day you were just
looking at.

Refused, with a message rather than a crash: a future date, an empty or nonsensical
weight, zero, and negatives. A comma is read as a decimal point, because the iPhone
number pad offers one. Anything past two decimals is rounded, because that's what the
column holds — so what you see saved is what was stored.

## Products

What you buy, entered once each. The list searches by name and hides retired
products behind a toggle — that toggle is also how you read the price history,
because oats → oats 2 → oats 3 is exactly what a kilo has cost you over time.

**The form follows the packet, not the database.** Energy, fat, of which saturates,
carbohydrate, of which sugars, fibre, protein, salt — the order printed on an EU
label, so you can type straight down it without hunting. Anything the label doesn't
give you is left empty, and empty means "not stated", which is deliberately not the
same as zero. Calories are the one required figure, because a meal's calorie total
has to be complete to mean anything.

EU labels give a single "of which sugars" number, so that field is copied straight
off the packet and the added-sugar field below it is your own estimate from the
ingredients list — left blank when you can't tell.

As you type the price and package size, the screen shows the price per 100. That is
the cheapest possible guard against the one mistake that's invisible later: typing
100 g for a one-kilo bag, which silently corrupts the cost of every meal that product
ever appears in.

### What you may change, and when

The app decides this for you, by counting how many recipes and meals point at the
product:

- **Never used** — everything is editable, and it can be deleted. Nothing points at
  it, so nothing can be corrupted.
- **Used** — price, quantity and nutrition are frozen. The name stays editable,
  because it's a label for you and no calculation depends on it.

Frozen doesn't mean stuck. **Replace** opens the add form as a copy of the product,
with the name already stepped on ("oats" → "oats 2"). Change the price, save, and in
one action the new product is created, the old one is retired, and the two are
linked. Every meal you have already logged still points at the old product and keeps
the numbers it was logged with.

That's the point of the design: replacing is as fast as editing would have been. If
the honest path were the slower one, the rule would quietly stop holding.

Because this database can't wrap two writes in one transaction, creating the
replacement and retiring the original are separate steps. If the second doesn't
happen — including the case where the original was deleted from another screen while
you were typing — the first is undone and nothing changes.

## Recipes

What you cook, built out of products. A recipe is a name, how many servings it makes,
what the pan weighed afterwards, and a list of ingredients.

**It's one screen.** Name and servings go in first, and the ingredients are added to
the saved recipe underneath — search, type a quantity, Add. Nothing is spread across
two screens, because iOS throws away a home-screen app's state when it relaunches and
a half-built recipe would go with it.

That does mean a recipe can sit there for a while with nothing in it. That's visible
on the list, which says "no ingredients", and it's the honest state anyway: the cooked
weight can't be filled in until the pan has been weighed, which is usually a different
day.

**Retired products are left out of the search.** A new recipe should be built from
what you buy today. If you want the old one deliberately, it's still there in the
products list.

### What the screen works out for you

Nothing here is stored. All of it is recalculated every time the screen is drawn, so
it can never go stale:

- **Raw weight** — the ingredients added up, with 1 ml counted as 1 g. No densities
  are stored anywhere.
- **Shrinkage** — cooked weight minus raw weight, shown both as grams and as a
  percentage. The percentage is what you compare between cooks; the grams are what
  tell you a number was mistyped. A pan that got *heavier* is reported as such rather
  than hidden, because adding water to a stew is a real thing and so is a typo.
- **Per serving** — the nine nutrition figures and the cost, divided by the servings.
  With a cooked weight it also says roughly what one serving weighs, which is what you
  actually need when you're dividing the pan up.

Missing nutrition values are added up as zero, so a fibre or salt total can read lower
than what's really in the pan. Calories never can, because calories are required on
every product.

### What you may change, and when

Same rule as products, counted the same way — how many meals point at the recipe:

- **Not eaten yet** — everything is editable, ingredients included, and it can be
  deleted.
- **Eaten** — servings and ingredients are frozen. Changing them would rewrite every
  meal already logged.

Three things stay editable forever: the name, the notes, and **the cooked weight**.
The first two are labels. The cooked weight is the interesting one — a meal records a
number of *servings*, so the calories and cost of a portion come from the ingredients
divided by the servings, and the cooked weight is never part of that sum. It only says
what a portion weighs. So weighing the pan a week later, or correcting a mistyped
figure, rewrites no history.

**Replace** works exactly like it does for products, and it brings the ingredients
across. Where a line points at a product that has since been retired, it follows the
`replaced_by` chain and uses the current version — and the replace screen lists which
lines moved before you save, because that's where the numbers change under you.

Creating the recipe, copying its lines and retiring the old one are three separate
writes with no transaction available. If any of them fails, the new recipe is deleted
again — which takes its own lines with it — so a failed replacement leaves nothing
behind.

## Meals

What you ate. The screen shows **one day at a time** — arrows either side, a date box
for jumping further, and "Back to today". Step 4 puts the day's totals and progress
against targets on this same screen rather than building a second one.

"Today" here means the day you're currently logging towards, not the calendar date. At
02:00 you are still filling in yesterday, and the screen agrees with you.

**Add a meal creates it there and then** — time set to now, type "meal", day worked out
by the 04:00 rule — and drops you straight inside it. There is no form standing between
you and typing what you ate, because this is the screen used several times a day, often
while eating. A mis-tap leaves an empty meal on the list, which is one tap to delete.

**One search box for products and recipes together**, recipes marked with a tag and
their calories a serving. Retired ones are left out, including when backfilling.

**Nothing about a meal is ever frozen.** Products and recipes freeze once something
points at them; nothing points at a meal, so every line, quantity, time and note stays
editable and deletable forever. Deleting a meal takes its own lines and nothing else.

### Grams or pieces

A meal line records **what you typed** — a number, and whether it meant the product's
own unit or pieces — not the converted weight. So a line still reads "2 eggs" in a
year instead of "120 g".

The box counts pieces by default for any product that says what one piece weighs, and
shows the conversion as you type. That figure is the whole reason the product has it.
Everything else is grams or millilitres, with no toggle to get wrong.

### Repeating a meal

Two ways in. **Repeat this today**, at the bottom of any past meal. And **Repeat
something recent** on the day screen, under Add a meal: the last few things you ate,
most recent first, with identical ones shown once so a fortnight of the same breakfast
takes one row. Either way it copies onto the day you're looking at and opens the new
meal, because the portion is usually the thing that differs.

Ranked by how recently rather than how often. Recency is exact; "how often" would need
a definition of "the same meal" that holds up over months, and that belongs with the
rest of the statistics in phase 7.

**The lines and the meal/snack type come across. The note and the score do not.** A
score is a judgement about one particular plate of food, and carrying it forward would
fill the history with scores that were never given — which matters, because phase 7
reads them.

**A line pointing at something retired follows `replaced_by` to the current version**,
so a repeat is made of what you'd buy today, and the copy says which lines moved. That
notice only exists in the moment: the copy itself points only at the current versions,
so it's worked out by comparing the copy against the meal it came from, and a moment
later there's nothing left to compare. Something retired with nothing after it is
copied as it stands and called out separately — you did eat it, and refusing would fail
the whole repeat over one line.

The old meal is untouched, and still points at what you actually ate. So a repeat of
last week's porridge can legitimately cost more than the original: it's made of this
week's oats.

### The time, and which day it counts towards

`eaten_at` is a full instant; `day` is which day it counts towards. The meal screen
shows both, and the day is an ordinary editable field.

When you log as you eat, the time is the real one. **When you backfill, the time is
midday on the day you're looking at** — deliberately not the current clock time. Log
yesterday's dinner at 01:30 tonight and the real time would fall before the 04:00 rule
and count towards the day before yesterday. Midday cannot cross that boundary in either
direction.

Underneath the day field, the screen says what the 04:00 rule makes of the date and
time as they currently stand, and offers to use it — so a 02:20 snack landing on the
previous day is visible rather than surprising.

## Sleep

Pick the morning you woke up, type the two times, tap a score out of ten, save. The
last fortnight underneath, each tappable to change and deletable, with the average
length of the last seven nights above them.

The same shape as weight, and safe for the same reason: nothing in the database points
at a night, so every entry stays editable and deletable forever. Logging the same night
twice updates it rather than failing, because the date is unique — that uniqueness is
what makes double-logging impossible rather than merely unlikely.

**How long the night was is never stored.** It's worked out from the two times every
time it's shown, and it appears live under the fields as you type. That's what catches
a mistyped time while you can still see it: "22 h 40 m" is visibly wrong in a way a
stored number never would be.

**Crossing midnight is arithmetic, not a question.** Bed at 23:30 and up at 07:00 means
the night crossed midnight; bed at 01:30 and up at 09:00 means it didn't. Both are
obvious from the two numbers, so the app never asks which day bedtime was on, and the
line under the fields says which it decided.

A night can be logged with only a score, or only a note. There's then nothing to
measure, and the list shows a dash rather than inventing a length.

## Cigarettes

A day, a count, an optional note, and the last fortnight underneath. The weight
screen's shape, on purpose: there is no bulk-entry grid and no backfill mode, because a
month of history is being entered a day at a time.

**Zero is a real entry, and an empty box is not.** The schema is explicit that a day
with no row means "not logged" while a row holding zero means "smoked nothing", and
those are different facts. So the field starts empty, never at zero, and saving an empty
one is refused. If empty quietly meant none, every day you forgot to log would read as a
perfect day and the averages would be fiction.

Above the list: the **4-day and 7-day averages**, each saying how many days it actually
had when the window has gaps. Then one flat sentence when the two differ — "The last
four days are below the week", or above it.

That sentence is the only place in the app that interprets rather than reports, and it
exists because the plan says the trend is the point rather than the bad days. It stays
neutral in both directions: no congratulation, no colour, nothing red. The rest of the
screen is numbers.

## Averages over days, and the gaps in them

`lib/series.ts` averages a value over a run of days. It's used for the seven-night sleep
average now, for cigarettes next, and it's the same function phase 7 needs for the
seven-day weight average that the whole TDEE estimate rests on.

**The honest part is the gaps.** A day with no row is a day that wasn't logged, which is
deliberately not a day with a value of zero — the schema keeps those apart on purpose.
So the average covers the days that actually have an entry, and it carries how many
that was, which the screen says out loud when the window isn't full: "7 h 23 m a night ·
over the 6 you logged". Filling the gaps with zero would flatter a cigarette count.
Treating a half-empty window as complete would lie about it.

## The day's totals, and the targets

At the top of the day screen: calories as a headline with a bar, then protein, fibre,
added sugar and money as compact rows. At the bottom, below the meals, the full nine
figures for the day as plain numbers.

It sits on the day screen rather than on a separate "Today" page so that the totals
work for **any** day. Backfilling Saturday shows Saturday's totals; looking back at
last week shows last week's. A today-only screen would have needed a second copy of the
same arithmetic for every other day.

The home screen's Meals line shows the day's calories so far, because that's the number
the app is most often opened to check.

### The bars

Every bar is the same colour, including the ones you have gone past, and there is no
amber and no red anywhere on this screen. Part 5 of the plan rules out anything red or
scolding about what was eaten; amber is reserved for "your backup is overdue", which is
an actual problem. Going over a target fills the bar and says so in numbers.

The five targets point in three directions and the wording under each bar says which:

- **Budgets** — calories, money: "of 2400 kcal".
- **Floors** — protein, fibre: "of 140 g at least", and "· there" once reached.
- **Ceiling** — added sugar: "of 40 g at most", and "· past it" once over.

**A target you haven't set shows the number with no bar** and a quiet link to the
targets screen. Not a hidden row, and never a bar reading "0% of 0" — you want to watch
a number for a fortnight before deciding what it ought to be, and hiding it until then
is backwards.

### Setting them

`/settings` holds the five numbers, all optional, all clearable back to empty. Empty
means "not decided yet", which is deliberately not the same as zero.

They live in the database rather than in the code because the plan expects them to be
revised once there's enough weight and food history to estimate a real TDEE — and if
changing them meant opening the Supabase SQL editor, they would quietly go stale.

`day_boundary_hour` is deliberately not on that screen. It's the one setting that
changes how data is read rather than what it's measured against, and it deserves its
own conversation.

## Dates, and the two mornings a year they go wrong

`lib/day.ts` is the only place a date or a time is built, and everything in it is
Europe/Bucharest.

`localTimestamp` turns a date and a time typed on the phone into the exact instant they
mean. That sounds trivial and isn't. On the last Sunday in March the clocks jump
03:00 → 04:00, so 03:30 never happens; on the last Sunday in October they go back
04:00 → 03:00, so 03:30 happens twice. Both sit directly on top of the 04:00 rule that
decides which day a late meal belongs to.

What it does with each case, deliberately:

- **A time that never existed** lands just after the jump — 03:30 becomes 04:30 —
  rather than before it.
- **A time that happened twice** takes the second of the two. Either is defensible;
  both fall on the same side of the 04:00 rule, and what matters is that it's the same
  answer every time.
- **Everything else**, including the hours either side of a change, is exact.

The first version of this got the October morning wrong: every meal logged before the
change was stored an hour late. It was found by checking every hour of both clock-change
days against a real clock, not by reading the code, which is the only way that bug was
ever going to be found.

`settings.day_boundary_hour` exists in the database for making 04:00 changeable later.
Nothing can change it yet, so the app reads a constant.

## The food arithmetic

`lib/nutrition.ts` holds every sum in the food half of the app: scaling a product to a
quantity, adding up a recipe, dividing by servings, cost, shrinkage. Meals and the
Today screen will use the same functions.

It's kept separate from the screens on purpose. Nothing derived is ever stored, so one
wrong function here would be wrong on every screen and in every week of history at
once — and it would look completely fine. Keeping the sums in one file with no
database access means they can be checked directly, which is how they were checked:
against a throwaway Postgres in a scratch folder, thrown away afterwards, with the app
run against the real numbers to confirm the screen agrees.

## Knowing the database's shape

`lib/types.ts` describes every table and column to TypeScript. Without it nothing
checks that `kg` is a real column or that `wieght` isn't a table, and a typo becomes
an error on your phone instead of a red line while writing.

The usual way to produce that file is the Supabase CLI, which is off limits here, so
it's written by hand — which means **it has to be updated by hand whenever a
migration changes a column.** A stale version is worse than none, because it lies
confidently.

## The database

Nine tables. Three groups:

**Food** — `products` (what you buy) feed into `recipes` (what you cook) and into
`meals` (what you ate). A meal is just a container; its lines point either at a
product with a quantity, or at a recipe with a number of servings. Nothing about a
meal's calories or price is stored — it's added up from the lines every time a screen
is drawn.

**Days** — `sleep`, `weight` and `smoking` are flat, one row per day, with the date
marked unique. That uniqueness is doing real work: it's what makes double-logging the
same day impossible rather than merely unlikely.

**Settings** — one row that can never become two.

### What the database refuses to do

Three of the honesty rules in Part 4 of the plan aren't left to the app to remember.
They're built into the tables, so a bug in a form can't get round them:

- **Deleting a product or recipe you've actually used is refused.** Not deleted-with-
  its-meals, not silently emptied — refused, with an error. Deleting an unused one is
  fine. Deleting a meal is always fine and takes only that meal's own lines with it.
- **A meal line is either a product or a recipe.** Never both, never neither.
- **The same day can't be logged twice** for sleep, weight or smoking.

Correcting a price or a nutrition value is deliberately not possible by editing. You
make a new product, mark the old one retired, and point it at the replacement — which
is also how the app knows what a kilo of oats has cost you over two years.

### Who can read it

Row Level Security is switched on for every table, with no access rules written at
all. In Postgres that means the public roles can read and write nothing — there's no
rule to get wrong, because there are no rules.

The app gets in using a separate key that skips those checks entirely, and that key
only ever exists on the server. Your phone never holds it. So if the database URL
leaks, it's worth nothing to whoever finds it.

## The backup

Supabase's free plan keeps no snapshots of anything. If a table is wiped, the data
is gone permanently. The file this produces is the only copy of your history that
exists anywhere else, which is why it was built third, before any screen that
creates data worth losing.

**What it does.** One button reads every row out of all nine tables and hands you a
single file, `life-tracker-2026-09-01.json`. On the phone that opens the iOS share
sheet — Save to Files, AirDrop to the laptop, mail it to yourself. In a desktop
browser, where there is no share sheet, it downloads instead.

`login_attempts` is deliberately left out. It's a list of timestamps the lockout
uses and nothing more: worthless in a backup, and nothing you'd want restored.

The tables are written in the order a restore would have to put them back — a thing
always appears after whatever it points at — so the file can be turned back into
rows without untangling anything first. There is no import screen; restoring today
means working from this file by hand.

**It's all or nothing.** If any single table can't be read, the whole export fails
rather than handing you a file with a table quietly missing. A backup that looks
complete and isn't is worse than no backup.

**The reminder.** `settings.last_export_at` records when you last exported, and the
home screen reads it: quiet under a week, amber at a week, red at a fortnight. It
lives in the database rather than on the phone because iOS wipes a home-screen
app's stored data after roughly a week of not opening it — exactly when the
reminder would need to be shouting.

It records that the file was *handed to you*, not that you saved it. Tap export,
then cancel the share sheet, and the clock still resets.

## Sample data, for developing against

Screens are hard to build against an empty database, so there is a pair of SQL
scripts in `supabase/sample-data/`. They are **not** migrations: they change no
structure, they're numbered nowhere, and they run only when you decide to run them.

- `seed.sql` creates a week of invented history — products, a recipe, meals, sleep,
  weigh-ins, cigarettes — dated relative to the day you run it, so the screens always
  look current.
- `wipe.sql` removes exactly what `seed.sql` made, and nothing else.

Deliberately kept out of the app. The app has no idea any of this exists, which means
the code behaves identically whether it's drawing invented data or real data — there
is no "if the database is empty" branch anywhere to get it wrong.

Everything the seed makes is marked so the wipe can find it and only it: products and
recipes are named "Sample …", every other row is noted "sample data".

The invented week is awkward on purpose, because tidy data proves nothing: a retired
product pointing at the one that replaced it, eggs measured in pieces, milk measured
in millilitres, a 02:20 snack that counts towards the previous day, and a skipped
weigh-in for the chart to interpolate across.

**Run `wipe.sql` before you start logging for real.** If you've already logged
something that uses a sample product, the wipe refuses and rolls itself back rather
than cascading — the deletion rule doing its job — and tells you what to delete
first.

## Choices worth knowing about

**Dark only.** The palette is a handful of CSS variables at the top of
`app/globals.css`. Changing a colour there changes it everywhere. There's no light
theme to keep in sync.

**Tailwind.** Styling is written as short class names directly on the markup rather
than in separate stylesheets. It means one file to look at per screen instead of two.

**No service worker.** Deliberate — see Part 6 of the plan. It's the main cause of
iOS home-screen apps serving a stale version after a deploy.

**How the home screen app works without one.** Three things and nothing more: a
manifest naming the app, an icon iOS can use, and a tag telling iOS to hide Safari's
address bar. There's no caching layer and no offline mode — every launch loads fresh
from Vercel, which is exactly what stops the stale-version problem.
