"use client";

import Link from "next/link";
import { useState } from "react";

export type RecipeRow = {
  id: number;
  name: string;
  retired: boolean;
  // Worked out on the server: "4 servings · 250 g each", "310 kcal".
  servingsLine: string;
  caloriesLine: string;
};

// The search box, the retired toggle, and the list they filter.
//
// The filtering happens on the phone. The screen arrives with every recipe,
// retired ones included, and typing or flipping the toggle only changes which
// of them are shown — nothing reloads, so the page stays where it was.
export function RecipeSearch({ recipes }: { recipes: RecipeRow[] }) {
  const [text, setText] = useState("");
  const [showRetired, setShowRetired] = useState(false);

  const search = text.trim();
  const term = search.toLowerCase();

  // Retired recipes stay in the database forever so old meals still add up.
  const shown = recipes.filter(
    (recipe) => (showRetired || !recipe.retired) && recipe.name.toLowerCase().includes(term),
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        <input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Search"
          aria-label="Search recipes"
          autoComplete="off"
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-base
                     outline-none focus:border-accent"
        />

        <button
          type="button"
          onClick={() => setShowRetired(!showRetired)}
          className={`self-start text-xs ${showRetired ? "text-accent" : "text-muted"}`}
        >
          {showRetired ? "Hide retired recipes" : "Show retired recipes"}
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted">
          {search
            ? `Nothing matching “${search}”.`
            : showRetired
              ? "Nothing here yet."
              : "No recipes yet. The first one goes in below."}
        </p>
      ) : (
        <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
          {shown.map((recipe) => (
            <li key={recipe.id}>
              <Link
                href={`/recipes/${recipe.id}`}
                className="flex items-baseline justify-between gap-3 px-3 py-2.5"
              >
                <span className="flex flex-col">
                  <span className={recipe.retired ? "text-muted line-through" : ""}>
                    {recipe.name}
                  </span>
                  <span className="text-xs text-muted tabular-nums">{recipe.servingsLine}</span>
                </span>

                <span className="text-sm text-muted tabular-nums">{recipe.caloriesLine}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
