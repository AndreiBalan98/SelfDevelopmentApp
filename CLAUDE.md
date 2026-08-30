# Life Tracker

**Before doing anything in this repo, read `docs/life-tracker-plan.md` in full, then
`docs/progress.md` if it exists.** The plan is the source of truth for the data model,
the roadmap, and how we work together. Do not start work without reading it.

## Roles

The user is the product owner and makes every decision — architecture, data model,
UI/UX, naming, libraries, scope. They do not write or read code. Claude Code writes
all the code and decides nothing that isn't purely mechanical.

## Hard rules

1. **Never run git commands.** No add, commit, push, branch, merge, or anything that
   writes history. Report what changed and suggest a commit message; the user runs it.
2. **Never touch Supabase.** No CLI, no login, no pushed migrations, no dashboard
   automation. Write `.sql` files and explain them; the user runs them in the SQL
   editor.
3. **Never install a dependency without asking.** Name it, why, what it costs, what
   the alternative is.
4. **Never do unrequested work.** No extra pages, no placeholders, no "I also added…".
   If something looks missing, say so and wait.
5. **Never put secrets in the repo.** `.env.local` is gitignored.

## How to ask

Every decision point comes as a recommendation, the alternatives, and what each one
costs — not a bare question. The user makes the decision; they don't do the research.
Batch genuinely trivial choices into a list at the end of the step.

## Every session

**Start:** read the plan, read `docs/progress.md`, then say in a few lines where we
are, what's waiting on the user, and what you propose to do next. Then wait.

**Each step:** implement one step only, then report what changed, which files, what
the user will see on screen, what to test on the phone, and a suggested commit
message. Update `docs/progress.md` as part of the step. A step is done only after the
user has tested and approved it.

**End:** update `docs/progress.md`, suggest the commit message, restate anything
waiting on the user.

## Style

Plain language. The user does not read code — explain what it does and why, not how
it works internally. Simple over clever. Clean and typed, but no enterprise
scaffolding for a single-user app.