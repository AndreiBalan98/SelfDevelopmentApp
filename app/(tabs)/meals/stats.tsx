import { Suspense } from "react";
import { db } from "@/lib/supabase";
import { datesFrom } from "@/lib/chart";
import { dateRowLabel, daysInMonth, monthName, monthStart, shiftDays } from "@/lib/day";
import { loadCatalogue, mealDaysIn } from "@/lib/meals";
import { rangeLabel, resolveRange, type Range, type RangeKey, type RangeParams } from "@/lib/range";
import { readTargets, type Targets } from "@/lib/settings";
import { clockDuration } from "@/lib/sleep";
import { mergeItems, sourceItems, type Metric, type SourceItem } from "@/lib/sources";
import { averagesOver, digestOf, isLogged, monthSpend, type StatsDay } from "@/lib/stats";
import { calorieKind, type Kind } from "@/lib/targets";
import { RangeControl } from "../range-control";
import { ChartCard, type Chart } from "./chart-card";
import { DigestCard, type DigestRow } from "./digest-card";
import { Sources, SourceTap } from "./sources";
import { LANDSCAPE, PORTRAIT, StatsChart, columns, type Target } from "./stats-chart";
import { BoxBones, DigestBones } from "./bones";
import { grams, gramsValue, whole } from "./format";

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
        <AverageBoxes range={range} label={label} currentDay={currentDay} />
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

async function AverageBoxes({
  range,
  label,
  currentDay,
}: {
  range: Range;
  label: string;
  currentDay: string;
}) {
  const [days, targets] = await Promise.all([
    mealDaysIn(range.from, range.to),
    readTargets(),
  ]);

  const averages = averagesOver(days);
  const logged = days.filter(isLogged);

  // Each day's foods, kept apart so that tapping one bar on the chart can show
  // that day alone; the boxes' panels are all of them added together. Both
  // cover exactly the days the averages do, so a number and the foods behind
  // it can't disagree.
  const byDate = new Map(logged.map((day) => [day.date, sourceItems(day.foods)]));
  const items = mergeItems([...byDate.values()]);

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

      {averages !== null && (
        <ChartCard
          charts={CHARTS.map((chart) =>
            drawChart(chart, {
              dates: datesFrom(range.from, range.to),
              logged,
              byDate,
              averages,
              targets,
              currentDay,
            }),
          )}
        />
      )}
    </Sources>
  );
}

// ---------------------------------------------------------------------------
// The chart, and its seven metrics
// ---------------------------------------------------------------------------

type ChartMetric = {
  key: string;
  // On the button. "Sugar" rather than "Added sugar", as the plan and the
  // mockup write it; the bar tracks added sugar, as it does on Today.
  label: string;
  metric: Metric;
  colour: string;
  unit: string;
  of: (day: { nutrition: StatsDay["nutrition"]; cost: number }) => number;
  target: (targets: Targets) => Target;
  // A number up the side of the chart, and one written out in the footer.
  tick: (value: number) => string;
  write: (value: number) => string;
};

const nutrient = (
  key: string,
  label: string,
  metric: Metric & keyof StatsDay["nutrition"],
  colour: string,
  target: (targets: Targets) => Target,
): ChartMetric => ({
  key,
  label,
  metric,
  colour,
  unit: "g",
  of: (day) => day.nutrition[metric],
  target,
  tick: (value) => String(Math.round(value)),
  // The unit is written once by the footer, so not here too.
  write: gramsValue,
});

const zone = (value: number | null): Target =>
  value === null || value <= 0 ? null : { value, kind: "zone" as Kind };
const ceiling = (value: number | null): Target =>
  value === null || value <= 0 ? null : { value, kind: "ceiling" as Kind };

const CHARTS: ChartMetric[] = [
  {
    key: "calories",
    label: "Calories",
    metric: "calories",
    colour: "fill-nutrition",
    unit: "kcal",
    of: (day) => day.nutrition.calories,
    // Calories are a ceiling on a cut and a zone on maintain or bulk. With no
    // goal picked there's no rule to draw, so nothing is drawn.
    target: (targets) => {
      const kind = calorieKind(targets.goal_phase);
      return kind === null || targets.calorie_target === null
        ? null
        : { value: targets.calorie_target, kind };
    },
    tick: whole,
    write: whole,
  },
  {
    key: "spend",
    label: "Spend",
    metric: "cost",
    colour: "fill-nutrition",
    unit: "lei",
    of: (day) => day.cost,
    target: (targets) => ceiling(targets.daily_budget),
    tick: (value) => String(Math.round(value)),
    write: (value) => value.toFixed(2),
  },
  nutrient("protein", "Protein", "protein", "fill-protein", (targets) => zone(targets.protein_target)),
  nutrient("carbs", "Carbs", "carbs", "fill-carbs", (targets) => zone(targets.carbs_target)),
  nutrient("sugar", "Sugar", "sugars_added", "fill-added-sugar", (targets) =>
    ceiling(targets.added_sugar_max),
  ),
  nutrient("fibre", "Fibre", "fibre", "fill-fibre", (targets) => zone(targets.fibre_target)),
  nutrient("fat", "Fat", "fat", "fill-fat", (targets) => zone(targets.fat_target)),
];

function drawChart(
  chart: ChartMetric,
  {
    dates,
    logged,
    byDate,
    averages,
    targets,
    currentDay,
  }: {
    dates: string[];
    logged: StatsDay[];
    byDate: Map<string, SourceItem[]>;
    averages: { nutrition: StatsDay["nutrition"]; cost: number };
    targets: Targets;
    currentDay: string;
  },
): Chart {
  const values = new Map(logged.map((day) => [day.date, chart.of(day)]));
  const target = chart.target(targets);

  // The dashed line is worked out from the same average the box above shows,
  // so the two can't read differently.
  const average = chart.of(averages);

  const drawing = (shape: typeof PORTRAIT, className?: string) => (
    <StatsChart
      dates={dates}
      values={values}
      target={target}
      average={average}
      colour={chart.colour}
      tick={chart.tick}
      title={`${chart.label} a day, against the target`}
      shape={shape}
      className={className}
    />
  );

  const edges = columns(PORTRAIT);

  return {
    key: chart.key,
    label: chart.label,
    footer:
      `average ${chart.write(average)} ${chart.unit} (dashed) · ` +
      (target === null
        ? "no target set"
        : `target ${chart.tick(target.value)} ${chart.unit} ${
            target.kind === "ceiling" ? "max" : "±10% (green band)"
          }`),
    portrait: (
      <div className="relative">
        {drawing(PORTRAIT)}

        {/* A column per logged day, laid over the bars: tapping one opens
            "where did it come from?" for that day alone. A day with no bar
            isn't tappable — there would be nothing to list. */}
        <div className="absolute inset-y-0" style={{ left: edges.left, right: edges.right }}>
          {dates.map((date, index) =>
            values.has(date) ? (
              <div
                key={date}
                className="absolute inset-y-0"
                style={{
                  left: `${(index / dates.length) * 100}%`,
                  width: `${100 / dates.length}%`,
                }}
              >
                <SourceTap
                  metric={chart.metric}
                  only={byDate.get(date) ?? []}
                  label={dateRowLabel(date, currentDay)}
                  className="h-full w-full"
                >
                  <span className="sr-only">
                    {chart.label} on {dateRowLabel(date, currentDay)}
                  </span>
                </SourceTap>
              </div>
            ) : null,
          )}
        </div>
      </div>
    ),
    landscape: drawing(LANDSCAPE, "h-full w-full"),
  };
}
