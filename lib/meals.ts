// Turning the rows of a meal into things that can be shown and added up.
//
// Both the day screen and the meal screen need the same thing: for each line,
// what it was, how much of it, and what that works out at. Doing it in one
// place means the two screens can never disagree about a number.
//
// A recipe line is the interesting one. A meal records a number of servings, so
// what it contains has to be worked out from the recipe's own ingredients,
// divided by its servings — none of which is stored anywhere.

import { db } from "@/lib/supabase";
import {
  divideNutrition,
  recipeTotals,
  type CountableProduct,
  type MealLine,
  type Nutrition,
  type PricedProduct,
} from "@/lib/nutrition";

const PRODUCT_COLUMNS =
  "id, name, unit, retired, piece_grams, package_price, package_quantity, calories, fat, saturated_fat, carbs, sugars_natural, sugars_added, fibre, protein, salt";

type ProductRow = CountableProduct & {
  id: number;
  name: string;
  unit: "g" | "ml";
  retired: boolean;
};

export type RecipeSummary = {
  id: number;
  name: string;
  retired: boolean;
  perServing: Nutrition;
  costPerServing: number;
};

// Everything a food screen needs to know about what exists: the products, and
// what one serving of each recipe works out at. Read once and passed around,
// rather than queried again for every line on the page.
export type Catalogue = {
  products: ProductRow[];
  productsById: Map<number, ProductRow>;
  recipes: RecipeSummary[];
  recipesById: Map<number, RecipeSummary>;
};

export async function loadCatalogue(): Promise<Catalogue> {
  const supabase = db();

  const [{ data: products }, { data: recipes }, { data: recipeItems }] = await Promise.all([
    // The whole products table: it's one person's shopping, and fetching it
    // once beats a query per line.
    supabase.from("products").select(PRODUCT_COLUMNS).order("name", { ascending: true }),
    supabase.from("recipes").select("id, name, servings, retired").order("name", { ascending: true }),
    supabase.from("recipe_items").select("recipe_id, product_id, quantity"),
  ]);

  const productRows = (products ?? []) as ProductRow[];
  const productsById = new Map(productRows.map((product) => [product.id, product]));

  const recipeSummaries: RecipeSummary[] = (recipes ?? []).map((recipe) => {
    const lines = (recipeItems ?? [])
      .filter((line) => line.recipe_id === recipe.id)
      .flatMap((line) => {
        const product = productsById.get(line.product_id);
        return product ? [{ quantity: line.quantity, product: product as PricedProduct }] : [];
      });

    const totals = recipeTotals(lines);

    return {
      id: recipe.id,
      name: recipe.name,
      retired: recipe.retired,
      perServing: divideNutrition(totals.nutrition, recipe.servings),
      costPerServing: recipe.servings > 0 ? totals.cost / recipe.servings : 0,
    };
  });

  return {
    products: productRows,
    productsById,
    recipes: recipeSummaries,
    recipesById: new Map(recipeSummaries.map((recipe) => [recipe.id, recipe])),
  };
}

export type ResolvedLine = {
  id: number;
  mealId: number;
  // What it was, and where to go to look at it.
  name: string;
  href: string;
  // "300 g", "2 pieces · 120 g", "1.5 servings"
  detail: string;
  line: MealLine;
  // What the edit box needs: which kind of line it is and what's in it now.
  kind: "product" | "recipe";
  amount: number;
  unit: string;
};

type MealItemRow = {
  id: number;
  meal_id: number;
  product_id: number | null;
  recipe_id: number | null;
  quantity: number | null;
  quantity_unit: "unit" | "piece" | null;
  servings: number | null;
};

function plural(count: number, word: string): string {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

export function resolveLines(items: MealItemRow[], catalogue: Catalogue): ResolvedLine[] {
  const lines: ResolvedLine[] = [];

  for (const item of items) {
    if (item.recipe_id !== null && item.servings !== null) {
      const recipe = catalogue.recipesById.get(item.recipe_id);
      if (!recipe) continue;

      lines.push({
        id: item.id,
        mealId: item.meal_id,
        name: recipe.name,
        href: `/recipes/${recipe.id}`,
        detail: plural(item.servings, "serving"),
        line: {
          kind: "recipe",
          servings: item.servings,
          perServing: recipe.perServing,
          costPerServing: recipe.costPerServing,
        },
        kind: "recipe",
        amount: item.servings,
        unit: "servings",
      });

      continue;
    }

    if (item.product_id !== null && item.quantity !== null && item.quantity_unit !== null) {
      const product = catalogue.productsById.get(item.product_id);
      if (!product) continue;

      const pieces = item.quantity_unit === "piece";

      lines.push({
        id: item.id,
        mealId: item.meal_id,
        name: product.name,
        href: `/products/${product.id}`,
        detail: pieces
          ? `${plural(item.quantity, "piece")} · ${
              Math.round(item.quantity * (product.piece_grams ?? 0) * 100) / 100
            } ${product.unit}`
          : `${item.quantity} ${product.unit}`,
        line: {
          kind: "product",
          quantity: item.quantity,
          quantityUnit: item.quantity_unit,
          product,
        },
        kind: "product",
        amount: item.quantity,
        unit: pieces ? "pieces" : product.unit,
      });
    }
  }

  return lines;
}

export async function mealItems(mealIds: number[]): Promise<MealItemRow[]> {
  if (mealIds.length === 0) return [];

  const { data } = await db()
    .from("meal_items")
    .select("id, meal_id, product_id, recipe_id, quantity, quantity_unit, servings")
    .in("meal_id", mealIds)
    .order("id", { ascending: true });

  return (data ?? []) as MealItemRow[];
}

// What the day screen needs: every line of every meal on that day, grouped.
export async function linesForMeals(
  mealIds: number[],
): Promise<Map<number, ResolvedLine[]>> {
  const byMeal = new Map<number, ResolvedLine[]>();
  for (const id of mealIds) byMeal.set(id, []);

  if (mealIds.length === 0) return byMeal;

  const [items, catalogue] = await Promise.all([mealItems(mealIds), loadCatalogue()]);

  for (const line of resolveLines(items, catalogue)) {
    byMeal.get(line.mealId)?.push(line);
  }

  return byMeal;
}
