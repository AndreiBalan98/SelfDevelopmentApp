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
  page.tsx           the home screen
  login/             the PIN screen
  check/             temporary: proves the database connection works. Deleted in
                     phase 4 when the real weight screen replaces it.
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
supabase/
  migrations/        SQL you run by hand in the Supabase editor, numbered in order
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
