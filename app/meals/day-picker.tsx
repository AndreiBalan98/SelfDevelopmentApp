"use client";

import { useRouter } from "next/navigation";

// Jumping to any day. The arrows either side are plain links; this is for
// getting somewhere further away without tapping one of them thirty times.
export function DayPicker({ day, latest }: { day: string; latest: string }) {
  const router = useRouter();

  return (
    <input
      type="date"
      value={day}
      max={latest}
      aria-label="Jump to a day"
      onChange={(event) => {
        if (event.target.value) router.replace(`/meals?day=${event.target.value}`);
      }}
      className="rounded-lg border border-border bg-surface px-3 py-2 text-sm
                 tabular-nums outline-none focus:border-accent"
    />
  );
}
