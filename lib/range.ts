// Which days a screen is showing: the shared range control's arithmetic.
//
// Pure, like the rest of lib/. The choice lives in the address — "?range=7",
// or "?from=2026-08-13&to=2026-09-09" for Custom — so the server can draw the
// chart for it, and a reload keeps it.

import { daysBetween, shiftDays } from "@/lib/day";

// Every option any screen offers. Each screen offers its own few. "night" is
// Sleep's single night, which the screen picks itself (from `?date=`).
export type RangeKey = "night" | "4" | "7" | "14" | "28" | "all" | "custom";

export type Range = {
  key: RangeKey;
  from: string;
  to: string;
  // Days from `from` to `to`, both included.
  days: number;
};

export type RangeParams = {
  range?: string | string[];
  from?: string | string[];
  to?: string | string[];
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);
const isDate = (value: string | undefined): value is string => value !== undefined && DATE.test(value);

// What the address asks for, within what this screen offers.
//
//   options   the keys this screen offers
//   fallback  the key when the address asks for nothing, or for something
//             this screen doesn't offer
//   end       the last day any range can reach — yesterday on Smoking
//   earliest  the first day with data, for "All"; null when there is none
export function resolveRange(
  params: RangeParams,
  settings: { options: RangeKey[]; fallback: RangeKey; end: string; earliest: string | null },
): Range {
  const { options, fallback, end, earliest } = settings;
  const make = (key: RangeKey, from: string, to: string): Range => ({
    key,
    from,
    to,
    days: daysBetween(from, to) + 1,
  });

  const from = one(params.from);
  const to = one(params.to);

  if (options.includes("custom") && isDate(from) && isDate(to)) {
    // Nothing past the end, and a range typed backwards is read forwards.
    const a = from > end ? end : from;
    const b = to > end ? end : to;
    return a <= b ? make("custom", a, b) : make("custom", b, a);
  }

  const asked = one(params.range) as RangeKey | undefined;
  const key = asked && asked !== "custom" && options.includes(asked) ? asked : fallback;

  if (key === "all") {
    return make("all", earliest !== null && earliest < end ? earliest : end, end);
  }

  // One night: the last one here; the Sleep screen moves it to the night asked
  // for.
  if (key === "night") return make("night", end, end);

  const length = Number(key);
  return make(key, shiftDays(end, -(length - 1)), end);
}

// The part of the address that says which range is showing, for carrying it
// through to another screen and back: "range=7", "from=…&to=…", or "" for the
// screen's default. Anything else in the address is dropped, so a value that
// arrives from a form can't smuggle anything into a redirect.
export function rangeQuery(params: RangeParams): string {
  const from = one(params.from);
  const to = one(params.to);
  if (isDate(from) && isDate(to)) return `from=${from}&to=${to}`;

  const range = one(params.range);
  if (range && /^(4|7|14|28|all)$/.test(range)) return `range=${range}`;

  return "";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "13 Aug", with the year when asked for.
export function shortDate(date: string, withYear = false): string {
  const day = Number(date.slice(8, 10));
  const month = MONTHS[Number(date.slice(5, 7)) - 1];
  return withYear ? `${day} ${month} ${date.slice(0, 4)}` : `${day} ${month}`;
}

// The dates a range covers, as written under the range control: "1–9 Sep",
// "13 Aug – 9 Sep", "9 Sep". The year appears only when the range isn't all in
// this year.
export function rangeLabel(from: string, to: string, today: string): string {
  const thisYear = today.slice(0, 4);
  const withYear = from.slice(0, 4) !== to.slice(0, 4) || to.slice(0, 4) !== thisYear;

  if (from === to) return shortDate(to, withYear);

  if (from.slice(0, 7) === to.slice(0, 7)) {
    const [, month] = shortDate(to).split(" ");
    const year = withYear ? ` ${to.slice(0, 4)}` : "";
    return `${Number(from.slice(8, 10))}–${Number(to.slice(8, 10))} ${month}${year}`;
  }

  return `${shortDate(from, withYear)} – ${shortDate(to, withYear)}`;
}
