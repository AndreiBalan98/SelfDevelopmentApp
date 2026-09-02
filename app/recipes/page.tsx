import Link from "next/link";
import { db } from "@/lib/supabase";
import { recipeTotals, round, type PricedProduct } from "@/lib/nutrition";
import { RecipeSearch } from "./recipe-search";

export const dynamic = "force-dynamic";

const PRODUCT_COLUMNS =
  "id, package_price, package_quantity, calories, fat, saturated_fat, carbs, sugars_total, sugars_added, fibre, protein, salt";

export default async function RecipesPage({ searchParams }: PageProps<"/recipes">) {
  const { q, retired } = await searchParams;

  const search = typeof q === "string" ? q.trim() : "";
  const showRetired = retired === "1";

  const supabase = db();

  let query = supabase
    .from("recipes")
    .select("id, name, servings, cooked_weight, retired")
    .order("name", { ascending: true });

  // Retired recipes stay in the database forever so old meals still add up.
  if (!showRetired) query = query.eq("retired", false);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;
  const recipes = data ?? [];

  // The calories per serving on each row are worked out here rather than
  // stored — three queries for the whole list, and never a stale number.
  const [{ data: lines }, { data: products }] =
    recipes.length > 0
      ? await Promise.all([
          supabase
            .from("recipe_items")
            .select("recipe_id, product_id, quantity")
            .in(
              "recipe_id",
              recipes.map((recipe) => recipe.id),
            ),
          supabase.from("products").select(PRODUCT_COLUMNS),
        ])
      : [{ data: [] }, { data: [] }];

  const productsById = new Map(
    (products ?? []).map((product) => [product.id, product as PricedProduct]),
  );

  const perServing = new Map<number, number | null>();

  for (const recipe of recipes) {
    const own = (lines ?? []).filter((line) => line.recipe_id === recipe.id);

    if (own.length === 0) {
      perServing.set(recipe.id, null);
      continue;
    }

    const totals = recipeTotals(
      own.flatMap((line) => {
        const product = productsById.get(line.product_id);
        return product ? [{ quantity: line.quantity, product }] : [];
      }),
    );

    perServing.set(recipe.id, totals.nutrition.calories / recipe.servings);
  }

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Recipes</h1>
        <Link href="/" className="text-sm text-accent">
          Home
        </Link>
      </header>

      <RecipeSearch search={search} showRetired={showRetired} />

      {error ? (
        <p className="rounded-lg border border-border bg-surface p-3 text-sm">
          Could not reach the database: {error.message}
        </p>
      ) : recipes.length === 0 ? (
        <p className="text-sm text-muted">
          {search
            ? `Nothing matching “${search}”.`
            : showRetired
              ? "Nothing here yet."
              : "No recipes yet. The first one goes in below."}
        </p>
      ) : (
        <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
          {recipes.map((recipe) => {
            const calories = perServing.get(recipe.id) ?? null;

            return (
              <li key={recipe.id}>
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="flex items-baseline justify-between gap-3 px-3 py-2.5"
                >
                  <span className="flex flex-col">
                    <span className={recipe.retired ? "text-muted line-through" : ""}>
                      {recipe.name}
                    </span>
                    <span className="text-xs text-muted tabular-nums">
                      {recipe.servings} {recipe.servings === 1 ? "serving" : "servings"}
                      {recipe.cooked_weight
                        ? ` · ${round(recipe.cooked_weight / recipe.servings, 0)} g each`
                        : ""}
                    </span>
                  </span>

                  <span className="text-sm text-muted tabular-nums">
                    {calories === null ? "no ingredients" : `${round(calories, 0)} kcal`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
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
