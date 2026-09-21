// Milestones: the small card that appears on a tab when something worth
// noticing has just happened.
//
// Pure, like the rest of lib/, and nothing is stored. A milestone is worked out
// from what's logged, every time the screen is drawn, which means there is no
// record of what has already fired — so each one is defined as an **event with
// a date**, and shows for the week after it happened. One rule for all of them,
// nothing to reconcile, and nothing that can go stale.
//
// Three rules the plan sets, which these follow:
//
//   * Never about a missed target. The streak is on logging and never on
//     hitting a number, and milestones stay on the same side of that line:
//     they are about weight, cigarettes and sleep, never about whether a day
//     was "good".
//   * Nothing fires until there are four weeks of that kind of log. In the
//     first weeks every day is a record, and a card that appears every morning
//     is wallpaper.
//   * No badges, points or levels. One line of plain text.

import { daysBetween, shiftDays } from "@/lib/day";
import { averageOver, type DayValue } from "@/lib/series";
import { minutesAsleep, type Night } from "@/lib/sleep";

export type Milestone = { key: string; text: string };

// How long a milestone stays on screen after the day it happened.
const SHOWS_FOR = 7;

// How much history there has to be before anything fires at all.
const MIN_HISTORY = 28;

// "Three months", for the weight milestone.
const QUARTER = 90;

// The window every one of these is measured over.
const WEEK = 7;

const sorted = (dates: string[]) => [...new Set(dates)].sort();

// The days in the last week that could have set something off, newest first.
function recent(dates: string[], today: string): string[] {
  return sorted(dates)
    .filter((date) => date <= today && daysBetween(date, today) < SHOWS_FOR)
    .reverse();
}

function enoughHistory(dates: string[], today: string): boolean {
  const all = sorted(dates);
  return all.length > 0 && daysBetween(all[0], today) >= MIN_HISTORY;
}

// A weight rounded for showing: "78.4 kg".
const kg = (value: number) => `${Math.round(value * 10) / 10} kg`;

// ---------------------------------------------------------------------------
// Weight
// ---------------------------------------------------------------------------
//
// Everything here goes by the 7-day average rather than a single weigh-in, the
// same figure the goal line uses — one dehydrated morning shouldn't set off a
// record.

export function weightMilestone(rows: DayValue[], today: string): Milestone | null {
  const dates = rows.map((row) => row.date);
  if (!enoughHistory(dates, today)) return null;

  const average = (date: string) => averageOver(rows, date, WEEK)?.average ?? null;
  const all = sorted(dates);
  const wholeHistory = daysBetween(all[0], today) >= QUARTER;

  for (const date of recent(dates, today)) {
    const now = average(date);
    if (now === null) continue;

    const earlier = all.filter((other) => other < date);
    const lower = (from: string) =>
      earlier
        .filter((other) => other >= from)
        .every((other) => {
          const was = average(other);
          return was === null || was > now;
        });

    // The strongest one that's true, and only one of them.
    if (wholeHistory && lower(all[0])) {
      return { key: "lowest-ever", text: `Lowest since you started · ${kg(now)}` };
    }

    if (lower(shiftDays(date, -QUARTER))) {
      return { key: "lowest-quarter", text: `Lowest in three months · ${kg(now)}` };
    }

    // Passing another whole kilo below the highest you've been. It counts as
    // having happened on this day only if the weigh-in before it hadn't got
    // there yet.
    const highest = Math.max(
      ...all
        .filter((other) => other <= date)
        .flatMap((other) => {
          const was = average(other);
          return was === null ? [] : [was];
        }),
    );

    const before = earlier[earlier.length - 1];
    const previous = before === undefined ? null : average(before);
    const down = Math.floor(highest - now);

    if (previous !== null && down >= 1 && down > Math.floor(highest - previous)) {
      return { key: "kilo", text: `${down} kg below your highest` };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Smoking
// ---------------------------------------------------------------------------
//
// A week's total, not an average: "under 40 in a week" is the thing worth
// knowing. A total only compares with another total when both weeks are fully
// logged, so a week with a gap in it is skipped rather than flattered.

function weekTotal(byDate: Map<string, number>, end: string): number | null {
  let total = 0;

  for (let back = 0; back < WEEK; back += 1) {
    const count = byDate.get(shiftDays(end, -back));
    if (count === undefined) return null;
    total += count;
  }

  return total;
}

export function smokingMilestone(rows: DayValue[], today: string): Milestone | null {
  const dates = rows.map((row) => row.date);
  if (!enoughHistory(dates, today)) return null;

  const byDate = new Map(rows.map((row) => [row.date, row.value]));
  const all = sorted(dates);

  for (const date of recent(dates, today)) {
    // A day with none at all, and whether any earlier day was one too.
    const none = byDate.get(date) === 0;
    const noneBefore = none
      ? all.filter((other) => other < date && byDate.get(other) === 0).length
      : 0;

    // The first day ever without a cigarette outranks a record week — it is
    // the rarer thing to have happened, and the two usually come together.
    if (none && noneBefore === 0) {
      return { key: "first-none", text: "First day with none" };
    }

    const total = weekTotal(byDate, date);

    if (total !== null) {
      const earlier = all.filter((other) => other < date);
      const best = earlier.every((other) => {
        const was = weekTotal(byDate, other);
        return was === null || was > total;
      });

      if (best) {
        return {
          key: "best-week",
          text: `Your lowest week yet · ${total.toLocaleString("en-GB")} cigarettes`,
        };
      }
    }

    if (none) {
      const month = all.filter(
        (other) => other.slice(0, 7) === date.slice(0, 7) && byDate.get(other) === 0,
      ).length;

      if (month >= 2) {
        return { key: "none-this-month", text: `${month} days with none this month` };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Sleep
// ---------------------------------------------------------------------------
//
// An average, not a total, so a week with a gap still compares fairly — but
// not a week that's mostly gaps.

const TIMED_NIGHTS = 5;

function weekSleep(byDate: Map<string, number>, end: string): number | null {
  const lengths: number[] = [];

  for (let back = 0; back < WEEK; back += 1) {
    const minutes = byDate.get(shiftDays(end, -back));
    if (minutes !== undefined) lengths.push(minutes);
  }

  if (lengths.length < TIMED_NIGHTS) return null;

  return lengths.reduce((a, b) => a + b, 0) / lengths.length;
}

// "7 h 40 a night".
function perNight(minutes: number): string {
  const whole = Math.round(minutes);
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;

  return rest === 0 ? `${hours} h a night` : `${hours} h ${String(rest).padStart(2, "0")} a night`;
}

export function sleepMilestone(nights: Night[], today: string): Milestone | null {
  const timed = nights.flatMap((night) => {
    const minutes = minutesAsleep(night.bedtime, night.wake_time);
    return minutes === null ? [] : [{ date: night.date, minutes }];
  });

  const dates = nights.map((night) => night.date);
  if (!enoughHistory(dates, today) || timed.length === 0) return null;

  const byDate = new Map(timed.map((night) => [night.date, night.minutes]));
  const all = sorted(timed.map((night) => night.date));

  for (const date of recent(dates, today)) {
    const week = weekSleep(byDate, date);
    if (week === null) continue;

    const best = all
      .filter((other) => other < date)
      .every((other) => {
        const was = weekSleep(byDate, other);
        return was === null || was < week;
      });

    if (best) {
      return { key: "best-sleep", text: `Your best week of sleep · ${perNight(week)}` };
    }
  }

  return null;
}
