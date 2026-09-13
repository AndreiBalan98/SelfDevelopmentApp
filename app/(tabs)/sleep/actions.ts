"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { dayFor } from "@/lib/day";
import { sleepQuery } from "./back";

// Saving and deleting a night's sleep.
//
// Nothing in the database points at a night, so like a weigh-in these are freely
// editable and deletable — Part 4, rule 5. Changing one rewrites no history.

export type Result = { ok: boolean; message: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

// Back to the Sleep tab after a save or a delete: to the period or the chart it
// was showing, or, from a single night, to the night just saved — the new arc
// is what says it worked. What to go back to comes back from the form, so it's
// rebuilt from its checked parts (./back.ts) rather than trusted as it arrived.
function backToClock(form: FormData, night: string): never {
  const params = new URLSearchParams(String(form.get("back") ?? ""));
  const query = sleepQuery({
    range: params.get("range") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    view: params.get("view") ?? undefined,
  });
  if (query) redirect(`/sleep?${query}`);
  redirect(night === dayFor(new Date()) ? "/sleep" : `/sleep?date=${night}`);
}

function readTime(raw: FormDataEntryValue | null): string | null | "bad" {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  if (!TIME.test(text)) return "bad";

  const hours = Number(text.slice(0, 2));
  const minutes = Number(text.slice(3, 5));
  if (hours > 23 || minutes > 59) return "bad";

  return text;
}

export async function saveSleep(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  // The wake-up date. Bedtime is usually the evening before, which is worked out
  // from the two times rather than asked.
  const date = String(form.get("date") ?? "").trim();

  if (!DATE.test(date)) return { ok: false, message: "Pick a day." };
  if (date > dayFor(new Date())) return { ok: false, message: "That date is in the future." };

  const bedtime = readTime(form.get("bedtime"));
  if (bedtime === "bad") return { ok: false, message: "That bedtime isn't a real time." };

  const wakeTime = readTime(form.get("wake_time"));
  if (wakeTime === "bad") return { ok: false, message: "That wake-up time isn't a real time." };

  const rawQuality = String(form.get("quality") ?? "").trim();
  const quality = rawQuality ? Number(rawQuality) : null;

  if (quality !== null && (!Number.isInteger(quality) || quality < 1 || quality > 10)) {
    return { ok: false, message: "The score has to be a whole number from 1 to 10." };
  }

  const notes = String(form.get("notes") ?? "").trim();

  if (bedtime === null && wakeTime === null && quality === null && !notes) {
    return { ok: false, message: "Nothing to save yet." };
  }

  // One row per day is a database rule, so this updates the existing row rather
  // than failing when the same night is logged twice.
  const { error } = await db()
    .from("sleep")
    .upsert(
      { date, bedtime, wake_time: wakeTime, quality, notes: notes || null },
      { onConflict: "date" },
    );

  if (error) return { ok: false, message: `Could not save: ${error.message}` };

  revalidatePath("/sleep");
  backToClock(form, date);
}

export async function deleteSleep(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const id = Number(form.get("id"));
  const date = String(form.get("date") ?? "");

  if (!Number.isInteger(id) || !DATE.test(date)) return { ok: false, message: "Nothing to delete." };

  const { error } = await db().from("sleep").delete().eq("id", id);

  if (error) return { ok: false, message: `Could not delete: ${error.message}` };

  revalidatePath("/sleep");
  backToClock(form, date);
}
