"use client";

import { useRouter } from "next/navigation";
import { CalendarIcon } from "../icons";

// The calendar icon in the date row: jumping to any day, for getting somewhere
// further away without tapping an arrow thirty times. The phone's own date
// picker sits invisibly over the icon, so tapping the icon opens it. Step 7.5
// turns this into the calendar heatmap.
export function DayPicker({ day, latest }: { day: string; latest: string }) {
  const router = useRouter();

  return (
    <label className="relative flex p-1.5 text-muted">
      <CalendarIcon size={18} />
      <input
        type="date"
        value={day}
        max={latest}
        aria-label="Jump to a day"
        onClick={(event) => {
          // Desktop browsers only open their picker from its own little button;
          // this opens it from anywhere on the icon. The phone opens it anyway.
          try {
            event.currentTarget.showPicker();
          } catch {
            // Already open, or not supported: tapping still works.
          }
        }}
        onChange={(event) => {
          if (event.target.value) router.replace(`/meals?day=${event.target.value}`);
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}
