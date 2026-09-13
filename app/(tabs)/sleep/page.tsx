import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/supabase";
import { allRows } from "@/lib/pages";
import { dayFor, shiftDays } from "@/lib/day";
import { rangeLabel, rangeQuery, resolveRange, shortDate, type Range, type RangeKey } from "@/lib/range";
import { clockTime, nightSpan, periodOf } from "@/lib/sleep";
import { HeaderAdd, TabHeader } from "../headers";
import { RangeControl } from "../range-control";
import { EmptyDial, NightDial, PeriodDial, UntimedDial } from "./clock";
import { NightRow } from "./night-row";
import { ClockBones } from "./clock-bones";

export const dynamic = "force-dynamic";

const OPTIONS: RangeKey[] = ["night", "7", "14", "28", "custom"];

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// The Sleep tab: the clock. With Night chosen it shows one night — last night
// unless another is asked for — and with 7 / 14 / 28 / Custom, every night in
// the range on the same clock.
//
// A night is stored under the day you woke up, so last night is the row dated
// today (by the 04:00 day), and every range ends with it. The "+" opens the
// entry form (./night), with a red dot while last night is missing.
export default async function SleepPage({ searchParams }: PageProps<"/sleep">) {
  const params = await searchParams;
  const now = dayFor(new Date());

  const range = resolveRange(params, { options: OPTIONS, fallback: "night", end: now, earliest: null });

  // Night view's night: the one in the address, or last night. Nothing later.
  const asked = typeof params.date === "string" && DATE.test(params.date) ? params.date : now;
  const night = range.key === "night" ? (asked > now ? now : asked) : null;

  // Carried to the entry form and back: "range=7" from a period, "" from a
  // night (saving there shows the night saved).
  const back = rangeQuery(params);

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-4">
      <TabHeader title="Sleep">
        <HeaderAdd href={`/sleep/night${back ? `?${back}` : ""}`} label="Log a night" dot="sleepMissing" />
      </TabHeader>

      <RangeControl
        options={OPTIONS}
        chosen={range.key}
        // Custom opens on the week ending the night showing.
        from={night ? shiftDays(night, -6) : range.from}
        to={night ?? range.to}
        latest={now}
      />

      {/* Keyed on what's showing, so another night or range swaps straight to
          the skeleton while it loads, and the pills above stay put. */}
      <Suspense key={night ?? `${range.from}:${range.to}`} fallback={<ClockBones night={night !== null} />}>
        {night ? <NightView night={night} now={now} /> : <PeriodView range={range} now={now} />}
      </Suspense>
    </main>
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
  const supabase = db();

  // Read a page at a time (lib/pages.ts): a long Custom range can pass
  // Supabase's 1,000 rows.
  const { data, error } = await allRows((from, to) =>
    supabase
      .from("sleep")
      .select("date, bedtime, wake_time, quality")
      .gte("date", range.from)
      .lte("date", range.to)
      .order("date", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to),
  );

  if (error) {
    return <p className="rounded-xl bg-surface p-3.5 text-sm">Could not reach the database: {error.message}</p>;
  }

  const nights = data ?? [];
  // "4–10 Sep · 7 nights", or "· 5 of 7 nights logged" when some are missing.
  const count =
    nights.length === range.days
      ? `${range.days} ${range.days === 1 ? "night" : "nights"}`
      : `${nights.length} of ${range.days} ${range.days === 1 ? "night" : "nights"} logged`;
  const label = `${rangeLabel(range.from, range.to, now)} · ${count}`;

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
