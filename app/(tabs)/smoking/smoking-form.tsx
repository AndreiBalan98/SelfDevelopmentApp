"use client";

import { useRouter } from "next/navigation";
import { saveSmoking, type Result } from "./actions";
import { useFormAction } from "../form-action";
import { BOX, CARD, PRIMARY, ROW } from "../ui";

type Props = {
  date: string;
  today: string;
  existing: { count: number; notes: string | null } | null;
  // The chart's range, to go back to after saving: "range=7", or "".
  back: string;
};

export function SmokingForm({ date, today, existing, back }: Props) {
  const router = useRouter();
  // Sent by hand, so a refused save keeps what you typed (form-action.ts). A
  // save that works goes back to the chart.
  const [result, submit, pending] = useFormAction<Result>(saveSmoking);

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <input type="hidden" name="back" value={back} />

      <div className={CARD}>
        <div className={ROW}>
          <label htmlFor="smoking-date" className="text-[13px]">
            Day
          </label>
          <input
            id="smoking-date"
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
                router.replace(`/smoking/day?date=${event.target.value}${back ? `&${back}` : ""}`);
              }
            }}
            className={`${BOX} min-h-8 w-36 [&::-webkit-date-and-time-value]:text-right`}
          />
        </div>

        <div className={ROW}>
          <label htmlFor="smoking-count" className="text-[13px]">
            Cigarettes
          </label>
          <input
            id="smoking-count"
            name="count"
            type="text"
            inputMode="numeric"
            // Deliberately not defaulted to 0. A zero has to be something you
            // typed, because "none" and "didn't log it" are different facts and
            // the whole table is built on keeping them apart.
            defaultValue={existing ? String(existing.count) : ""}
            autoComplete="off"
            required
            className={`${BOX} w-20 text-right`}
          />
        </div>

        <div className={ROW}>
          <label htmlFor="smoking-notes" className="text-[13px]">
            Note
          </label>
          <input
            id="smoking-notes"
            name="notes"
            type="text"
            defaultValue={existing?.notes ?? ""}
            placeholder="optional"
            autoComplete="off"
            className={`${BOX} min-w-0 flex-1 placeholder:text-faint`}
          />
        </div>
      </div>

      <p className="-mt-2 text-[11px] text-faint">
        Zero is a real answer — a day of none. A day with nothing typed isn&rsquo;t logged.
      </p>

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
