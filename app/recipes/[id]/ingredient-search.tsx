"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Searching for a product to add, without leaving the recipe.
//
// It rewrites the URL rather than fetching anything itself, so the server does
// the searching, and a half-built recipe is never spread across two screens —
// iOS throws away a home-screen app's state when it relaunches.
export function IngredientSearch({
  recipeId,
  search,
}: {
  recipeId: number;
  search: string;
}) {
  const router = useRouter();
  const [text, setText] = useState(search);

  useEffect(() => {
    if (text === search) return;

    const timer = setTimeout(() => {
      const term = text.trim();
      router.replace(
        term ? `/recipes/${recipeId}?q=${encodeURIComponent(term)}` : `/recipes/${recipeId}`,
      );
    }, 250);

    return () => clearTimeout(timer);
  }, [text, search, recipeId, router]);

  return (
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
  );
}
