// The one settings row, and the five numbers on it that the day screen measures
// against.
//
// The row is created by the first migration and can never become a second one,
// so this always has something to read. Every target is allowed to be empty —
// empty means "I haven't decided yet", which is a real answer, especially
// before there's enough history to pick a sensible number.

import { db } from "@/lib/supabase";

export type Targets = {
  calorie_target: number | null;
  protein_target: number | null;
  added_sugar_max: number | null;
  fibre_min: number | null;
  daily_budget: number | null;
};

export const NO_TARGETS: Targets = {
  calorie_target: null,
  protein_target: null,
  added_sugar_max: null,
  fibre_min: null,
  daily_budget: null,
};

export async function readTargets(): Promise<Targets> {
  const { data, error } = await db()
    .from("settings")
    .select("calorie_target, protein_target, added_sugar_max, fibre_min, daily_budget")
    .eq("id", 1)
    .maybeSingle();

  // A database that can't be reached is already reported by the screen's own
  // query. Here it just means no targets to measure against, which the screen
  // handles anyway.
  if (error || !data) return NO_TARGETS;

  return data;
}
