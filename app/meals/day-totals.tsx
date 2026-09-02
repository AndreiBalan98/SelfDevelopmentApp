import Link from "next/link";
import { round, type Nutrition } from "@/lib/nutrition";
import type { Targets } from "@/lib/settings";
import { progress, targetNote, type Direction } from "@/lib/targets";

// The day measured against your targets.
//
// Every bar is the same colour, including the ones you've gone past. The plan is
// explicit that nothing here is ever red or scolding: the numbers say what
// happened, and that's the whole job.

function Bar({ fraction }: { fraction: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
      <div
        className="h-full rounded-full bg-accent"
        style={{ width: `${Math.round(fraction * 100)}%` }}
      />
    </div>
  );
}

function Row({
  label,
  value,
  unit,
  decimals,
  target,
  direction,
}: {
  label: string;
  value: number;
  unit: string;
  decimals: number;
  target: number | null;
  direction: Direction;
}) {
  const done = progress(value, target);
  const shown = round(value, decimals).toFixed(decimals);

  return (
    <li className="flex flex-col gap-1.5 px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="tabular-nums">
          {shown}
          {unit && ` ${unit}`}
          {target !== null && <span className="text-muted"> / {target}</span>}
        </span>
      </div>

      {done ? (
        <>
          <Bar fraction={done.fraction} />
          <span className="text-xs text-muted tabular-nums">
            {targetNote(target as number, unit, direction)}
            {done.over && direction === "ceiling" && " · past it"}
            {done.reached && direction === "floor" && " · there"}
          </span>
        </>
      ) : (
        <span className="text-xs text-muted">no target set</span>
      )}
    </li>
  );
}

export function DayTotals({
  nutrition,
  cost,
  targets,
}: {
  nutrition: Nutrition;
  cost: number;
  targets: Targets;
}) {
  const calories = progress(nutrition.calories, targets.calorie_target);

  const anyMissing =
    targets.calorie_target === null ||
    targets.protein_target === null ||
    targets.fibre_min === null ||
    targets.added_sugar_max === null ||
    targets.daily_budget === null;

  return (
    <section className="flex flex-col gap-2">
      <div className="rounded-lg border border-border bg-surface px-3 py-3 flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-3xl font-semibold tabular-nums">
            {round(nutrition.calories, 0)}
            <span className="text-base font-normal text-muted"> kcal</span>
          </span>

          {targets.calorie_target !== null && (
            <span className="text-sm text-muted tabular-nums">
              of {targets.calorie_target}
            </span>
          )}
        </div>

        {calories ? (
          <Bar fraction={calories.fraction} />
        ) : (
          <span className="text-xs text-muted">no calorie target set</span>
        )}
      </div>

      <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
        <Row
          label="Protein"
          value={nutrition.protein}
          unit="g"
          decimals={1}
          target={targets.protein_target}
          direction="floor"
        />
        <Row
          label="Fibre"
          value={nutrition.fibre}
          unit="g"
          decimals={1}
          target={targets.fibre_min}
          direction="floor"
        />
        <Row
          label="Added sugar"
          value={nutrition.sugars_added}
          unit="g"
          decimals={1}
          target={targets.added_sugar_max}
          direction="ceiling"
        />
        <Row
          label="Spent"
          value={cost}
          unit=""
          decimals={2}
          target={targets.daily_budget}
          direction="budget"
        />
      </ul>

      {anyMissing && (
        <Link href="/settings" className="text-xs text-accent">
          Set your targets
        </Link>
      )}
    </section>
  );
}
