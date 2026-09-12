import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { dateRowLabel, dayFor, timeIn, dateIn } from "@/lib/day";
import { loadCatalogue, mealItems, resolveLines, whatChanged } from "@/lib/meals";
import { mealLineCost, mealLineNutrition, mealTotals, round } from "@/lib/nutrition";
import { MealDetailsForm } from "./meal-details-form";
import { FoodSearch } from "./food-search";
import { DeleteMealButton, EditMealLine } from "./meal-line-forms";
import { RepeatButton } from "../repeat-buttons";
import { NutritionDetails } from "../nutrition-details";
import { CARD, HEADING } from "../../ui";

export const dynamic = "force-dynamic";

export default async function MealPage({ params, searchParams }: PageProps<"/meals/[id]">) {
  const { id } = await params;
  const { from } = await searchParams;

  if (!/^\d+$/.test(id)) notFound();
  const mealId = Number(id);
  const copiedFrom = typeof from === "string" && /^\d+$/.test(from) ? Number(from) : null;

  // All asked for at once rather than one after another: each is a trip to the
  // database, and none of them needs another's answer.
  const [{ data: meal, error }, items, catalogue, sourceItems] = await Promise.all([
    db().from("meals").select("*").eq("id", mealId).maybeSingle(),
    mealItems([mealId]),
    loadCatalogue(),
    copiedFrom === null ? Promise.resolve([]) : mealItems([copiedFrom]),
  ]);

  if (error) throw new Error(error.message);
  if (!meal) notFound();

  const lines = resolveLines(items, catalogue);
  const totals = mealTotals(lines.map((line) => line.line));

  const eatenAt = new Date(meal.eaten_at);

  // Just repeated: compare the copy against what it came from, so it can say
  // which lines followed a retired product or recipe to its replacement.
  const changes =
    copiedFrom === null
      ? { moved: [], stillRetired: [] }
      : whatChanged(sourceItems, items, catalogue);

  // What the search box can offer, products and recipes together. Retired ones
  // are left out — including when backfilling a past day, which is deliberate:
  // if you want the old one you go and find it.
  const recipeChoices = catalogue.recipes
    .filter((recipe) => !recipe.retired)
    .map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      caloriesPerServing: round(recipe.perServing.calories, 0),
    }));
  const productChoices = catalogue.products
    .filter((product) => !product.retired)
    .map((product) => ({
      id: product.id,
      name: product.name,
      unit: product.unit,
      pieceGrams: product.piece_grams,
    }));

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-5">
      <header className="flex min-h-7 items-center justify-between gap-4">
        <h1 className="whitespace-nowrap text-lg font-semibold">
          <span className={meal.type === "snack" ? "text-snack-label" : "text-meal-label"}>
            {meal.type === "snack" ? "Snack" : "Meal"}
          </span>
          <span className="font-normal text-faint tabular-nums"> · {timeIn(eatenAt)}</span>
        </h1>
        {/* The way back: the day it counts towards, as Today's date row writes it. */}
        <Link
          href={`/meals?day=${meal.day}`}
          className="min-w-0 truncate text-sm text-accent"
        >
          {dateRowLabel(meal.day)}
        </Link>
      </header>

      {copiedFrom !== null && (
        <div className="flex flex-col gap-1 rounded-xl bg-surface p-3.5 text-[13px] text-muted">
          <p>Copied from an earlier meal. Change the amounts if they were different.</p>

          {changes.moved.length > 0 && (
            <>
              <p className="text-foreground">
                {changes.moved.length === 1 ? "One line has" : `${changes.moved.length} lines have`}{" "}
                moved to what replaced them:
              </p>
              {changes.moved.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </>
          )}

          {changes.stillRetired.length > 0 && (
            <p>
              {changes.stillRetired.join(", ")} — retired, with nothing replacing it, so
              it was copied as it was.
            </p>
          )}
        </div>
      )}

      <section className="flex flex-col gap-1.5">
        <h2 className={HEADING}>What was in it</h2>

        {lines.length === 0 ? (
          <p className="text-[13px] text-muted">
            Nothing in it yet. Search below to add the first thing.
          </p>
        ) : (
          <ul className={CARD}>
            {lines.map((line) => {
              const calories = mealLineNutrition(line.line).calories;

              return (
                <li
                  key={line.id}
                  className="flex flex-col gap-1.5 border-t border-border py-2.5 first:border-t-0"
                >
                  <div className="flex items-start justify-between gap-3 text-[13px]">
                    <span className="flex min-w-0 flex-col">
                      <Link href={line.href} className="truncate">
                        {line.name}
                      </Link>
                      {/* "2 pieces · 120 g", "1.5 servings": as it's stored. */}
                      <span className="text-xs text-faint tabular-nums">{line.detail}</span>
                    </span>
                    <span className="shrink-0 text-muted tabular-nums">
                      {Math.round(calories).toLocaleString("en-GB")} kcal ·{" "}
                      {mealLineCost(line.line).toFixed(2)} lei
                    </span>
                  </div>

                  <EditMealLine
                    mealId={mealId}
                    lineId={line.id}
                    kind={line.kind}
                    amount={line.amount}
                    unit={line.unit}
                  />
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-1">
          <FoodSearch mealId={mealId} recipes={recipeChoices} products={productChoices} />
        </div>
      </section>

      {lines.length > 0 && (
        <NutritionDetails heading="Meal details" nutrition={totals.nutrition} cost={totals.cost} />
      )}

      <section className="flex flex-col gap-1.5">
        <h2 className={HEADING}>When, and how it was</h2>

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

      <div className="flex flex-col gap-3 pt-2">
        {lines.length > 0 && <RepeatButton sourceId={mealId} day={dayFor(new Date())} />}
        <DeleteMealButton id={mealId} day={meal.day} />
      </div>
    </main>
  );
}
