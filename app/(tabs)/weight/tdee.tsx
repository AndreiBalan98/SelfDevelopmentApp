import Link from "next/link";
import { db } from "@/lib/supabase";
import { everyRow } from "@/lib/pages";
import { shiftDays } from "@/lib/day";
import { totalsByDay } from "@/lib/meals";
import { averageOver, type DayValue } from "@/lib/series";
import { dataDays, estimateTdee, formulaEstimate, WINDOW_DAYS, type Tdee } from "@/lib/tdee";
import type { ActivityLevel, Sex } from "@/lib/types";
import { Bone } from "../skeleton";

// The TDEE card under the weight chart: calories burned a day, worked out from
// what you ate and what your weight did (lib/tdee.ts has the method), and the
// formula estimate beside it. It doesn't follow the chart's range: it's always
// the latest window.

const CARD = "flex flex-col gap-1.5 rounded-xl bg-surface px-3.5 py-3";

// The body figures from Settings the formula needs. Any of them can be unset.
type Body = {
  height_cm: number | null;
  birth_year: number | null;
  sex: Sex | null;
  activity_level: ActivityLevel | null;
};

// As the formula line writes the activity level: "(light activity)".
const ACTIVITY_WORDS: Record<ActivityLevel, string> = {
  sedentary: "sedentary",
  light: "light activity",
  moderate: "moderate activity",
  very_active: "very active",
};

const kcal = (value: number) => Math.round(value).toLocaleString("en-GB");
const signed = (value: number) =>
  value > 0 ? `+${kcal(value)}` : value < 0 ? `−${kcal(-value)}` : "0";

export async function TdeeCard({ now }: { now: string }) {
  // Food counts up to yesterday — today isn't over. Weigh-ins count up to this
  // morning.
  const end = shiftDays(now, -1);
  const supabase = db();

  let tdee: Tdee;
  let weights: DayValue[];
  let body: Body | null;

  try {
    // Every weigh-in and every day with a meal: one row a day and a few rows a
    // day, read a page at a time (lib/pages.ts).
    const [weighIns, meals, settings] = await Promise.all([
      everyRow((from, to) =>
        supabase.from("weight").select("date, kg").lte("date", now).order("id").range(from, to),
      ),
      everyRow((from, to) =>
        supabase.from("meals").select("day").lte("day", end).order("id").range(from, to),
      ),
      supabase
        .from("settings")
        .select("height_cm, birth_year, sex, activity_level")
        .eq("id", 1)
        .maybeSingle(),
    ]);
    if (settings.error) throw new Error(settings.error.message);

    weights = weighIns.map((row) => ({ date: row.date, value: row.kg }));
    body = settings.data;

    // The days that might be days of data — a weigh-in and a meal — newest
    // first. Only their food needs adding up: the latest 28, and further back
    // for any that turn out to hold only an empty meal.
    const mealDays = new Set(meals.map((row) => row.day));
    const candidates = [...new Set(weights.map((weight) => weight.date))]
      .filter((date) => date <= end && mealDays.has(date))
      .sort()
      .reverse();

    let intake = new Map<string, number>();
    let reach = WINDOW_DAYS;
    while (candidates.length > 0) {
      const from = candidates[Math.min(reach, candidates.length) - 1];
      const totals = await totalsByDay(from, end);
      intake = new Map([...totals].map(([day, totals]) => [day, totals.nutrition.calories]));

      const found = dataDays(candidates, intake, end).length;
      if (found >= WINDOW_DAYS || reach >= candidates.length) break;
      reach += WINDOW_DAYS - found;
    }

    tdee = estimateTdee({ weights, intake, end, today: now });
  } catch (error) {
    return (
      <section className={CARD}>
        <span className="text-[13px] text-muted">TDEE, calories burned / day</span>
        <p className="text-sm">
          Could not reach the database: {error instanceof Error ? error.message : String(error)}
        </p>
      </section>
    );
  }

  // The estimate as shown: to the nearest 10, and the ± never under 10.
  const shown = tdee.ready ? Math.round(tdee.kcal / 10) * 10 : null;
  const plusMinus = tdee.ready ? Math.max(10, Math.round(tdee.plusMinus / 10) * 10) : null;
  const toGo = tdee.ready ? 0 : tdee.toGo;

  return (
    <section className={CARD}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-muted">TDEE, calories burned / day</span>
        {tdee.ready && (
          <span className="shrink-0 rounded-md bg-raised px-2 py-0.5 text-[11px] text-muted tabular-nums">
            {tdee.accuracy} · {tdee.days} days
          </span>
        )}
      </div>

      {shown !== null && plusMinus !== null ? (
        <p className="text-2xl font-semibold tabular-nums">
          {kcal(shown)} <span className="text-sm font-normal text-muted">± {kcal(plusMinus)} kcal</span>
        </p>
      ) : (
        <div className="flex flex-col gap-0.5">
          <p className="text-[15px] font-medium tabular-nums">
            TDEE available in {toGo} {toGo === 1 ? "day" : "days"}
          </p>
          <p className="text-[11px] text-faint tabular-nums">
            A day counts when it has a weigh-in and food logged · {tdee.days} so far
          </p>
        </div>
      )}

      <Formula body={body} weights={weights} now={now} estimate={shown} />
    </section>
  );
}

// "Formula estimate: 2,427 kcal (light activity) · You: +253", from the 7-day
// average weight. "You" is your estimate minus the formula's, from the two
// numbers as shown, so the sum on screen adds up.
function Formula({
  body,
  weights,
  now,
  estimate,
}: {
  body: Body | null;
  weights: DayValue[];
  now: string;
  estimate: number | null;
}) {
  if (!body || body.height_cm === null || body.birth_year === null || body.sex === null || body.activity_level === null) {
    return (
      <p className="text-xs text-faint">
        For a formula estimate, add your height, birth year, sex and activity level in{" "}
        <Link href="/settings" className="underline underline-offset-2">
          Settings
        </Link>
        .
      </p>
    );
  }

  const average = averageOver(weights, now, 7);
  if (average === null) {
    return <p className="text-xs text-muted">Formula estimate needs a weigh-in in the last 7 days.</p>;
  }

  const formula = Math.round(
    formulaEstimate({
      kg: average.average,
      heightCm: body.height_cm,
      birthYear: body.birth_year,
      thisYear: Number(now.slice(0, 4)),
      sex: body.sex,
      activity: body.activity_level,
    }),
  );

  return (
    <p className="text-xs text-muted tabular-nums">
      Formula estimate: {kcal(formula)} kcal ({ACTIVITY_WORDS[body.activity_level]})
      {estimate !== null && ` · You: ${signed(estimate - formula)}`}
    </p>
  );
}

// The card while it works itself out.
export function TdeeBones() {
  return (
    <div aria-hidden="true" className={CARD}>
      <span className="text-[13px] text-muted">TDEE, calories burned / day</span>
      <Bone className="h-7 w-40" />
      <Bone className="h-3.5 w-56" />
    </div>
  );
}
