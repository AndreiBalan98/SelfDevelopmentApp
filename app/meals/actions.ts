"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { dayFor, localTimestamp } from "@/lib/day";
import { readAmount, readMeal } from "@/lib/meal-fields";

export type Result = { ok: boolean; message: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Nothing in the database points at a meal, so unlike a product or a recipe
// there is nothing to freeze here: every meal and every line stays editable and
// deletable forever (Part 4, rule 5).

// Tapping Add creates the meal there and then and drops you straight into it,
// rather than making you fill in a form before you can start typing food. The
// details it needs already have right answers.
export async function createMeal(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const day = String(form.get("day") ?? "").trim();
  if (!DATE.test(day)) return { ok: false, message: "Pick a day first." };

  const now = new Date();

  // Logging as you eat gets the real time. Backfilling gets midday, which is
  // deliberate: the current clock time on a past date is fiction anyway, and
  // logging yesterday's dinner at 01:30 tonight would land before the 04:00
  // rule and count towards the day before yesterday.
  const eatenAt =
    day === dayFor(now) ? now.toISOString() : localTimestamp(day, "12:00");

  const { data: created, error } = await db()
    .from("meals")
    .insert({ eaten_at: eatenAt, day, type: "meal" })
    .select("id")
    .single();

  if (error) return { ok: false, message: `Could not start a meal: ${error.message}` };

  revalidatePath("/meals");
  redirect(`/meals/${created.id}`);
}

export async function updateMeal(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return { ok: false, message: "Nothing to save." };

  const parsed = readMeal(form);
  if (!parsed.ok) return parsed;

  const { error } = await db().from("meals").update(parsed.values).eq("id", id);

  if (error) return { ok: false, message: `Could not save: ${error.message}` };

  revalidatePath("/meals");
  revalidatePath(`/meals/${id}`);

  return { ok: true, message: "Saved." };
}

export async function deleteMeal(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const id = Number(form.get("id"));
  const day = String(form.get("day") ?? "").trim();

  if (!Number.isInteger(id)) return { ok: false, message: "Nothing to delete." };

  // Deleting a meal takes its own lines with it and nothing else. That's always
  // allowed — nothing anywhere points at a meal.
  const { error } = await db().from("meals").delete().eq("id", id);

  if (error) return { ok: false, message: `Could not delete: ${error.message}` };

  revalidatePath("/meals");
  redirect(DATE.test(day) ? `/meals?day=${day}` : "/meals");
}

// ---------------------------------------------------------------------------
// What was in it
// ---------------------------------------------------------------------------

export async function addMealLine(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const mealId = Number(form.get("meal_id"));
  if (!Number.isInteger(mealId)) return { ok: false, message: "Nothing to add it to." };

  const kind = String(form.get("kind") ?? "");
  const supabase = db();

  if (kind === "recipe") {
    const recipeId = Number(form.get("recipe_id"));
    if (!Number.isInteger(recipeId)) return { ok: false, message: "No recipe chosen." };

    const servings = readAmount(form.get("servings"), "servings");
    if (!servings.ok) return servings;

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select("retired")
      .eq("id", recipeId)
      .maybeSingle();

    if (recipeError) return { ok: false, message: `Could not save: ${recipeError.message}` };
    if (!recipe) return { ok: false, message: "That recipe no longer exists." };
    // Retired recipes are hidden from the search, so this only happens if one
    // was retired on another screen while this one was open.
    if (recipe.retired) {
      return { ok: false, message: "That recipe has been retired — use the one that replaced it." };
    }

    const { error } = await supabase
      .from("meal_items")
      .insert({ meal_id: mealId, recipe_id: recipeId, servings: servings.value });

    if (error) return { ok: false, message: `Could not add it: ${error.message}` };
  } else if (kind === "product") {
    const productId = Number(form.get("product_id"));
    if (!Number.isInteger(productId)) return { ok: false, message: "No product chosen." };

    const quantityUnit = String(form.get("quantity_unit") ?? "unit");
    if (quantityUnit !== "unit" && quantityUnit !== "piece") {
      return { ok: false, message: "Pick grams or pieces." };
    }

    const quantity = readAmount(form.get("quantity"), "quantity");
    if (!quantity.ok) return quantity;

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("retired, piece_grams")
      .eq("id", productId)
      .maybeSingle();

    if (productError) return { ok: false, message: `Could not save: ${productError.message}` };
    if (!product) return { ok: false, message: "That product no longer exists." };
    if (product.retired) {
      return { ok: false, message: "That product has been retired — use the one that replaced it." };
    }
    // Pieces mean nothing without knowing what one weighs.
    if (quantityUnit === "piece" && product.piece_grams === null) {
      return { ok: false, message: "That product isn't counted in pieces." };
    }

    const { error } = await supabase.from("meal_items").insert({
      meal_id: mealId,
      product_id: productId,
      quantity: quantity.value,
      quantity_unit: quantityUnit,
    });

    if (error) return { ok: false, message: `Could not add it: ${error.message}` };
  } else {
    return { ok: false, message: "Nothing chosen." };
  }

  revalidatePath("/meals");
  // Back to the meal with the search box empty, ready for the next thing.
  redirect(`/meals/${mealId}`);
}

export async function setMealLineAmount(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const mealId = Number(form.get("meal_id"));
  const lineId = Number(form.get("line_id"));
  const kind = String(form.get("kind") ?? "");

  if (!Number.isInteger(mealId) || !Number.isInteger(lineId)) {
    return { ok: false, message: "Nothing to change." };
  }

  let values: { quantity: number } | { servings: number };

  if (kind === "recipe") {
    const servings = readAmount(form.get("servings"), "servings");
    if (!servings.ok) return servings;
    values = { servings: servings.value };
  } else {
    const quantity = readAmount(form.get("quantity"), "quantity");
    if (!quantity.ok) return quantity;
    values = { quantity: quantity.value };
  }

  const { data: changed, error } = await db()
    .from("meal_items")
    .update(values)
    .eq("id", lineId)
    .eq("meal_id", mealId)
    .select("id");

  if (error) return { ok: false, message: `Could not save: ${error.message}` };
  // An update that matches nothing is not an error, so it has to be checked.
  if ((changed ?? []).length === 0) {
    return { ok: false, message: "That is no longer in this meal." };
  }

  revalidatePath("/meals");
  revalidatePath(`/meals/${mealId}`);

  return { ok: true, message: "Saved." };
}

export async function removeMealLine(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const mealId = Number(form.get("meal_id"));
  const lineId = Number(form.get("line_id"));

  if (!Number.isInteger(mealId) || !Number.isInteger(lineId)) {
    return { ok: false, message: "Nothing to remove." };
  }

  const { error } = await db()
    .from("meal_items")
    .delete()
    .eq("id", lineId)
    .eq("meal_id", mealId);

  if (error) return { ok: false, message: `Could not remove it: ${error.message}` };

  revalidatePath("/meals");
  revalidatePath(`/meals/${mealId}`);

  return { ok: true, message: "Removed." };
}
