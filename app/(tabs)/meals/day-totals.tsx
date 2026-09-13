import Link from "next/link";
import type { ReactNode } from "react";
import type { Nutrition } from "@/lib/nutrition";
import type { Targets } from "@/lib/settings";
import {
  TRACK,
  bar,
  calorieKind,
  fatSplit,
  judge,
  type Judgement,
  type Kind,
} from "@/lib/targets";
import type { Metric } from "@/lib/sources";
import { CheckIcon } from "../icons";
import { SourceTap } from "./sources";

// The top of Nutrition → Today: calories and money as the hero, then a bar for
// each nutrient, all measured by the phase 7 target rules (lib/targets.ts).
//
// Bars keep their nutrient colour; red appears only on the part that's over
// and on the number. A target that isn't set shows its number with no bar and
// is never red.
//
// Tapping the calories, the spend, a bar or the fat line underneath opens
// "where did it come from?" for that number (./sources.tsx).

const whole = (value: number) => Math.round(value).toLocaleString("en-GB");

// A ratio as written after "1 :" — "2", "1.5".
const ratio = (value: number) => String(Math.round(value * 10) / 10);

// "17 to zone" and "8 over", rounded like the amounts beside them so the sum on
// screen adds up — but never 0: anything short of the zone, or past the limit,
// is at least 1 off.
const gap = (judgement: Judgement) => Math.max(1, Math.round(judgement.gap));

function SetTarget({ children = "set a target" }: { children?: ReactNode }) {
  return (
    <Link href="/settings" className="text-faint">
      {children}
    </Link>
  );
}

function Hero({
  calories,
  cost,
  targets,
  finished,
}: {
  calories: number;
  cost: number;
  targets: Targets;
  finished: boolean;
}) {
  const kind = calorieKind(targets.goal_phase);
  const calorie = kind ? judge(calories, targets.calorie_target, kind, finished) : null;
  const spend = judge(cost, targets.daily_budget, "ceiling", finished);

  return (
    <div className="flex items-end gap-[18px]">
      <SourceTap metric="calories">
        <p
          className={`text-[32px] font-semibold leading-none tabular-nums ${
            calorie?.red ? "text-danger" : ""
          }`}
        >
          {whole(calories)} <span className="text-[13px] font-normal text-faint">kcal</span>
        </p>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-faint tabular-nums">
          {targets.calorie_target === null ? (
            <SetTarget />
          ) : (
            <>
              of {whole(targets.calorie_target)}
              {kind === null && (
                <>
                  {" · "}
                  <SetTarget>pick a goal</SetTarget>
                </>
              )}
              {calorie?.status === "inside" && (
                <span className="text-zone" aria-label="in the zone">
                  <CheckIcon size={12} />
                </span>
              )}
            </>
          )}
        </p>
      </SourceTap>

      <SourceTap metric="cost">
        <p
          className={`text-[17px] font-semibold leading-none tabular-nums ${
            spend?.red ? "text-danger" : "text-muted"
          }`}
        >
          {cost.toFixed(2)} lei
        </p>
        <p className="mt-1 text-[11px] text-faint tabular-nums">
          {targets.daily_budget === null ? (
            <SetTarget />
          ) : (
            // No unit here, the same as "of 2,000" under the calories: the
            // number above already says lei.
            `of ${targets.daily_budget.toLocaleString("en-GB")}`
          )}
        </p>
      </SourceTap>
    </div>
  );
}

// What sits on the right of a nutrient's name: the amount against the target,
// and how it stands.
function Reading({ value, judgement }: { value: number; judgement: Judgement | null }) {
  if (!judgement) {
    return (
      <span className="text-muted tabular-nums">
        {whole(value)} g · <SetTarget />
      </span>
    );
  }

  const amounts = `${whole(value)} / ${whole(judgement.target)} g${
    judgement.kind === "ceiling" ? " max" : ""
  }`;

  if (judgement.status === "inside") {
    return (
      <span className="flex items-center gap-1 text-zone tabular-nums">
        {amounts}
        <CheckIcon size={13} />
      </span>
    );
  }

  const note =
    judgement.status === "over"
      ? ` · ${gap(judgement)} over`
      : judgement.status === "below"
        ? ` · ${gap(judgement)} to zone`
        : "";

  return (
    <span className={`tabular-nums ${judgement.red ? "text-danger" : "text-muted"}`}>
      {amounts}
      {note}
    </span>
  );
}

// The bar: a grey track spanning 130% of the target, the ±10% zone as a pale
// green band, a thin line at the target, the nutrient's colour up to the value,
// and red on anything past the ceiling or the zone. The fat bar splits its
// colour into saturated and unsaturated.
function Track({
  value,
  judgement,
  colour,
  saturated,
}: {
  value: number;
  judgement: Judgement;
  colour: string;
  saturated?: number;
}) {
  const shape = bar(value, judgement);
  const hasRed = shape.redWidth > 0;

  // The saturated part is drawn first, up to however much of the fill it is.
  const satWidth =
    saturated === undefined
      ? 0
      : Math.min(shape.fill, Math.max(0, (saturated / (judgement.target * TRACK)) * 100));

  return (
    <div className="relative h-2 rounded-full bg-border-strong" aria-hidden="true">
      {shape.zone && (
        <div
          className="absolute -top-1 h-4 rounded-[3px] bg-zone opacity-30"
          style={{ left: `${shape.zone.left}%`, width: `${shape.zone.width}%` }}
        />
      )}

      {saturated === undefined ? (
        <div
          className={`absolute inset-y-0 left-0 ${hasRed ? "rounded-l-full" : "rounded-full"} ${colour}`}
          style={{ width: `${shape.fill}%` }}
        />
      ) : (
        <>
          <div
            className={`absolute inset-y-0 left-0 bg-saturated ${
              satWidth < shape.fill || hasRed ? "rounded-l-full" : "rounded-full"
            }`}
            style={{ width: `${satWidth}%` }}
          />
          <div
            className={`absolute inset-y-0 bg-unsaturated ${
              hasRed ? "" : "rounded-r-full"
            } ${satWidth === 0 ? "rounded-l-full" : ""}`}
            style={{ left: `${satWidth}%`, width: `${shape.fill - satWidth}%` }}
          />
        </>
      )}

      {hasRed && (
        <div
          className="absolute inset-y-0 rounded-r-full bg-danger"
          style={{ left: `${shape.redLeft}%`, width: `${shape.redWidth}%` }}
        />
      )}

      <div
        className="absolute -top-[5px] h-[18px] w-0.5 bg-muted"
        style={{ left: `calc(${shape.mark}% - 1px)` }}
      />
    </div>
  );
}

function NutrientRow({
  name,
  metric,
  value,
  target,
  kind,
  colour,
  finished,
  saturated,
  children,
}: {
  name: string;
  metric: Metric;
  value: number;
  target: number | null;
  kind: Kind;
  colour: string;
  finished: boolean;
  saturated?: number;
  children?: ReactNode;
}) {
  const judgement = judge(value, target, kind, finished);

  return (
    <div>
      <SourceTap metric={metric}>
        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
          <span>{name}</span>
          <Reading value={value} judgement={judgement} />
        </div>
        {judgement && (
          <Track value={value} judgement={judgement} colour={colour} saturated={saturated} />
        )}
      </SourceTap>
      {children}
    </div>
  );
}

// Under the fat bar: how it splits, and the ratio against the goal. Only the
// ratio ever turns red, when the saturated share is over the limit. Tapping it
// opens where the saturated fat came from.
function FatLine({ fat, saturated, goal }: { fat: number; saturated: number; goal: number | null }) {
  const split = fatSplit(fat, saturated, goal);

  return (
    <SourceTap metric="saturated_fat" className="mt-[7px] text-xs text-muted tabular-nums">
      <span className="mr-1 inline-block h-2 w-[9px] rounded-[2px] bg-saturated align-middle" />
      Sat {whole(split.saturated)} g ·{" "}
      <span className="mr-1 inline-block h-2 w-[9px] rounded-[2px] bg-unsaturated align-middle" />
      Unsat {whole(split.unsaturated)} g
      {split.perSaturated !== null && (
        <>
          {" · "}
          <span className={split.over ? "text-danger" : ""}>1 : {ratio(split.perSaturated)}</span>
          {goal !== null && <span className="text-faint"> (goal 1 : {ratio(goal)})</span>}
        </>
      )}
    </SourceTap>
  );
}

export function DayTotals({
  nutrition,
  cost,
  targets,
  finished,
}: {
  nutrition: Nutrition;
  cost: number;
  targets: Targets;
  // The day is over, so being short of a zone is a miss rather than "still
  // eating".
  finished: boolean;
}) {
  return (
    <section className="flex flex-col gap-5">
      <Hero calories={nutrition.calories} cost={cost} targets={targets} finished={finished} />

      <div className="flex flex-col gap-[15px]">
        <NutrientRow
          name="Protein"
          metric="protein"
          value={nutrition.protein}
          target={targets.protein_target}
          kind="zone"
          colour="bg-protein"
          finished={finished}
        />
        <NutrientRow
          name="Carbs"
          metric="carbs"
          value={nutrition.carbs}
          target={targets.carbs_target}
          kind="zone"
          colour="bg-carbs"
          finished={finished}
        />
        <NutrientRow
          name="Added sugar"
          metric="sugars_added"
          value={nutrition.sugars_added}
          target={targets.added_sugar_max}
          kind="ceiling"
          colour="bg-added-sugar"
          finished={finished}
        />
        <NutrientRow
          name="Fibre"
          metric="fibre"
          value={nutrition.fibre}
          target={targets.fibre_target}
          kind="zone"
          colour="bg-fibre"
          finished={finished}
        />
        <NutrientRow
          name="Fat"
          metric="fat"
          value={nutrition.fat}
          target={targets.fat_target}
          kind="zone"
          colour="bg-fat"
          finished={finished}
          saturated={nutrition.saturated_fat}
        >
          <FatLine
            fat={nutrition.fat}
            saturated={nutrition.saturated_fat}
            goal={targets.unsat_per_sat}
          />
        </NutrientRow>
      </div>
    </section>
  );
}
