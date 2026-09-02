// Reading a meal, and a meal line, off a submitted form and checking them
// before they go near the database.

import { localTimestamp } from "@/lib/day";

export type MealValues = {
  eaten_at: string;
  day: string;
  type: "meal" | "snack";
  note: string | null;
  score: number | null;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

// The iPhone number pad offers a comma in some layouts, so "1,5" has to mean
// the same as "1.5". Empty means genuinely empty, never zero.
export function toNumber(raw: FormDataEntryValue | null): number | null | "bad" {
  const text = String(raw ?? "").trim().replace(",", ".");
  if (!text) return null;
  const value = Number(text);
  if (!Number.isFinite(value)) return "bad";
  return value;
}

export function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function readMeal(
  form: FormData,
): { ok: true; values: MealValues } | { ok: false; message: string } {
  const date = String(form.get("date") ?? "").trim();
  const time = String(form.get("time") ?? "").trim();
  const day = String(form.get("day") ?? "").trim();

  if (!DATE.test(date)) return { ok: false, message: "Pick a date for the meal." };
  if (!TIME.test(time)) return { ok: false, message: "Pick a time for the meal." };
  if (!DATE.test(day)) return { ok: false, message: "Pick the day it counts towards." };

  const hours = Number(time.slice(0, 2));
  const minutes = Number(time.slice(3, 5));
  if (hours > 23 || minutes > 59) return { ok: false, message: "That time doesn't exist." };

  const type = String(form.get("type") ?? "");
  if (type !== "meal" && type !== "snack") {
    return { ok: false, message: "Pick meal or snack." };
  }

  const score = toNumber(form.get("score"));
  if (score === "bad") return { ok: false, message: "The score isn't a number." };
  if (score !== null && (!Number.isInteger(score) || score < 1 || score > 10)) {
    return { ok: false, message: "The score has to be a whole number from 1 to 10." };
  }

  const note = String(form.get("note") ?? "").trim();

  return {
    ok: true,
    values: {
      // The one place a typed date and time become an instant. It's local,
      // Bucharest, and it handles both clock changes.
      eaten_at: localTimestamp(date, time),
      day,
      type,
      note: note || null,
      score,
    },
  };
}

// A quantity of a product, or a number of servings of a recipe.
export function readAmount(
  raw: FormDataEntryValue | null,
  what: "quantity" | "servings",
): { ok: true; value: number } | { ok: false; message: string } {
  const value = toNumber(raw);

  if (value === "bad") {
    return { ok: false, message: `That ${what === "servings" ? "number of servings" : "quantity"} isn't a number.` };
  }
  if (value === null) {
    return {
      ok: false,
      message: what === "servings" ? "Type how many servings." : "Type how much.",
    };
  }

  const limit = what === "servings" ? 1000 : 1000000;
  if (value <= 0 || value > limit) {
    return {
      ok: false,
      message: `That ${what === "servings" ? "number of servings" : "quantity"} doesn't look right.`,
    };
  }

  return { ok: true, value: round(value, 2) };
}
