import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import {
  costOf,
  divideNutrition,
  nutritionOf,
  recipeTotals,
  round,
  shrinkage,
  type Nutrient,
} from "@/lib/nutrition";
import { timesUsed, updateRecipe } from "../actions";
import { RecipeForm } from "../recipe-form";
import { IngredientSearch } from "./ingredient-search";
import { AddLineForm, EditLineForm } from "./line-forms";
import {
  CookedWeightForm,
  DeleteButton,
  LabelsForm,
  RetireButton,
} from "./recipe-forms";

export const dynamic = "force-dynamic";

// One string on purpose: supabase-js reads this literally to work out the shape
// of what comes back, and joining two pieces with + hides it from that check.
const PRODUCT_COLUMNS =
  "id, name, unit, retired, piece_grams, package_price, package_quantity, calories, fat, saturated_fat, carbs, sugars_natural, sugars_added, fibre, protein, salt";

// Same order as the product form and an EU label.
const NUTRITION: Array<{ key: Nutrient; label: string; unit: string; decimals: number }> = [
  { key: "calories", label: "Energy", unit: "kcal", decimals: 0 },
  { key: "fat", label: "Fat", unit: "g", decimals: 1 },
  { key: "saturated_fat", label: "of which saturates", unit: "g", decimals: 1 },
  { key: "carbs", label: "Carbohydrate", unit: "g", decimals: 1 },
  { key: "sugars_natural", label: "of which sugars", unit: "g", decimals: 1 },
  { key: "sugars_added", label: "of which added", unit: "g", decimals: 1 },
  { key: "fibre", label: "Fibre", unit: "g", decimals: 1 },
  { key: "protein", label: "Protein", unit: "g", decimals: 1 },
  { key: "salt", label: "Salt", unit: "g", decimals: 2 },
];

export default async function RecipePage({ params, searchParams }: PageProps<"/recipes/[id]">) {
  const { id } = await params;
  const { q } = await searchParams;

  if (!/^\d+$/.test(id)) notFound();
  const recipeId = Number(id);
  const search = typeof q === "string" ? q.trim() : "";

  const supabase = db();

  const { data: recipe, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", recipeId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!recipe) notFound();

  const used = await timesUsed(recipeId);

  const [{ data: lineRows }, { data: productRows }, { data: replacement }, { data: predecessors }] =
    await Promise.all([
      supabase
        .from("recipe_items")
        .select("id, product_id, quantity")
        .eq("recipe_id", recipeId)
        .order("id", { ascending: true }),
      supabase.from("products").select(PRODUCT_COLUMNS),
      recipe.replaced_by
        ? supabase.from("recipes").select("id, name").eq("id", recipe.replaced_by).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("recipes").select("id, name").eq("replaced_by", recipeId),
    ]);

  const productsById = new Map((productRows ?? []).map((product) => [product.id, product]));

  // Every line paired with the product it points at. A product that a recipe
  // uses can't be deleted, so the pairing never comes up empty in practice.
  const lines = (lineRows ?? []).flatMap((line) => {
    const product = productsById.get(line.product_id);
    return product ? [{ ...line, product }] : [];
  });

  const totals = recipeTotals(lines);
  const perServing = divideNutrition(totals.nutrition, recipe.servings);
  const lost = shrinkage(totals.rawWeight, recipe.cooked_weight);

  // Only searched when the recipe is still free to change, and retired products
  // are left out — a new recipe should be built from what you buy today.
  const { data: results } = search && used === 0
    ? await supabase
        .from("products")
        .select("id, name, unit, piece_grams")
        .eq("retired", false)
        .ilike("name", `%${search}%`)
        .order("name", { ascending: true })
        .limit(8)
    : { data: null };

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">{recipe.name}</h1>
        <Link href="/recipes" className="text-sm text-accent">
          Recipes
        </Link>
      </header>

      {(recipe.retired || replacement || (predecessors ?? []).length > 0) && (
        <div className="rounded-lg border border-border bg-surface p-3 text-sm text-muted flex flex-col gap-1">
          {recipe.retired && <p>Retired — hidden when logging, kept so old meals still add up.</p>}
          {replacement && (
            <p>
              Replaced by{" "}
              <Link href={`/recipes/${replacement.id}`} className="text-accent">
                {replacement.name}
              </Link>
            </p>
          )}
          {(predecessors ?? []).map((older) => (
            <p key={older.id}>
              Replaces{" "}
              <Link href={`/recipes/${older.id}`} className="text-accent">
                {older.name}
              </Link>
            </p>
          ))}
        </div>
      )}

      {used === 0 ? (
        <>
          <p className="text-sm text-muted">
            Not eaten yet, so everything about it is still safe to change.
          </p>

          <RecipeForm
            action={updateRecipe}
            submitLabel="Save changes"
            id={recipe.id}
            defaults={{
              name: recipe.name,
              servings: recipe.servings,
              cooked_weight: recipe.cooked_weight,
              notes: recipe.notes,
            }}
          />
        </>
      ) : (
        <>
          <p className="text-sm text-muted">
            Eaten in {used} {used === 1 ? "meal" : "meals"}, so its servings and
            ingredients are frozen — changing them would rewrite meals you have already
            eaten. To cook it differently, replace it.
          </p>

          <LabelsForm id={recipe.id} name={recipe.name} notes={recipe.notes} />

          <div className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm flex items-baseline justify-between">
            <span>Servings</span>
            <span className="tabular-nums">{recipe.servings}</span>
          </div>
        </>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted">Ingredients</h2>

        {lines.length === 0 ? (
          <p className="text-sm text-muted">
            Nothing in it yet. Search below to add the first ingredient.
          </p>
        ) : (
          <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
            {lines.map((line) => (
              <li key={line.id} className="flex flex-col gap-2 px-3 py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <Link href={`/products/${line.product.id}`} className="min-w-0 truncate">
                    {line.product.name}
                  </Link>
                  <span className="shrink-0 text-sm text-muted tabular-nums">
                    {line.quantity} {line.product.unit}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-3 text-xs text-muted tabular-nums">
                  <span>{round(nutritionOf(line.product, line.quantity).calories, 0)} kcal</span>
                  <span>{round(costOf(line.product, line.quantity), 2).toFixed(2)}</span>
                </div>

                {used === 0 && (
                  <EditLineForm
                    recipeId={recipe.id}
                    lineId={line.id}
                    quantity={line.quantity}
                    unit={line.product.unit}
                  />
                )}
              </li>
            ))}
          </ul>
        )}

        {used === 0 && (
          <div className="flex flex-col gap-2 pt-1">
            <IngredientSearch recipeId={recipe.id} search={search} />

            {search && (
              (results ?? []).length === 0 ? (
                <p className="text-sm text-muted">Nothing matching “{search}”.</p>
              ) : (
                <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
                  {(results ?? []).map((product) => (
                    <li key={product.id}>
                      <AddLineForm
                        recipeId={recipe.id}
                        productId={product.id}
                        name={product.name}
                        unit={product.unit}
                        pieceGrams={product.piece_grams}
                      />
                    </li>
                  ))}
                </ul>
              )
            )}

            <p className="text-xs text-muted">
              Quantities are in the product&rsquo;s own unit. Retired products are left
              out — a new recipe should be built from what you buy today.
            </p>
          </div>
        )}
      </section>

      {lines.length > 0 && (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted">The pan</h2>

            <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
              <li className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm">
                <span>Raw weight</span>
                <span className="tabular-nums">{round(totals.rawWeight, 0)} g</span>
              </li>

              <li className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span>Cooked weight</span>
                {used === 0 ? (
                  <span className="tabular-nums">
                    {recipe.cooked_weight === null ? (
                      <span className="text-muted">not weighed</span>
                    ) : (
                      `${round(recipe.cooked_weight, 0)} g`
                    )}
                  </span>
                ) : (
                  <CookedWeightForm id={recipe.id} cookedWeight={recipe.cooked_weight} />
                )}
              </li>

              <li className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm">
                <span>Shrinkage</span>
                <span className="tabular-nums">
                  {lost === null ? (
                    <span className="text-muted">weigh the pan to see it</span>
                  ) : (
                    `${lost.grams > 0 ? "+" : ""}${round(lost.grams, 0)} g · ${
                      lost.percent > 0 ? "+" : ""
                    }${round(lost.percent, 1)}%`
                  )}
                </span>
              </li>
            </ul>

            <p className="text-xs text-muted">
              Raw weight is added up from the ingredients, with 1 ml counted as 1 g.
              {used > 0 && " The cooked weight can still be corrected — no meal is calculated from it."}
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted">
              Per serving
              {recipe.cooked_weight !== null && (
                <span className="tabular-nums">
                  {" "}
                  · about {round(recipe.cooked_weight / recipe.servings, 0)} g
                </span>
              )}
            </h2>

            <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
              {NUTRITION.map((row) => (
                <li
                  key={row.key}
                  className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span>{row.label}</span>
                  <span className="tabular-nums">
                    {round(perServing[row.key], row.decimals)} {row.unit}
                  </span>
                </li>
              ))}

              <li className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm">
                <span>Cost</span>
                <span className="tabular-nums">
                  {(totals.cost / recipe.servings).toFixed(2)}
                </span>
              </li>
            </ul>

            <p className="text-xs text-muted tabular-nums">
              Whole batch: {round(totals.nutrition.calories, 0)} kcal ·{" "}
              {totals.cost.toFixed(2)} · {recipe.servings}{" "}
              {recipe.servings === 1 ? "serving" : "servings"}
            </p>
          </section>
        </>
      )}

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        {used > 0 && (
          <Link
            href={`/recipes/new?copy=${recipe.id}`}
            className="rounded-lg bg-accent px-4 py-3 text-center font-medium text-black"
          >
            Replace — cook it differently
          </Link>
        )}

        <RetireButton id={recipe.id} retired={recipe.retired} />
        {used === 0 && <DeleteButton id={recipe.id} />}
      </div>
    </main>
  );
}
