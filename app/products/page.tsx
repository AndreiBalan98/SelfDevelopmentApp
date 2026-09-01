import Link from "next/link";
import { db } from "@/lib/supabase";
import { ProductSearch } from "./product-search";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const { q, retired } = await searchParams;

  const search = typeof q === "string" ? q.trim() : "";
  const showRetired = retired === "1";

  let query = db()
    .from("products")
    .select("id, name, unit, package_price, package_quantity, calories, retired")
    .order("name", { ascending: true });

  // Retired products stay in the database forever so old meals still add up.
  // They're hidden here by default, and the toggle is how you get at the price
  // history — oats, oats 2, oats 3.
  if (!showRetired) query = query.eq("retired", false);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;
  const products = data ?? [];

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Products</h1>
        <Link href="/" className="text-sm text-accent">
          Home
        </Link>
      </header>

      <ProductSearch search={search} showRetired={showRetired} />

      {error ? (
        <p className="rounded-lg border border-border bg-surface p-3 text-sm">
          Could not reach the database: {error.message}
        </p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted">
          {search
            ? `Nothing matching “${search}”.`
            : showRetired
              ? "Nothing here yet."
              : "No products yet. The first one goes in below."}
        </p>
      ) : (
        <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                href={`/products/${product.id}`}
                className="flex items-baseline justify-between gap-3 px-3 py-2.5"
              >
                <span className="flex flex-col">
                  <span className={product.retired ? "text-muted line-through" : ""}>
                    {product.name}
                  </span>
                  <span className="text-xs text-muted tabular-nums">
                    {(
                      (product.package_price / product.package_quantity) *
                      100
                    ).toFixed(2)}{" "}
                    per 100 {product.unit}
                  </span>
                </span>

                <span className="text-sm text-muted tabular-nums">
                  {product.calories} kcal
                </span>
              </Link>
            </li>
          ))}
        </ul>
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
