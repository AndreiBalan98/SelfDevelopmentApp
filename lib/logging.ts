// How completely each day was logged, and the two numbers the calendar
// heatmap shows above it: the logging streak and the days-logged counter.
//
// A day has four logs: that morning's sleep (a night is stored under the day
// you woke up), that day's cigarettes, that day's weigh-in, and at least one
// meal. A day is **logged** only when all four exist — three out of four doesn't
// count, though the calendar still shows it as a fainter dot.
//
// Pure arithmetic on lists of dates: no database, so it can be checked on its
// own (plan, Part 5 → Original phase 7 → Logging streak).

import { shiftDays } from "@/lib/day";

export const ALL_FOUR = 4;

export type LogDates = {
  sleep: string[];
  smoking: string[];
  weight: string[];
  // The day each meal counts towards; many meals share a day.
  meals: string[];
};

// How many of the four logs each date has, for every date that has at least
// one. A date that isn't in the map has none.
export function logCounts(dates: LogDates): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const list of [dates.sleep, dates.smoking, dates.weight, dates.meals]) {
    for (const date of new Set(list)) counts[date] = (counts[date] ?? 0) + 1;
  }

  return counts;
}

const isLogged = (counts: Record<string, number>, date: string) =>
  (counts[date] ?? 0) >= ALL_FOUR;

// The Monday of the calendar week a date falls in. Read at midday UTC so the
// weekday can't slide either side of midnight.
export function mondayOf(date: string): string {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay(); // Sunday is 0
  return shiftDays(date, -((weekday + 6) % 7));
}

// Every logged day up to yesterday. Today is never counted: its cigarettes
// can't be logged until tomorrow. Only ever goes up, unless an entry is deleted.
export function daysLogged(counts: Record<string, number>, today: string): number {
  return Object.keys(counts).filter((date) => date < today && isLogged(counts, date)).length;
}

// The logging streak: logged days in a row, counting back from yesterday, where
// one missed day in a Monday–Sunday week is forgiven and a second one in the
// same week ends it. The streak is on logging, never on hitting targets.
//
// Two details:
// - A forgiven day keeps the streak going but doesn't add to it: "11 days"
//   means eleven days with all four logs.
// - Yesterday isn't held against you until today is over. Its cigarettes are
//   logged this morning, so until then it's still open — not counted, and not a
//   miss either. Otherwise the streak would break every morning before the
//   smoking log went in.
export function streak(counts: Record<string, number>, today: string): number {
  const logged = Object.keys(counts).filter((date) => isLogged(counts, date)).sort();
  if (logged.length === 0) return 0;
  const first = logged[0];

  let day = shiftDays(today, -1);
  if (!isLogged(counts, day)) day = shiftDays(day, -1);

  let length = 0;
  const forgiven = new Set<string>();

  while (day >= first) {
    if (isLogged(counts, day)) {
      length += 1;
    } else {
      const week = mondayOf(day);
      if (forgiven.has(week)) break;
      forgiven.add(week);
    }
    day = shiftDays(day, -1);
  }

  return length;
}

// The days of a month laid out Monday-first: how many blank cells come before
// the 1st, then every date in it.
export function monthGrid(month: string): { blanks: number; days: string[] } {
  const [year, number] = month.split("-").map(Number);
  const length = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const days = Array.from(
    { length },
    (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`,
  );
  const blanks = (new Date(`${days[0]}T12:00:00Z`).getUTCDay() + 6) % 7;

  return { blanks, days };
}

// The month before or after, as "2026-09".
export function shiftMonth(month: string, by: number): string {
  const [year, number] = month.split("-").map(Number);
  const moved = new Date(Date.UTC(year, number - 1 + by, 1));
  return `${moved.getUTCFullYear()}-${String(moved.getUTCMonth() + 1).padStart(2, "0")}`;
}

// "September 2026", from a month ("2026-09") — the calendar's heading. The
// month on its own, from a date, is monthName in lib/day.ts.
export function monthAndYear(month: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-15T12:00:00Z`));
}
