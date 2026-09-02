import Link from "next/link";
import { db } from "@/lib/supabase";
import { dayFor, dayLabel, shiftDays, timeIn } from "@/lib/day";
import { linesForMeals } from "@/lib/meals";
import { mealTotals, round } from "@/lib/nutrition";
import { DayPicker } from "./day-picker";
import { AddMealButton } from "./add-meal-button";

export const dynamic = "force-dynamic";

export default async function MealsPage({ searchParams }: PageProps<"/meals">) {
  const { day } = await searchParams;

  // "Today" here means the day you're currently logging towards, not the
  // calendar date: at 02:00 you are still filling in yesterday.
  const currentDay = dayFor(new Date());
  const selected =
    typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : currentDay;

  const { data, error } = await db()
    .from("meals")
    .select("id, eaten_at, day, type, note, score")
    .eq("day", selected)
    .order("eaten_at", { ascending: true });

  const meals = data ?? [];
  const lines = await linesForMeals(meals.map((meal) => meal.id));

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Meals</h1>
        <Link href="/" className="text-sm text-accent">
          Home
        </Link>
      </header>

      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/meals?day=${shiftDays(selected, -1)}`}
          aria-label="The day before"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          ‹
        </Link>

        <span className="flex-1 text-center text-sm">{dayLabel(selected, currentDay)}</span>

        {selected < currentDay ? (
          <Link
            href={`/meals?day=${shiftDays(selected, 1)}`}
            aria-label="The day after"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            ›
          </Link>
        ) : (
          <span className="rounded-lg border border-border px-3 py-2 text-sm text-muted opacity-40">
            ›
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <DayPicker day={selected} latest={currentDay} />
        {selected !== currentDay && (
          <Link href="/meals" className="text-sm text-accent">
            Back to today
          </Link>
        )}
      </div>

      {error ? (
        <p className="rounded-lg border border-border bg-surface p-3 text-sm">
          Could not reach the database: {error.message}
        </p>
      ) : meals.length === 0 ? (
        <p className="text-sm text-muted">
          Nothing logged for this day yet.
        </p>
      ) : (
        <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
          {meals.map((meal) => {
            const own = lines.get(meal.id) ?? [];
            const totals = mealTotals(own.map((line) => line.line));

            return (
              <li key={meal.id}>
                <Link href={`/meals/${meal.id}`} className="flex flex-col gap-1 px-3 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="tabular-nums">
                      {timeIn(new Date(meal.eaten_at))}
                      {meal.type === "snack" && (
                        <span className="text-muted"> · snack</span>
                      )}
                    </span>
                    <span className="text-sm tabular-nums">
                      {round(totals.nutrition.calories, 0)} kcal
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-3 text-xs text-muted">
                    <span className="min-w-0 truncate">
                      {own.length === 0
                        ? "empty"
                        : own.map((line) => line.name).join(", ")}
                    </span>
                    <span className="shrink-0 tabular-nums">{totals.cost.toFixed(2)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <AddMealButton day={selected} />
    </main>
  );
}
