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
  type MealLine,
  type Nutrition,
} from "@/lib/nutrition";

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

// Low protein: protein supplies under 10% of the food's calories, counting
// protein at 4 kcal a gram — the definition the Products and Recipes lists use
// too, from step 7.7. Something with no protein at all is always low in it,
// even with no calories to compare against: diet drinks, salt, spices.
export function isLowProtein(nutrition: Nutrition): boolean {
  return nutrition.protein <= 0 || nutrition.protein * 4 < nutrition.calories * 0.1;
}

// Every food in these lines, with its lines added together.
export function sourceItems(lines: Array<{ href: string; name: string; line: MealLine }>): SourceItem[] {
  const byKey = new Map<string, SourceItem>();

  for (const { href, name, line } of lines) {
    const item = byKey.get(href) ?? { key: href, name, nutrition: emptyNutrition(), cost: 0 };
    item.nutrition = addNutrition(item.nutrition, mealLineNutrition(line));
    item.cost += mealLineCost(line);
    byKey.set(href, item);
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
        lowProtein: metric === "cost" && share >= TAG_SHARE && isLowProtein(item.nutrition),
      };
    })
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));

  return { total, sources };
}
