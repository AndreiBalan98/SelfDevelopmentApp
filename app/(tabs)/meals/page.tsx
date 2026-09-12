import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/supabase";
import { dateRowLabel, dayFor, shiftDays, timeIn } from "@/lib/day";
import { linesForMeals, recentMeals } from "@/lib/meals";
import { mealTotals, round, type Nutrient } from "@/lib/nutrition";
import { readTargets } from "@/lib/settings";
import { DayPicker } from "./day-picker";
import { AddMealButton } from "./add-meal-button";
import { DayTotals } from "./day-totals";
import Loading from "./loading";
import { NutritionHeader } from "../headers";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";

export const dynamic = "force-dynamic";

const RECENT = 10;

// The day details, in the order an EU label prints them. `indent` is how far
// in an "of which" line sits.
const DETAILS: Array<{
  key: Nutrient;
  label: string;
  unit: string;
  decimals: number;
  indent: 0 | 1 | 2;
}> = [
  { key: "calories", label: "Energy", unit: "kcal", decimals: 0, indent: 0 },
  { key: "fat", label: "Fat", unit: "g", decimals: 1, indent: 0 },
  { key: "saturated_fat", label: "of which saturates", unit: "g", decimals: 1, indent: 1 },
  { key: "carbs", label: "Carbohydrates", unit: "g", decimals: 1, indent: 0 },
  { key: "sugars_total", label: "of which sugars", unit: "g", decimals: 1, indent: 1 },
  { key: "sugars_added", label: "of which added", unit: "g", decimals: 1, indent: 2 },
  { key: "fibre", label: "Fibre", unit: "g", decimals: 1, indent: 0 },
  { key: "protein", label: "Protein", unit: "g", decimals: 1, indent: 0 },
  { key: "salt", label: "Salt", unit: "g", decimals: 2, indent: 0 },
];

const INDENT = ["", "pl-3 text-muted", "pl-6 text-muted"] as const;

// The macros on a meal's second line: a letter in the nutrient's colour and a
// whole number. S is added sugar, Fi fibre, Fa fat.
const MACROS: Array<{ key: Nutrient; letter: string; colour: string }> = [
  { key: "protein", letter: "P", colour: "text-protein" },
  { key: "carbs", letter: "C", colour: "text-carbs" },
  { key: "sugars_added", letter: "S", colour: "text-added-sugar" },
  { key: "fibre", letter: "Fi", colour: "text-fibre" },
  { key: "fat", letter: "Fa", colour: "text-fat" },
];

export default async function MealsPage({ searchParams }: PageProps<"/meals">) {
  const { day } = await searchParams;

  // "Today" here means the day you're currently logging towards, not the
  // calendar date: at 02:00 you are still filling in yesterday.
  const currentDay = dayFor(new Date());
  const selected =
    typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : currentDay;

  // Keyed on the day, so stepping to another day swaps straight to the
  // skeleton while it loads, rather than leaving the old day on screen as if
  // the tap hadn't registered.
  return (
    <Suspense key={selected} fallback={<Loading />}>
      <Day selected={selected} currentDay={currentDay} />
    </Suspense>
  );
}

async function Day({ selected, currentDay }: { selected: string; currentDay: string }) {
  // The targets and the recent list don't depend on which meals are on this
  // day, so they're asked for at the same time rather than after.
  const [{ data, error }, targets, recent] = await Promise.all([
    db()
      .from("meals")
      .select("id, eaten_at, day, type, note, score")
      .eq("day", selected)
      .order("eaten_at", { ascending: true }),
    readTargets(),
    recentMeals(RECENT),
  ]);

  const meals = data ?? [];
  const lines = await linesForMeals(meals.map((meal) => meal.id));

  // The day, added up from every line of every meal on it. Nothing about this
  // is stored — it's the meals themselves, totalled when the screen is drawn.
  const dayTotals = mealTotals(
    meals.flatMap((meal) => (lines.get(meal.id) ?? []).map((line) => line.line)),
  );

  const label = dateRowLabel(selected, currentDay);

  // Short of a zone is only a miss once the day is over. A past day with no
  // meals at all wasn't logged rather than eaten nothing, so it isn't marked
  // down for it either.
  const finished = selected < currentDay && meals.length > 0;

  return (
    <main className="flex-1 px-5 pt-8 pb-24 mx-auto w-full max-w-md flex flex-col gap-5">
      <NutritionHeader active="today" />

      <div className="-mt-2 flex flex-col items-center gap-1">
        <div className="flex items-center justify-center gap-2 text-[13px] text-muted">
          <Link
            href={`/meals?day=${shiftDays(selected, -1)}`}
            aria-label="The day before"
            className="flex p-1.5"
          >
            <ChevronLeftIcon size={18} />
          </Link>

          <span className="tabular-nums">{label}</span>

          {selected < currentDay ? (
            <Link
              href={`/meals?day=${shiftDays(selected, 1)}`}
              aria-label="The day after"
              className="flex p-1.5"
            >
              <ChevronRightIcon size={18} />
            </Link>
          ) : (
            <span className="flex p-1.5 opacity-30" aria-hidden="true">
              <ChevronRightIcon size={18} />
            </span>
          )}

          <DayPicker day={selected} latest={currentDay} />
        </div>

        {selected !== currentDay && (
          <Link href="/meals" className="text-xs text-accent">
            Back to today
          </Link>
        )}
      </div>

      {error ? (
        <p className="rounded-xl bg-surface p-3.5 text-sm">
          Could not reach the database: {error.message}
        </p>
      ) : (
        <>
          <DayTotals
            nutrition={dayTotals.nutrition}
            cost={dayTotals.cost}
            targets={targets}
            finished={finished}
          />

          {meals.length === 0 ? (
            <p className="text-sm text-muted">Nothing logged for this day yet.</p>
          ) : (
            <ul className="flex flex-col rounded-xl bg-surface px-3.5">
              {meals.map((meal) => {
                const own = lines.get(meal.id) ?? [];
                const totals = mealTotals(own.map((line) => line.line));

                return (
                  <li key={meal.id} className="border-t border-border first:border-t-0">
                    <Link href={`/meals/${meal.id}`} className="flex flex-col gap-1 py-2.5">
                      <div className="flex items-baseline justify-between gap-2 text-[13px]">
                        <span className="min-w-0 truncate">
                          <span
                            className={`font-semibold ${
                              meal.type === "snack" ? "text-snack-label" : "text-meal-label"
                            }`}
                          >
                            {meal.type === "snack" ? "Snack" : "Meal"}
                          </span>{" "}
                          <span className="text-faint tabular-nums">
                            · {timeIn(new Date(meal.eaten_at))} ·
                          </span>{" "}
                          {own.length === 0 ? (
                            <span className="text-muted">empty</span>
                          ) : (
                            own.map((line) => line.name).join(", ")
                          )}
                        </span>
                        <span className="shrink-0 text-muted tabular-nums">
                          {Math.round(totals.nutrition.calories).toLocaleString("en-GB")} kcal ·{" "}
                          {totals.cost.toFixed(2)} lei
                        </span>
                      </div>

                      <div className="text-xs text-muted tabular-nums">
                        {MACROS.map((macro, index) => (
                          <span key={macro.key}>
                            {index > 0 && <span className="text-faint"> · </span>}
                            <span className={`font-semibold ${macro.colour}`}>{macro.letter}</span>{" "}
                            {Math.round(totals.nutrition[macro.key])}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {meals.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold">Day details</h2>

              <ul className="flex flex-col rounded-xl bg-surface px-3.5 text-[13px]">
                {DETAILS.map((row) => (
                  <li
                    key={row.key}
                    className="flex items-baseline justify-between gap-3 border-t border-border py-2.5 first:border-t-0"
                  >
                    <span className={INDENT[row.indent]}>{row.label}</span>
                    <span className={`tabular-nums ${row.indent > 0 ? "text-muted" : ""}`}>
                      {round(dayTotals.nutrition[row.key], row.decimals).toLocaleString("en-GB")}{" "}
                      {row.unit}
                    </span>
                  </li>
                ))}

                <li className="flex items-baseline justify-between gap-3 border-t border-border py-2.5">
                  <span>Cost</span>
                  <span className="tabular-nums">{dayTotals.cost.toFixed(2)} lei</span>
                </li>
              </ul>
            </section>
          )}
        </>
      )}

      <AddMealButton
        day={selected}
        dayLabel={label}
        recent={recent.map((meal) => ({
          id: meal.id,
          type: meal.type,
          names: meal.names,
          calories: meal.calories,
          cost: meal.cost,
        }))}
      />
    </main>
  );
}
