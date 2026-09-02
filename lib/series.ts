// Averages over a run of days.
//
// Written once here, because the same function is what phase 7 needs for the
// 7-day weight average the whole TDEE estimate rests on. Pure: it takes rows and
// returns numbers, and never touches the database.
//
// The honest part is the gaps. A day with no row is a day you didn't log, which
// is deliberately not the same as a day with a value of zero — the schema keeps
// them apart on purpose. So the average is over the days that actually have an
// entry, and it says how many that was. Filling the gaps with zero would flatter
// a cigarette count; treating the window as complete would lie about it.

import { daysBetween } from "@/lib/day";

export type DayValue = { date: string; value: number };

export type Average = {
  average: number;
  // How many days in the window had an entry, and how wide the window was.
  counted: number;
  window: number;
};

export function averageOver(
  entries: DayValue[],
  endDate: string,
  windowDays: number,
): Average | null {
  if (windowDays <= 0) return null;

  const inWindow = entries.filter((entry) => {
    const back = daysBetween(entry.date, endDate);
    return back >= 0 && back < windowDays;
  });

  if (inWindow.length === 0) return null;

  const total = inWindow.reduce((sum, entry) => sum + entry.value, 0);

  return {
    average: total / inWindow.length,
    counted: inWindow.length,
    window: windowDays,
  };
}
