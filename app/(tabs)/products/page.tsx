import { db } from "@/lib/supabase";
import { allRows } from "@/lib/pages";
import { costOf, nutritionOf } from "@/lib/nutrition";
import { valueOf } from "@/lib/value";
import { ValueList } from "../value-list";
import { NutritionHeader } from "../headers";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  // Every product, retired ones included: the search box, the sort pills and
  // the retired toggle work on this list on the phone.
  // Read a page at a time (lib/pages.ts): one question stops at 1,000 rows.
  const supabase = db();
  const { data, error } = await allRows((from, to) =>
    supabase
      .from("products")
      .select(
        "id, name, retired, package_price, package_quantity, calories, fat, saturated_fat, carbs, sugars_total, sugars_added, fibre, protein, salt",
      )
      .order("name")
      .order("id")
      .range(from, to),
  );

  // What each product is worth for the money, worked out from 100 of its own
  // unit — the value numbers don't depend on the amount.
  const rows = (data ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    retired: product.retired,
    href: `/products/${product.id}`,
    value: valueOf({
      cost: costOf(product, 100),
      nutrition: nutritionOf(product, 100),
      weight: 100,
    }),
  }));

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-4">
      <NutritionHeader active="products" />

      {error ? (
        <p className="rounded-xl bg-surface p-3.5 text-sm">
          Could not reach the database: {error.message}
        </p>
      ) : (
        <ValueList rows={rows} noun="product" newHref="/products/new" />
      )}
    </main>
  );
}
