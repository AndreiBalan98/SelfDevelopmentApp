"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";

export type Result = { ok: boolean; message: string };

// The iPhone number pad offers a comma in some layouts. Empty means genuinely
// empty — no target — which is not the same as zero.
function toNumber(raw: FormDataEntryValue | null): number | null | "bad" {
  const text = String(raw ?? "").trim().replace(",", ".");
  if (!text) return null;
  const value = Number(text);
  if (!Number.isFinite(value)) return "bad";
  return value;
}

const FIELDS = [
  { name: "calorie_target", label: "Calorie target", decimals: 0, max: 20000, aboveZero: true },
  { name: "protein_target", label: "Protein target", decimals: 1, max: 1000, aboveZero: false },
  { name: "added_sugar_max", label: "Added sugar limit", decimals: 1, max: 1000, aboveZero: false },
  { name: "fibre_min", label: "Fibre target", decimals: 1, max: 1000, aboveZero: false },
  { name: "daily_budget", label: "Daily budget", decimals: 2, max: 100000, aboveZero: false },
] as const;

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export async function saveTargets(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  // Written out one field at a time rather than built up in a loose object, so
  // that a mistyped column name is caught here rather than silently saving
  // nothing.
  const cleaned = new Map<string, number | null>();

  for (const field of FIELDS) {
    const value = toNumber(form.get(field.name));

    if (value === "bad") return { ok: false, message: `${field.label} isn't a number.` };

    if (value !== null) {
      // The database refuses a calorie target of zero, and a negative anything.
      // Catching it here means a message rather than an error.
      if (field.aboveZero && value <= 0) {
        return { ok: false, message: `${field.label} has to be more than zero, or empty.` };
      }
      if (value < 0 || value > field.max) {
        return { ok: false, message: `${field.label} doesn't look right.` };
      }
    }

    cleaned.set(field.name, value === null ? null : round(value, field.decimals));
  }

  const { data: changed, error } = await db()
    .from("settings")
    .update({
      calorie_target: cleaned.get("calorie_target") ?? null,
      protein_target: cleaned.get("protein_target") ?? null,
      added_sugar_max: cleaned.get("added_sugar_max") ?? null,
      fibre_min: cleaned.get("fibre_min") ?? null,
      daily_budget: cleaned.get("daily_budget") ?? null,
    })
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
  revalidatePath("/");

  return { ok: true, message: "Saved." };
}
