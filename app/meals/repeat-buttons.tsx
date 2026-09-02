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

      {result && !result.ok && <p className="text-sm text-danger">{result.message}</p>}
    </form>
  );
}

// One row of the recent list on the day screen.
export function RepeatRow({
  sourceId,
  day,
  names,
  type,
  calories,
  cost,
}: {
  sourceId: number;
  day: string;
  names: string;
  type: "meal" | "snack";
  calories: number;
  cost: number;
}) {
  const [result, action, pending] = useActionState<Result | null, FormData>(repeatMeal, null);

  return (
    <form action={action} className="flex flex-col gap-1.5 px-3 py-2.5">
      <input type="hidden" name="source_id" value={sourceId} />
      <input type="hidden" name="day" value={day} />

      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm">{names}</span>
          <span className="text-xs text-muted tabular-nums">
            {calories} kcal · {cost.toFixed(2)}
            {type === "snack" && " · snack"}
          </span>
        </span>

        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-md border border-border bg-surface px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {pending ? "…" : "Repeat"}
        </button>
      </div>

      {result && !result.ok && <p className="text-sm text-danger">{result.message}</p>}
    </form>
  );
}
