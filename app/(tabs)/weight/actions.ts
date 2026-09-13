"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { dayFor } from "@/lib/day";
import { rangeQuery } from "@/lib/range";

// Back to the chart after a save or a delete, on the range it was showing. The
// range comes back from the form, so it's rebuilt from its checked parts
// (lib/range.ts) rather than trusted as it arrived.
function backToChart(form: FormData): never {
  const params = new URLSearchParams(String(form.get("back") ?? ""));
  const query = rangeQuery({
    range: params.get("range") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
  });
  redirect(query ? `/weight?${query}` : "/weight");
}

// Saving and deleting a weigh-in.
//
// Nothing in the database points at a weigh-in, so unlike a product or a recipe
// these are freely editable and deletable — Part 4, rule 5. Changing one
// rewrites no history.

export type SaveResult = { ok: boolean; message: string };

export async function saveWeight(
  _previous: SaveResult | null,
  form: FormData,
): Promise<SaveResult> {
  const date = String(form.get("date") ?? "").trim();
  const rawKg = String(form.get("kg") ?? "").trim().replace(",", ".");
  const notes = String(form.get("notes") ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, message: "Pick a date." };
  }

  // A weigh-in in the future is always a mistake. The past is fine — the plan
  // wants every form to accept backfilling.
  if (date > dayFor(new Date())) {
    return { ok: false, message: "That date is in the future." };
  }

  const kg = Number(rawKg);

  if (!rawKg || Number.isNaN(kg)) {
    return { ok: false, message: "Type a weight." };
  }
  if (kg <= 0 || kg >= 1000) {
    return { ok: false, message: "That weight doesn't look right." };
  }

  // The column holds two decimals. Rounding here rather than letting the
  // database do it means what you see saved is what was stored.
  const rounded = Math.round(kg * 100) / 100;

  // One row per day is a database rule, so this updates the existing row rather
  // than failing when you log the same day twice.
  const { error } = await db()
    .from("weight")
    .upsert(
      { date, kg: rounded, notes: notes || null },
      { onConflict: "date" },
    );

  if (error) return { ok: false, message: `Could not save: ${error.message}` };

  // The new dot and the row under the chart are what say it worked.
  revalidatePath("/weight");
  backToChart(form);
}

export async function deleteWeight(
  _previous: SaveResult | null,
  form: FormData,
): Promise<SaveResult> {
  const id = Number(form.get("id"));

  if (!Number.isInteger(id)) {
    return { ok: false, message: "Nothing to delete." };
  }

  const { error } = await db().from("weight").delete().eq("id", id);

  if (error) return { ok: false, message: `Could not delete: ${error.message}` };

  revalidatePath("/weight");
  backToChart(form);
}
