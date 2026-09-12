import Link from "next/link";
import { db } from "@/lib/supabase";
import { ProductSearch } from "./product-search";
import { NutritionHeader } from "../headers";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  // Every product, retired ones included: the search box and the retired
  // toggle filter this list on the phone.
  const { data, error } = await db()
    .from("products")
    .select("id, name, unit, package_price, package_quantity, calories, retired")
    .order("name", { ascending: true });

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-6">
      <NutritionHeader active="products" />

      {error ? (
        <p className="rounded-lg border border-border bg-surface p-3 text-sm">
          Could not reach the database: {error.message}
        </p>
      ) : (
        <ProductSearch products={data ?? []} />
      )}

      <Link
        href="/products/new"
        className="rounded-lg bg-accent px-4 py-3 text-center font-medium text-black"
      >
        Add a product
      </Link>
    </main>
  );
}
