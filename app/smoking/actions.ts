"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { today } from "@/lib/day";

// Saving and deleting a day's cigarettes.
//
// Nothing in the database points at one of these, so like a weigh-in they're
// freely editable and deletable — Part 4, rule 5.
//
// The important rule here is the one the schema spells out: a day with no row is
// "not logged", and a row with a count of zero is "smoked nothing". Those are
// different facts. An empty box is therefore refused rather than quietly saved
// as a zero — otherwise every day you forgot would read as a perfect one.

export type Result = { ok: boolean; message: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Nobody smokes 500 in a day; a number that big is a typo.
const MOST = 200;

export async function saveSmoking(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const date = String(form.get("date") ?? "").trim();

  if (!DATE.test(date)) return { ok: false, message: "Pick a day." };
  if (date > today()) return { ok: false, message: "That date is in the future." };

  const raw = String(form.get("count") ?? "").trim();

  if (!raw) {
    return {
      ok: false,
      message: "Type a number. Zero is a real answer — an empty box isn't.",
    };
  }

  const count = Number(raw);

  if (!Number.isFinite(count)) return { ok: false, message: "That isn't a number." };
  if (!Number.isInteger(count)) return { ok: false, message: "Whole cigarettes only." };
  if (count < 0) return { ok: false, message: "That can't be less than none." };
  if (count > MOST) return { ok: false, message: "That number doesn't look right." };

  const notes = String(form.get("notes") ?? "").trim();

  // One row per day is a database rule, so this updates the existing row rather
  // than failing when the same day is logged twice.
  const { error } = await db()
    .from("smoking")
    .upsert({ date, count, notes: notes || null }, { onConflict: "date" });

  if (error) return { ok: false, message: `Could not save: ${error.message}` };

  revalidatePath("/smoking");

  return { ok: true, message: `Saved ${count} for ${date}.` };
}

export async function deleteSmoking(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const id = Number(form.get("id"));

  if (!Number.isInteger(id)) return { ok: false, message: "Nothing to delete." };

  const { error } = await db().from("smoking").delete().eq("id", id);

  if (error) return { ok: false, message: `Could not delete: ${error.message}` };

  revalidatePath("/smoking");

  return { ok: true, message: "Deleted." };
}
