import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { allRows } from "@/lib/pages";
import { costOf, divideNutrition, nutritionOf, recipeTotals, round, shrinkage } from "@/lib/nutrition";
import { timesUsed, updateRecipe } from "../actions";
import { RecipeForm } from "../recipe-form";
import { IngredientSearch } from "./ingredient-search";
import { EditLineForm } from "./line-forms";
import {
  CookedWeightForm,
  DeleteButton,
  LabelsForm,
  RetireButton,
} from "./recipe-forms";
import { NutritionDetails } from "../../meals/nutrition-details";
import { CARD, HEADING, PRIMARY, QUIET } from "../../ui";

export const dynamic = "force-dynamic";

// One string on purpose: supabase-js reads this literally to work out the shape
// of what comes back, and joining two pieces with + hides it from that check.
const PRODUCT_COLUMNS =
  "id, name, unit, retired, piece_grams, package_price, package_quantity, calories, fat, saturated_fat, carbs, sugars_total, sugars_added, fibre, protein, salt";

const LINE = "flex items-baseline justify-between gap-3 border-t border-border py-2.5 first:border-t-0";

export default async function RecipePage({ params }: PageProps<"/recipes/[id]">) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) notFound();
  const recipeId = Number(id);

  const supabase = db();

  // Asked for at once rather than one after another: each is a trip to the
  // database, and none of them needs another's answer.
  const [
    { data: recipe, error },
    used,
    { data: lineRows },
    { data: productRows },
    { data: predecessors },
  ] = await Promise.all([
    supabase.from("recipes").select("*").eq("id", recipeId).maybeSingle(),
    timesUsed(recipeId),
    supabase
      .from("recipe_items")
      .select("id, product_id, quantity")
      .eq("recipe_id", recipeId)
      .order("id", { ascending: true }),
    // Every product, a page at a time (lib/pages.ts): one question stops at 1,000 rows.
    allRows((from, to) =>
      supabase.from("products").select(PRODUCT_COLUMNS).order("name").order("id").range(from, to),
    ),
    supabase.from("recipes").select("id, name").eq("replaced_by", recipeId),
  ]);

  if (error) throw new Error(error.message);
  if (!recipe) notFound();

  // The one read that has to wait: which recipe replaced this one is only
  // known once this one has been read.
  const { data: replacement } = recipe.replaced_by
    ? await supabase.from("recipes").select("id, name").eq("id", recipe.replaced_by).maybeSingle()
    : { data: null };

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

  // What the search box can offer, only while the recipe is still free to
  // change. Retired products are left out — a new recipe should be built from
  // what you buy today.
  const ingredientChoices =
    used === 0
      ? (productRows ?? [])
          .filter((product) => !product.retired)
          .map((product) => ({
            id: product.id,
            name: product.name,
            unit: product.unit,
            pieceGrams: product.piece_grams,
          }))
      : [];

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-5">
      <header className="flex min-h-7 items-center justify-between gap-4">
        <h1 className="min-w-0 break-words text-lg font-semibold">{recipe.name}</h1>
        <Link href="/recipes" className="shrink-0 text-sm text-accent">
          Recipes
        </Link>
      </header>

      {(recipe.retired || replacement || (predecessors ?? []).length > 0) && (
        <div className="flex flex-col gap-1 rounded-xl bg-surface p-3.5 text-[13px] text-muted">
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
          <p className="text-[13px] text-muted">
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
          <p className="text-[13px] text-muted">
            Eaten in {used} {used === 1 ? "meal" : "meals"}, so its servings and
            ingredients are frozen — changing them would rewrite meals you have already
            eaten. To cook it differently, replace it.
          </p>

          <LabelsForm id={recipe.id} name={recipe.name} notes={recipe.notes} />

          <ul className={`${CARD} text-[13px]`}>
            <li className={LINE}>
              <span>Servings</span>
              <span className="tabular-nums">{recipe.servings}</span>
            </li>
          </ul>
        </>
      )}

      <section className="flex flex-col gap-1.5">
        <h2 className={HEADING}>Ingredients</h2>

        {lines.length === 0 ? (
          <p className="text-[13px] text-muted">
            Nothing in it yet. Search below to add the first ingredient.
          </p>
        ) : (
          <ul className={CARD}>
            {lines.map((line) => (
              <li
                key={line.id}
                className="flex flex-col gap-1.5 border-t border-border py-2.5 first:border-t-0"
              >
                <div className="flex items-start justify-between gap-3 text-[13px]">
                  <span className="flex min-w-0 flex-col">
                    <Link
                      href={`/products/${line.product.id}`}
                      className={`truncate ${line.product.retired ? "text-muted line-through" : ""}`}
                    >
                      {line.product.name}
                    </Link>
                    <span className="text-xs text-faint tabular-nums">
                      {line.quantity} {line.product.unit}
                    </span>
                  </span>
                  <span className="shrink-0 text-muted tabular-nums">
                    {round(nutritionOf(line.product, line.quantity).calories, 0).toLocaleString("en-GB")} kcal ·{" "}
                    {costOf(line.product, line.quantity).toFixed(2)} lei
                  </span>
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
          <div className="mt-1 flex flex-col gap-1.5">
            <IngredientSearch recipeId={recipe.id} products={ingredientChoices} />

            <p className="text-[11px] text-faint">
              Quantities are in the product&rsquo;s own unit. Retired products are left
              out — a new recipe should be built from what you buy today.
            </p>
          </div>
        )}
      </section>

      {lines.length > 0 && (
        <>
          <section className="flex flex-col gap-1.5">
            <h2 className={HEADING}>The pan</h2>

            <ul className={`${CARD} text-[13px]`}>
              <li className={LINE}>
                <span>Raw weight</span>
                <span className="tabular-nums">{round(totals.rawWeight, 0)} g</span>
              </li>

              <li className="flex items-center justify-between gap-3 border-t border-border py-2">
                <span>Cooked weight</span>
                {used === 0 ? (
                  <span className="tabular-nums">
                    {recipe.cooked_weight === null ? (
                      <span className="text-faint">not weighed</span>
                    ) : (
                      `${round(recipe.cooked_weight, 0)} g`
                    )}
                  </span>
                ) : (
                  <CookedWeightForm id={recipe.id} cookedWeight={recipe.cooked_weight} />
                )}
              </li>

              <li className={LINE}>
                <span>Shrinkage</span>
                <span className="tabular-nums">
                  {lost === null ? (
                    <span className="text-faint">weigh the pan to see it</span>
                  ) : (
                    `${lost.grams > 0 ? "+" : ""}${round(lost.grams, 0)} g · ${
                      lost.percent > 0 ? "+" : ""
                    }${round(lost.percent, 1)}%`
                  )}
                </span>
              </li>
            </ul>

            <p className="text-[11px] text-faint">
              Raw weight is added up from the ingredients, with 1 ml counted as 1 g.
              {used > 0 && " The cooked weight can still be corrected — no meal is calculated from it."}
            </p>
          </section>

          <div className="flex flex-col gap-1.5">
            <NutritionDetails
              heading={
                recipe.cooked_weight === null
                  ? "Per serving"
                  : `Per serving · about ${round(recipe.cooked_weight / recipe.servings, 0)} g`
              }
              nutrition={perServing}
              cost={totals.cost / recipe.servings}
            />

            <p className="text-[11px] text-faint tabular-nums">
              Whole batch: {round(totals.nutrition.calories, 0).toLocaleString("en-GB")} kcal ·{" "}
              {totals.cost.toFixed(2)} lei · {recipe.servings}{" "}
              {recipe.servings === 1 ? "serving" : "servings"}
            </p>
          </div>
        </>
      )}

      <div className="flex flex-col gap-3 pt-2">
        {used > 0 && (
          <Link href={`/recipes/new?copy=${recipe.id}`} className={`${PRIMARY} text-center`}>
            Replace — cook it differently
          </Link>
        )}

        {/* Duplicate is there for any recipe, eaten or not, retired or not: it
            starts a new recipe from this one and leaves this one as it is. */}
        <Link href={`/recipes/new?duplicate=${recipe.id}`} className={`${QUIET} text-center`}>
          Duplicate
        </Link>

        <RetireButton id={recipe.id} retired={recipe.retired} />
        {used === 0 && <DeleteButton id={recipe.id} />}
      </div>
    </main>
  );
}
