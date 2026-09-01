"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { readProduct } from "@/lib/product-fields";

export type Result = { ok: boolean; message: string };

// How many recipes and meals point at this product. Everything about what you
// may do to a product hangs off this number: zero means it's still free to
// change, anything else means it's frozen (Part 4, rule 1).
export async function timesUsed(productId: number): Promise<number> {
  const supabase = db();

  const [recipes, meals] = await Promise.all([
    supabase
      .from("recipe_items")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId),
    supabase
      .from("meal_items")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId),
  ]);

  if (recipes.error) throw new Error(recipes.error.message);
  if (meals.error) throw new Error(meals.error.message);

  return (recipes.count ?? 0) + (meals.count ?? 0);
}

// Creating a product, and — when it's replacing one — retiring the old one and
// linking the two in the same breath.
export async function createProduct(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const parsed = readProduct(form);
  if (!parsed.ok) return parsed;

  const replacesRaw = String(form.get("replaces") ?? "").trim();
  const replaces = replacesRaw ? Number(replacesRaw) : null;

  if (replacesRaw && !Number.isInteger(replaces)) {
    return { ok: false, message: "Something is wrong with the product being replaced." };
  }

  const supabase = db();

  const { data: created, error } = await supabase
    .from("products")
    .insert(parsed.values)
    .select("id")
    .single();

  if (error) return { ok: false, message: `Could not save: ${error.message}` };

  if (replaces !== null) {
    const { data: retiredRows, error: linkError } = await supabase
      .from("products")
      .update({ retired: true, replaced_by: created.id })
      .eq("id", replaces)
      // Asking for the changed rows back is the only way to tell "retired it"
      // from "matched nothing" — updating a row that isn't there is not an
      // error, it just quietly does nothing.
      .select("id");

    const linkFailed = linkError !== null || (retiredRows ?? []).length === 0;

    // Two separate writes, because this database can't wrap them in one
    // transaction. If the second doesn't happen, the first is undone by hand, so
    // you're never left with a half-done replacement — the new product is brand
    // new and unused, so removing it is always safe.
    if (linkFailed) {
      const reason = linkError
        ? `Could not retire the old product: ${linkError.message}.`
        : "The product you were replacing no longer exists.";

      const { error: undoError } = await supabase
        .from("products")
        .delete()
        .eq("id", created.id);

      return {
        ok: false,
        message: undoError
          ? `${reason} The new product could not be removed either — open the products list and check both by hand.`
          : `${reason} Nothing was changed.`,
      };
    }
  }

  revalidatePath("/products");
  redirect(`/products/${created.id}`);
}

// Editing a product that nothing points at yet. Anything else is refused here,
// not just hidden in the interface.
export async function updateProduct(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return { ok: false, message: "Nothing to save." };

  const parsed = readProduct(form);
  if (!parsed.ok) return parsed;

  if ((await timesUsed(id)) > 0) {
    return {
      ok: false,
      message:
        "This product has been used, so its price and nutrition are frozen. Use Replace instead.",
    };
  }

  const { error } = await db().from("products").update(parsed.values).eq("id", id);

  if (error) return { ok: false, message: `Could not save: ${error.message}` };

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);

  return { ok: true, message: "Saved." };
}

// Renaming is always allowed, used or not. A name is a label for you, not
// something any calculation depends on.
export async function renameProduct(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const id = Number(form.get("id"));
  const name = String(form.get("name") ?? "").trim();

  if (!Number.isInteger(id)) return { ok: false, message: "Nothing to save." };
  if (!name) return { ok: false, message: "Give it a name." };

  const { error } = await db().from("products").update({ name }).eq("id", id);

  if (error) return { ok: false, message: `Could not save: ${error.message}` };

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);

  return { ok: true, message: "Renamed." };
}

export async function deleteProduct(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return { ok: false, message: "Nothing to delete." };

  const { error } = await db().from("products").delete().eq("id", id);

  if (error) {
    // The database refuses to delete anything that's been used, rather than
    // taking the meals with it.
    if (/foreign key|restrict/i.test(error.message)) {
      return {
        ok: false,
        message:
          "This product has been used, so it can't be deleted — that would change meals you've already logged. Retire it instead.",
      };
    }
    return { ok: false, message: `Could not delete: ${error.message}` };
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function setRetired(
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const id = Number(form.get("id"));
  const retired = String(form.get("retired")) === "true";

  if (!Number.isInteger(id)) return { ok: false, message: "Nothing to change." };

  const { error } = await db().from("products").update({ retired }).eq("id", id);

  if (error) return { ok: false, message: `Could not change: ${error.message}` };

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);

  return { ok: true, message: retired ? "Retired." : "Back in use." };
}
