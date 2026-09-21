import { Suspense } from "react";
import { db } from "@/lib/supabase";
import { daysInMonth, monthName, monthStart, shiftDays } from "@/lib/day";
import { loadCatalogue, mealDaysIn } from "@/lib/meals";
import { rangeLabel, resolveRange, type Range, type RangeKey, type RangeParams } from "@/lib/range";
import { readTargets } from "@/lib/settings";
import { clockDuration } from "@/lib/sleep";
import { sourceItems, type Metric } from "@/lib/sources";
import { averagesOver, digestOf, isLogged, monthSpend } from "@/lib/stats";
import { RangeControl } from "../range-control";
import { DigestCard, type DigestRow } from "./digest-card";
import { Sources, SourceTap } from "./sources";
import { BoxBones, DigestBones } from "./bones";
import { grams, whole } from "./format";

// The stats section, under the day details on Nutrition → Today.
//
// It does not follow the day you're looking at (decided 2026-09-21): whichever
// day is on screen above, the stats cover the days ending yesterday. They answer
// "how have the last seven days been", which isn't a property of the day you
// happen to be reading — and stepping back to fix a forgotten meal shouldn't
// silently re-point every average at a fortnight ago.
//
// The digest cards are always the last seven days, whatever the range control
// below them says.

const OPTIONS: RangeKey[] = ["4", "7", "14", "28", "custom"];

// A week, for the digest.
const WEEK = 7;

const BOX = "rounded-[10px] bg-surface px-2.5 py-2";
const LABEL = "text-[11px]";
const VALUE = "text-[17px] font-semibold tabular-nums";

export function StatsSection({
  params,
  currentDay,
  keep,
}: {
  params: RangeParams;
  currentDay: string;
  // The day being looked at above, when it isn't today, so choosing a range
  // doesn't send you back to today.
  keep: string;
}) {
  const yesterday = shiftDays(currentDay, -1);
  const range = resolveRange(params, {
    options: OPTIONS,
    fallback: "7",
    end: yesterday,
    earliest: null,
  });

  const label = `${rangeLabel(range.from, range.to, currentDay)} · ${range.days} ${
    range.days === 1 ? "day" : "days"
  }`;

  return (
    <section className="flex flex-col gap-3">
      {/* Not keyed: the digest doesn't depend on the range, so choosing another
          one leaves these two cards alone instead of blinking them away. */}
      <Suspense fallback={<DigestBones />}>
        <Digest today={currentDay} yesterday={yesterday} />
      </Suspense>

      <div className="flex flex-col gap-2">
        <RangeControl
          options={OPTIONS}
          chosen={range.key}
          from={range.from}
          to={range.to}
          latest={yesterday}
          keep={keep}
        />
        <p className="text-xs text-faint tabular-nums">{label}</p>
      </div>

      <Suspense key={`${range.from}:${range.to}`} fallback={<BoxBones />}>
        <AverageBoxes range={range} label={label} />
      </Suspense>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The two digest cards
// ---------------------------------------------------------------------------

async function Digest({ today, yesterday }: { today: string; yesterday: string }) {
  // The week ending yesterday, and the week before it for the cigarette trend.
  const from = shiftDays(yesterday, -(WEEK - 1));
  const before = shiftDays(from, -WEEK);
  const supabase = db();

  // Read once and shared, so the week and the month don't each fetch every
  // product and recipe.
  const catalogue = await loadCatalogue();

  const [week, month, nights, smoking, targets] = await Promise.all([
    mealDaysIn(from, yesterday, catalogue),
    // The month to date — a running total, so this one does include today.
    mealDaysIn(monthStart(today), today, catalogue),
    supabase
      .from("sleep")
      .select("date, bedtime, wake_time, quality")
      .gte("date", from)
      .lte("date", yesterday),
    supabase.from("smoking").select("date, count").gte("date", before).lte("date", yesterday),
    readTargets(),
  ]);

  const counts = (smoking.data ?? []).map((row) => ({ date: row.date, value: row.count }));

  const digest = digestOf(
    week,
    nights.data ?? [],
    counts.filter((row) => row.date >= from),
    counts.filter((row) => row.date < from),
  );

  const spend = monthSpend(month, targets.daily_budget, daysInMonth(today));

  const rows: DigestRow[] = [
    {
      name: "Sleep",
      value: digest.sleep === null ? "Not logged" : clockDuration(digest.sleep.minutes),
      note:
        digest.sleep === null || digest.sleep.nights === WEEK
          ? undefined
          : `over ${digest.sleep.nights} ${digest.sleep.nights === 1 ? "night" : "nights"}`,
    },
    {
      name: "Cigarettes",
      value:
        digest.cigarettes === null
          ? "Not logged"
          : `${Math.round(digest.cigarettes.perDay * 10) / 10} a day`,
      note: digest.cigarettes === null ? undefined : trend(digest.cigarettes),
    },
    { name: "Food spend", value: `${whole(digest.spend)} lei` },
    {
      name: "Calories",
      value: digest.calories === null ? "Nothing logged" : `${whole(digest.calories)} a day`,
      note:
        digest.calories === null || digest.logged === WEEK
          ? undefined
          : `over ${digest.logged} ${digest.logged === 1 ? "day" : "days"} logged`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      <DigestCard label={`${rangeLabel(from, yesterday, today)} · ${WEEK} days`} rows={rows} />

      <div className={BOX}>
        <p className={`${LABEL} text-faint`}>Food spend · {monthName(today)}</p>
        <p className={VALUE}>
          {whole(spend.spent)}{" "}
          <span className="text-xs font-normal text-faint">
            {spend.budget === null ? "lei" : `/ ${whole(spend.budget)} lei`}
          </span>
        </p>
      </div>
    </div>
  );
}

// "−1.4 on the week before", with the days it's over when the week has gaps.
// A real minus sign, as the weigh-in list writes its differences.
function trend({ days, change }: { days: number; change: number | null }) {
  const over = days === WEEK ? [] : [`over ${days} ${days === 1 ? "day" : "days"}`];

  if (change === null) return [...over, "no week before to compare"].join(" · ");

  const size = Math.round(Math.abs(change) * 10) / 10;
  const word = size === 0 ? "the same as" : `${change < 0 ? "−" : "+"}${size} on`;

  return [...over, `${word} the week before`].join(" · ");
}

// ---------------------------------------------------------------------------
// The eight average boxes
// ---------------------------------------------------------------------------

const AVERAGES: Array<{ label: string; colour: string; metric: Metric }> = [
  { label: "Calories / day", colour: "text-faint", metric: "calories" },
  { label: "Spend / day", colour: "text-faint", metric: "cost" },
  { label: "Protein / day", colour: "text-protein", metric: "protein" },
  { label: "Carbs / day", colour: "text-carbs", metric: "carbs" },
  { label: "Added sugar / day", colour: "text-added-sugar", metric: "sugars_added" },
  { label: "Fibre / day", colour: "text-fibre", metric: "fibre" },
  { label: "Fat / day", colour: "text-fat", metric: "fat" },
];

async function AverageBoxes({ range, label }: { range: Range; label: string }) {
  const days = await mealDaysIn(range.from, range.to);
  const averages = averagesOver(days);

  // The panels cover exactly the days the averages do, so a number and the
  // foods behind it can't disagree.
  const items = sourceItems(days.filter(isLogged).flatMap((day) => day.foods));

  const value = (metric: Metric) => {
    if (averages === null) return "—";
    if (metric === "calories") return whole(averages.nutrition.calories);
    if (metric === "cost") return `${averages.cost.toFixed(2)} lei`;
    return grams(averages.nutrition[metric]);
  };

  return (
    <Sources items={items} label={label} empty="No meals logged in these days.">
      <div className="grid grid-cols-2 gap-2">
        {AVERAGES.map((box) => (
          <SourceTap key={box.metric} metric={box.metric} className={BOX}>
            <p className={`${LABEL} ${box.colour}`}>{box.label}</p>
            <p className={VALUE}>{value(box.metric)}</p>
          </SourceTap>
        ))}

        {/* No panel behind this one: there's no list of foods to show. */}
        <div className={BOX}>
          <p className={`${LABEL} text-faint`}>Meals · snacks / day</p>
          <p className={VALUE}>
            {averages === null
              ? "—"
              : `${averages.meals.toFixed(1)} · ${averages.snacks.toFixed(1)}`}
          </p>
        </div>
      </div>

      {averages === null ? (
        <p className="mt-2 text-xs text-muted">No meals logged in these days.</p>
      ) : (
        averages.logged < range.days && (
          <p className="mt-2 text-xs text-faint tabular-nums">
            Averages over the {averages.logged} {averages.logged === 1 ? "day" : "days"} logged.
          </p>
        )
      )}
    </Sources>
  );
}
