"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { allRows } from "@/lib/pages";
import { dayFor, localTimestamp } from "@/lib/day";
import { readAmount, readMeal } from "@/lib/meal-fields";
import { currentVersion } from "@/lib/replacements";

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

// Copying a past meal onto the day you're looking at, then opening it so you can
// adjust the portions — which is almost always the thing that differs.
//
// Lines and the meal/snack type come across. The note and the score deliberately
// do not: a score is a judgement about one particular plate of food, and
// carrying it forward would fill the history with scores that were never given.
export async function repeatMeal(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const sourceId = Number(form.get("source_id"));
  const day = String(form.get("day") ?? "").trim();

  if (!Number.isInteger(sourceId)) return { ok: false, message: "Nothing to repeat." };
  if (!DATE.test(day)) return { ok: false, message: "Pick a day first." };

  const supabase = db();

  const [{ data: source }, { data: sourceLines }, { data: products }, { data: recipes }] =
    await Promise.all([
      supabase.from("meals").select("type").eq("id", sourceId).maybeSingle(),
      supabase
        .from("meal_items")
        .select("product_id, recipe_id, quantity, quantity_unit, servings")
        .eq("meal_id", sourceId)
        .order("id", { ascending: true }),
      // Every product and recipe, a page at a time (lib/pages.ts), to follow
      // anything retired to what replaced it.
      allRows((from, to) =>
        supabase.from("products").select("id, retired, replaced_by").order("id").range(from, to),
      ),
      allRows((from, to) =>
        supabase.from("recipes").select("id, retired, replaced_by").order("id").range(from, to),
      ),
    ]);

  if (!source) return { ok: false, message: "That meal no longer exists." };

  const lines = sourceLines ?? [];
  if (lines.length === 0) {
    return { ok: false, message: "There was nothing in that meal to repeat." };
  }

  const productsById = new Map((products ?? []).map((row) => [row.id, row]));
  const recipesById = new Map((recipes ?? []).map((row) => [row.id, row]));

  const now = new Date();
  const eatenAt = day === dayFor(now) ? now.toISOString() : localTimestamp(day, "12:00");

  const { data: created, error } = await supabase
    .from("meals")
    .insert({ eaten_at: eatenAt, day, type: source.type })
    .select("id")
    .single();

  if (error) return { ok: false, message: `Could not repeat it: ${error.message}` };

  // Anything retired is followed to whatever replaced it, so a repeat is made of
  // what you'd buy today. Something retired with nothing after it is copied as
  // it stands — you did eat it, and refusing would fail the whole repeat over
  // one line. The new meal says which lines moved.
  const copied = lines.map((line) => ({
    meal_id: created.id,
    product_id:
      line.product_id === null ? null : currentVersion(line.product_id, productsById),
    recipe_id: line.recipe_id === null ? null : currentVersion(line.recipe_id, recipesById),
    quantity: line.quantity,
    quantity_unit: line.quantity_unit,
    servings: line.servings,
  }));

  const { error: linesError } = await supabase.from("meal_items").insert(copied);

  // Two writes with no transaction available. If the lines don't land, the new
  // meal is removed, so a failed repeat leaves nothing behind.
  if (linesError) {
    const { error: undoError } = await supabase.from("meals").delete().eq("id", created.id);

    return {
      ok: false,
      message: undoError
        ? `Could not copy what was in it: ${linesError.message}. The empty meal could not be removed either — open the day and delete it by hand.`
        : `Could not copy what was in it: ${linesError.message}. Nothing was changed.`,
    };
  }

  revalidatePath("/meals");
  // "from" is what lets the new meal work out which lines moved to a
  // replacement, by comparing itself against the meal it was copied from.
  redirect(`/meals/${created.id}?from=${sourceId}`);
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

  // Redraws the meal where it stands, with the new line in it. Deliberately not
  // a redirect: that re-opens the page, and re-opening it scrolls to the top.
  revalidatePath("/meals");
  revalidatePath(`/meals/${mealId}`);

  return { ok: true, message: "Added." };
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
