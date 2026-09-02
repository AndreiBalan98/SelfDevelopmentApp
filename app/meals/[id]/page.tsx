import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { dayLabel, timeIn, dateIn } from "@/lib/day";
import { loadCatalogue, mealItems, resolveLines } from "@/lib/meals";
import { mealLineCost, mealLineNutrition, mealTotals, round, type Nutrient } from "@/lib/nutrition";
import { MealDetailsForm } from "./meal-details-form";
import { FoodSearch } from "./food-search";
import {
  AddProductLine,
  AddRecipeLine,
  DeleteMealButton,
  EditMealLine,
} from "./meal-line-forms";

export const dynamic = "force-dynamic";

const RESULTS = 6;

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

export default async function MealPage({ params, searchParams }: PageProps<"/meals/[id]">) {
  const { id } = await params;
  const { q } = await searchParams;

  if (!/^\d+$/.test(id)) notFound();
  const mealId = Number(id);
  const search = typeof q === "string" ? q.trim() : "";

  const { data: meal, error } = await db()
    .from("meals")
    .select("*")
    .eq("id", mealId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!meal) notFound();

  const [items, catalogue] = await Promise.all([mealItems([mealId]), loadCatalogue()]);
  const lines = resolveLines(items, catalogue);
  const totals = mealTotals(lines.map((line) => line.line));

  const eatenAt = new Date(meal.eaten_at);

  // Products and recipes come back in one list. Retired ones are left out —
  // including when backfilling a past day, which is deliberate: if you want the
  // old one you go and find it.
  const term = search.toLowerCase();
  const productMatches = search
    ? catalogue.products
        .filter((product) => !product.retired && product.name.toLowerCase().includes(term))
        .slice(0, RESULTS)
    : [];
  const recipeMatches = search
    ? catalogue.recipes
        .filter((recipe) => !recipe.retired && recipe.name.toLowerCase().includes(term))
        .slice(0, RESULTS)
    : [];

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight capitalize">
          {meal.type}
          <span className="text-muted"> · {timeIn(eatenAt)}</span>
        </h1>
        <Link href={`/meals?day=${meal.day}`} className="text-sm text-accent">
          {dayLabel(meal.day)}
        </Link>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted">What was in it</h2>

        {lines.length === 0 ? (
          <p className="text-sm text-muted">
            Nothing in it yet. Search below to add the first thing.
          </p>
        ) : (
          <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
            {lines.map((line) => (
              <li key={line.id} className="flex flex-col gap-2 px-3 py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <Link href={line.href} className="min-w-0 truncate">
                    {line.name}
                  </Link>
                  <span className="shrink-0 text-sm text-muted tabular-nums">
                    {line.detail}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-3 text-xs text-muted tabular-nums">
                  <span>{round(mealLineNutrition(line.line).calories, 0)} kcal</span>
                  <span>{mealLineCost(line.line).toFixed(2)}</span>
                </div>

                <EditMealLine
                  mealId={mealId}
                  lineId={line.id}
                  kind={line.kind}
                  amount={line.amount}
                  unit={line.unit}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <FoodSearch mealId={mealId} search={search} />

          {search &&
            (productMatches.length === 0 && recipeMatches.length === 0 ? (
              <p className="text-sm text-muted">Nothing matching “{search}”.</p>
            ) : (
              <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
                {recipeMatches.map((recipe) => (
                  <li key={`recipe-${recipe.id}`}>
                    <AddRecipeLine
                      mealId={mealId}
                      recipeId={recipe.id}
                      name={recipe.name}
                      caloriesPerServing={round(recipe.perServing.calories, 0)}
                    />
                  </li>
                ))}

                {productMatches.map((product) => (
                  <li key={`product-${product.id}`}>
                    <AddProductLine
                      mealId={mealId}
                      productId={product.id}
                      name={product.name}
                      unit={product.unit}
                      pieceGrams={product.piece_grams}
                    />
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </section>

      {lines.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted">The whole meal</h2>

          <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
            {NUTRITION.map((row) => (
              <li
                key={row.key}
                className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm"
              >
                <span>{row.label}</span>
                <span className="tabular-nums">
                  {round(totals.nutrition[row.key], row.decimals)} {row.unit}
                </span>
              </li>
            ))}

            <li className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm">
              <span>Cost</span>
              <span className="tabular-nums">{totals.cost.toFixed(2)}</span>
            </li>
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted">When, and how it was</h2>

        <MealDetailsForm
          id={mealId}
          date={dateIn(eatenAt)}
          time={timeIn(eatenAt)}
          day={meal.day}
          type={meal.type}
          note={meal.note}
          score={meal.score}
        />
      </section>

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <DeleteMealButton id={mealId} day={meal.day} />
      </div>
    </main>
  );
}
