// Measuring a day against a target.
//
// The five targets point in three different directions — calories and money are
// budgets to spend, protein and fibre are floors to reach, added sugar is a
// ceiling to stay under — but a bar fills the same way for all of them. Only
// the wording underneath differs.
//
// Nothing here ever returns a colour or a warning. Part 5 of the plan rules out
// anything red or scolding about what was eaten, so going over a target fills
// the bar and says so in plain numbers, and that is all it does.

export type Direction = "budget" | "floor" | "ceiling";

export type Progress = {
  // 0 to 1, for how far along the bar is drawn. Clamped, so eating double
  // doesn't draw a bar twice as wide as its box.
  fraction: number;
  // Past the target. Used for wording, never for colour.
  over: boolean;
  // Reached, for a floor. "over" and "reached" are the same event read two
  // different ways, which is why they're separate words.
  reached: boolean;
};

export function progress(value: number, target: number | null): Progress | null {
  if (target === null || target <= 0) return null;

  const ratio = value / target;

  return {
    fraction: Math.max(0, Math.min(1, ratio)),
    over: ratio > 1,
    reached: ratio >= 1,
  };
}

// What to write under a bar: "of 2400", "of 140 g", "of 40 g at most".
export function targetNote(target: number, unit: string, direction: Direction): string {
  const amount = `${target}${unit ? ` ${unit}` : ""}`;

  if (direction === "ceiling") return `of ${amount} at most`;
  if (direction === "floor") return `of ${amount} at least`;
  return `of ${amount}`;
}
