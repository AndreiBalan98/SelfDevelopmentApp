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
import { allRows, everyRow } from "@/lib/pages";
import {
  divideNutrition,
  mealTotals,
  recipeTotals,
  type CountableProduct,
  type MealLine,
  type Nutrition,
  type PricedProduct,
} from "@/lib/nutrition";

const PRODUCT_COLUMNS =
  "id, name, unit, retired, piece_grams, package_price, package_quantity, calories, fat, saturated_fat, carbs, sugars_total, sugars_added, fibre, protein, salt";

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
  // Raw ingredients, 1 ml as 1 g, divided by the servings.
  weightPerServing: number;
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
    // Each read a page at a time (lib/pages.ts): one question stops at 1,000 rows.
    allRows((from, to) =>
      supabase.from("products").select(PRODUCT_COLUMNS).order("name").order("id").range(from, to),
    ),
    allRows((from, to) =>
      supabase.from("recipes").select("id, name, servings, retired").order("name").order("id").range(from, to),
    ),
    allRows((from, to) =>
      supabase.from("recipe_items").select("recipe_id, product_id, quantity").order("id").range(from, to),
    ),
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
      weightPerServing: recipe.servings > 0 ? totals.rawWeight / recipe.servings : 0,
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

export type MealItemRow = {
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
          weightPerServing: recipe.weightPerServing,
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

// Comparing a repeated meal against the one it was copied from, to say which
// lines followed a retired product or recipe to its replacement.
//
// This is the only moment that information still exists: the copy itself points
// only at the current versions, so a moment later there is nothing to compare.
export function whatChanged(
  source: MealItemRow[],
  copied: MealItemRow[],
  catalogue: Catalogue,
): { moved: string[]; stillRetired: string[] } {
  const moved: string[] = [];
  const stillRetired: string[] = [];

  // The copy is made line for line in order, so the two line up. If they don't,
  // the meal has been changed since and there is nothing to report.
  if (source.length !== copied.length) return { moved, stillRetired };

  source.forEach((was, index) => {
    const now = copied[index];

    const wasProduct = was.product_id === null ? null : catalogue.productsById.get(was.product_id);
    const nowProduct = now.product_id === null ? null : catalogue.productsById.get(now.product_id);
    const wasRecipe = was.recipe_id === null ? null : catalogue.recipesById.get(was.recipe_id);
    const nowRecipe = now.recipe_id === null ? null : catalogue.recipesById.get(now.recipe_id);

    if (wasProduct && nowProduct && wasProduct.id !== nowProduct.id) {
      moved.push(`${wasProduct.name} → ${nowProduct.name}`);
    } else if (nowProduct?.retired) {
      stillRetired.push(nowProduct.name);
    }

    if (wasRecipe && nowRecipe && wasRecipe.id !== nowRecipe.id) {
      moved.push(`${wasRecipe.name} → ${nowRecipe.name}`);
    } else if (nowRecipe?.retired) {
      stillRetired.push(nowRecipe.name);
    }
  });

  return { moved, stillRetired };
}

// What you've eaten lately, for repeating.
//
// Ranked by how recently rather than how often: recency is exact and needs no
// guessing about what counts as "the same meal". Identical meals collapse into
// one row, so a fortnight of the same breakfast doesn't fill the list.
export type RecentMeal = {
  id: number;
  type: "meal" | "snack";
  day: string;
  names: string;
  calories: number;
  cost: number;
};

// How many meals to look back through to find the distinct ones.
const LOOK_BACK = 40;

export async function recentMeals(limit: number): Promise<RecentMeal[]> {
  const { data: recent } = await db()
    .from("meals")
    .select("id, day, type")
    .order("eaten_at", { ascending: false })
    .limit(LOOK_BACK);

  const found = recent ?? [];
  if (found.length === 0) return [];

  const [items, catalogue] = await Promise.all([
    mealItems(found.map((meal) => meal.id)),
    loadCatalogue(),
  ]);

  const byMeal = new Map<number, ResolvedLine[]>();
  for (const line of resolveLines(items, catalogue)) {
    const list = byMeal.get(line.mealId) ?? [];
    list.push(line);
    byMeal.set(line.mealId, list);
  }

  const seen = new Set<string>();
  const results: RecentMeal[] = [];

  for (const meal of found) {
    const lines = byMeal.get(meal.id) ?? [];
    // An empty meal is nothing to repeat.
    if (lines.length === 0) continue;

    const signature = lines
      .map((line) =>
        line.kind === "recipe"
          ? `r:${line.href}:${line.amount}`
          : `p:${line.href}:${line.amount}:${line.unit}`,
      )
      .sort()
      .join("|");

    if (seen.has(signature)) continue;
    seen.add(signature);

    const totals = mealTotals(lines.map((line) => line.line));

    results.push({
      id: meal.id,
      type: meal.type,
      day: meal.day,
      names: lines.map((line) => line.name).join(", "),
      calories: totals.nutrition.calories,
      cost: totals.cost,
    });

    if (results.length === limit) break;
  }

  return results;
}

// Each day's totals from `from` to `to`, for anything that looks across days
// (TDEE's intake). Only days with a meal are in it; a day whose meals are empty
// is in it with nothing added up. Read a page at a time (lib/pages.ts), since a
// few weeks of meal lines can pass Supabase's 1,000 rows.
export async function totalsByDay(
  from: string,
  to: string,
): Promise<Map<string, { nutrition: Nutrition; cost: number }>> {
  const supabase = db();

  const [meals, catalogue] = await Promise.all([
    everyRow((start, end) =>
      supabase
        .from("meals")
        .select("id, day")
        .gte("day", from)
        .lte("day", to)
        .order("id", { ascending: true })
        .range(start, end),
    ),
    loadCatalogue(),
  ]);

  const items =
    meals.length === 0
      ? []
      : ((await everyRow((start, end) =>
          supabase
            .from("meal_items")
            .select("id, meal_id, product_id, recipe_id, quantity, quantity_unit, servings")
            .in(
              "meal_id",
              meals.map((meal) => meal.id),
            )
            .order("id", { ascending: true })
            .range(start, end),
        )) as MealItemRow[]);

  const dayOf = new Map(meals.map((meal) => [meal.id, meal.day]));
  const linesByDay = new Map<string, MealLine[]>();
  for (const meal of meals) linesByDay.set(meal.day, linesByDay.get(meal.day) ?? []);
  for (const line of resolveLines(items, catalogue)) {
    linesByDay.get(dayOf.get(line.mealId) as string)?.push(line.line);
  }

  return new Map([...linesByDay].map(([day, lines]) => [day, mealTotals(lines)]));
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
