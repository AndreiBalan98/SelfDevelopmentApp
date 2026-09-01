// Reading a product out of a submitted form, and checking it before it goes
// anywhere near the database.
//
// Shared by creating, replacing and editing, so a value typed on one screen is
// validated exactly the same way on every other.

export type ProductValues = {
  name: string;
  unit: "g" | "ml";
  package_price: number;
  package_quantity: number;
  ingredients_text: string | null;
  piece_grams: number | null;
  calories: number;
  protein: number | null;
  carbs: number | null;
  sugars_natural: number | null;
  sugars_added: number | null;
  fibre: number | null;
  fat: number | null;
  saturated_fat: number | null;
  salt: number | null;
};

// The iPhone number pad offers a comma in some layouts, so "78,4" has to mean
// the same as "78.4". Empty means genuinely empty, never zero — a blank fibre
// figure is "the label didn't say", which is not the same as "no fibre".
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

// Per-100 nutrition values. Nothing edible reaches 10000 of anything per 100 g,
// so a number that big is a typo rather than a fact.
const NUTRIENT_MAX = 10000;

const NUTRIENTS = [
  "calories",
  "protein",
  "carbs",
  "sugars_natural",
  "sugars_added",
  "fibre",
  "fat",
  "saturated_fat",
  "salt",
] as const;

const LABELS: Record<string, string> = {
  calories: "Calories",
  protein: "Protein",
  carbs: "Carbohydrate",
  sugars_natural: "Natural sugars",
  sugars_added: "Added sugars",
  fibre: "Fibre",
  fat: "Fat",
  saturated_fat: "Saturates",
  salt: "Salt",
};

export function readProduct(
  form: FormData,
): { ok: true; values: ProductValues } | { ok: false; message: string } {
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { ok: false, message: "Give it a name." };

  const unit = String(form.get("unit") ?? "");
  if (unit !== "g" && unit !== "ml") {
    return { ok: false, message: "Pick grams or millilitres." };
  }

  const price = toNumber(form.get("package_price"));
  if (price === "bad") return { ok: false, message: "The price isn't a number." };
  if (price === null) return { ok: false, message: "Type what the package cost." };
  if (price < 0 || price > 100000) {
    return { ok: false, message: "That price doesn't look right." };
  }

  const quantity = toNumber(form.get("package_quantity"));
  if (quantity === "bad") {
    return { ok: false, message: "The package size isn't a number." };
  }
  if (quantity === null) {
    return { ok: false, message: "Type how much was in the package." };
  }
  if (quantity <= 0 || quantity > 1000000) {
    return { ok: false, message: "That package size doesn't look right." };
  }

  const pieceGrams = toNumber(form.get("piece_grams"));
  if (pieceGrams === "bad") {
    return { ok: false, message: "Grams per piece isn't a number." };
  }
  if (pieceGrams !== null && (pieceGrams <= 0 || pieceGrams > 10000)) {
    return { ok: false, message: "Grams per piece doesn't look right." };
  }

  const nutrition: Record<string, number | null> = {};

  for (const field of NUTRIENTS) {
    const value = toNumber(form.get(field));

    if (value === "bad") {
      return { ok: false, message: `${LABELS[field]} isn't a number.` };
    }
    if (value !== null && (value < 0 || value > NUTRIENT_MAX)) {
      return { ok: false, message: `${LABELS[field]} doesn't look right.` };
    }

    // Salt is the one value small enough to need a third decimal.
    nutrition[field] = value === null ? null : round(value, field === "salt" ? 3 : 2);
  }

  // The only nutrition figure that is never optional, because a meal's calorie
  // total has to be complete to mean anything.
  if (nutrition.calories === null) {
    return { ok: false, message: "Calories are required — everything else is optional." };
  }

  const ingredients = String(form.get("ingredients_text") ?? "").trim();

  return {
    ok: true,
    values: {
      name,
      unit,
      package_price: round(price, 2),
      package_quantity: round(quantity, 2),
      ingredients_text: ingredients || null,
      piece_grams: pieceGrams === null ? null : round(pieceGrams, 2),
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      sugars_natural: nutrition.sugars_natural,
      sugars_added: nutrition.sugars_added,
      fibre: nutrition.fibre,
      fat: nutrition.fat,
      saturated_fat: nutrition.saturated_fat,
      salt: nutrition.salt,
    },
  };
}
