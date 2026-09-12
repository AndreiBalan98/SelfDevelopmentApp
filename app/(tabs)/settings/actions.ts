"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import {
  ACTIVITY_LEVELS,
  GOAL_PHASES,
  SEXES,
  settingsAsText,
  type SettingsText,
  type SettingsValues,
} from "@/lib/settings-fields";
import { dateIn } from "@/lib/day";

// What the screen gets back. On success, `saved` is every field exactly as it
// was stored — rounded, and with a comma read as a decimal point — so the form
// shows what the database holds rather than what was typed.
export type Result =
  | { ok: true; message: string; saved: SettingsText }
  | { ok: false; message: string };

type NumberField = {
  name:
    | "calorie_target"
    | "protein_target"
    | "carbs_target"
    | "added_sugar_max"
    | "fibre_target"
    | "fat_target"
    | "unsat_per_sat"
    | "daily_budget"
    | "goal_weight"
    | "height_cm"
    | "birth_year";
  label: string;
  decimals: number;
  // The database refuses zero for these, so it's caught here with a message.
  aboveZero: boolean;
  min: number;
  max: number;
};

// The upper and lower limits are only there to catch a slipped finger — a
// calorie target of 22000, a height of 18 — not to tell you what's sensible.
function numberFields(): NumberField[] {
  const thisYear = Number(dateIn(new Date()).slice(0, 4));

  return [
    { name: "goal_weight", label: "Goal weight", decimals: 2, aboveZero: true, min: 0, max: 500 },
    { name: "calorie_target", label: "Calories", decimals: 0, aboveZero: true, min: 0, max: 20000 },
    { name: "daily_budget", label: "Daily spend", decimals: 2, aboveZero: false, min: 0, max: 100000 },
    { name: "protein_target", label: "Protein", decimals: 1, aboveZero: false, min: 0, max: 1000 },
    { name: "carbs_target", label: "Carbs", decimals: 1, aboveZero: false, min: 0, max: 2000 },
    { name: "added_sugar_max", label: "Added sugar", decimals: 1, aboveZero: false, min: 0, max: 1000 },
    { name: "fibre_target", label: "Fibre", decimals: 1, aboveZero: false, min: 0, max: 1000 },
    { name: "fat_target", label: "Fat", decimals: 1, aboveZero: false, min: 0, max: 1000 },
    { name: "unsat_per_sat", label: "The fat ratio", decimals: 2, aboveZero: true, min: 0, max: 20 },
    { name: "height_cm", label: "Height", decimals: 1, aboveZero: true, min: 50, max: 300 },
    { name: "birth_year", label: "Birth year", decimals: 0, aboveZero: true, min: 1900, max: thisYear },
  ];
}

// The iPhone number pad offers a comma in some layouts. Empty means genuinely
// empty — not decided — which is not the same as zero.
function toNumber(raw: FormDataEntryValue | null): number | null | "bad" {
  const text = String(raw ?? "").trim().replace(",", ".");
  if (!text) return null;
  const value = Number(text);
  if (!Number.isFinite(value)) return "bad";
  return value;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// One of a fixed list of choices, or empty. Anything else means the form sent
// something it never offered.
function toChoice<T extends string>(
  raw: FormDataEntryValue | null,
  choices: Array<{ value: T }>,
): T | null | "bad" {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  return choices.find((choice) => choice.value === text)?.value ?? "bad";
}

// A real calendar date, "2026-10-04", or empty.
function toDate(raw: FormDataEntryValue | null): string | null | "bad" {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "bad";
  const parsed = new Date(`${text}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) return "bad";
  return text;
}

export async function saveSettings(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const numbers = new Map<NumberField["name"], number | null>();

  for (const field of numberFields()) {
    const value = toNumber(form.get(field.name));

    if (value === "bad") return { ok: false, message: `${field.label} isn't a number.` };

    if (value === null) {
      numbers.set(field.name, null);
      continue;
    }

    if (field.aboveZero && value <= 0) {
      return { ok: false, message: `${field.label} has to be more than zero, or empty.` };
    }
    if (field.name === "birth_year" && !Number.isInteger(value)) {
      return { ok: false, message: "Birth year has to be a whole year, like 1995." };
    }
    if (value < field.min || value > field.max) {
      return { ok: false, message: `${field.label} doesn't look right.` };
    }

    numbers.set(field.name, round(value, field.decimals));
  }

  const goalPhase = toChoice(form.get("goal_phase"), GOAL_PHASES);
  const sex = toChoice(form.get("sex"), SEXES);
  const activityLevel = toChoice(form.get("activity_level"), ACTIVITY_LEVELS);
  const gymStartDate = toDate(form.get("gym_start_date"));

  if (goalPhase === "bad") return { ok: false, message: "That goal isn't one of the three." };
  if (sex === "bad") return { ok: false, message: "That isn't one of the choices for sex." };
  if (activityLevel === "bad") return { ok: false, message: "That activity level isn't one of the four." };
  if (gymStartDate === "bad") return { ok: false, message: "The gym start date isn't a date." };

  // Written out one column at a time rather than built up in a loose object,
  // so that a mistyped column name is caught here rather than silently saving
  // nothing.
  const values: SettingsValues = {
    goal_phase: goalPhase,
    goal_weight: numbers.get("goal_weight") ?? null,
    calorie_target: numbers.get("calorie_target") ?? null,
    daily_budget: numbers.get("daily_budget") ?? null,
    protein_target: numbers.get("protein_target") ?? null,
    carbs_target: numbers.get("carbs_target") ?? null,
    added_sugar_max: numbers.get("added_sugar_max") ?? null,
    fibre_target: numbers.get("fibre_target") ?? null,
    fat_target: numbers.get("fat_target") ?? null,
    unsat_per_sat: numbers.get("unsat_per_sat") ?? null,
    height_cm: numbers.get("height_cm") ?? null,
    birth_year: numbers.get("birth_year") ?? null,
    sex,
    activity_level: activityLevel,
    gym_start_date: gymStartDate,
  };

  const { data: changed, error } = await db()
    .from("settings")
    .update(values)
    .eq("id", 1)
    .select("id");

  if (error) return { ok: false, message: `Could not save: ${error.message}` };
  // An update that matches nothing is not an error, so it has to be checked.
  // The settings row is created by the first migration and can't be deleted, so
  // this only fires if something is badly wrong.
  if ((changed ?? []).length === 0) {
    return { ok: false, message: "The settings row is missing — nothing was saved." };
  }

  revalidatePath("/settings");
  revalidatePath("/meals");
  revalidatePath("/workout");

  return { ok: true, message: "Saved.", saved: settingsAsText(values) };
}
