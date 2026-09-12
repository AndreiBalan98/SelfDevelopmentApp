import Link from "next/link";
import { db } from "@/lib/supabase";
import { recipeTotals, round, type PricedProduct } from "@/lib/nutrition";
import { RecipeSearch, type RecipeRow } from "./recipe-search";
import { NutritionHeader } from "../headers";

export const dynamic = "force-dynamic";

const PRODUCT_COLUMNS =
  "id, package_price, package_quantity, calories, fat, saturated_fat, carbs, sugars_total, sugars_added, fibre, protein, salt";

export default async function RecipesPage() {
  const supabase = db();

  // Every recipe, retired ones included: the search box and the retired toggle
  // filter this list on the phone. The calories per serving on each row are
  // worked out here rather than stored — three queries for the whole list, all
  // at once, and never a stale number.
  const [{ data, error }, { data: lines }, { data: products }] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, name, servings, cooked_weight, retired")
      .order("name", { ascending: true }),
    supabase.from("recipe_items").select("recipe_id, product_id, quantity"),
    supabase.from("products").select(PRODUCT_COLUMNS),
  ]);

  const productsById = new Map(
    (products ?? []).map((product) => [product.id, product as PricedProduct]),
  );

  const rows: RecipeRow[] = (data ?? []).map((recipe) => {
    const own = (lines ?? []).filter((line) => line.recipe_id === recipe.id);

    const calories =
      own.length === 0
        ? null
        : recipeTotals(
            own.flatMap((line) => {
              const product = productsById.get(line.product_id);
              return product ? [{ quantity: line.quantity, product }] : [];
            }),
          ).nutrition.calories / recipe.servings;

    return {
      id: recipe.id,
      name: recipe.name,
      retired: recipe.retired,
      servingsLine:
        `${recipe.servings} ${recipe.servings === 1 ? "serving" : "servings"}` +
        (recipe.cooked_weight
          ? ` · ${round(recipe.cooked_weight / recipe.servings, 0)} g each`
          : ""),
      caloriesLine: calories === null ? "no ingredients" : `${round(calories, 0)} kcal`,
    };
  });

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-6">
      <NutritionHeader active="recipes" />

      {error ? (
        <p className="rounded-lg border border-border bg-surface p-3 text-sm">
          Could not reach the database: {error.message}
        </p>
      ) : (
        <RecipeSearch recipes={rows} />
      )}

      <Link
        href="/recipes/new"
        className="rounded-lg bg-accent px-4 py-3 text-center font-medium text-black"
      >
        Add a recipe
      </Link>
    </main>
  );
}
