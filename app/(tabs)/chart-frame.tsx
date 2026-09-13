"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Rotate2Icon, RotateClockwiseIcon } from "./icons";

// Every chart sits in one of these: a line above it saying what it covers, with
// the rotate button on the right.
//
// A home-screen app on the iPhone can't turn the screen itself, and it has to
// work with the phone's rotation lock on, so rotating is done here: the button
// lays the chart across the whole screen turned 90° clockwise, and you turn the
// phone to match. Tapping it again comes back. While it's turned, it covers
// everything else — the list under the chart, the tab bar.
//
// Both drawings arrive from the server, one shaped for portrait and one for
// the screen on its side, so the phone draws nothing itself.

export function ChartFrame({
  title,
  label,
  portrait,
  landscape,
}: {
  // The tab, written above the chart when it's turned: "Smoking".
  title: string;
  // What the chart covers: "13 Aug – 9 Sep · 28 days".
  label: string;
  portrait: ReactNode;
  landscape: ReactNode;
}) {
  const [turned, setTurned] = useState(false);

  // While it's turned: the page underneath can't scroll, and Escape turns it
  // back on a computer.
  useEffect(() => {
    if (!turned) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const back = (event: KeyboardEvent) => event.key === "Escape" && setTurned(false);
    window.addEventListener("keydown", back);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener("keydown", back);
    };
  }, [turned]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-faint tabular-nums">{label}</span>
        <button
          type="button"
          aria-label="Turn the chart sideways"
          onClick={() => setTurned(true)}
          className="-mr-1 flex p-1 text-muted"
        >
          <RotateClockwiseIcon size={18} />
        </button>
      </div>

      {portrait}

      {turned && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-background" role="dialog" aria-label={`${title}, sideways`}>
          {/* The screen's height becomes the chart's width. Turned 90°
              clockwise, this box's left edge sits along the top of the phone
              and its right edge along the bottom, so those two get the
              iPhone's safe areas. */}
          <div
            className="absolute top-1/2 left-1/2 flex flex-col gap-1 py-3"
            style={{
              width: "100dvh",
              height: "100vw",
              transform: "translate(-50%, -50%) rotate(90deg)",
              paddingLeft: "max(1.25rem, env(safe-area-inset-top))",
              paddingRight: "max(1.25rem, env(safe-area-inset-bottom))",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[15px] font-semibold">
                {title} <span className="text-[13px] font-normal text-faint tabular-nums">· {label}</span>
              </span>
              <button
                type="button"
                aria-label="Turn the chart back"
                onClick={() => setTurned(false)}
                className="-mr-1 flex p-1 text-muted"
              >
                <Rotate2Icon size={22} />
              </button>
            </div>
            <div className="min-h-0 flex-1">{landscape}</div>
          </div>
        </div>
      )}
    </div>
  );
}
