// The arithmetic behind the charts: the days along the bottom, the moving
// averages, where the numbers go on each axis.
//
// Pure, like the rest of lib/. The charts themselves are drawn by hand as SVG
// (see the chart screens); everything here is what decides where things go, so
// it can be checked on its own.

import { shiftDays } from "@/lib/day";
import { averageOver, type DayValue } from "@/lib/series";

// Every day from `from` to `to`, both included.
export function datesFrom(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let date = from; date <= to; date = shiftDays(date, 1)) dates.push(date);
  return dates;
}

// A moving average for each day: the mean of the entries in the `window` days
// ending that day, counting only the days that have one (lib/series.ts). Null
// where the window has none.
//
// It reaches back before the first day shown when there are entries there, so
// the lines start where the chart does rather than a week in.
export function movingAverage(entries: DayValue[], dates: string[], window: number): Array<number | null> {
  return dates.map((date) => averageOver(entries, date, window)?.average ?? null);
}

// A line through the days that have a value (a moving average), as SVG point
// lists — one per unbroken run, so a day with nothing to draw breaks the line.
// A run of one day is left out: a line needs two points.
export function lineRuns(
  values: Array<number | null>,
  x: (index: number) => number,
  y: (value: number) => number,
): string[] {
  const runs: string[] = [];
  let run: string[] = [];
  values.forEach((value, index) => {
    if (value === null) {
      if (run.length > 1) runs.push(run.join(" "));
      run = [];
    } else {
      run.push(`${x(index).toFixed(1)},${y(value).toFixed(1)}`);
    }
  });
  if (run.length > 1) runs.push(run.join(" "));
  return runs;
}

// The numbers up the side of a chart that runs from 0 to exactly `max`: 0, a
// few round steps, and `max` itself — 0 · 5 · 10 · 13. A round step within the
// top eighth of the axis is dropped, so its label doesn't sit on top of `max`'s.
export function countTicks(max: number): number[] {
  if (max <= 0) return [0];

  const step = max <= 5 ? 1 : max <= 10 ? 2 : max <= 25 ? 5 : max <= 50 ? 10 : max <= 125 ? 25 : 50;

  const ticks: number[] = [];
  for (let value = 0; value < max; value += step) {
    if (value === 0 || (max - value) / max >= 0.125) ticks.push(value);
  }
  ticks.push(max);

  return ticks;
}

// Which days get a date written under them, when there are too many to label
// them all: the first, then every so many — 2 or 3 days, a week, a fortnight,
// four weeks, and so on — and the last. If the last would land too close to the
// one before, it takes that one's place.
export function labelIndexes(count: number, most: number): number[] {
  if (count <= 0) return [];
  if (count <= most) return Array.from({ length: count }, (_, index) => index);

  const steps = [2, 3, 7, 14, 28, 56, 91, 182, 364, 728];
  const step = steps.find((candidate) => count / candidate <= most - 1) ?? Math.ceil(count / (most - 1));

  const indexes: number[] = [];
  for (let index = 0; index < count; index += step) indexes.push(index);

  const last = count - 1;
  if (indexes[indexes.length - 1] !== last) {
    if (last - indexes[indexes.length - 1] < step / 2) indexes[indexes.length - 1] = last;
    else indexes.push(last);
  }

  return indexes;
}
