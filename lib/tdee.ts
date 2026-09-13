// The TDEE estimate: how many calories a day you actually burn, worked out from
// what you ate and what your weight did — the reason the app exists — and the
// formula estimate it's compared against.
//
// Pure, like the rest of lib/. The screen reads the rows (app/(tabs)/weight/
// tdee.tsx); everything that decides the number is here, so it can be checked
// on its own.
//
// The method (plan, Part 5 → Nutrition → Weight → TDEE estimate):
//
//   A day of data is a day with a weigh-in and food logged. The window is the
//   latest 28 of them, reaching back past days you missed, and everything
//   inside it counts: every weigh-in, every day with food.
//
//   Weight change is the slope of a straight trend line through every real
//   weigh-in in the window, in kg a day — never single readings, never the
//   invented points on the chart. The weigh-ins run to this morning, one
//   morning past the food: this morning's weight is what yesterday's eating did.
//
//   Intake is the average calories over the window's days with food logged,
//   up to yesterday. Today isn't over.
//
//   TDEE = intake − slope × 7700. Losing weight makes the slope negative, which
//   puts TDEE above intake — the right way round (the original plan had it
//   backwards).
//
//   The ± is one standard error of the slope, times 7700: about a 2-in-3 chance
//   the real figure is inside it.

import { daysBetween } from "@/lib/day";
import type { DayValue } from "@/lib/series";
import type { ActivityLevel, Sex } from "@/lib/types";

// Roughly the calories in a kilo of body weight.
export const KCAL_PER_KG = 7700;

// How many days of data the window holds at most, and how many it needs
// before there's anything to show.
export const WINDOW_DAYS = 28;
export const FIRST_DAYS = 7;

export type Accuracy = "Rough" | "Fair" | "Reliable";

export function accuracy(days: number): Accuracy {
  return days >= 28 ? "Reliable" : days >= 14 ? "Fair" : "Rough";
}

// The days of data up to `end` (yesterday), newest first: a weigh-in that day,
// and food that adds up to more than nothing. An empty meal left by a mis-tap
// isn't food logged.
export function dataDays(weighedOn: Iterable<string>, intake: Map<string, number>, end: string): string[] {
  const days: string[] = [];
  for (const date of new Set(weighedOn)) {
    if (date <= end && (intake.get(date) ?? 0) > 0) days.push(date);
  }
  return days.sort().reverse();
}

// The first day of the window: the oldest of the latest 28 days of data, or of
// all of them while there are fewer. Null with none at all.
export function windowStart(days: string[]): string | null {
  if (days.length === 0) return null;
  return days[Math.min(WINDOW_DAYS, days.length) - 1];
}

export type Trend = {
  // kg a day; negative when losing.
  slope: number;
  // One standard error of that slope.
  error: number;
  weighIns: number;
};

// A straight line through the weigh-ins by least squares. Null with fewer than
// three: two make a line, but its uncertainty needs a third.
export function trend(points: DayValue[], from: string): Trend | null {
  if (points.length < 3) return null;

  const xs = points.map((point) => daysBetween(from, point.date));
  const ys = points.map((point) => point.value);
  const n = points.length;
  const meanX = xs.reduce((sum, x) => sum + x, 0) / n;
  const meanY = ys.reduce((sum, y) => sum + y, 0) / n;

  let sxx = 0;
  let sxy = 0;
  xs.forEach((x, index) => {
    sxx += (x - meanX) ** 2;
    sxy += (x - meanX) * (ys[index] - meanY);
  });
  // Every weigh-in on the same day: no line to draw.
  if (sxx === 0) return null;

  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  const leftOver = xs.reduce((sum, x, index) => sum + (ys[index] - (intercept + slope * x)) ** 2, 0);

  return { slope, error: Math.sqrt(leftOver / (n - 2) / sxx), weighIns: n };
}

export type Tdee =
  | {
      ready: false;
      // Days of data so far, and how many more until there's an estimate.
      days: number;
      toGo: number;
    }
  | {
      ready: true;
      days: number;
      accuracy: Accuracy;
      // kcal a day, and the ± around it.
      kcal: number;
      plusMinus: number;
      // What went into it.
      intake: number;
      trend: Trend;
      from: string;
    };

// The estimate from every weigh-in up to this morning and the calories of each
// day with food logged up to yesterday. `intake` may hold only the days the
// window could reach; anything outside the window is ignored.
export function estimateTdee(input: {
  weights: DayValue[];
  intake: Map<string, number>;
  // Yesterday: the last day whose food counts.
  end: string;
  // Today: the last morning whose weigh-in counts.
  today: string;
}): Tdee {
  const { weights, intake, end, today } = input;

  const days = dataDays(
    weights.map((weight) => weight.date),
    intake,
    end,
  );
  const from = windowStart(days);
  const counted = Math.min(days.length, WINDOW_DAYS);

  if (from === null || counted < FIRST_DAYS) {
    return { ready: false, days: counted, toGo: FIRST_DAYS - counted };
  }

  const line = trend(
    weights.filter((weight) => weight.date >= from && weight.date <= today),
    from,
  );
  // Seven days of data always means seven weigh-ins on different days, so the
  // line is always there; this only keeps the arithmetic safe.
  if (line === null) return { ready: false, days: counted, toGo: 0 };

  const eaten = [...intake].filter(([date, kcal]) => date >= from && date <= end && kcal > 0);
  const average = eaten.reduce((sum, [, kcal]) => sum + kcal, 0) / eaten.length;

  return {
    ready: true,
    days: counted,
    accuracy: accuracy(counted),
    kcal: average - line.slope * KCAL_PER_KG,
    plusMinus: line.error * KCAL_PER_KG,
    intake: average,
    trend: line,
    from,
  };
}

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
};

// The Mifflin–St Jeor estimate: resting calories from weight, height, age and
// sex, times the activity level. Age is this year minus the birth year, so it
// can be a year high before your birthday — about 5 kcal.
export function formulaEstimate(body: {
  kg: number;
  heightCm: number;
  birthYear: number;
  thisYear: number;
  sex: Sex;
  activity: ActivityLevel;
}): number {
  const age = body.thisYear - body.birthYear;
  const resting = 10 * body.kg + 6.25 * body.heightCm - 5 * age + (body.sex === "male" ? 5 : -161);
  return resting * ACTIVITY_FACTORS[body.activity];
}
