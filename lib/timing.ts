// When the eating happens: the timing card's arithmetic.
//
// Pure, like the rest of lib/. Everything here is laid out on a day that runs
// from 04:00 to 04:00 — the same boundary the whole app uses — so a meal at
// 02:00 sits at the far end of its own day rather than at the beginning of the
// next one, and nothing has to wrap around in the middle.
//
// Minutes are counted from 04:00 (lib/day.ts turns a timestamp into one):
// 04:00 is 0, 13:30 is 570, 02:00 is 1,320.
//
// Two things this deliberately does not do:
//
//   * It doesn't try to tell a backfilled meal from a real one. A meal logged
//     for a past day is saved at midday, and this takes that time as it stands
//     (plan, Part 5). Andrei rarely backfills meals.
//   * It doesn't count days with no food logged, the same rule the rest of the
//     stats follow.

import { minutesIntoDayOf } from "@/lib/day";
import { periodOf, type Night } from "@/lib/sleep";
import { isLogged, type StatsDay } from "@/lib/stats";

const DAY = 24 * 60;

// Anything eaten from 01:00 onwards is in the small hours — which, by the
// 04:00 rule, is still the same day, right at the end of it.
export const LATE = minutesIntoDayOf("01:00") as number;

export type Spread = { average: number; shortest: number; longest: number; days: number };

export type Timing = {
  // How many days had food with a time on it.
  days: number;
  // Positions on the 04:00 → 04:00 day, averaged over those days.
  firstFood: number | null;
  lastFood: number | null;
  // How long between the two, averaged.
  window: number | null;
  // Waking up to the first thing eaten, for the days that have both.
  wakeToFirst: Spread | null;
  // What was eaten from 01:00 onwards, over the whole range.
  lateNight: { meals: number; calories: number };
  // The average day's protein in each of the 24 hours, from 04:00.
  proteinByHour: number[];
  // The average night, as two positions on the same day. Null when no night in
  // the range has both its times.
  sleep: { bed: number; wake: number } | null;
};

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

export function timingOf(days: StatsDay[], nights: Night[]): Timing {
  const logged = days.filter(isLogged);

  // A day's eating, as the first and last minute anything was eaten.
  const eating = logged.flatMap((day) => {
    const minutes = day.entries
      .filter((entry) => entry.nutrition.calories > 0)
      .map((entry) => entry.minute);

    if (minutes.length === 0) return [];

    return [{ date: day.date, first: Math.min(...minutes), last: Math.max(...minutes) }];
  });

  // Waking up against the first thing eaten. Only days with both count, and a
  // night is stored under the date you woke up — which is the day itself.
  const wakeBy = new Map(
    nights.flatMap((night) => {
      const wake = night.wake_time === null ? null : minutesIntoDayOf(night.wake_time);
      return wake === null ? [] : [[night.date, wake] as const];
    }),
  );

  const gaps = eating.flatMap((day) => {
    const wake = wakeBy.get(day.date);
    // A first meal before you got up is a mistyped time, not a negative gap.
    return wake === undefined || day.first < wake ? [] : [day.first - wake];
  });

  const late = logged
    .flatMap((day) => day.entries)
    .filter((entry) => entry.minute >= LATE && entry.nutrition.calories > 0);

  // Protein hour by hour, spread over the days that were logged rather than
  // over the days that happened to have something in that hour — an empty
  // afternoon is the thing this is meant to show.
  const proteinByHour = Array.from({ length: 24 }, () => 0);
  for (const day of logged) {
    for (const entry of day.entries) {
      proteinByHour[Math.floor(entry.minute / 60)] += entry.nutrition.protein;
    }
  }

  const period = periodOf(nights);

  // periodOf counts from the noon before, so that nights either side of
  // midnight average properly. Bring each average back to a time of day, then
  // onto this card's 04:00 day.
  const onDay = (minute: number) => (((Math.round(minute) % DAY) + DAY) % DAY + DAY - 4 * 60) % DAY;

  return {
    days: eating.length,
    firstFood: eating.length === 0 ? null : mean(eating.map((day) => day.first)),
    lastFood: eating.length === 0 ? null : mean(eating.map((day) => day.last)),
    window: eating.length === 0 ? null : mean(eating.map((day) => day.last - day.first)),
    wakeToFirst:
      gaps.length === 0
        ? null
        : {
            average: mean(gaps),
            shortest: Math.min(...gaps),
            longest: Math.max(...gaps),
            days: gaps.length,
          },
    lateNight: {
      meals: late.length,
      calories: late.reduce((total, entry) => total + entry.nutrition.calories, 0),
    },
    proteinByHour:
      logged.length === 0
        ? proteinByHour
        : proteinByHour.map((total) => total / logged.length),
    sleep:
      period.bed === null || period.wake === null
        ? null
        : { bed: onDay(period.bed.average), wake: onDay(period.wake.average) },
  };
}
