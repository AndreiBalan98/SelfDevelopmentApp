import { Bone, Screen } from "../skeleton";
import { NutritionHeader } from "../headers";

const BARS = ["Protein", "Carbs", "Added sugar", "Fibre", "Fat"];

// Today while it loads: the date row, the hero, the five nutrient bars with
// their real names, the meals, and the "+" where it will be.
export default function Loading() {
  return (
    <Screen header={<NutritionHeader active="today" />} gap="gap-5">
      <div className="-mt-2 flex justify-center py-1.5">
        <Bone className="h-[18px] w-44" />
      </div>

      <div className="flex items-end gap-[18px]">
        <div className="flex flex-col gap-1.5">
          <Bone className="h-8 w-32" />
          <Bone className="h-3 w-12" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Bone className="h-[17px] w-20" />
          <Bone className="h-3 w-12" />
        </div>
      </div>

      <div className="flex flex-col gap-[15px]">
        {BARS.map((name) => (
          <div key={name}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
              <span>{name}</span>
              <Bone className="h-3.5 w-24" />
            </div>
            <Bone className="h-2" />
          </div>
        ))}
      </div>

      <div className="flex flex-col rounded-xl bg-surface px-3.5">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0"
          >
            <div className="flex justify-between gap-3">
              <Bone className="h-3.5 w-2/5" />
              <Bone className="h-3.5 w-24" />
            </div>
            <Bone className="h-3 w-1/2" />
          </div>
        ))}
      </div>

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
