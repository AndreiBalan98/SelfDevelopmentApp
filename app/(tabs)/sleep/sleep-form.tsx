"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDuration, minutesAsleep } from "@/lib/sleep";
import { saveSleep, type Result } from "./actions";

const FIELD =
  "rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-accent";

type Props = {
  date: string;
  today: string;
  existing: {
    bedtime: string;
    wake_time: string;
    quality: number | null;
    notes: string | null;
  } | null;
};

export function SleepForm({ date, today, existing }: Props) {
  const router = useRouter();
  const [result, action, pending] = useActionState<Result | null, FormData>(saveSleep, null);

  const [bedtime, setBedtime] = useState(existing?.bedtime ?? "");
  const [wakeTime, setWakeTime] = useState(existing?.wake_time ?? "");
  const [quality, setQuality] = useState<number | null>(existing?.quality ?? null);

  // Worked out as you type. It's the only thing that catches a mistyped time
  // while you can still see it — "22 h 40 m" is visibly wrong in a way a stored
  // number never would be.
  const minutes = minutesAsleep(bedtime || null, wakeTime || null);
  const crossedMidnight =
    bedtime !== "" && wakeTime !== "" && bedtime > wakeTime;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="quality" value={quality ?? ""} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Woke up on</span>
        <input
          type="date"
          name="date"
          defaultValue={date}
          max={today}
          required
          // Changing the day reloads the screen for that day, so the fields show
          // what was actually logged rather than the night you were just looking
          // at.
          onChange={(event) => {
            if (event.target.value) router.replace(`/sleep?date=${event.target.value}`);
          }}
          className={`${FIELD} tabular-nums`}
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm text-muted">Went to bed</span>
          <input
            name="bedtime"
            type="time"
            value={bedtime}
            onChange={(event) => setBedtime(event.target.value)}
            className={`${FIELD} tabular-nums`}
          />
        </label>

        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm text-muted">Got up</span>
          <input
            name="wake_time"
            type="time"
            value={wakeTime}
            onChange={(event) => setWakeTime(event.target.value)}
            className={`${FIELD} tabular-nums`}
          />
        </label>
      </div>

      <p className="-mt-2 text-xs text-muted tabular-nums" aria-live="polite">
        {minutes === null
          ? "Fill in both times and the length appears here."
          : `${formatDuration(minutes)}${crossedMidnight ? " · went to bed the evening before" : " · went to bed after midnight"}`}
      </p>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">
          How it was{quality !== null && <span> · {quality}</span>}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => (
            <button
              key={number}
              type="button"
              aria-label={`Quality ${number}`}
              onClick={() => setQuality(quality === number ? null : number)}
              className={`flex-1 rounded-md border py-2 text-xs tabular-nums ${
                quality === number ? "border-accent text-accent" : "border-border text-muted"
              }`}
            >
              {number}
            </button>
          ))}
        </div>
      </div>

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
