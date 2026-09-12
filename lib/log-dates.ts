// Reading which dates have a sleep, smoking, weight or meal log, for the
// calendar heatmap and the streak (lib/logging.ts does the arithmetic).

import { db } from "@/lib/supabase";
import type { LogDates } from "@/lib/logging";

// Supabase hands back at most 1,000 rows to any one question and says nothing
// about the rest. A year of meals is well past that, so every list here is
// read 1,000 rows at a time until a page comes back short.
const PAGE = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

async function everyRow<T>(ask: (from: number, to: number) => Page<T>): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await ask(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

// Null when the database couldn't be read: the calendar then says so, rather
// than showing a history of empty days.
export async function readLogDates(): Promise<LogDates | null> {
  const supabase = db();

  try {
    const [sleep, smoking, weight, meals] = await Promise.all([
      everyRow((from, to) => supabase.from("sleep").select("date").order("id").range(from, to)),
      everyRow((from, to) => supabase.from("smoking").select("date").order("id").range(from, to)),
      everyRow((from, to) => supabase.from("weight").select("date").order("id").range(from, to)),
      everyRow((from, to) => supabase.from("meals").select("day").order("id").range(from, to)),
    ]);

    return {
      sleep: sleep.map((row) => row.date),
      smoking: smoking.map((row) => row.date),
      weight: weight.map((row) => row.date),
      meals: meals.map((row) => row.day),
    };
  } catch {
    return null;
  }
}
