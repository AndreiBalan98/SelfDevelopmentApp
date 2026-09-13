// What a product or a recipe is worth for the money: lei per 30 g of protein,
// and lei per 1,000 kcal. Shown on every row of the Products and Recipes
// lists, which can be sorted by either.
//
// Pure arithmetic, like the rest of lib/. The numbers don't depend on how much
// is eaten, so they're worked out from any amount at all: 100 of a product's
// own unit, or a recipe's whole pan.
//
// Where a number would be absurd it isn't shown. Honey buys 30 g of protein
// only at the price of ten kilos, and a diet drink's price per 1,000 kcal is
// infinite; those get a label instead and go to the bottom of that sort.

import type { Nutrition } from "@/lib/nutrition";
import { isLowProtein } from "@/lib/sources";

// Under this many kcal per 100 g or ml, an item is "low calorie": salt,
// spices, diet drinks, black coffee.
export const LOW_CALORIE_PER_100 = 20;

export type Value = {
  // Null when the item is low in protein (see isLowProtein in lib/sources.ts).
  perProtein: number | null;
  // Null when the item is low in calories.
  perKcal: number | null;
};

// `weight` is the amount in grams, with 1 ml counted as 1 g — for a recipe,
// its ingredients added up. Nothing to go on (a recipe with no ingredients)
// gives null.
export function valueOf(amount: { cost: number; nutrition: Nutrition; weight: number }): Value | null {
  const { cost, nutrition, weight } = amount;
  if (weight <= 0) return null;

  const lowCalorie = (nutrition.calories / weight) * 100 < LOW_CALORIE_PER_100;

  return {
    // Not low in protein means there is some, so this never divides by zero;
    // likewise the calories below.
    perProtein: isLowProtein(nutrition) ? null : (cost * 30) / nutrition.protein,
    perKcal: lowCalorie ? null : (cost * 1000) / nutrition.calories,
  };
}

export type Sort = "name" | "protein" | "calories";

// A list in the chosen order. "name" leaves it as it came (A–Z from the
// database). The two value sorts put the cheapest first; anything without that
// number — low protein, low calorie, a recipe with no ingredients — goes to the
// bottom, still A–Z among itself. Equal prices keep their A–Z order too.
export function sortByValue<T extends { value: Value | null }>(rows: T[], sort: Sort): T[] {
  if (sort === "name") return rows;

  const key = (row: T) => (sort === "protein" ? row.value?.perProtein : row.value?.perKcal) ?? null;

  const ranked = rows.filter((row) => key(row) !== null);
  const rest = rows.filter((row) => key(row) === null);

  // Array.sort keeps equal items in the order they came, so ties stay A–Z.
  ranked.sort((a, b) => (key(a) as number) - (key(b) as number));

  return [...ranked, ...rest];
}
