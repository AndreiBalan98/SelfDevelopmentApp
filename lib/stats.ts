// The Nutrition stats section's arithmetic: the averages over a range, the
// weekly digest, and the month's food spend.
//
// Pure, like the rest of lib/: it takes rows and returns numbers, and never
// touches the database.
//
// Two honesty rules from the plan live here, and they are the whole reason this
// is a file of its own rather than a few sums on a screen:
//
//   * A day with no food logged is left out entirely — of every average, and of
//     the count those averages are said to be over. A forgotten day is a day not
//     logged, not a day of eating nothing; counting it as zero would drag every
//     average down and make a missed day look like a good one. "Food logged"
//     means more than 0 kcal, the same rule the TDEE estimate uses, so a day
//     holding only an empty meal doesn't count either.
//   * Complete days only. The caller passes days ending yesterday; today's
//     half-finished numbers are already live at the top of the same screen.
//
// Totals are different from averages: a sum over a range is the same whether or
// not the empty days are in it, so the month's spend simply adds up what was
// spent.

import type { DayValue } from "@/lib/series";
import { addNutrition, divideNutrition, emptyNutrition, type Nutrition } from "@/lib/nutrition";
import { periodOf, type Night } from "@/lib/sleep";

// One day of eating, as the stats read it (lib/meals.ts fills these in).
export type StatsDay = {
  date: string;
  nutrition: Nutrition;
  cost: number;
  meals: number;
  snacks: number;
};

// A day counts once it has food on it. Calories are required on every product,
// so they are the one figure that is never missing.
export function isLogged(day: StatsDay): boolean {
  return day.nutrition.calories > 0;
}

export type Averages = {
  // How many of the range's days had food logged. Everything below is over
  // these days only.
  logged: number;
  nutrition: Nutrition;
  cost: number;
  meals: number;
  snacks: number;
};

// The average day of the ones that were logged. Null when none of them were,
// which the screen says rather than showing zeroes.
export function averagesOver(days: StatsDay[]): Averages | null {
  const logged = days.filter(isLogged);
  if (logged.length === 0) return null;

  let nutrition = emptyNutrition();
  let cost = 0;
  let meals = 0;
  let snacks = 0;

  for (const day of logged) {
    nutrition = addNutrition(nutrition, day.nutrition);
    cost += day.cost;
    meals += day.meals;
    snacks += day.snacks;
  }

  return {
    logged: logged.length,
    nutrition: divideNutrition(nutrition, logged.length),
    cost: cost / logged.length,
    meals: meals / logged.length,
    snacks: snacks / logged.length,
  };
}

// The weekly digest: the last seven complete days, with the cigarettes compared
// against the seven before them.
//
// "The previous week" is those seven days, not the previous calendar week
// (decided 2026-09-21). Everything else in this section is a rolling window
// ending yesterday, any seven days in a row hold exactly one weekend, and it
// compares two full weeks whatever day the app is opened on.
export type Digest = {
  // The average night in the week, and how many nights it's over. Null when no
  // night in the week has both its times.
  sleep: { minutes: number; nights: number } | null;
  // Cigarettes a day, over the days with an entry, and the change against the
  // week before. The change is null when that week has no entry to compare
  // against.
  cigarettes: { perDay: number; days: number; change: number | null } | null;
  // What the week's food cost, in total.
  spend: number;
  // The average day's calories, over the days with food logged.
  calories: number | null;
  logged: number;
};

export function digestOf(
  days: StatsDay[],
  nights: Night[],
  cigarettes: DayValue[],
  cigarettesBefore: DayValue[],
): Digest {
  const averages = averagesOver(days);
  const period = periodOf(nights);

  const mean = (entries: DayValue[]) =>
    entries.length === 0
      ? null
      : entries.reduce((sum, entry) => sum + entry.value, 0) / entries.length;

  const week = mean(cigarettes);
  const before = mean(cigarettesBefore);

  return {
    sleep: period.minutes === null ? null : { minutes: period.minutes, nights: period.timed },
    cigarettes:
      week === null
        ? null
        : {
            perDay: week,
            days: cigarettes.length,
            change: before === null ? null : week - before,
          },
    spend: days.reduce((sum, day) => sum + day.cost, 0),
    calories: averages?.nutrition.calories ?? null,
    logged: averages?.logged ?? 0,
  };
}

// Food spend this month: a running total that does include today, against the
// daily spend target multiplied by the days in the month. There is deliberately
// no separate monthly budget setting (plan, Part 5).
export type MonthSpend = { spent: number; budget: number | null };

export function monthSpend(
  days: StatsDay[],
  dailyBudget: number | null,
  monthLength: number,
): MonthSpend {
  return {
    spent: days.reduce((sum, day) => sum + day.cost, 0),
    budget: dailyBudget === null || dailyBudget <= 0 ? null : dailyBudget * monthLength,
  };
}
