"use client";

import Link from "next/link";
import { useState } from "react";

export type ProductRow = {
  id: number;
  name: string;
  unit: "g" | "ml";
  package_price: number;
  package_quantity: number;
  calories: number;
  retired: boolean;
};

// The search box, the retired toggle, and the list they filter.
//
// The filtering happens on the phone. The screen arrives with every product,
// retired ones included, and typing or flipping the toggle only changes which
// of them are shown — nothing reloads, so the page stays where it was.
export function ProductSearch({ products }: { products: ProductRow[] }) {
  const [text, setText] = useState("");
  const [showRetired, setShowRetired] = useState(false);

  const search = text.trim();
  const term = search.toLowerCase();

  // Retired products stay in the database forever so old meals still add up.
  // They're hidden here by default, and the toggle is how you get at the price
  // history — oats, oats 2, oats 3.
  const shown = products.filter(
    (product) =>
      (showRetired || !product.retired) && product.name.toLowerCase().includes(term),
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        <input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Search"
          aria-label="Search products"
          autoComplete="off"
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-base
                     outline-none focus:border-accent"
        />

        <button
          type="button"
          onClick={() => setShowRetired(!showRetired)}
          className={`self-start text-xs ${showRetired ? "text-accent" : "text-muted"}`}
        >
          {showRetired ? "Hide retired products" : "Show retired products"}
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted">
          {search
            ? `Nothing matching “${search}”.`
            : showRetired
              ? "Nothing here yet."
              : "No products yet. The first one goes in below."}
        </p>
      ) : (
        <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
          {shown.map((product) => (
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
                    {((product.package_price / product.package_quantity) * 100).toFixed(2)}{" "}
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
    </>
  );
}
