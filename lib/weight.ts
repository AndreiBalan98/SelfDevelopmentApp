// The Weight chart's own arithmetic: the invented points on skipped days, the
// axis sitting tight around the weights, and how far the goal is.
//
// Pure, like the rest of lib/. The moving averages are the shared ones in
// lib/chart.ts, over the real weigh-ins only.

import { daysBetween } from "@/lib/day";
import type { DayValue } from "@/lib/series";
import type { GoalPhase } from "@/lib/types";

// An invented point for each skipped day in `dates`: on a straight line between
// the weigh-ins either side, so a single skipped day lands exactly halfway and
// a run of them slopes evenly across the gap. A day with no weigh-in on one side
// — before the first ever, or after the latest, like today before the scale —
// gets none, because there's nothing to draw a line to.
//
// Only for the eye. They're never part of an average, or of TDEE: they weren't
// weighed.
//
// `entries` should reach past both ends of `dates` — the weigh-in just before
// and just after — so a gap that crosses the edge of the chart still has its two
// neighbours. `dates` must run oldest first.
export function inventedPoints(entries: DayValue[], dates: string[]): Map<string, number> {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const points = new Map<string, number>();

  // `next` is the first weigh-in after the day being looked at.
  let next = 0;
  for (const date of dates) {
    while (next < sorted.length && sorted[next].date <= date) next++;

    const before = sorted[next - 1];
    const after = sorted[next];
    if (before === undefined || after === undefined || before.date === date) continue;

    const share = daysBetween(before.date, date) / daysBetween(before.date, after.date);
    points.set(date, before.value + (after.value - before.value) * share);
  }

  return points;
}

export type WeightAxis = { low: number; high: number; ticks: number[] };

// The weight axis: tight around what's drawn, padded about a kilo each side and
// on whole kilos — weights of 78–82 give an axis of 77–83, and 79.2–81.5 gives
// 78–83. A number up the side at every kilo, or every 2, 5 or 10 when the range
// is too wide for that.
export function weightAxis(values: number[]): WeightAxis | null {
  if (values.length === 0) return null;

  // Rounded to the column's two decimals first, so an average that comes out as
  // 80.000000001 doesn't push the axis up a whole extra kilo.
  const rounded = values.map((value) => Math.round(value * 100) / 100);
  const low = Math.floor(Math.min(...rounded)) - 1;
  const high = Math.ceil(Math.max(...rounded)) + 1;

  const span = high - low;
  const step = span <= 8 ? 1 : span <= 16 ? 2 : span <= 40 ? 5 : 10;

  const ticks: number[] = [];
  for (let value = Math.ceil(low / step) * step; value <= high; value += step) ticks.push(value);

  return { low, high, ticks };
}

// How far the 7-day average weight is from the goal, and which words go with it.
//
//   to     still heading for it: above it on a cut, below it on a bulk
//   past   gone beyond it: below it on a cut, above it on a bulk
//   above  / below — on maintain, or with no goal phase picked, where neither
//          direction is "towards"
//   at     within 0.05 kg, which rounds to nothing
export type GoalDistance = { kind: "to" | "past" | "above" | "below"; kg: number } | { kind: "at" };

export function goalDistance(average: number, goal: number, phase: GoalPhase | null): GoalDistance {
  const kg = Math.round(Math.abs(average - goal) * 10) / 10;
  if (kg === 0) return { kind: "at" };

  const above = average > goal;
  if (phase === "cut") return { kind: above ? "to" : "past", kg };
  if (phase === "bulk") return { kind: above ? "past" : "to", kg };
  return { kind: above ? "above" : "below", kg };
}

// The difference from the weigh-in before, as the list writes it: "+0.3",
// "−0.4", "0.0". Null for the first weigh-in ever.
export function weightChange(kg: number, previous: number | undefined): string | null {
  if (previous === undefined) return null;
  // In whole hundredths first — weights are stored to two decimals — so 80.06
  // − 80.01 is exactly 5 hundredths rather than 0.0499999, and then to tenths,
  // halves away from zero the same way up and down: +0.05 is +0.1, −0.05 is −0.1.
  const hundredths = Math.round((kg - previous) * 100);
  const difference = (Math.sign(hundredths) * Math.round(Math.abs(hundredths) / 10)) / 10;
  if (difference === 0) return "0.0";
  return difference > 0 ? `+${difference.toFixed(1)}` : `−${Math.abs(difference).toFixed(1)}`;
}
