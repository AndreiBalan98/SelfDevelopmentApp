import Link from "next/link";
import { backupStatus, type BackupLevel } from "@/lib/backup";
import { db } from "@/lib/supabase";
import { dayFor } from "@/lib/day";
import { linesForMeals } from "@/lib/meals";
import { mealTotals, round } from "@/lib/nutrition";

export const dynamic = "force-dynamic";

const LEVEL_COLOUR: Record<BackupLevel, string> = {
  unknown: "text-muted",
  never: "text-warn",
  ok: "text-muted",
  warn: "text-warn",
  late: "text-danger",
};

// What today comes to so far. It's the number the app is most often opened to
// check, so it sits on the front rather than one tap in.
async function caloriesToday(): Promise<string> {
  const { data, error } = await db()
    .from("meals")
    .select("id")
    .eq("day", dayFor(new Date()));

  if (error) return "What you ate";

  const meals = data ?? [];
  if (meals.length === 0) return "Nothing logged yet";

  const lines = await linesForMeals(meals.map((meal) => meal.id));
  const totals = mealTotals(
    meals.flatMap((meal) => (lines.get(meal.id) ?? []).map((line) => line.line)),
  );

  return `${round(totals.nutrition.calories, 0)} kcal today`;
}

// One line per destination. It grows a line as each phase lands, which is
// honest about how far along the app is; a tab bar can come when there are
// enough screens to fill one.
export default async function Home() {
  const [backup, meals] = await Promise.all([backupStatus(), caloriesToday()]);

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-7">
      <h1 className="text-2xl font-semibold tracking-tight">Life Tracker</h1>

      <nav className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
        <Link href="/weight" className="flex items-baseline justify-between gap-4 px-4 py-3.5">
          <span>Weight</span>
          <span className="text-sm text-muted">Log today</span>
        </Link>

        <Link href="/sleep" className="flex items-baseline justify-between gap-4 px-4 py-3.5">
          <span>Sleep</span>
          <span className="text-sm text-muted">Last night</span>
        </Link>

        <Link href="/smoking" className="flex items-baseline justify-between gap-4 px-4 py-3.5">
          <span>Cigarettes</span>
          <span className="text-sm text-muted">Count for today</span>
        </Link>

        <Link href="/meals" className="flex items-baseline justify-between gap-4 px-4 py-3.5">
          <span>Meals</span>
          <span className="text-sm text-muted tabular-nums">{meals}</span>
        </Link>

        <Link href="/products" className="flex items-baseline justify-between gap-4 px-4 py-3.5">
          <span>Products</span>
          <span className="text-sm text-muted">What you buy</span>
        </Link>

        <Link href="/recipes" className="flex items-baseline justify-between gap-4 px-4 py-3.5">
          <span>Recipes</span>
          <span className="text-sm text-muted">What you cook</span>
        </Link>

        <Link href="/export" className="flex items-baseline justify-between gap-4 px-4 py-3.5">
          <span>Backup</span>
          <span className={`text-sm ${LEVEL_COLOUR[backup.level]}`}>
            {backup.label}
          </span>
        </Link>

        <Link href="/settings" className="flex items-baseline justify-between gap-4 px-4 py-3.5">
          <span>Targets</span>
          <span className="text-sm text-muted">What a day aims at</span>
        </Link>
      </nav>
    </main>
  );
}
