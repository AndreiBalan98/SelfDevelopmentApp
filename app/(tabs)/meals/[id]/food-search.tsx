"use client";

import { useState } from "react";
import { AddProductLine, AddRecipeLine } from "./meal-line-forms";

const RESULTS = 6;

export type RecipeChoice = { id: number; name: string; caloriesPerServing: number };
export type ProductChoice = {
  id: number;
  name: string;
  unit: "g" | "ml";
  pieceGrams: number | null;
};

// Searching for what you ate, without leaving the meal. Products and recipes
// come back in the same list, because deciding which of the two something is
// before you can look for it is a tap you shouldn't have to make.
//
// The searching happens on the phone. The screen arrives with everything you
// could add — retired things are already left out — and typing only filters
// that list, so results appear between letters and nothing reloads the page.
// Nothing goes to the server until you tap Add.
export function FoodSearch({
  mealId,
  recipes,
  products,
}: {
  mealId: number;
  recipes: RecipeChoice[];
  products: ProductChoice[];
}) {
  const [text, setText] = useState("");

  const term = text.trim().toLowerCase();
  const recipeMatches = term
    ? recipes.filter((recipe) => recipe.name.toLowerCase().includes(term)).slice(0, RESULTS)
    : [];
  const productMatches = term
    ? products.filter((product) => product.name.toLowerCase().includes(term)).slice(0, RESULTS)
    : [];

  // After an Add the box empties, ready for the next thing.
  const clear = () => setText("");

  return (
    <div className="flex flex-col gap-2 pt-1">
      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Search what you ate"
        aria-label="Search what you ate"
        autoComplete="off"
        className="rounded-lg border border-border bg-surface px-4 py-2.5 text-base
                   outline-none focus:border-accent"
      />

      {term &&
        (recipeMatches.length === 0 && productMatches.length === 0 ? (
          <p className="text-sm text-muted">Nothing matching “{text.trim()}”.</p>
        ) : (
          <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
            {recipeMatches.map((recipe) => (
              <li key={`recipe-${recipe.id}`}>
                <AddRecipeLine
                  mealId={mealId}
                  recipeId={recipe.id}
                  name={recipe.name}
                  caloriesPerServing={recipe.caloriesPerServing}
                  onAdded={clear}
                />
              </li>
            ))}

            {productMatches.map((product) => (
              <li key={`product-${product.id}`}>
                <AddProductLine
                  mealId={mealId}
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
    </div>
  );
}
