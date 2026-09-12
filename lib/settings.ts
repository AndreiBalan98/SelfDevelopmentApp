// The one settings row: the targets a day is measured against, the goal, the
// body figures for the formula estimate, and the gym start date.
//
// The row is created by the first migration and can never become a second one,
// so this always has something to read. Everything on it is allowed to be
// empty — empty means "I haven't decided yet", which is a real answer,
// especially before there's enough history to pick a sensible number.

import { db } from "@/lib/supabase";
import type { SettingsValues } from "@/lib/settings-fields";

// The five targets the day screen measures against today. Step 7.4 brings in
// the rest (carbs, fat, the fat ratio, and the goal phase that decides how
// calories are judged).
export type Targets = {
  calorie_target: number | null;
  protein_target: number | null;
  added_sugar_max: number | null;
  fibre_target: number | null;
  daily_budget: number | null;
};

export const NO_TARGETS: Targets = {
  calorie_target: null,
  protein_target: null,
  added_sugar_max: null,
  fibre_target: null,
  daily_budget: null,
};

export async function readTargets(): Promise<Targets> {
  const { data, error } = await db()
    .from("settings")
    .select("calorie_target, protein_target, added_sugar_max, fibre_target, daily_budget")
    .eq("id", 1)
    .maybeSingle();

  // A database that can't be reached is already reported by the screen's own
  // query. Here it just means no targets to measure against, which the screen
  // handles anyway.
  if (error || !data) return NO_TARGETS;

  return data;
}

// Everything the Settings tab edits (the fields themselves are described in
// lib/settings-fields.ts).
//
// Unlike readTargets, a failure here is reported rather than turned into empty
// values. The Settings screen saves every field at once, so showing it blank
// after a failed read would mean one tap of Save wiped every real setting.
export async function readSettings(): Promise<
  { settings: SettingsValues } | { error: string }
> {
  // One string, written out in full, so TypeScript checks every column name in
  // it against lib/types.ts.
  const { data, error } = await db()
    .from("settings")
    .select(
      "calorie_target, protein_target, carbs_target, added_sugar_max, fibre_target, fat_target, unsat_per_sat, daily_budget, goal_phase, goal_weight, height_cm, birth_year, sex, activity_level, gym_start_date",
    )
    .eq("id", 1)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "The settings row is missing." };

  return { settings: data };
}

// Just the gym start date, for the Workout tab. Null when none is set; an
// error when the database couldn't say.
export async function readGymStartDate(): Promise<
  { date: string | null } | { error: string }
> {
  const { data, error } = await db()
    .from("settings")
    .select("gym_start_date")
    .eq("id", 1)
    .maybeSingle();

  if (error) return { error: error.message };
  return { date: data?.gym_start_date ?? null };
}
