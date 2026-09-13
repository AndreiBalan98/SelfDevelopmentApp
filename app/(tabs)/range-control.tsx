"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { RangeKey } from "@/lib/range";
import { BOX, PILL, PILL_CHOSEN, PILL_OTHER, SMALL_PRIMARY } from "./ui";

// The shared range control: a row of pills under a tab's header, the chosen
// one tinted in the tab's colour. The same everywhere; only the options change
// from screen to screen (lib/range.ts does the arithmetic).
//
// A pill is a link — the choice lives in the address, so the server draws the
// chart for it and a reload keeps it. Custom opens a start and an end date.

const LABELS: Record<RangeKey, string> = {
  night: "Night",
  "4": "4",
  "7": "7",
  "14": "14",
  "28": "28",
  all: "All",
  custom: "Custom",
};

export function RangeControl({
  options,
  chosen,
  from,
  to,
  latest,
}: {
  options: RangeKey[];
  chosen: RangeKey;
  // The days showing now, to start Custom's two boxes from.
  from: string;
  to: string;
  // The last day Custom can reach.
  latest: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(from);
  const [end, setEnd] = useState(to);

  const customChosen = chosen === "custom" || open;

  function show() {
    if (!start || !end) return;
    // Read forwards whichever way round they were typed.
    const [a, b] = start <= end ? [start, end] : [end, start];
    setOpen(false);
    router.replace(`${pathname}?from=${a}&to=${b}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Range">
        {options.map((key) =>
          key === "custom" ? (
            <button
              key={key}
              type="button"
              aria-pressed={customChosen}
              onClick={() => {
                // Opens on the days showing now, whichever pill chose them.
                if (!open) {
                  setStart(from);
                  setEnd(to);
                }
                setOpen(!open);
              }}
              className={`${PILL} ${customChosen ? PILL_CHOSEN : PILL_OTHER}`}
            >
              {LABELS[key]}
            </button>
          ) : (
            <Link
              key={key}
              href={`${pathname}?range=${key}`}
              replace
              scroll={false}
              onClick={() => setOpen(false)}
              aria-current={chosen === key && !open ? "true" : undefined}
              className={`${PILL} ${chosen === key && !open ? PILL_CHOSEN : PILL_OTHER}`}
            >
              {LABELS[key]}
            </Link>
          ),
        )}
      </div>

      {open && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface px-3.5 py-2.5 text-[13px]">
          <label className="flex items-center gap-1.5">
            <span className="text-muted">From</span>
            <input
              type="date"
              value={start}
              max={latest}
              onChange={(event) => setStart(event.target.value)}
              className={`${BOX} min-h-8 w-36`}
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-muted">to</span>
            <input
              type="date"
              value={end}
              max={latest}
              onChange={(event) => setEnd(event.target.value)}
              className={`${BOX} min-h-8 w-36`}
            />
          </label>
          <button type="button" onClick={show} className={`${SMALL_PRIMARY} ml-auto`}>
            Show
          </button>
        </div>
      )}
    </div>
  );
}
