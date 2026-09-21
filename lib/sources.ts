// "Where did it come from?" — which foods a number is made of.
//
// Pure arithmetic, like the rest of lib/: it takes meal lines and returns
// numbers, and never touches the database, so the phone can run it too.
//
// A food is whatever the line points at: a product, or a recipe as a whole —
// "Burritos", not its tortillas and beans. Each version of a product is its own
// food, so "oats" and "oats 2" are two rows, as they are stored. The same food
// eaten twice is one row with both amounts added together.

import {
  addNutrition,
  emptyNutrition,
  mealLineCost,
  mealLineNutrition,
  mealLineWeight,
  type MealLine,
  type Nutrition,
} from "@/lib/nutrition";
import { isLowProtein } from "@/lib/value";

// What a panel can be opened for.
export type Metric =
  | "calories"
  | "cost"
  | "protein"
  | "carbs"
  | "sugars_added"
  | "fibre"
  | "fat"
  | "saturated_fat";

// One food, and everything it added up to over the lines that ate it.
export type SourceItem = {
  // Tells two foods apart when their names are the same: "/products/12".
  key: string;
  name: string;
  nutrition: Nutrition;
  cost: number;
  // Grams, 1 ml counted as 1 g: for telling whether it's low calorie, and so
  // low protein.
  weight: number;
};

// One row of a panel.
export type Source = {
  key: string;
  name: string;
  amount: number;
  // Of the panel's total, 0 to 100.
  share: number;
  // Only in the spend panel: 5% or more of the spend, on something low in
  // protein.
  lowProtein: boolean;
};

// The spend panel tags anything taking at least this share of the spend while
// being low in protein.
export const TAG_SHARE = 5;

// Every food in these lines, with its lines added together.
export function sourceItems(lines: Array<{ href: string; name: string; line: MealLine }>): SourceItem[] {
  const byKey = new Map<string, SourceItem>();

  for (const { href, name, line } of lines) {
    const item = byKey.get(href) ?? { key: href, name, nutrition: emptyNutrition(), cost: 0, weight: 0 };
    item.nutrition = addNutrition(item.nutrition, mealLineNutrition(line));
    item.cost += mealLineCost(line);
    item.weight += mealLineWeight(line);
    byKey.set(href, item);
  }

  return [...byKey.values()];
}

// Several days' foods added together, for a panel that covers a range. The
// same food on different days becomes one row, exactly as it does within a
// day.
export function mergeItems(days: SourceItem[][]): SourceItem[] {
  const byKey = new Map<string, SourceItem>();

  for (const items of days) {
    for (const item of items) {
      const found = byKey.get(item.key);

      if (!found) {
        byKey.set(item.key, { ...item, nutrition: { ...item.nutrition } });
        continue;
      }

      found.nutrition = addNutrition(found.nutrition, item.nutrition);
      found.cost += item.cost;
      found.weight += item.weight;
    }
  }

  return [...byKey.values()];
}

function amountOf(item: SourceItem, metric: Metric): number {
  return metric === "cost" ? item.cost : item.nutrition[metric];
}

// A panel's rows, biggest first, and the total they make. Foods that add
// nothing to this number are left out — oats have no added sugar to list.
export function breakdown(items: SourceItem[], metric: Metric): { total: number; sources: Source[] } {
  const found = items
    .map((item) => ({ item, amount: amountOf(item, metric) }))
    .filter(({ amount }) => amount > 0);

  const total = found.reduce((sum, { amount }) => sum + amount, 0);

  const sources = found
    .map(({ item, amount }) => {
      const share = (amount / total) * 100;
      return {
        key: item.key,
        name: item.name,
        amount,
        share,
        lowProtein: metric === "cost" && share >= TAG_SHARE && isLowProtein(item.nutrition, item.weight),
      };
    })
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));

  return { total, sources };
}
