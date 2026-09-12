"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { saveWeight, type SaveResult } from "./actions";

type Props = {
  date: string;
  today: string;
  existing: { id: number; kg: number; notes: string | null } | null;
};

export function WeightForm({ date, today, existing }: Props) {
  const router = useRouter();
  const [result, action, pending] = useActionState<SaveResult | null, FormData>(
    saveWeight,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Day</span>
        <input
          type="date"
          name="date"
          defaultValue={date}
          max={today}
          required
          // Changing the day reloads the screen for that day, so the field below
          // shows what was already logged rather than a stale number.
          onChange={(event) => {
            if (event.target.value) router.replace(`/weight?date=${event.target.value}`);
          }}
          className="rounded-lg border border-border bg-surface px-4 py-3
                     text-base outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Weight (kg)</span>
        <input
          name="kg"
          type="text"
          // Summons the number pad with a decimal point on iOS.
          inputMode="decimal"
          defaultValue={existing ? String(existing.kg) : ""}
          placeholder="78.4"
          autoComplete="off"
          required
          className="rounded-lg border border-border bg-surface px-4 py-3
                     text-2xl tabular-nums outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Note (optional)</span>
        <input
          name="notes"
          type="text"
          defaultValue={existing?.notes ?? ""}
          autoComplete="off"
          className="rounded-lg border border-border bg-surface px-4 py-3
                     text-base outline-none focus:border-accent"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-3 font-medium text-black disabled:opacity-50"
      >
        {pending ? "Saving…" : existing ? "Update" : "Save"}
      </button>

      {result && (
        <p
          className={`text-sm ${result.ok ? "text-muted" : "text-foreground"}`}
          aria-live="polite"
        >
          {result.message}
        </p>
      )}
    </form>
  );
}
