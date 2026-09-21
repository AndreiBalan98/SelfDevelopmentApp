import type { Comparison, Side, TargetRow } from "@/lib/stats";
import { shareOfMeals, targetsHit } from "@/lib/stats";
import { whole } from "./format";

// The last two cards of the stats section: meals against snacks, and how many
// days each target was hit.
//
// Both are governed by the range control above them, and both follow the same
// rule as the averages: a day with no food logged is left out — of the
// comparison entirely, and of Days on target as a grey square that doesn't
// count.

// Grams here keep a decimal, as the mockup writes them. These are per-meal
// figures rather than per-day ones, and a snack's 5.5 g of protein rounded to
// 6 g loses the thing the card is for.
const gram = (value: number) => `${Math.round(value * 10) / 10} g`;

// "84", "77.5" — a share written as short as it can honestly be.
const percent = (value: number) => String(Math.round(value * 10) / 10);

const COUNT = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

// ---------------------------------------------------------------------------
// Meals against snacks
// ---------------------------------------------------------------------------

type Row = {
  label: string;
  colour: string;
  of: (side: Side) => string;
};

const ROWS: Row[] = [
  {
    label: "Avg calories",
    colour: "text-muted",
    of: (side) => (side.calories === null ? "—" : whole(side.calories)),
  },
  {
    label: "Avg protein",
    colour: "text-protein",
    of: (side) => (side.protein === null ? "—" : gram(side.protein)),
  },
  {
    label: "Avg fibre",
    colour: "text-fibre",
    of: (side) => (side.fibre === null ? "—" : gram(side.fibre)),
  },
  {
    label: "Avg added sugar",
    colour: "text-added-sugar",
    of: (side) => (side.sugar === null ? "—" : gram(side.sugar)),
  },
  {
    label: "Avg cost",
    colour: "text-muted",
    of: (side) => (side.cost === null ? "—" : `${side.cost.toFixed(2)} lei`),
  },
  {
    label: "Protein per leu",
    colour: "text-muted",
    of: (side) => (side.proteinPerLeu === null ? "—" : gram(side.proteinPerLeu)),
  },
  {
    label: "Avg score",
    colour: "text-muted",
    // Scores are optional, so this is over the ones that have one.
    of: (side) => (side.score === null ? "—" : String(Math.round(side.score * 10) / 10)),
  },
];

const SHARES: Array<{ label: string; of: (side: Side) => number }> = [
  { label: "Share of calories", of: (side) => side.calorieTotal },
  { label: "Share of spending", of: (side) => side.costTotal },
  { label: "Share of added sugar", of: (side) => side.sugarTotal },
];

const CELL = "grid grid-cols-[1.4fr_1fr_1fr] gap-2";

export function MealsVsSnacks({
  comparison,
  dates,
}: {
  comparison: Comparison;
  // The days the card covers, written as the mockup writes them — the meal
  // counts stand in for the day count here.
  dates: string;
}) {
  const { meals, snacks } = comparison;
  if (meals.count === 0 && snacks.count === 0) return null;

  const scored = meals.scored + snacks.scored;

  return (
    <section className="flex flex-col gap-2">
      <div>
        <h2 className="text-sm font-semibold">Meals vs snacks</h2>
        <p className="text-xs text-faint tabular-nums">
          {dates} · {COUNT(meals.count, "meal", "meals")} ·{" "}
          {COUNT(snacks.count, "snack", "snacks")}
        </p>
      </div>

      <div className="rounded-xl bg-surface px-3.5 py-1">
        <div className={`${CELL} py-2 text-xs`}>
          <span />
          <span className="text-right text-meal">Meals</span>
          <span className="text-right text-snack">Snacks</span>
        </div>

        {ROWS.map((row) => (
          <div key={row.label} className={`${CELL} border-t border-border py-2.5 text-[13px]`}>
            <span className={row.colour}>{row.label}</span>
            <span className="text-right tabular-nums">{row.of(meals)}</span>
            <span className="text-right tabular-nums">{row.of(snacks)}</span>
          </div>
        ))}

        {scored === 0 && (
          <p className="border-t border-border py-2 text-[11px] text-faint">
            Nothing in these days was given a score.
          </p>
        )}

        <div className="border-t border-border pt-3 pb-2.5">
          {SHARES.map((share) => {
            const mine = shareOfMeals(share.of(meals), share.of(snacks));

            return (
              <div key={share.label} className="mb-3 last:mb-0">
                <p className="mb-1 text-xs text-muted">{share.label}</p>

                {mine === null ? (
                  <p className="text-[11px] text-faint">None of it, either way.</p>
                ) : (
                  <>
                    <div className="flex h-2.5 overflow-hidden rounded-full" aria-hidden="true">
                      <div className="bg-meal" style={{ width: `${mine}%` }} />
                      <div className="bg-snack" style={{ width: `${100 - mine}%` }} />
                    </div>
                    <div className="mt-0.5 flex justify-between text-[11px] text-faint tabular-nums">
                      <span>{percent(mine)}%</span>
                      <span>{percent(100 - mine)}%</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Days on target
// ---------------------------------------------------------------------------

// Past this many days the squares stop fitting, and the card shows counts only.
const MOST_SQUARES = 31;

// A day is marked as a bad one when it hit a quarter of its targets or fewer —
// two out of eight, as the mockup draws it.
const BAD = 0.25;

function Square({ hit }: { hit: boolean | null }) {
  const colour = hit === null ? "bg-border-strong" : hit ? "bg-zone" : "bg-danger";
  return <span className={`h-[15px] flex-1 rounded-[3px] ${colour}`} />;
}

export function DaysOnTarget({
  rows,
  dates,
  swings,
  label,
}: {
  rows: TargetRow[];
  dates: string[];
  // "Calories swing ±391 kcal · Protein swing ±23 g", or null with too few days.
  swings: string | null;
  label: string;
}) {
  if (rows.length === 0) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Days on target</h2>
        <p className="rounded-xl bg-surface px-3.5 py-3 text-[13px] text-muted">
          No targets are set yet. Set some in Settings and this fills in.
        </p>
      </section>
    );
  }

  const squares = dates.length <= MOST_SQUARES;

  return (
    <section className="flex flex-col gap-2">
      <div>
        <h2 className="text-sm font-semibold">Days on target</h2>
        <p className="text-xs text-faint tabular-nums">
          {label}
          {squares ? "" : " · counts only, the range being too long for squares"}
        </p>
      </div>

      <div className="rounded-xl bg-surface px-3.5 py-3">
        {rows.map((row) => (
          <div key={row.key} className="mb-1.5 flex items-center gap-1.5 last:mb-0">
            <span className={`w-[84px] shrink-0 text-[11.5px] ${row.colour}`}>{row.label}</span>

            {squares && (
              <span className="flex flex-1 gap-[3px]">
                {row.days.map((hit, index) => (
                  <Square key={dates[index]} hit={hit} />
                ))}
              </span>
            )}

            <span
              className={`w-9 shrink-0 text-right text-xs tabular-nums ${squares ? "" : "flex-1"}`}
            >
              {row.hit}/{row.counted}
            </span>
          </div>
        ))}

        {squares && (
          <>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="w-[84px] shrink-0 text-[11px] text-faint">Day</span>
              <span className="flex flex-1 gap-[3px]">
                {dates.map((date) => (
                  <span
                    key={date}
                    className="flex-1 text-center text-[10px] text-faint tabular-nums"
                  >
                    {Number(date.slice(8, 10))}
                  </span>
                ))}
              </span>
              <span className="w-9 shrink-0" />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-[84px] shrink-0 text-[11px] text-faint">Targets hit</span>
              <span className="flex flex-1 gap-[3px]">
                {dates.map((date, index) => {
                  const hit = targetsHit(rows, index);

                  return (
                    <span
                      key={date}
                      className={`flex-1 text-center text-[10px] tabular-nums ${
                        hit === null
                          ? "text-faint"
                          : hit / rows.length <= BAD
                            ? "text-danger"
                            : "text-muted"
                      }`}
                    >
                      {hit === null ? "·" : hit}
                    </span>
                  );
                })}
              </span>
              <span className="w-9 shrink-0" />
            </div>
          </>
        )}

        {swings && (
          <p className="mt-2.5 border-t border-border pt-2 text-xs text-muted tabular-nums">
            {swings}
          </p>
        )}
      </div>
    </section>
  );
}
