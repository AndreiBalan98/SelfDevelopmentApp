// Reading which dates have a sleep, smoking, weight or meal log, for the
// calendar heatmap and the streak (lib/logging.ts does the arithmetic).

import { db } from "@/lib/supabase";
import type { LogDates } from "@/lib/logging";
import { everyRow } from "@/lib/pages";

// A year of meals is well past Supabase's 1,000 rows per question, so every
// list here is read a page at a time (lib/pages.ts).

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
