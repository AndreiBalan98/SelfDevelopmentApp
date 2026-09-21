"use client";

import { useEffect, useState } from "react";
import { ChevronRightIcon } from "../icons";

// The weekly digest: a small card at the top of the stats section that opens a
// sheet with the week's four numbers — average sleep, cigarettes against the
// week before, food spend and average calories.
//
// The words are worked out on the server (./stats.tsx) and handed over ready to
// show; all this does is open and close, like the "where did it come from?"
// panel it's shaped after.

export type DigestRow = {
  name: string;
  value: string;
  // The honest small print: how many nights or days it's over.
  note?: string;
};

export function DigestCard({ label, rows }: { label: string; rows: DigestRow[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="rounded-[10px] bg-surface px-2.5 py-2 text-left
                   [-webkit-tap-highlight-color:transparent] active:opacity-70"
      >
        <span className="block text-[11px] text-faint">Weekly digest</span>
        <span className="mt-0.5 flex items-center gap-0.5 text-xs text-muted">
          Tap to open
          <ChevronRightIcon size={12} />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/55" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label="Weekly digest"
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[90dvh] max-w-md flex-col
                       rounded-t-[18px] bg-surface px-4 pt-2.5
                       pb-[calc(max(1.75rem,env(safe-area-inset-bottom))+0.5rem)]"
          >
            <div className="mx-auto mb-3 h-1 w-[38px] shrink-0 rounded-full bg-border-strong" />
            <h2 className="text-base font-semibold">Weekly digest</h2>
            <p className="mt-0.5 mb-2 text-xs text-faint tabular-nums">{label}</p>

            <ul className="flex min-h-0 flex-col overflow-y-auto overscroll-contain">
              {rows.map((row) => (
                <li
                  key={row.name}
                  className="flex items-baseline justify-between gap-3 border-t border-border py-2.5
                             text-[13px] first:border-t-0"
                >
                  <span>{row.name}</span>
                  <span className="text-right">
                    <span className="tabular-nums">{row.value}</span>
                    {row.note && (
                      <span className="block text-[11px] text-faint tabular-nums">{row.note}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
