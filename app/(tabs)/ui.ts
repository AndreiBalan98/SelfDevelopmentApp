// The new look's building blocks, as class names, shared by the screens being
// restyled to it so they can't drift apart. Taken from the phase 7 mockups and
// the Settings tab (step 7.3), which was the first screen built this way.

// A small grey heading above a card.
export const HEADING = "text-xs text-faint";

// A rounded card; its rows sit inside, divided by hairlines.
export const CARD = "flex flex-col rounded-xl bg-surface px-3.5";

// One line of a card: what it is on the left, the value or box on the right.
export const ROW =
  "flex min-h-12 items-center justify-between gap-3 border-t border-border py-1.5 first:border-t-0";

// A box to type into. 16px text, or iOS zooms the page when it's tapped.
export const BOX =
  "rounded-md border border-border bg-background px-2 py-1 text-base tabular-nums " +
  "outline-none focus:border-accent";

// The main button of a screen or form: the tab's colour, black text.
export const PRIMARY =
  "rounded-lg bg-accent px-4 py-3 font-medium text-black disabled:opacity-50";

// A small button inside a card row: Save, Remove.
export const SMALL = "rounded-md bg-raised px-2.5 py-1 text-[13px] disabled:opacity-50";

// A small button that is a row's main action: Add.
export const SMALL_PRIMARY =
  "rounded-md bg-accent px-2.5 py-1 text-[13px] font-medium text-black disabled:opacity-50";

// A plain full-width button for a quieter action: Delete. Never red — red
// means a missing log, a missed target or an overdue backup, and nothing else.
export const QUIET = "rounded-xl bg-surface px-4 py-3 text-sm disabled:opacity-50";

// A pill: the sort on Products and Recipes, the shared range control. The chosen
// one is tinted in the tab's colour.
export const PILL = "rounded-full border px-[11px] py-[5px] text-xs";
export const PILL_CHOSEN = "border-accent bg-accent/20 text-accent-pale";
export const PILL_OTHER = "border-border-strong text-muted";

// A grey track with the chosen segment raised, like Nutrition's sub-tabs.
export const SEGMENTS = "flex rounded-[9px] bg-border p-0.5";
export const SEGMENT = "flex-1 rounded-[7px] py-1.5 text-center text-xs";
export const SEGMENT_CHOSEN = "bg-segment font-medium";
