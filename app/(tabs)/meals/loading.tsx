import { Screen } from "../skeleton";
import { NutritionHeader } from "../headers";
import { DayBones, StatsBones } from "./bones";

// Today while it loads: the date row, the hero, the five nutrient bars with
// their real names, the meals, the stats section underneath, and the "+" where
// it will be.
//
// The range pills show the default 7 here, whichever range the address asks
// for: a loading screen is drawn before the address is read. Once the screen is
// up, choosing a range keeps the real pills in place and only the boxes below
// them show blocks.
export default function Loading() {
  return (
    <Screen header={<NutritionHeader active="today" />} gap="gap-5">
      <DayBones />
      <StatsBones />

      {/* The "+" in its place, so it doesn't blink when the day changes. */}
      <span
        aria-hidden="true"
        className="fixed z-30 size-[46px] rounded-full bg-nutrition opacity-60"
        style={{
          bottom: "calc(2.375rem + max(1.75rem, env(safe-area-inset-bottom)) + 0.875rem)",
          right: "max(1rem, calc((100vw - 28rem) / 2 + 1rem))",
        }}
      />
    </Screen>
  );
}
