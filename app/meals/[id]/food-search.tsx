"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Searching for what you ate, without leaving the meal. Products and recipes
// come back in the same list, because deciding which of the two something is
// before you can look for it is a tap you shouldn't have to make.
export function FoodSearch({ mealId, search }: { mealId: number; search: string }) {
  const router = useRouter();
  const [text, setText] = useState(search);

  useEffect(() => {
    if (text === search) return;

    const timer = setTimeout(() => {
      const term = text.trim();
      router.replace(
        term ? `/meals/${mealId}?q=${encodeURIComponent(term)}` : `/meals/${mealId}`,
      );
    }, 250);

    return () => clearTimeout(timer);
  }, [text, search, mealId, router]);

  return (
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
  );
}
