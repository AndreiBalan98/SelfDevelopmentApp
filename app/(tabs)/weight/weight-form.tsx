"use client";

import { useRouter } from "next/navigation";
import { saveWeight, type SaveResult } from "./actions";
import { useFormAction } from "../form-action";
import { BOX, CARD, PRIMARY, ROW } from "../ui";

type Props = {
  date: string;
  today: string;
  existing: { id: number; kg: number; notes: string | null } | null;
  // The chart's range, to go back to after saving: "range=7", or "".
  back: string;
};

export function WeightForm({ date, today, existing, back }: Props) {
  const router = useRouter();
  // Sent by hand, so a refused save keeps what you typed (form-action.ts). A
  // save that works goes back to the chart.
  const [result, submit, pending] = useFormAction<SaveResult>(saveWeight);

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <input type="hidden" name="back" value={back} />

      <div className={CARD}>
        <div className={ROW}>
          <label htmlFor="weight-date" className="text-[13px]">
            Day
          </label>
          <input
            id="weight-date"
            type="date"
            name="date"
            defaultValue={date}
            max={today}
            required
            // Changing the day reloads the screen for that day, so the box
            // below shows what was already logged rather than a number left over
            // from the day you were just looking at.
            onChange={(event) => {
              if (event.target.value) {
                router.replace(`/weight/day?date=${event.target.value}${back ? `&${back}` : ""}`);
              }
            }}
            className={`${BOX} min-h-8 w-36 [&::-webkit-date-and-time-value]:text-right`}
          />
        </div>

        <div className={ROW}>
          <label htmlFor="weight-kg" className="text-[13px]">
            Weight
          </label>
          <span className="flex shrink-0 items-center gap-1.5">
            <input
              id="weight-kg"
              name="kg"
              type="text"
              // Summons the number pad with a decimal point on iOS.
              inputMode="decimal"
              defaultValue={existing ? String(existing.kg) : ""}
              placeholder="78.4"
              autoComplete="off"
              required
              className={`${BOX} w-24 text-right placeholder:text-faint`}
            />
            <span className="w-7 text-xs text-faint">kg</span>
          </span>
        </div>

        <div className={ROW}>
          <label htmlFor="weight-notes" className="text-[13px]">
            Note
          </label>
          <input
            id="weight-notes"
            name="notes"
            type="text"
            defaultValue={existing?.notes ?? ""}
            placeholder="optional"
            autoComplete="off"
            className={`${BOX} min-w-0 flex-1 placeholder:text-faint`}
          />
        </div>
      </div>

      <button type="submit" disabled={pending} className={PRIMARY}>
        {pending ? "Saving…" : existing ? "Update" : "Save"}
      </button>

      {result && !result.ok && (
        <p className="text-[13px] text-foreground" aria-live="polite">
          {result.message}
        </p>
      )}
    </form>
  );
}
