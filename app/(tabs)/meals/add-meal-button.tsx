"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { createMeal, repeatMeal, type Result } from "./actions";
import { PlusIcon } from "../icons";

export type RecentItem = {
  id: number;
  type: "meal" | "snack";
  names: string;
  calories: number;
  cost: number;
};

// How long a press has to last to count as holding rather than tapping.
const HOLD_MS = 500;
// A finger that slides further than this is scrolling, not pressing.
const SLOP_PX = 10;

// Where the button sits: just above the tab bar, whatever the phone's safe area,
// and inside the app's column on a wide screen. The tab bar is 2.375rem plus its
// bottom padding (see the tabs layout).
const ABOVE_TAB_BAR = "calc(2.375rem + max(1.75rem, env(safe-area-inset-bottom)) + 0.875rem)";
const FROM_RIGHT = "max(1rem, calc((100vw - 28rem) / 2 + 1rem))";

// The round green "+" on Today.
//
// Tap: creates a meal there and then and opens it, exactly as "Add a meal" did.
// Hold: opens the recent meals; tapping one copies it onto the day being
// viewed, under the same rules as before (lines and type, not note or score;
// anything retired follows what replaced it).
export function AddMealButton({
  day,
  dayLabel,
  recent,
}: {
  day: string;
  dayLabel: string;
  recent: RecentItem[];
}) {
  const [created, create, creating] = useActionState<Result | null, FormData>(createMeal, null);
  const [repeated, repeat, repeating] = useActionState<Result | null, FormData>(repeatMeal, null);
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<Result | null>(null);

  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const busy = creating || repeating;

  function stopTimer() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  }

  useEffect(() => stopTimer, []);

  function addMeal() {
    if (busy) return;
    const form = new FormData();
    form.set("day", day);
    startTransition(() => create(form));
  }

  function repeatOne(id: number) {
    if (busy) return;
    setChosen(id);
    const form = new FormData();
    form.set("source_id", String(id));
    form.set("day", day);
    startTransition(() => repeat(form));
  }

  // A failure says so just above the button, until tapped away.
  const failure = [created, repeated].find(
    (result) => result && !result.ok && result !== dismissed,
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/55"
          // A fresh tap on the dim closes the sheet. Lifting the finger that
          // opened it never lands here: the button stays on top of the dim.
          onClick={() => !repeating && setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Repeat something recent"
            onClick={(event) => event.stopPropagation()}
            // Never taller than the screen: on a small phone the list scrolls.
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[90dvh] max-w-md flex-col
                       rounded-t-[18px] bg-surface px-4 pt-2.5"
            // Room underneath for the button, so the finger that held it is
            // never lifted over a meal and repeats it by accident.
            style={{ paddingBottom: `calc(${ABOVE_TAB_BAR} + 46px + 1rem)` }}
          >
            <div className="mx-auto mb-3 h-1 w-[38px] rounded-full bg-border-strong" />
            <h2 className="text-base font-semibold">Repeat something recent</h2>
            <p className="mt-0.5 mb-2 text-xs text-faint">Copies onto {dayLabel}</p>

            {recent.length === 0 ? (
              <p className="py-3 text-[13px] text-muted">Nothing to repeat yet.</p>
            ) : (
              <ul className="flex min-h-0 flex-col overflow-y-auto overscroll-contain">
                {recent.map((meal) => (
                  <li key={meal.id} className="border-t border-border first:border-t-0">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => repeatOne(meal.id)}
                      className="flex w-full items-center justify-between gap-2.5 py-2.5 text-left text-[13px]
                                 disabled:opacity-60"
                    >
                      <span className="min-w-0 truncate">
                        <span
                          className={`font-semibold ${
                            meal.type === "snack" ? "text-snack-label" : "text-meal-label"
                          }`}
                        >
                          {meal.type === "snack" ? "Snack" : "Meal"}
                        </span>{" "}
                        · {meal.names}
                      </span>
                      <span className="shrink-0 text-muted tabular-nums">
                        {repeating && chosen === meal.id
                          ? "Copying…"
                          : `${Math.round(meal.calories).toLocaleString("en-GB")} kcal · ${meal.cost.toFixed(2)} lei`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {failure && (
        <button
          type="button"
          onClick={() => setDismissed(failure)}
          className="fixed z-30 max-w-[calc(100vw-2rem)] rounded-xl bg-raised p-3 text-left text-sm"
          style={{ bottom: `calc(${ABOVE_TAB_BAR} + 46px + 0.75rem)`, right: FROM_RIGHT }}
        >
          {failure.message}
        </button>
      )}

      <button
        type="button"
        aria-label="Add a meal. Hold for recent meals."
        disabled={busy}
        onPointerDown={(event) => {
          start.current = { x: event.clientX, y: event.clientY };
          timer.current = window.setTimeout(() => {
            timer.current = null;
            start.current = null;
            setOpen(true);
          }, HOLD_MS);
        }}
        onPointerMove={(event) => {
          const from = start.current;
          if (from && Math.hypot(event.clientX - from.x, event.clientY - from.y) > SLOP_PX) {
            stopTimer();
          }
        }}
        onPointerUp={() => {
          // Still timing means it was let go before it became a hold: a tap.
          const tapped = timer.current !== null;
          stopTimer();
          if (!tapped) return;
          if (open) setOpen(false);
          else addMeal();
        }}
        onPointerCancel={stopTimer}
        onPointerLeave={stopTimer}
        // A keyboard press has no pointer; treat it as a tap.
        onClick={(event) => {
          if (event.detail === 0) addMeal();
        }}
        // Right-click, and a long press on phones that report one, hold too.
        onContextMenu={(event) => {
          event.preventDefault();
          stopTimer();
          setOpen(true);
        }}
        className={`fixed z-30 flex size-[46px] items-center justify-center rounded-full bg-nutrition
                    text-black touch-manipulation select-none [-webkit-touch-callout:none]
                    [-webkit-tap-highlight-color:transparent] disabled:opacity-60 ${
                      open ? "shadow-[0_0_0_6px_rgba(99,153,34,0.35)]" : ""
                    }`}
        style={{ bottom: ABOVE_TAB_BAR, right: FROM_RIGHT }}
      >
        <PlusIcon size={24} />
      </button>
    </>
  );
}
