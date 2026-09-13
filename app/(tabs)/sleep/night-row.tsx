"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "../icons";

// The night view's date row: "‹ Night to 11 Sep ›" and a calendar icon. The
// arrows step a night at a time, landing on unlogged nights too; the calendar
// icon is the phone's own date picker, hidden over the icon, for jumping to any
// night. Nothing past last night.
export function NightRow({
  label,
  before,
  after,
  night,
  lastNight,
}: {
  label: string;
  // The nights either side; `after` is null on last night.
  before: string;
  after: string | null;
  night: string;
  lastNight: string;
}) {
  const router = useRouter();
  const href = (date: string) => (date === lastNight ? "/sleep" : `/sleep?date=${date}`);

  return (
    <div className="flex items-center justify-center gap-2 text-[13px] text-muted">
      <Link href={href(before)} aria-label="The night before" className="flex p-1.5">
        <ChevronLeftIcon size={18} />
      </Link>

      <span className="tabular-nums">{label}</span>

      {after ? (
        <Link href={href(after)} aria-label="The night after" className="flex p-1.5">
          <ChevronRightIcon size={18} />
        </Link>
      ) : (
        <span className="flex p-1.5 opacity-30" aria-hidden="true">
          <ChevronRightIcon size={18} />
        </span>
      )}

      <label className="relative flex p-1.5 text-accent" aria-label="Pick a night">
        <CalendarIcon size={18} />
        <input
          type="date"
          value={night}
          max={lastNight}
          onChange={(event) => {
            if (event.target.value) router.push(href(event.target.value));
          }}
          className="absolute inset-0 opacity-0"
        />
      </label>
    </div>
  );
}
