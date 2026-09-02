// All the food arithmetic, in one place.
//
// Every function here is pure: it takes rows and returns numbers, and never
// touches the database. That's deliberate — nothing derived is ever stored, so
// one wrong helper would be wrong on every screen and in every week of history
// at once, and it would look completely fine. Keeping the sums here means they
// can be checked directly, away from any page.
//
// Two rules from the plan live in this file and nowhere else:
//   * 1 ml counts as 1 g when a recipe's raw weight is added up. No densities.
//   * A missing nutrition value is summed as zero. It means "the label didn't
//     say", so a fibre or sugar total can read lower than what was really
//     eaten. Calories are never affected — they're required on every product.

import type { Database } from "@/lib/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

// The nine figures a product carries, in the order an EU label prints them.
export const NUTRIENTS = [
  "calories",
  "fat",
  "saturated_fat",
  "carbs",
  "sugars_natural",
  "sugars_added",
  "fibre",
  "protein",
  "salt",
] as const;

export type Nutrient = (typeof NUTRIENTS)[number];
export type Nutrition = Record<Nutrient, number>;

// Everything these sums need off a product. Written as a subset so a screen can
// ask the database for these columns only.
export type PricedProduct = Pick<
  ProductRow,
  "package_price" | "package_quantity" | Nutrient
>;

export function emptyNutrition(): Nutrition {
  return {
    calories: 0,
    fat: 0,
    saturated_fat: 0,
    carbs: 0,
    sugars_natural: 0,
    sugars_added: 0,
    fibre: 0,
    protein: 0,
    salt: 0,
  };
}

// What a given quantity of a product contains. Product figures are per 100 of
// its own unit, so this is a straight scale.
export function nutritionOf(product: PricedProduct, quantity: number): Nutrition {
  const factor = quantity / 100;
  const result = emptyNutrition();

  for (const nutrient of NUTRIENTS) {
    const value = product[nutrient];
    result[nutrient] = (value ?? 0) * factor;
  }

  return result;
}

// What a given quantity of a product cost, from the package price and size.
export function costOf(product: PricedProduct, quantity: number): number {
  if (!product.package_quantity) return 0;
  return (product.package_price / product.package_quantity) * quantity;
}

export function addNutrition(base: Nutrition, extra: Nutrition): Nutrition {
  const result = emptyNutrition();
  for (const nutrient of NUTRIENTS) {
    result[nutrient] = base[nutrient] + extra[nutrient];
  }
  return result;
}

export function divideNutrition(total: Nutrition, by: number): Nutrition {
  const result = emptyNutrition();
  if (by <= 0) return result;
  for (const nutrient of NUTRIENTS) {
    result[nutrient] = total[nutrient] / by;
  }
  return result;
}

// One ingredient line: how much of which product.
export type Line = { quantity: number; product: PricedProduct };

export type RecipeTotals = {
  // Grams, with 1 ml counted as 1 g.
  rawWeight: number;
  nutrition: Nutrition;
  cost: number;
};

export function recipeTotals(lines: Line[]): RecipeTotals {
  let rawWeight = 0;
  let cost = 0;
  let nutrition = emptyNutrition();

  for (const line of lines) {
    rawWeight += line.quantity;
    cost += costOf(line.product, line.quantity);
    nutrition = addNutrition(nutrition, nutritionOf(line.product, line.quantity));
  }

  return { rawWeight, nutrition, cost };
}

// What the pan lost while cooking. Null when there's nothing to compare —
// either the pan hasn't been weighed yet or the recipe has no ingredients.
//
// A negative result is possible and is left alone: adding water to a stew makes
// it heavier, and pretending otherwise would hide a mistyped weight.
export function shrinkage(
  rawWeight: number,
  cookedWeight: number | null,
): { grams: number; percent: number } | null {
  if (cookedWeight === null || rawWeight <= 0) return null;

  const grams = cookedWeight - rawWeight;

  return { grams, percent: (grams / rawWeight) * 100 };
}

// Rounding is display only — nothing rounded here is ever written down.
export function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// ---------------------------------------------------------------------------
// Meals
// ---------------------------------------------------------------------------
// A meal line points at either a product or a recipe, never both. A product
// line records what was typed — a number, and whether it meant the product's
// own unit or pieces — so it still reads "2 eggs" in a year rather than "120 g".

export type CountableProduct = PricedProduct & { piece_grams: number | null };

// How much of the product a line actually means, in the product's own unit.
export function amountOf(
  product: CountableProduct,
  quantity: number,
  quantityUnit: "unit" | "piece",
): number {
  if (quantityUnit !== "piece") return quantity;

  // Pieces are only ever offered for a product that says how much one weighs,
  // and a product that has been eaten is frozen, so this can't go missing
  // underneath a line that used it.
  return quantity * (product.piece_grams ?? 0);
}

export type MealLine =
  | {
      kind: "product";
      quantity: number;
      quantityUnit: "unit" | "piece";
      product: CountableProduct;
    }
  | {
      kind: "recipe";
      servings: number;
      perServing: Nutrition;
      costPerServing: number;
    };

export function mealLineNutrition(line: MealLine): Nutrition {
  if (line.kind === "recipe") {
    const result = emptyNutrition();
    for (const nutrient of NUTRIENTS) {
      result[nutrient] = line.perServing[nutrient] * line.servings;
    }
    return result;
  }

  return nutritionOf(line.product, amountOf(line.product, line.quantity, line.quantityUnit));
}

export function mealLineCost(line: MealLine): number {
  if (line.kind === "recipe") return line.costPerServing * line.servings;

  return costOf(line.product, amountOf(line.product, line.quantity, line.quantityUnit));
}

export function mealTotals(lines: MealLine[]): { nutrition: Nutrition; cost: number } {
  let nutrition = emptyNutrition();
  let cost = 0;

  for (const line of lines) {
    nutrition = addNutrition(nutrition, mealLineNutrition(line));
    cost += mealLineCost(line);
  }

  return { nutrition, cost };
}
