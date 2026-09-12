"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ALL_FOUR, monthGrid, monthName, shiftMonth } from "@/lib/logging";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "../icons";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

// How strong a day's dot is, by how many of its four logs exist: 0 to 4.
const STRENGTH = [0.12, 0.3, 0.5, 0.75, 1];

const plural = (count: number) => (count === 1 ? "1 day" : `${count} days`);

// The calendar icon in Today's date row, and the heatmap it opens: a month at a
// time, one dot a day, stronger with more of the day's four logs (sleep,
// smoking, weight, meals). The streak and the days-logged counter sit above
// it. Tapping a day opens it on Today.
export function Calendar({
  selected,
  today,
  counts,
  streak,
  daysLogged,
}: {
  // The day Today is showing.
  selected: string;
  // Today by the 04:00 rule; nothing after it can be opened.
  today: string;
  // How many of the four logs each date has. Null if they couldn't be read.
  counts: Record<string, number> | null;
  streak: number;
  daysLogged: number;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(selected.slice(0, 7));

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  const grid = monthGrid(month);
  const latestMonth = today.slice(0, 7);

  return (
    <>
      <button
        type="button"
        aria-label="Calendar"
        onClick={() => {
          setMonth(selected.slice(0, 7));
          setOpen(true);
        }}
        className="flex p-1.5 text-muted"
      >
        <CalendarIcon size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/55" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label="Calendar"
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-[18px] bg-surface px-4 pt-2.5
                       pb-[calc(max(1.75rem,env(safe-area-inset-bottom))+0.5rem)]"
          >
            <div className="mx-auto mb-3 h-1 w-[38px] rounded-full bg-border-strong" />

            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">{monthName(month)}</h2>
              <span className="flex items-center gap-1 text-muted">
                <button
                  type="button"
                  aria-label="The month before"
                  onClick={() => setMonth(shiftMonth(month, -1))}
                  className="flex p-1.5"
                >
                  <ChevronLeftIcon size={18} />
                </button>
                <button
                  type="button"
                  aria-label="The month after"
                  disabled={month >= latestMonth}
                  onClick={() => setMonth(shiftMonth(month, 1))}
                  className="flex p-1.5 disabled:opacity-30"
                >
                  <ChevronRightIcon size={18} />
                </button>
              </span>
            </div>

            {counts === null ? (
              <p className="py-6 text-center text-[13px] text-muted">
                Couldn&rsquo;t read your logs. Try again in a moment.
              </p>
            ) : (
              <>
                <div className="mb-3.5 grid grid-cols-2 gap-2">
                  <div className="rounded-[10px] bg-raised px-2.5 py-2">
                    <p className="text-[11px] text-faint">Logging streak</p>
                    <p className="text-[17px] font-semibold tabular-nums">{plural(streak)}</p>
                  </div>
                  <div className="rounded-[10px] bg-raised px-2.5 py-2">
                    <p className="text-[11px] text-faint">Days logged</p>
                    <p className="text-[17px] font-semibold tabular-nums">
                      {daysLogged.toLocaleString("en-GB")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-y-2.5 text-center text-[11px]">
                  {WEEKDAYS.map((letter, index) => (
                    <span key={index} className="text-faint">
                      {letter}
                    </span>
                  ))}

                  {Array.from({ length: grid.blanks }, (_, index) => (
                    <span key={`blank-${index}`} />
                  ))}

                  {grid.days.map((date) => {
                    const number = Number(date.slice(8));
                    const logs = counts[date] ?? 0;

                    // Days still to come can't be opened and have no dot.
                    if (date > today) {
                      return (
                        <span
                          key={date}
                          className="rounded-lg border border-transparent py-[3px] text-[#55555a] tabular-nums"
                        >
                          {number}
                          <span className="mx-auto mt-[3px] block size-2" />
                        </span>
                      );
                    }

                    return (
                      <Link
                        key={date}
                        href={date === today ? "/meals" : `/meals?day=${date}`}
                        onClick={() => setOpen(false)}
                        aria-label={`${date}: ${logs} of ${ALL_FOUR} logs`}
                        className={`rounded-lg border py-[3px] tabular-nums ${
                          date === selected ? "border-nutrition" : "border-transparent"
                        }`}
                      >
                        {number}
                        <span
                          className="mx-auto mt-[3px] block size-2 rounded-full bg-nutrition"
                          style={{ opacity: STRENGTH[Math.min(logs, ALL_FOUR)] }}
                        />
                      </Link>
                    );
                  })}
                </div>

                <p className="mt-3 text-center text-[11px] text-muted">
                  Dot = logs that day (sleep, smoking, weight, meals)
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
