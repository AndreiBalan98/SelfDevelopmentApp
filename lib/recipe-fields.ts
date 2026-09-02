// Reading a recipe off a submitted form and checking it before it goes near the
// database. Shared by creating, replacing and editing, so a value typed on one
// screen is validated exactly the same way on every other.

export type RecipeValues = {
  name: string;
  servings: number;
  cooked_weight: number | null;
  notes: string | null;
};

// The iPhone number pad offers a comma in some layouts, so "1,5" has to mean the
// same as "1.5". Empty means genuinely empty, never zero.
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

export function readCookedWeight(
  raw: FormDataEntryValue | null,
): { ok: true; value: number | null } | { ok: false; message: string } {
  const weight = toNumber(raw);

  if (weight === "bad") return { ok: false, message: "The cooked weight isn't a number." };
  if (weight === null) return { ok: true, value: null };
  if (weight <= 0 || weight > 1000000) {
    return { ok: false, message: "That cooked weight doesn't look right." };
  }

  return { ok: true, value: round(weight, 2) };
}

export function readRecipe(
  form: FormData,
): { ok: true; values: RecipeValues } | { ok: false; message: string } {
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { ok: false, message: "Give it a name." };

  const servings = toNumber(form.get("servings"));
  if (servings === "bad") return { ok: false, message: "Servings isn't a number." };
  if (servings === null) return { ok: false, message: "Type how many servings it makes." };
  if (!Number.isInteger(servings) || servings < 1 || servings > 1000) {
    return { ok: false, message: "Servings has to be a whole number, at least 1." };
  }

  const cooked = readCookedWeight(form.get("cooked_weight"));
  if (!cooked.ok) return cooked;

  const notes = String(form.get("notes") ?? "").trim();

  return {
    ok: true,
    values: { name, servings, cooked_weight: cooked.value, notes: notes || null },
  };
}
