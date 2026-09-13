import { db } from "@/lib/supabase";
import { allRows } from "@/lib/pages";
import { recipeTotals, type PricedProduct } from "@/lib/nutrition";
import { valueOf } from "@/lib/value";
import { ValueList, type ValueRow } from "../value-list";
import { NutritionHeader } from "../headers";

export const dynamic = "force-dynamic";

const PRODUCT_COLUMNS =
  "id, package_price, package_quantity, calories, fat, saturated_fat, carbs, sugars_total, sugars_added, fibre, protein, salt";

export default async function RecipesPage() {
  const supabase = db();

  // Every recipe, retired ones included: the search box, the sort pills and the
  // retired toggle work on this list on the phone. The value numbers on each
  // row are worked out here rather than stored — three queries for the whole
  // list, all at once, and never a stale number.
  const [{ data, error }, { data: lines }, { data: products }] = await Promise.all([
    // Each read a page at a time (lib/pages.ts): one question stops at 1,000 rows.
    allRows((from, to) =>
      supabase.from("recipes").select("id, name, retired").order("name").order("id").range(from, to),
    ),
    allRows((from, to) =>
      supabase.from("recipe_items").select("recipe_id, product_id, quantity").order("id").range(from, to),
    ),
    allRows((from, to) =>
      supabase.from("products").select(PRODUCT_COLUMNS).order("id").range(from, to),
    ),
  ]);

  const productsById = new Map(
    (products ?? []).map((product) => [product.id, product as PricedProduct]),
  );

  // What each recipe is worth for the money, from the whole pan: its
  // ingredients added up, 1 ml counted as 1 g. Servings don't come into it —
  // they divide the price and the protein alike.
  const rows: ValueRow[] = (data ?? []).map((recipe) => {
    const totals = recipeTotals(
      (lines ?? [])
        .filter((line) => line.recipe_id === recipe.id)
        .flatMap((line) => {
          const product = productsById.get(line.product_id);
          return product ? [{ quantity: line.quantity, product }] : [];
        }),
    );

    return {
      id: recipe.id,
      name: recipe.name,
      retired: recipe.retired,
      href: `/recipes/${recipe.id}`,
      value: valueOf({ cost: totals.cost, nutrition: totals.nutrition, weight: totals.rawWeight }),
    };
  });

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-4">
      <NutritionHeader active="recipes" />

      {error ? (
        <p className="rounded-xl bg-surface p-3.5 text-sm">
          Could not reach the database: {error.message}
        </p>
      ) : (
        <ValueList rows={rows} noun="recipe" newHref="/recipes/new" />
      )}
    </main>
  );
}
