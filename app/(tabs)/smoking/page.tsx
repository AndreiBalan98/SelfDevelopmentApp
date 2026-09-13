import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/supabase";
import { allRows } from "@/lib/pages";
import { dayFor, shiftDays, weekdayName } from "@/lib/day";
import { datesFrom, movingAverage } from "@/lib/chart";
import { rangeLabel, rangeQuery, resolveRange, shortDate, type Range, type RangeKey } from "@/lib/range";
import { HeaderAdd, TabHeader } from "../headers";
import { RangeControl } from "../range-control";
import { ChartFrame } from "../chart-frame";
import { ChartBones } from "./chart-bones";
import { LANDSCAPE, PORTRAIT, SmokingChart } from "./smoking-chart";

export const dynamic = "force-dynamic";

const OPTIONS: RangeKey[] = ["7", "14", "28", "all", "custom"];

// The Smoking tab: the range control, the chart, and the days under it.
//
// Smoking is logged a day behind, at the end of the day or the next morning,
// so every range ends yesterday (by the 04:00 day) and today never shows. The
// "+" opens the entry form (./day), with a red dot while yesterday is missing.
export default async function SmokingPage({ searchParams }: PageProps<"/smoking">) {
  const params = await searchParams;
  const now = dayFor(new Date());
  const yesterday = shiftDays(now, -1);

  // The first day ever logged, which is where "All" starts.
  const { data: first } = await db()
    .from("smoking")
    .select("date")
    .order("date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const range = resolveRange(params, {
    options: OPTIONS,
    fallback: "28",
    end: yesterday,
    earliest: first?.date ?? null,
  });

  // Carried to the entry form and back, so saving returns to the same range.
  const back = rangeQuery(params);

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-4">
      <TabHeader title="Smoking">
        <HeaderAdd href={`/smoking/day${back ? `?${back}` : ""}`} label="Log a day" dot="smokingMissing" />
      </TabHeader>

      <RangeControl options={OPTIONS} chosen={range.key} from={range.from} to={range.to} latest={yesterday} />

      {/* Keyed on the days, so another range swaps straight to the skeleton
          while it loads, and the pills above stay put. */}
      <Suspense key={`${range.from}:${range.to}`} fallback={<ChartBones />}>
        <Days range={range} now={now} back={back} everLogged={first !== null} />
      </Suspense>
    </main>
  );
}

// "Wed 9 Sep", with the year when it isn't this one.
function rowDate(date: string, now: string): string {
  return `${weekdayName(date).slice(0, 3)} ${shortDate(date, date.slice(0, 4) !== now.slice(0, 4))}`;
}

async function Days({
  range,
  now,
  back,
  everLogged,
}: {
  range: Range;
  now: string;
  back: string;
  everLogged: boolean;
}) {
  const supabase = db();

  // The days in the range, and the six before it, so the 7-day average has a
  // full week behind it from the first day shown. Read a page at a time
  // (lib/pages.ts): "All" can reach past Supabase's 1,000 rows.
  const { data, error } = await allRows((from, to) =>
    supabase
      .from("smoking")
      .select("id, date, count, notes")
      .gte("date", shiftDays(range.from, -6))
      .lte("date", range.to)
      .order("date", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to),
  );

  if (error) {
    return (
      <p className="rounded-xl bg-surface p-3.5 text-sm">Could not reach the database: {error.message}</p>
    );
  }

  const rows = data ?? [];
  const inRange = rows.filter((row) => row.date >= range.from);

  const label = `${rangeLabel(range.from, range.to, now)} · ${range.days} ${range.days === 1 ? "day" : "days"}`;

  if (inRange.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-faint tabular-nums">{label}</span>
        <p className="py-6 text-center text-[13px] text-muted">
          {everLogged ? "Nothing logged in these days." : "Nothing logged yet. Tap + to log a day."}
        </p>
      </div>
    );
  }

  const dates = datesFrom(range.from, range.to);
  const counts = new Map(inRange.map((row) => [row.date, row.count]));
  const entries = rows.map((row) => ({ date: row.date, value: row.count }));
  const short = movingAverage(entries, dates, 4);
  const long = movingAverage(entries, dates, 7);

  const chart = { dates, counts, short, long };

  return (
    <>
      <ChartFrame
        title="Smoking"
        label={label}
        portrait={<SmokingChart {...chart} shape={PORTRAIT} />}
        landscape={<SmokingChart {...chart} shape={LANDSCAPE} className="h-full w-full" />}
      />

      <div className="-mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-[2px] bg-smoking" />
          Per day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[3px] w-3.5 rounded-full bg-average-4" />
          4-day avg
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[3px] w-3.5 rounded-full bg-average-7" />
          7-day avg
        </span>
      </div>

      {/* Newest first, only the days in the range, so it always matches the
          chart. Tap one to change it. */}
      <ul className="flex flex-col">
        {[...inRange].reverse().map((day) => (
          <li key={day.id} className="border-t border-border first:border-t-0">
            <Link
              href={`/smoking/day?date=${day.date}${back ? `&${back}` : ""}`}
              className="flex items-baseline gap-3 py-2.5 text-[13px]"
            >
              <span className="min-w-0 flex-1">
                <span className="tabular-nums">{rowDate(day.date, now)}</span>
                {day.notes && <span className="text-xs text-faint"> · {day.notes}</span>}
              </span>
              <span className="font-semibold tabular-nums">{day.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
