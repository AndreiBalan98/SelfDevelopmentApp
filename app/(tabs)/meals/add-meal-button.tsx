"use client";

import { useActionState } from "react";
import { createMeal, type Result } from "./actions";

// One tap: the meal is created with the time and day already filled in, and you
// land inside it ready to add food.
export function AddMealButton({ day }: { day: string }) {
  const [result, action, pending] = useActionState<Result | null, FormData>(createMeal, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="day" value={day} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-3 text-center font-medium text-black disabled:opacity-50"
      >
        {pending ? "…" : "Add a meal"}
      </button>

      {result && !result.ok && <p className="text-sm text-foreground">{result.message}</p>}
    </form>
  );
}
