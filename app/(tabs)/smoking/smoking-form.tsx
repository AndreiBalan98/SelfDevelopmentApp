"use client";

import { useRouter } from "next/navigation";
import { saveSmoking, type Result } from "./actions";
import { useFormAction } from "../form-action";

const FIELD =
  "rounded-lg border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent";

type Props = {
  date: string;
  today: string;
  existing: { count: number; notes: string | null } | null;
};

export function SmokingForm({ date, today, existing }: Props) {
  const router = useRouter();
  // Sent by hand, so a refused save keeps what you typed (form-action.ts).
  const [result, submit, pending] = useFormAction<Result>(saveSmoking);

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Day</span>
        <input
          type="date"
          name="date"
          defaultValue={date}
          max={today}
          required
          // Changing the day reloads the screen for that day, so the field below
          // shows what was already logged rather than a number left over from
          // the day you were just looking at.
          onChange={(event) => {
            if (event.target.value) router.replace(`/smoking?date=${event.target.value}`);
          }}
          className={`${FIELD} tabular-nums`}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Cigarettes</span>
        <input
          name="count"
          type="text"
          inputMode="numeric"
          // Deliberately not defaulted to 0. A zero has to be something you
          // typed, because "none" and "didn't log it" are different facts and
          // the whole table is built on keeping them apart.
          defaultValue={existing ? String(existing.count) : ""}
          autoComplete="off"
          required
          className={`${FIELD} text-2xl tabular-nums`}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Note (optional)</span>
        <input
          name="notes"
          type="text"
          defaultValue={existing?.notes ?? ""}
          autoComplete="off"
          className={FIELD}
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
