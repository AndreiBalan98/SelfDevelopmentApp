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

// The unbroken runs of days that have a value, as lists of positions: [1, 2, null,
// 4] gives [[0, 1], [3]]. For shading between two lines, which stops where
// they do.
export function runsOf(values: Array<number | null>): number[][] {
  const runs: number[][] = [];
  let run: number[] = [];
  values.forEach((value, index) => {
    if (value === null) {
      if (run.length > 0) runs.push(run);
      run = [];
    } else {
      run.push(index);
    }
  });
  if (run.length > 0) runs.push(run);
  return runs;
}

// A time-of-day axis that runs on across midnight, for minutes on one
// continuous line (lib/sleep.ts): from the whole two hours below the earliest
// time to the whole two hours above the latest, with at least a quarter of an
// hour's room at each end — times of 23:30 to 09:30 give an axis of 22:00 to
// 10:00. A label every two hours, or every three or four when the axis is too
// long for that.
export function timeAxis(values: number[]): { low: number; high: number; ticks: number[] } | null {
  if (values.length === 0) return null;

  const low = Math.floor((Math.min(...values) - 15) / 120) * 120;
  const high = Math.ceil((Math.max(...values) + 15) / 120) * 120;

  const hours = (high - low) / 60;
  const step = (hours <= 16 ? 2 : hours <= 24 ? 3 : 4) * 60;

  const ticks: number[] = [];
  for (let minute = Math.ceil(low / step) * step; minute <= high; minute += step) ticks.push(minute);

  return { low, high, ticks };
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

// A bar chart's axis: zero up to a round number that everything fits under —
// the tallest day, and the target or the top of its zone. Three numbers up the
// side, as the mockups draw them: nothing, half way, and the top.
//
// Unlike the Smoking chart, which stops at exactly the highest count because
// that number is the point, these bars are read against a target, so the axis
// is a round number with the target comfortably on it.
export function barAxis(highest: number): { max: number; ticks: number[] } {
  if (!(highest > 0)) return { max: 1, ticks: [0, 0.5, 1] };

  const power = 10 ** Math.floor(Math.log10(highest));
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const max = (steps.find((step) => step * power >= highest) ?? 10) * power;

  return { max, ticks: [0, max / 2, max] };
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
