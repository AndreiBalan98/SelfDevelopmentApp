"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { allRows } from "@/lib/pages";
import { readRecipe, readCookedWeight, toNumber, round } from "@/lib/recipe-fields";
import { currentVersion } from "@/lib/replacements";

export type Result = { ok: boolean; message: string };

// How many meals point at this recipe. Everything about what you may do to a
// recipe hangs off this number: zero means it's still free to change, anything
// else means it's frozen (Part 4, rule 2).
export async function timesUsed(recipeId: number): Promise<number> {
  const { count, error } = await db()
    .from("meal_items")
    .select("*", { count: "exact", head: true })
    .eq("recipe_id", recipeId);

  if (error) throw new Error(error.message);

  return count ?? 0;
}

// The lines a copy of this recipe would get. A replacement follows every
// retired product to its current version; a duplicate copies them exactly as
// they are, retired ones included (Andrei's call, 2026-09-13). Read on the
// copy screen so you can see what's coming across, and again when saving so the
// answer comes from the database rather than from the page.
export async function linesForCopy(
  recipeId: number,
  follow: boolean,
): Promise<
  Array<{
    quantity: number;
    fromId: number;
    fromName: string;
    toId: number;
    toName: string;
    // The product the copy will point at has been retired.
    retired: boolean;
  }>
> {
  const supabase = db();

  const [{ data: lines, error: linesError }, { data: products, error: productsError }] =
    await Promise.all([
      supabase
        .from("recipe_items")
        .select("id, product_id, quantity")
        .eq("recipe_id", recipeId)
        .order("id", { ascending: true }),
      // Every product, a page at a time (lib/pages.ts), to follow anything
      // retired to what replaced it.
      allRows((from, to) =>
        supabase.from("products").select("id, name, retired, replaced_by").order("id").range(from, to),
      ),
    ]);

  if (linesError) throw new Error(linesError.message);
  if (productsError) throw new Error(productsError.message);

  const byId = new Map((products ?? []).map((product) => [product.id, product]));

  return (lines ?? []).map((line) => {
    const toId = follow ? currentVersion(line.product_id, byId) : line.product_id;

    return {
      quantity: line.quantity,
      fromId: line.product_id,
      fromName: byId.get(line.product_id)?.name ?? "a deleted product",
      toId,
      toName: byId.get(toId)?.name ?? "a deleted product",
      retired: byId.get(toId)?.retired ?? false,
    };
  });
}

// Creating a recipe. When it's replacing one: copying its ingredients, retiring
// the old one and linking the two in the same breath. When it's duplicating
// one: copying its ingredients as they are, and leaving the original alone.
export async function createRecipe(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const parsed = readRecipe(form);
  if (!parsed.ok) return parsed;

  const replacesRaw = String(form.get("replaces") ?? "").trim();
  const replaces = replacesRaw ? Number(replacesRaw) : null;
  const duplicatesRaw = String(form.get("duplicates") ?? "").trim();
  const duplicates = duplicatesRaw ? Number(duplicatesRaw) : null;

  if (replacesRaw && !Number.isInteger(replaces)) {
    return { ok: false, message: "Something is wrong with the recipe being replaced." };
  }
  if (duplicatesRaw && !Number.isInteger(duplicates)) {
    return { ok: false, message: "Something is wrong with the recipe being copied." };
  }
  if (replaces !== null && duplicates !== null) {
    return { ok: false, message: "A recipe can be replaced or copied, not both at once." };
  }

  const supabase = db();

  // The ingredients are read from the database, not from the page, so a form
  // left open while something changed elsewhere can't copy a stale list.
  const copied =
    replaces !== null
      ? await linesForCopy(replaces, true)
      : duplicates !== null
        ? await linesForCopy(duplicates, false)
        : [];

  const { data: created, error } = await supabase
    .from("recipes")
    .insert(parsed.values)
    .select("id")
    .single();

  if (error) return { ok: false, message: `Could not save: ${error.message}` };

  const createdId = created.id;

  // Three writes with no transaction available. If any of them fails the new
  // recipe is removed, which takes its own lines with it, so you're never left
  // with half a replacement. Deleting it is always safe — it's brand new and
  // nothing can point at it yet.
  async function undo(reason: string): Promise<Result> {
    const { error: undoError } = await supabase
      .from("recipes")
      .delete()
      .eq("id", createdId);

    return {
      ok: false,
      message: undoError
        ? `${reason} The new recipe could not be removed either — open the recipes list and check both by hand.`
        : `${reason} Nothing was changed.`,
    };
  }

  if (copied.length > 0) {
    const { error: linesError } = await supabase.from("recipe_items").insert(
      copied.map((line) => ({
        recipe_id: createdId,
        product_id: line.toId,
        quantity: line.quantity,
      })),
    );

    if (linesError) {
      return undo(`Could not copy the ingredients: ${linesError.message}.`);
    }
  }

  if (replaces !== null) {
    const { data: retiredRows, error: linkError } = await supabase
      .from("recipes")
      .update({ retired: true, replaced_by: created.id })
      .eq("id", replaces)
      // Asking for the changed rows back is the only way to tell "retired it"
      // from "matched nothing" — updating a row that isn't there is not an
      // error, it just quietly does nothing.
      .select("id");

    if (linkError || (retiredRows ?? []).length === 0) {
      return undo(
        linkError
          ? `Could not retire the old recipe: ${linkError.message}.`
          : "The recipe you were replacing no longer exists.",
      );
    }
  }

  revalidatePath("/recipes");
  redirect(`/recipes/${created.id}`);
}

// Editing a recipe nothing has eaten yet. Anything else is refused here, not
// just hidden in the interface.
export async function updateRecipe(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return { ok: false, message: "Nothing to save." };

  const parsed = readRecipe(form);
  if (!parsed.ok) return parsed;

  if ((await timesUsed(id)) > 0) {
    return {
      ok: false,
      message:
        "This recipe has been eaten, so its servings and ingredients are frozen. Use Replace instead.",
    };
  }

  const { error } = await db().from("recipes").update(parsed.values).eq("id", id);

  if (error) return { ok: false, message: `Could not save: ${error.message}` };

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);

  return { ok: true, message: "Saved." };
}

// The name and the notes stay editable forever, used or not. They're labels for
// you; no calculation depends on either.
export async function updateLabels(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const id = Number(form.get("id"));
  const name = String(form.get("name") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();

  if (!Number.isInteger(id)) return { ok: false, message: "Nothing to save." };
  if (!name) return { ok: false, message: "Give it a name." };

  const { error } = await db()
    .from("recipes")
    .update({ name, notes: notes || null })
    .eq("id", id);

  if (error) return { ok: false, message: `Could not save: ${error.message}` };

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);

  return { ok: true, message: "Saved." };
}

// The cooked weight is also editable forever, even on a recipe you've eaten.
// A meal records a number of *servings*, so per-serving calories and cost come
// from the ingredients divided by the servings — the cooked weight is never
// part of that sum. It only tells you what a portion weighs and how much the
// pan lost, so typing it in later, or correcting it, changes no history.
export async function setCookedWeight(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return { ok: false, message: "Nothing to save." };

  const cooked = readCookedWeight(form.get("cooked_weight"));
  if (!cooked.ok) return cooked;

  const { error } = await db()
    .from("recipes")
    .update({ cooked_weight: cooked.value })
    .eq("id", id);

  if (error) return { ok: false, message: `Could not save: ${error.message}` };

  revalidatePath(`/recipes/${id}`);

  return { ok: true, message: cooked.value === null ? "Cleared." : "Saved." };
}

export async function setRetired(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const id = Number(form.get("id"));
  const retired = String(form.get("retired")) === "true";

  if (!Number.isInteger(id)) return { ok: false, message: "Nothing to change." };

  const { error } = await db().from("recipes").update({ retired }).eq("id", id);

  if (error) return { ok: false, message: `Could not change: ${error.message}` };

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);

  return { ok: true, message: retired ? "Retired." : "Back in use." };
}

export async function deleteRecipe(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return { ok: false, message: "Nothing to delete." };

  const { error } = await db().from("recipes").delete().eq("id", id);

  if (error) {
    // The database refuses to delete a recipe anything else points at, rather
    // than taking that other thing with it. Its own ingredient lines do go with
    // it, which is safe — they mean nothing on their own.
    //
    // Two different things can point at a recipe, and they need two different
    // answers. Saying "you've eaten this" about a recipe nobody has eaten sends
    // you looking in the wrong place entirely.
    if (/meal_items/i.test(error.message)) {
      return {
        ok: false,
        message:
          "This recipe has been eaten, so it can't be deleted — that would change meals you've already logged. Retire it instead.",
      };
    }

    if (/replaced_by/i.test(error.message)) {
      return {
        ok: false,
        message:
          "An older recipe was replaced by this one and still points at it, so deleting it would break that link. Retire it instead.",
      };
    }

    return { ok: false, message: `Could not delete: ${error.message}` };
  }

  revalidatePath("/recipes");
  redirect("/recipes");
}

// ---------------------------------------------------------------------------
// Ingredient lines
// ---------------------------------------------------------------------------

// Reads a quantity and refuses to touch a recipe that's already been eaten.
async function checkLineEdit(
  recipeId: number,
  rawQuantity: FormDataEntryValue | null,
): Promise<{ ok: true; quantity: number } | { ok: false; message: string }> {
  if (!Number.isInteger(recipeId)) return { ok: false, message: "Nothing to change." };

  const quantity = toNumber(rawQuantity);

  if (quantity === "bad") return { ok: false, message: "That quantity isn't a number." };
  if (quantity === null) return { ok: false, message: "Type how much goes in." };
  if (quantity <= 0 || quantity > 1000000) {
    return { ok: false, message: "That quantity doesn't look right." };
  }

  if ((await timesUsed(recipeId)) > 0) {
    return {
      ok: false,
      message:
        "This recipe has been eaten, so its ingredients are frozen. Use Replace instead.",
    };
  }

  return { ok: true, quantity: round(quantity, 2) };
}

export async function addLine(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const recipeId = Number(form.get("recipe_id"));
  const productId = Number(form.get("product_id"));

  if (!Number.isInteger(productId)) return { ok: false, message: "No product chosen." };

  const checked = await checkLineEdit(recipeId, form.get("quantity"));
  if (!checked.ok) return checked;

  const supabase = db();

  // Retired products are hidden from the search, so this only happens if a
  // product was retired on another screen while this one was open.
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("retired")
    .eq("id", productId)
    .maybeSingle();

  if (productError) return { ok: false, message: `Could not save: ${productError.message}` };
  if (!product) return { ok: false, message: "That product no longer exists." };
  if (product.retired) {
    return { ok: false, message: "That product has been retired — use the one that replaced it." };
  }

  const { error } = await supabase
    .from("recipe_items")
    .insert({ recipe_id: recipeId, product_id: productId, quantity: checked.quantity });

  if (error) return { ok: false, message: `Could not add it: ${error.message}` };

  // Redraws the recipe where it stands, with the new line in it. Deliberately
  // not a redirect: that re-opens the page, and re-opening it scrolls to the top.
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);

  return { ok: true, message: "Added." };
}

export async function setLineQuantity(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const recipeId = Number(form.get("recipe_id"));
  const lineId = Number(form.get("line_id"));

  if (!Number.isInteger(lineId)) return { ok: false, message: "Nothing to change." };

  const checked = await checkLineEdit(recipeId, form.get("quantity"));
  if (!checked.ok) return checked;

  const { data: changed, error } = await db()
    .from("recipe_items")
    .update({ quantity: checked.quantity })
    .eq("id", lineId)
    .eq("recipe_id", recipeId)
    .select("id");

  if (error) return { ok: false, message: `Could not save: ${error.message}` };
  // An update that matches nothing is not an error, so it has to be checked.
  if ((changed ?? []).length === 0) {
    return { ok: false, message: "That ingredient is no longer in this recipe." };
  }

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);

  return { ok: true, message: "Saved." };
}

export async function removeLine(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const recipeId = Number(form.get("recipe_id"));
  const lineId = Number(form.get("line_id"));

  if (!Number.isInteger(recipeId) || !Number.isInteger(lineId)) {
    return { ok: false, message: "Nothing to remove." };
  }

  if ((await timesUsed(recipeId)) > 0) {
    return {
      ok: false,
      message:
        "This recipe has been eaten, so its ingredients are frozen. Use Replace instead.",
    };
  }

  const { error } = await db()
    .from("recipe_items")
    .delete()
    .eq("id", lineId)
    .eq("recipe_id", recipeId);

  if (error) return { ok: false, message: `Could not remove it: ${error.message}` };

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);

  return { ok: true, message: "Removed." };
}
