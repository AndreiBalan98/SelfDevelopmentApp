"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDuration, minutesAsleep } from "@/lib/sleep";
import { saveSleep, type Result } from "./actions";
import { useFormAction } from "../form-action";
import { BOX, CARD, PRIMARY, ROW } from "../ui";

type Props = {
  date: string;
  today: string;
  existing: {
    bedtime: string;
    wake_time: string;
    quality: number | null;
    notes: string | null;
  } | null;
  // Where to go back to after saving: "range=7" from a period, "" from a night.
  back: string;
};

export function SleepForm({ date, today, existing, back }: Props) {
  const router = useRouter();
  // Sent by hand, so a refused save keeps what you typed (form-action.ts). A
  // save that works goes back to the clock.
  const [result, submit, pending] = useFormAction<Result>(saveSleep);

  const [bedtime, setBedtime] = useState(existing?.bedtime ?? "");
  const [wakeTime, setWakeTime] = useState(existing?.wake_time ?? "");
  const [quality, setQuality] = useState<number | null>(existing?.quality ?? null);

  // Worked out as you type. It's the only thing that catches a mistyped time
  // while you can still see it — "22 h 40 m" is visibly wrong in a way a stored
  // number never would be.
  const minutes = minutesAsleep(bedtime || null, wakeTime || null);
  const crossedMidnight = bedtime !== "" && wakeTime !== "" && bedtime > wakeTime;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <input type="hidden" name="quality" value={quality ?? ""} />
      <input type="hidden" name="back" value={back} />

      <div className={CARD}>
        <div className={ROW}>
          <label htmlFor="sleep-date" className="text-[13px]">
            Woke up on
          </label>
          <input
            id="sleep-date"
            type="date"
            name="date"
            defaultValue={date}
            max={today}
            required
            // Changing the day reloads the screen for that night, so the boxes
            // show what was actually logged rather than the night you were
            // just looking at.
            onChange={(event) => {
              if (event.target.value) {
                router.replace(`/sleep/night?date=${event.target.value}${back ? `&${back}` : ""}`);
              }
            }}
            className={`${BOX} min-h-8 w-36 [&::-webkit-date-and-time-value]:text-right`}
          />
        </div>

        <div className={ROW}>
          <label htmlFor="sleep-bedtime" className="text-[13px]">
            Went to bed
          </label>
          <input
            id="sleep-bedtime"
            name="bedtime"
            type="time"
            value={bedtime}
            onChange={(event) => setBedtime(event.target.value)}
            className={`${BOX} min-h-8 w-28 [&::-webkit-date-and-time-value]:text-right`}
          />
        </div>

        <div className={ROW}>
          <label htmlFor="sleep-wake" className="text-[13px]">
            Got up
          </label>
          <input
            id="sleep-wake"
            name="wake_time"
            type="time"
            value={wakeTime}
            onChange={(event) => setWakeTime(event.target.value)}
            className={`${BOX} min-h-8 w-28 [&::-webkit-date-and-time-value]:text-right`}
          />
        </div>

        <p className="-mt-0.5 pb-2.5 text-[11px] text-faint tabular-nums" aria-live="polite">
          {minutes === null
            ? "Fill in both times and the length appears here."
            : `${formatDuration(minutes)}${crossedMidnight ? " · went to bed the evening before" : " · went to bed after midnight"}`}
        </p>

        <div className="flex flex-col gap-2 border-t border-border py-2.5">
          <span className="text-[13px]">
            How it was
            <span className="text-faint">{quality !== null ? ` · ${quality}` : " · optional"}</span>
          </span>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => (
              <button
                key={number}
                type="button"
                aria-label={`Quality ${number}`}
                aria-pressed={quality === number}
                onClick={() => setQuality(quality === number ? null : number)}
                className={`flex-1 rounded-md py-1.5 text-xs tabular-nums ${
                  quality === number ? "bg-accent font-semibold text-black" : "bg-background text-muted"
                }`}
              >
                {number}
              </button>
            ))}
          </div>
        </div>

        <div className={ROW}>
          <label htmlFor="sleep-notes" className="text-[13px]">
            Note
          </label>
          <input
            id="sleep-notes"
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
