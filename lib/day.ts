// Dates, always in Europe/Bucharest.
//
// The plan is strict about this (Part 4, rule 7): every date boundary is a local
// one. Bucharest observes daylight saving, so doing this in UTC would shift
// entries by an hour twice a year and quietly corrupt totals around midnight.
// Nothing in the app should build a date string any other way.

export const TIME_ZONE = "Europe/Bucharest";

// A meal before 04:00 counts towards the day before. The column
// settings.day_boundary_hour exists to make this changeable later; nothing can
// change it yet, so the app reads this constant.
export const DAY_BOUNDARY_HOUR = 4;

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

// The plain calendar date. Only the backup's age goes by it; anything logged
// goes by the 04:00 day instead (dayFor), so that at 00:30 it's still yesterday.
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

// Calendar arithmetic on a plain date string. Done at midday UTC so that a
// clock change, which happens in the small hours, can never push the answer
// onto the wrong date.
export function shiftDays(date: string, days: number): string {
  const moved = Date.parse(`${date}T12:00:00Z`) + days * 24 * 60 * 60 * 1000;
  return new Date(moved).toISOString().slice(0, 10);
}

// The wall clock in Bucharest at a given instant: what a clock on the wall
// there would read.
function wallClockAt(instant: Date): { date: string; time: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    // Without this, midnight comes back as "24" in some locales.
    hourCycle: "h23",
  }).formatToParts(instant);

  const part = (type: string) =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";

  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
    hour: Number(part("hour")),
  };
}

// How far ahead of UTC Bucharest is at a given instant, in minutes: +120 in
// winter, +180 in summer.
function offsetMinutesAt(instant: Date): number {
  const name =
    new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, timeZoneName: "longOffset" })
      .formatToParts(instant)
      .find((candidate) => candidate.type === "timeZoneName")?.value ?? "GMT+00:00";

  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  if (!match) return 0;

  return (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]));
}

// Turns a date and a time typed on the phone — both local, Bucharest — into the
// exact instant they mean.
//
// This is the piece that goes wrong twice a year if it's done naively, which is
// why it's here and not written out inline anywhere. On the last Sunday in March
// the clocks jump 03:00 → 04:00, so 03:30 never happens; on the last Sunday in
// October they go back 04:00 → 03:00, so 03:30 happens twice. Both of those sit
// right next to the 04:00 rule that decides which day a late meal belongs to.
export function localTimestamp(date: string, time: string): string {
  const wanted = `${date}T${time}`;
  const asIfUtc = Date.parse(`${wanted}:00Z`);

  // Guess the offset, correct the guess, and see whether the two agree.
  const first = asIfUtc - offsetMinutesAt(new Date(asIfUtc)) * 60000;
  const second = asIfUtc - offsetMinutesAt(new Date(first)) * 60000;

  if (first === second) return new Date(first).toISOString();

  const reads = (instant: number) => {
    const clock = wallClockAt(new Date(instant));
    return `${clock.date}T${clock.time}` === wanted;
  };

  // Two different answers means a clock change is nearby, and there are three
  // cases. Usually exactly one of them really reads the time that was typed —
  // that's the answer, and getting this wrong put every meal logged before the
  // change on an October morning an hour late.
  if (reads(first) !== reads(second)) {
    return new Date(reads(first) ? first : second).toISOString();
  }

  // Otherwise take the later of the two. If neither reads right, the clocks went
  // forward and that time never existed, so this lands just after the jump
  // instead of before it. If both read right, the clocks went back and the time
  // happened twice, and this is the second of them — either is defensible, and
  // both fall on the same side of the 04:00 rule.
  return new Date(Math.max(first, second)).toISOString();
}

// Which day a meal counts towards: its local date, unless it was before 04:00,
// in which case the day before.
export function dayFor(instant: Date): string {
  const clock = wallClockAt(instant);
  return clock.hour < DAY_BOUNDARY_HOUR ? shiftDays(clock.date, -1) : clock.date;
}

// The local time an instant happened, as "14:30".
export function timeIn(instant: Date): string {
  return wallClockAt(instant).time;
}

// "Tuesday". Read at midday UTC so the weekday can't slide either side of
// midnight.
export function weekdayName(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
  }).format(new Date(`${date}T12:00:00Z`));
}

// "Sunday, 4 October", with the year added when it isn't the current one.
export function longDate(date: string, from: string = dayFor(new Date())): string {
  const sameYear = date.slice(0, 4) === from.slice(0, 4);

  const dayAndMonth = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: sameYear ? undefined : "numeric",
  }).format(new Date(`${date}T12:00:00Z`));

  return `${weekdayName(date)}, ${dayAndMonth}`;
}

// The Today screen's date row: "Today, 11 Sep", "Yesterday, 10 Sep",
// "Wednesday, 9 Sep" — with the year when it isn't the current one.
export function dateRowLabel(date: string, from: string = dayFor(new Date())): string {
  // Written out rather than left to the phone's language settings, which spell
  // September "Sept" in British English.
  const month = SHORT_MONTHS[Number(date.slice(5, 7)) - 1];
  const year = date.slice(0, 4) === from.slice(0, 4) ? "" : ` ${date.slice(0, 4)}`;

  const away = daysBetween(from, date);
  const name = away === 0 ? "Today" : away === -1 ? "Yesterday" : weekdayName(date);

  return `${name}, ${Number(date.slice(8, 10))} ${month}${year}`;
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// What to call a day on screen: "Today", "Yesterday", or "Tuesday 2 September".
// "Today" is the 04:00 day, the same one the rest of the app goes by.
export function dayLabel(date: string, from: string = dayFor(new Date())): string {
  const away = daysBetween(from, date);
  if (away === 0) return "Today";
  if (away === -1) return "Yesterday";
  if (away === 1) return "Tomorrow";

  const written = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00Z`));

  return written;
}
