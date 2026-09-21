import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/supabase";
import { allRows } from "@/lib/pages";
import { dayFor, shiftDays } from "@/lib/day";
import { rangeLabel, rangeQuery, resolveRange, shortDate, type Range, type RangeKey } from "@/lib/range";
import { datesFrom } from "@/lib/chart";
import { clockTime, nightSpan, periodOf } from "@/lib/sleep";
import { HeaderAdd, TabHeader } from "../headers";
import { RangeControl } from "../range-control";
import { ChartFrame } from "../chart-frame";
import { ChartBones } from "../chart-bones";
import { ChartLineIcon, ClockIcon } from "../icons";
import { EmptyDial, NightDial, PeriodDial, UntimedDial } from "./clock";
import { NightRow } from "./night-row";
import { ClockBones } from "./clock-bones";
import { LANDSCAPE, PORTRAIT, SleepChart } from "./sleep-chart";
import { sleepQuery } from "./back";
import { SleepMilestone } from "../milestone-card";

export const dynamic = "force-dynamic";

const CLOCK_OPTIONS: RangeKey[] = ["night", "7", "14", "28", "custom"];
// The chart has no single night: ranges only.
const CHART_OPTIONS: RangeKey[] = ["7", "14", "28", "custom"];

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// The Sleep tab: the clock, or the chart (`?view=chart`), switched with the
// icon in the header.
//
// On the clock, Night shows one night — last night unless another is asked
// for — and 7 / 14 / 28 / Custom put every night in the range on the same
// clock. The chart shows a range's bedtimes and wake-ups day by day.
//
// A night is stored under the day you woke up, so last night is the row dated
// today (by the 04:00 day), and every range ends with it. The "+" opens the
// entry form (./night), with a red dot while last night is missing.
export default async function SleepPage({ searchParams }: PageProps<"/sleep">) {
  const params = await searchParams;
  const now = dayFor(new Date());
  const chart = params.view === "chart";

  // The chart opens on 7 when there's no range to carry over from the clock.
  const range = resolveRange(params, {
    options: chart ? CHART_OPTIONS : CLOCK_OPTIONS,
    fallback: chart ? "7" : "night",
    end: now,
    earliest: null,
  });

  // Night view's night: the one in the address, or last night. Nothing later.
  const asked = typeof params.date === "string" && DATE.test(params.date) ? params.date : now;
  const night = range.key === "night" ? (asked > now ? now : asked) : null;

  // Carried to the entry form and back: "range=7" from a period, with
  // "view=chart" from the chart, "" from a night (saving there shows the night
  // saved).
  const back = sleepQuery(params);

  // The switch keeps the range: 28 on the clock is 28 on the chart and back.
  const ranged = night ? "" : rangeQuery(params) || `range=${range.key}`;
  const toChart = `/sleep?${ranged ? `${ranged}&` : ""}view=chart`;
  const toClock = ranged ? `/sleep?${ranged}` : "/sleep";

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-4">
      <TabHeader title="Sleep">
        <div className="flex items-center gap-4">
          {chart ? (
            <Link href={toClock} aria-label="Show the clock" className="flex text-accent">
              <ClockIcon size={23} />
            </Link>
          ) : (
            <Link href={toChart} aria-label="Show the chart" className="flex text-muted">
              <ChartLineIcon size={23} />
            </Link>
          )}
          <HeaderAdd href={`/sleep/night${back ? `?${back}` : ""}`} label="Log a night" dot="sleepMissing" />
        </div>
      </TabHeader>

      {/* About the whole history rather than what's showing, so it loads on
          its own and survives the clock/chart switch. */}
      <Suspense fallback={null}>
        <SleepMilestone today={now} />
      </Suspense>

      <RangeControl
        options={chart ? CHART_OPTIONS : CLOCK_OPTIONS}
        chosen={range.key}
        // Custom opens on the week ending the night showing.
        from={night ? shiftDays(night, -6) : range.from}
        to={night ?? range.to}
        latest={now}
        keep={chart ? "view=chart" : ""}
      />

      {/* Keyed on what's showing, so another night, range or view swaps
          straight to the skeleton while it loads, and the pills above stay
          put. */}
      <Suspense
        key={`${chart ? "chart" : "clock"}:${night ?? `${range.from}:${range.to}`}`}
        fallback={chart ? <ChartBones rows={false} /> : <ClockBones night={night !== null} />}
      >
        {chart ? (
          <ChartView range={range} now={now} />
        ) : night ? (
          <NightView night={night} now={now} />
        ) : (
          <PeriodView range={range} now={now} />
        )}
      </Suspense>
    </main>
  );
}

// A range's nights, read a page at a time (lib/pages.ts): a long Custom range
// can pass Supabase's 1,000 rows.
function readNights(range: Range) {
  const supabase = db();
  return allRows((from, to) =>
    supabase
      .from("sleep")
      .select("date, bedtime, wake_time, quality")
      .gte("date", range.from)
      .lte("date", range.to)
      .order("date", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to),
  );
}

// "4–10 Sep · 7 nights", or "· 5 of 7 nights logged" when some are missing.
function nightsLabel(range: Range, logged: number, now: string): string {
  const nights = (count: number) => `${count} ${count === 1 ? "night" : "nights"}`;
  const count = logged === range.days ? nights(range.days) : `${logged} of ${nights(range.days)} logged`;
  return `${rangeLabel(range.from, range.to, now)} · ${count}`;
}

async function ChartView({ range, now }: { range: Range; now: string }) {
  const { data, error } = await readNights(range);

  if (error) {
    return <p className="rounded-xl bg-surface p-3.5 text-sm">Could not reach the database: {error.message}</p>;
  }

  const nights = data ?? [];
  const label = nightsLabel(range, nights.length, now);
  const period = periodOf(nights);

  if (period.bed === null || period.wake === null) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-faint tabular-nums">{label}</span>
        <p className="py-6 text-center text-[13px] text-muted">
          {nights.length === 0 ? "Nothing logged in these nights." : "No times logged in these nights."}
        </p>
      </div>
    );
  }

  const dates = datesFrom(range.from, range.to);
  const spans = new Map(nights.map((row) => [row.date, nightSpan(row.bedtime, row.wake_time)]));
  const chart = {
    dates,
    beds: dates.map((date) => spans.get(date)?.bed ?? null),
    wakes: dates.map((date) => spans.get(date)?.wake ?? null),
    averageBed: period.bed.average,
    averageWake: period.wake.average,
  };

  return (
    <>
      <ChartFrame
        title="Sleep"
        label={label}
        portrait={<SleepChart {...chart} shape={PORTRAIT} />}
        landscape={<SleepChart {...chart} shape={LANDSCAPE} className="h-full w-full" />}
      />

      <div className="-mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[3px] w-3.5 rounded-full bg-wake" />
          Wake time
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[3px] w-3.5 rounded-full bg-bedtime" />
          Bedtime
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3.5 rounded-[2px] bg-sleep/45" />
          Asleep
        </span>
      </div>

      {/* Said out loud when some nights had no times to draw. */}
      {period.timed < nights.length && (
        <p className="text-[11px] text-faint">
          {nights.length - period.timed} {nights.length - period.timed === 1 ? "night" : "nights"} logged without
          times {nights.length - period.timed === 1 ? "isn't" : "aren't"} on the chart.
        </p>
      )}
    </>
  );
}

async function NightView({ night, now }: { night: string; now: string }) {
  const { data: entry, error } = await db()
    .from("sleep")
    .select("bedtime, wake_time, quality, notes")
    .eq("date", night)
    .maybeSingle();

  const label = `Night to ${shortDate(night, night.slice(0, 4) !== now.slice(0, 4))}`;
  // Tapping the clock opens this night in the entry form.
  const edit = `/sleep/night?date=${night}`;

  return (
    <>
      <NightRow
        label={label}
        before={shiftDays(night, -1)}
        after={night < now ? shiftDays(night, 1) : null}
        night={night}
        lastNight={now}
      />

      {error ? (
        <p className="rounded-xl bg-surface p-3.5 text-sm">Could not reach the database: {error.message}</p>
      ) : entry === null ? (
        <Link href={edit} className="flex flex-col items-center gap-1.5">
          <EmptyDial />
          <span className="text-sm text-muted">{night === now ? "Log last night" : "Log this night"}</span>
        </Link>
      ) : (
        <>
          <Link href={edit} aria-label="Change this night" className="block">
            <Night entry={entry} />
          </Link>
          {entry.notes && <p className="-mt-1 px-2.5 text-center text-sm text-muted italic">{entry.notes}</p>}
        </>
      )}
    </>
  );
}

function Night({
  entry,
}: {
  entry: { bedtime: string | null; wake_time: string | null; quality: number | null };
}) {
  const span = nightSpan(entry.bedtime, entry.wake_time);
  if (span) return <NightDial span={span} quality={entry.quality} />;

  // Logged with only a score or a note: no arc, and saying which time is
  // missing rather than guessing it.
  const message =
    entry.bedtime === null && entry.wake_time === null
      ? "Times not logged"
      : entry.bedtime === null
        ? "Bedtime not logged"
        : "Wake-up not logged";

  return <UntimedDial message={message} quality={entry.quality} />;
}

async function PeriodView({ range, now }: { range: Range; now: string }) {
  const { data, error } = await readNights(range);

  if (error) {
    return <p className="rounded-xl bg-surface p-3.5 text-sm">Could not reach the database: {error.message}</p>;
  }

  const nights = data ?? [];
  const label = nightsLabel(range, nights.length, now);

  if (nights.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-center text-xs text-faint tabular-nums">{label}</span>
        <p className="py-6 text-center text-[13px] text-muted">Nothing logged in these nights.</p>
      </div>
    );
  }

  const period = periodOf(nights);

  return (
    <>
      <span className="text-center text-xs text-faint tabular-nums">{label}</span>

      <PeriodDial period={period} />

      {period.bed && period.wake && (
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-[1.1fr_1fr_1fr_1fr] gap-y-1.5 rounded-xl bg-surface px-3 py-2.5 text-xs tabular-nums">
            <span />
            <span className="text-faint">earliest</span>
            <span className="text-faint">latest</span>
            <span className="text-faint">avg</span>

            <span className="text-muted">Bedtime</span>
            <span>{clockTime(period.bed.earliest)}</span>
            <span>{clockTime(period.bed.latest)}</span>
            <span>{clockTime(period.bed.average)}</span>

            <span className="text-muted">Wake</span>
            <span>{clockTime(period.wake.earliest)}</span>
            <span>{clockTime(period.wake.latest)}</span>
            <span>{clockTime(period.wake.average)}</span>
          </div>

          {/* The times and the length go by the nights with both times; said
              out loud when that isn't every night logged. */}
          {period.timed < nights.length && (
            <p className="text-[11px] text-faint">
              Times from {period.timed} {period.timed === 1 ? "night" : "nights"}; {nights.length - period.timed}{" "}
              logged without them.
            </p>
          )}
        </div>
      )}
    </>
  );
}
