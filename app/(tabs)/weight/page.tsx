import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/supabase";
import { allRows } from "@/lib/pages";
import { dayFor, shiftDays, weekdayName } from "@/lib/day";
import { datesFrom, movingAverage } from "@/lib/chart";
import { averageOver, type DayValue } from "@/lib/series";
import { rangeLabel, rangeQuery, resolveRange, shortDate, type Range, type RangeKey } from "@/lib/range";
import { goalDistance, inventedPoints, weightChange } from "@/lib/weight";
import type { GoalPhase } from "@/lib/types";
import { HeaderAdd, NutritionHeader } from "../headers";
import { RangeControl } from "../range-control";
import { ChartFrame } from "../chart-frame";
import { ChartBones } from "../chart-bones";
import { LANDSCAPE, PORTRAIT, WeightChart } from "./weight-chart";

export const dynamic = "force-dynamic";

const OPTIONS: RangeKey[] = ["7", "14", "28", "all", "custom"];

// Nutrition → Weight: the range control, how far the goal is, the chart, and
// the weigh-ins under it.
//
// Weight is logged the morning it happens, so every range ends today (by the
// 04:00 day). The "+" opens the entry form (./day), with a red dot while today's
// weigh-in is missing.
export default async function WeightPage({ searchParams }: PageProps<"/weight">) {
  const params = await searchParams;
  const now = dayFor(new Date());
  const supabase = db();

  const [first, week, settings] = await Promise.all([
    // The first day ever weighed, which is where "All" starts.
    supabase.from("weight").select("date").order("date", { ascending: true }).limit(1).maybeSingle(),
    // The last seven days, for the average the goal line goes by.
    supabase.from("weight").select("date, kg").gte("date", shiftDays(now, -6)).lte("date", now),
    supabase.from("settings").select("goal_weight, goal_phase").eq("id", 1).maybeSingle(),
  ]);

  const range = resolveRange(params, {
    options: OPTIONS,
    fallback: "28",
    end: now,
    earliest: first.data?.date ?? null,
  });

  // Carried to the entry form and back, so saving returns to the same range.
  const back = rangeQuery(params);

  // A question the database couldn't answer leaves the goal line out; the
  // chart below says what went wrong.
  const goal =
    week.error || settings.error
      ? null
      : {
          average: averageOver((week.data ?? []).map((row) => ({ date: row.date, value: row.kg })), now, 7),
          weight: settings.data?.goal_weight ?? null,
          phase: settings.data?.goal_phase ?? null,
        };

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-4">
      <NutritionHeader active="weight">
        <HeaderAdd href={`/weight/day${back ? `?${back}` : ""}`} label="Log a weigh-in" dot="weightMissing" />
      </NutritionHeader>

      <RangeControl options={OPTIONS} chosen={range.key} from={range.from} to={range.to} latest={now} />

      {goal && <GoalLine average={goal.average?.average ?? null} goal={goal.weight} phase={goal.phase} />}

      {/* Keyed on the days, so another range swaps straight to the skeleton
          while it loads, and everything above stays put. */}
      <Suspense key={`${range.from}:${range.to}`} fallback={<ChartBones />}>
        <WeighIns range={range} now={now} back={back} everLogged={first.data !== null} />
      </Suspense>
    </main>
  );
}

// "4.6 kg to goal (75 kg)", from the 7-day average rather than one weigh-in, so
// a salty dinner doesn't move it. Always now, whatever range the chart shows.
// Never coloured: it's where you are, not a target missed.
function GoalLine({
  average,
  goal,
  phase,
}: {
  average: number | null;
  goal: number | null;
  phase: GoalPhase | null;
}) {
  if (goal === null) {
    return (
      <p className="text-[13px] text-faint">
        No goal weight ·{" "}
        <Link href="/settings" className="text-faint underline underline-offset-2">
          set one in Settings
        </Link>
      </p>
    );
  }

  if (average === null) {
    return <p className="text-[13px] text-muted">No weigh-in in the last 7 days · goal {goal} kg</p>;
  }

  const distance = goalDistance(average, goal, phase);

  return (
    <p className="flex items-baseline gap-2.5">
      {distance.kind === "at" ? (
        <span className="text-2xl font-semibold">At goal</span>
      ) : (
        <span className="text-2xl font-semibold tabular-nums">{distance.kg.toFixed(1)} kg</span>
      )}
      <span className="text-[13px] text-muted tabular-nums">
        {distance.kind === "at" ? "" : `${distance.kind} goal `}({goal} kg)
      </span>
    </p>
  );
}

// "Wed 9 Sep", with the year when it isn't this one.
function rowDate(date: string, now: string): string {
  return `${weekdayName(date).slice(0, 3)} ${shortDate(date, date.slice(0, 4) !== now.slice(0, 4))}`;
}

async function WeighIns({
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

  const [inWindow, before, after] = await Promise.all([
    // The days in the range, and the six before it, so the 7-day average has a
    // full week behind it from the first day shown. Read a page at a time
    // (lib/pages.ts): "All" can reach past Supabase's 1,000 rows.
    allRows((from, to) =>
      supabase
        .from("weight")
        .select("id, date, kg, notes")
        .gte("date", shiftDays(range.from, -6))
        .lte("date", range.to)
        .order("date", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to),
    ),
    // The weigh-in just before the range, however long ago: the other end of a
    // gap that runs into the chart, and what the first row's difference is from.
    supabase
      .from("weight")
      .select("date, kg")
      .lt("date", range.from)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // And the one just after it, for a Custom range that ends in a gap.
    supabase
      .from("weight")
      .select("date, kg")
      .gt("date", range.to)
      .order("date", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const failure = inWindow.error?.message ?? before.error?.message ?? after.error?.message ?? null;
  if (failure) {
    return <p className="rounded-xl bg-surface p-3.5 text-sm">Could not reach the database: {failure}</p>;
  }

  const rows = inWindow.data ?? [];
  const inRange = rows.filter((row) => row.date >= range.from);

  const label = `${rangeLabel(range.from, range.to, now)} · ${inRange.length} ${
    inRange.length === 1 ? "weigh-in" : "weigh-ins"
  }`;

  if (inRange.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-faint tabular-nums">{label}</span>
        <p className="py-6 text-center text-[13px] text-muted">
          {everLogged ? "Nothing weighed in these days." : "Nothing logged yet. Tap + to log a weigh-in."}
        </p>
      </div>
    );
  }

  const dates = datesFrom(range.from, range.to);
  const weights = new Map(inRange.map((row) => [row.date, row.kg]));

  // The averages go by the real weigh-ins only.
  const entries: DayValue[] = rows.map((row) => ({ date: row.date, value: row.kg }));
  const short = movingAverage(entries, dates, 4);
  const long = movingAverage(entries, dates, 7);

  // The invented points also need the weigh-ins on either side of the range.
  const neighbours = new Map(entries.map((entry) => [entry.date, entry.value]));
  for (const edge of [before.data, after.data]) {
    if (edge) neighbours.set(edge.date, edge.kg);
  }
  const invented = inventedPoints(
    [...neighbours].map(([date, value]) => ({ date, value })),
    dates,
  );

  const chart = { dates, weights, invented, short, long };

  return (
    <>
      <ChartFrame
        title="Weight"
        label={label}
        portrait={<WeightChart {...chart} shape={PORTRAIT} />}
        landscape={<WeightChart {...chart} shape={LANDSCAPE} className="h-full w-full" />}
      />

      <div className="-mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-nutrition" />
          Weigh-in
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full border-[1.5px] border-muted" />
          Skipped day (invented)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[3px] w-3.5 rounded-full bg-weight-average-4" />
          4-day avg
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[3px] w-3.5 rounded-full bg-average-7" />
          7-day avg
        </span>
      </div>

      {/* Newest first, only the weigh-ins in the range, so it always matches
          the chart. The difference is from the weigh-in before, whenever that
          was. Tap one to change it. */}
      <ul className="flex flex-col">
        {inRange
          .map((day, index) => ({
            ...day,
            change: weightChange(day.kg, index > 0 ? inRange[index - 1].kg : before.data?.kg),
          }))
          .reverse()
          .map((day) => (
            <li key={day.id} className="border-t border-border first:border-t-0">
              <Link
                href={`/weight/day?date=${day.date}${back ? `&${back}` : ""}`}
                className="flex items-baseline gap-3 py-2.5 text-[13px]"
              >
                <span className="min-w-0 flex-1">
                  <span className="tabular-nums">{rowDate(day.date, now)}</span>
                  {day.notes && <span className="text-xs text-faint"> · {day.notes}</span>}
                </span>
                <span className="tabular-nums">{day.kg} kg</span>
                <span className="w-11 text-right text-xs text-muted tabular-nums">{day.change ?? ""}</span>
              </Link>
            </li>
          ))}
      </ul>
    </>
  );
}
