"use client";

import { useState } from "react";
import { AddLineForm } from "./line-forms";

const RESULTS = 8;

export type IngredientChoice = {
  id: number;
  name: string;
  unit: "g" | "ml";
  pieceGrams: number | null;
};

// Searching for a product to add, without leaving the recipe.
//
// The searching happens on the phone. The screen arrives with every product
// you could add — retired ones are already left out — and typing only filters
// that list, so results appear between letters and nothing reloads the page.
// Nothing goes to the server until you tap Add.
export function IngredientSearch({
  recipeId,
  products,
}: {
  recipeId: number;
  products: IngredientChoice[];
}) {
  const [text, setText] = useState("");

  const term = text.trim().toLowerCase();
  const matches = term
    ? products.filter((product) => product.name.toLowerCase().includes(term)).slice(0, RESULTS)
    : [];

  // After an Add the box empties, ready for the next ingredient.
  const clear = () => setText("");

  return (
    <>
      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Search products to add"
        aria-label="Search products to add"
        autoComplete="off"
        className="rounded-lg border border-border bg-surface px-4 py-2.5 text-base
                   outline-none focus:border-accent"
      />

      {term &&
        (matches.length === 0 ? (
          <p className="text-sm text-muted">Nothing matching “{text.trim()}”.</p>
        ) : (
          <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
            {matches.map((product) => (
              <li key={product.id}>
                <AddLineForm
                  recipeId={recipeId}
                  productId={product.id}
                  name={product.name}
                  unit={product.unit}
                  pieceGrams={product.pieceGrams}
                  onAdded={clear}
                />
              </li>
            ))}
          </ul>
        ))}
    </>
  );
}
