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
import type { MealEntry } from "@/lib/meals";
import type { Targets } from "@/lib/settings";
import { periodOf, type Night } from "@/lib/sleep";
import { calorieKind, fatSplit, judge, type Kind } from "@/lib/targets";

// One day of eating, as the stats read it (lib/meals.ts fills these in).
export type StatsDay = {
  date: string;
  nutrition: Nutrition;
  cost: number;
  meals: number;
  snacks: number;
  entries: MealEntry[];
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

// ---------------------------------------------------------------------------
// Meals against snacks
// ---------------------------------------------------------------------------
//
// Averages here are per meal, not per day: "the average snack" is every snack
// in the range added up and divided by how many there were. Only days with food
// logged are counted, the same as everywhere else in this section.

export type Side = {
  count: number;
  // Per meal (or per snack). Null when there were none.
  calories: number | null;
  protein: number | null;
  fibre: number | null;
  sugar: number | null;
  cost: number | null;
  // Grams of protein for each leu spent. Null when they cost nothing.
  proteinPerLeu: number | null;
  // Over the ones that were given a score, which is optional.
  score: number | null;
  scored: number;
  // Totals, for the share bars.
  calorieTotal: number;
  costTotal: number;
  sugarTotal: number;
};

export type Comparison = { meals: Side; snacks: Side };

function sideOf(entries: MealEntry[]): Side {
  const count = entries.length;
  const sum = (of: (entry: MealEntry) => number) =>
    entries.reduce((total, entry) => total + of(entry), 0);

  const calorieTotal = sum((entry) => entry.nutrition.calories);
  const costTotal = sum((entry) => entry.cost);
  const sugarTotal = sum((entry) => entry.nutrition.sugars_added);
  const proteinTotal = sum((entry) => entry.nutrition.protein);

  const scores = entries.flatMap((entry) => (entry.score === null ? [] : [entry.score]));
  const per = (total: number) => (count === 0 ? null : total / count);

  return {
    count,
    calories: per(calorieTotal),
    protein: per(proteinTotal),
    fibre: per(sum((entry) => entry.nutrition.fibre)),
    sugar: per(sugarTotal),
    cost: per(costTotal),
    proteinPerLeu: costTotal > 0 ? proteinTotal / costTotal : null,
    score: scores.length === 0 ? null : scores.reduce((a, b) => a + b, 0) / scores.length,
    scored: scores.length,
    calorieTotal,
    costTotal,
    sugarTotal,
  };
}

export function compare(days: StatsDay[]): Comparison {
  const entries = days.filter(isLogged).flatMap((day) => day.entries);

  return {
    meals: sideOf(entries.filter((entry) => entry.type === "meal")),
    snacks: sideOf(entries.filter((entry) => entry.type === "snack")),
  };
}

// The meals' share of a total, 0 to 100. Null when there's nothing to share
// out — no calories at all, say.
export function shareOfMeals(meals: number, snacks: number): number | null {
  const total = meals + snacks;
  return total > 0 ? (meals / total) * 100 : null;
}

// ---------------------------------------------------------------------------
// Days on target
// ---------------------------------------------------------------------------

export type TargetRow = {
  key: string;
  label: string;
  // The nutrient's colour, as a Tailwind class.
  colour: string;
  // One per day in the range: true hit, false missed, null not logged. A day
  // that wasn't logged is neither, and doesn't count towards the total.
  days: Array<boolean | null>;
  hit: number;
  counted: number;
};

// Every target that is set, measured day by day. A target that isn't set has no
// row at all — there is nothing to be on or off.
export function daysOnTarget(
  dates: string[],
  byDate: Map<string, StatsDay>,
  targets: Targets,
): TargetRow[] {
  const calories = calorieKind(targets.goal_phase);

  // A target that isn't set can't be hit or missed. `judge` says so by
  // answering null — and `!judge(…)?.red` would quietly turn that into a hit,
  // which is how an unset target once scored full marks every day.
  const by = (value: number, target: number | null, kind: Kind): boolean | null => {
    const judgement = judge(value, target, kind, true);
    return judgement === null ? null : !judgement.red;
  };

  const rows: Array<{
    key: string;
    label: string;
    colour: string;
    hits: (day: StatsDay) => boolean | null;
  }> = [
    {
      key: "calories",
      label: "Calories",
      colour: "text-muted",
      // With no goal picked there's no rule to measure calories by, so they
      // aren't measured at all — the same as on Today.
      hits: (day) =>
        calories === null ? null : by(day.nutrition.calories, targets.calorie_target, calories),
    },
    {
      key: "spend",
      label: "Spend",
      colour: "text-muted",
      hits: (day) => by(day.cost, targets.daily_budget, "ceiling"),
    },
    {
      key: "protein",
      label: "Protein",
      colour: "text-protein",
      hits: (day) => by(day.nutrition.protein, targets.protein_target, "zone"),
    },
    {
      key: "carbs",
      label: "Carbs",
      colour: "text-carbs",
      hits: (day) => by(day.nutrition.carbs, targets.carbs_target, "zone"),
    },
    {
      key: "sugar",
      label: "Added sugar",
      colour: "text-added-sugar",
      hits: (day) => by(day.nutrition.sugars_added, targets.added_sugar_max, "ceiling"),
    },
    {
      key: "fibre",
      label: "Fibre",
      colour: "text-fibre",
      hits: (day) => by(day.nutrition.fibre, targets.fibre_target, "zone"),
    },
    {
      key: "fat",
      label: "Fat",
      colour: "text-fat",
      hits: (day) => by(day.nutrition.fat, targets.fat_target, "zone"),
    },
    {
      key: "ratio",
      label: "Fat ratio",
      colour: "text-fat",
      hits: (day) =>
        targets.unsat_per_sat === null || targets.unsat_per_sat <= 0
          ? null
          : !fatSplit(day.nutrition.fat, day.nutrition.saturated_fat, targets.unsat_per_sat).over,
    },
  ];

  return rows.flatMap((row) => {
    // `judge` answers null for a target that isn't set, which `!null` would
    // turn into a hit. A row is only kept when some day could actually be
    // measured.
    const measured = dates.some((date) => {
      const day = byDate.get(date);
      return day !== undefined && isLogged(day) && row.hits(day) !== null;
    });

    if (!measured) return [];

    const days = dates.map((date) => {
      const day = byDate.get(date);
      if (day === undefined || !isLogged(day)) return null;
      return row.hits(day);
    });

    const counted = days.filter((hit) => hit !== null).length;

    return [
      {
        key: row.key,
        label: row.label,
        colour: row.colour,
        days,
        hit: days.filter((hit) => hit === true).length,
        counted,
      },
    ];
  });
}

// How many of the day's targets were hit, for the row under the grid. Null on a
// day that wasn't logged.
export function targetsHit(rows: TargetRow[], index: number): number | null {
  if (rows.length === 0 || rows[0].days[index] === null) return null;
  return rows.filter((row) => row.days[index] === true).length;
}

// How much the daily figures move about: the standard deviation over the days
// with food logged, written as "±391 kcal". Two days at least, or there's
// nothing to spread.
export function swing(values: number[]): number | null {
  if (values.length < 2) return null;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squares = values.reduce((total, value) => total + (value - mean) ** 2, 0);

  // Divided by one less than the count, as the mockup works it out: these days
  // are a sample of how the eating goes, not the whole of it.
  return Math.sqrt(squares / (values.length - 1));
}
