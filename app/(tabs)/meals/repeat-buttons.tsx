"use client";

import { useActionState } from "react";
import { repeatMeal, type Result } from "./actions";

// On a past meal's own screen: copy this onto the day you're looking at.
export function RepeatButton({ sourceId, day }: { sourceId: number; day: string }) {
  const [result, action, pending] = useActionState<Result | null, FormData>(repeatMeal, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="source_id" value={sourceId} />
      <input type="hidden" name="day" value={day} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-3 text-center font-medium text-black disabled:opacity-50"
      >
        {pending ? "…" : "Repeat this today"}
      </button>

      {result && !result.ok && <p className="text-sm text-foreground">{result.message}</p>}
    </form>
  );
}
