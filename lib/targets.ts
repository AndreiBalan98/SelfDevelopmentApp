// Measuring a day against a target: the phase 7 rules (plan, Part 5 →
// Nutrition → Today → Target rules).
//
// Two kinds of target:
//
// - A ceiling — calories on a cut, daily spend, added sugar — is fine anywhere
//   under the limit and red once over it.
// - A zone — protein, carbs, fibre, fat, and calories on maintain or bulk — is a
//   value to land around: ±10% of the target. Inside it gets a tick. Above it,
//   the part past the zone is red. Below it is neutral while the day is still
//   going and red once the day is over.
//
// A target that isn't set is never measured, so it is never red.
//
// Red means a missed target here, and nothing else. These functions only say
// what happened; the screen decides how it looks.

import type { GoalPhase } from "@/lib/types";

export type Kind = "ceiling" | "zone";

export type Status =
  // A ceiling not yet reached.
  | "under"
  // A ceiling gone past, or a zone overshot.
  | "over"
  // Inside a zone.
  | "inside"
  // Short of a zone.
  | "below";

export type Judgement = {
  target: number;
  kind: Kind;
  status: Status;
  // The number is red.
  red: boolean;
  // How far off, always positive: "17 to zone", "8 over". Zero when inside
  // a zone or under a ceiling.
  gap: number;
  // Where red starts on the bar: the ceiling itself, or the top of the zone.
  redFrom: number;
};

// ±10%, so a zone is 90% to 110% of the target, both ends included.
export const ZONE = 0.1;

// Floating-point slack, so 110% of 60 (66.00000000000001) still counts 66 as
// inside.
const EPSILON = 1e-9;

// `finished` is whether the day is over. Being short of a zone only turns red
// once it is: today you're still eating.
export function judge(
  value: number,
  target: number | null,
  kind: Kind,
  finished: boolean,
): Judgement | null {
  if (target === null || target <= 0) return null;

  if (kind === "ceiling") {
    const over = value > target + EPSILON;
    return {
      target,
      kind,
      status: over ? "over" : "under",
      red: over,
      gap: over ? value - target : 0,
      redFrom: target,
    };
  }

  const low = target * (1 - ZONE);
  const high = target * (1 + ZONE);

  if (value > high + EPSILON) {
    return { target, kind, status: "over", red: true, gap: value - high, redFrom: high };
  }
  if (value < low - EPSILON) {
    return { target, kind, status: "below", red: finished, gap: low - value, redFrom: high };
  }
  return { target, kind, status: "inside", red: false, gap: 0, redFrom: high };
}

// Calories change kind with the goal: a ceiling on a cut, a zone on maintain or
// bulk. With no goal picked there's no rule to measure by, so they aren't
// measured at all.
export function calorieKind(phase: GoalPhase | null): Kind | null {
  if (phase === "cut") return "ceiling";
  if (phase === "maintain" || phase === "bulk") return "zone";
  return null;
}

// The bar's track spans 130% of the target, so the zone and anything over it
// stay visible. Every position is a percentage of the track, clamped to it.
export const TRACK = 1.3;

export type Bar = {
  // The nutrient-coloured part, from the left.
  fill: number;
  // The red part past the ceiling or the zone: where it starts and its width.
  redLeft: number;
  redWidth: number;
  // The thin line at the target.
  mark: number;
  // The zone band, for a zone target.
  zone: { left: number; width: number } | null;
};

export function bar(value: number, judgement: Judgement): Bar {
  const span = judgement.target * TRACK;
  const at = (amount: number) => Math.max(0, Math.min(100, (amount / span) * 100));

  const end = at(value);
  const redStart = at(judgement.redFrom);
  const over = judgement.status === "over";

  return {
    fill: over ? redStart : end,
    redLeft: redStart,
    redWidth: over ? end - redStart : 0,
    mark: at(judgement.target),
    zone:
      judgement.kind === "zone"
        ? {
            left: at(judgement.target * (1 - ZONE)),
            width: at(judgement.target * (1 + ZONE)) - at(judgement.target * (1 - ZONE)),
          }
        : null,
  };
}

// The fat ratio, saturated : unsaturated, written 1 : N. It's a ceiling on the
// saturated share: with a goal of 1 : N, saturated fat is over when it's more
// than 1 ÷ (1 + N) of all the fat — a third at the default 1 : 2.
// Unsaturated is simply everything that isn't saturated.
export type FatSplit = {
  saturated: number;
  unsaturated: number;
  // N in "1 : N" for what was eaten. Null when there's no saturated fat to
  // divide by.
  perSaturated: number | null;
  // Over the goal. False when there's no goal, or no fat.
  over: boolean;
};

export function fatSplit(fat: number, saturated: number, goal: number | null): FatSplit {
  // Saturated can't be more than the fat it's part of; a product typed that way
  // would be a typo, and the bar shouldn't draw it.
  const sat = Math.min(Math.max(saturated, 0), Math.max(fat, 0));
  const unsaturated = Math.max(fat - sat, 0);

  return {
    saturated: sat,
    unsaturated,
    perSaturated: sat > 0 ? unsaturated / sat : null,
    over: goal !== null && goal > 0 && fat > 0 && sat / fat > 1 / (1 + goal) + EPSILON,
  };
}
