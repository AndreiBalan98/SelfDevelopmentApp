// Dates, always in Europe/Bucharest.
//
// The plan is strict about this (Part 4, rule 7): every date boundary is a local
// one. Bucharest observes daylight saving, so doing this in UTC would shift
// entries by an hour twice a year and quietly corrupt totals around midnight.
// Nothing in the app should build a date string any other way.

const TIME_ZONE = "Europe/Bucharest";

// Which local day an instant falls on, as "2026-09-01".
export function dateIn(instant: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const part = (type: string) =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function today(): string {
  return dateIn(new Date());
}

// Whole days from one local date to another. Both are plain "2026-09-01"
// strings, so this is unaffected by clocks going forward or back.
export function daysBetween(from: string, to: string): number {
  const day = 24 * 60 * 60 * 1000;
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / day,
  );
}
