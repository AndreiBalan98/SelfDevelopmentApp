import { Bone, Rows, Screen } from "../skeleton";
import { NutritionHeader } from "../headers";

// The day screen while it loads: the day and its arrows, the totals, the meals.
export default function Loading() {
  return (
    <Screen header={<NutritionHeader active="today" />}>
      <div className="flex items-center justify-between gap-3">
        <Bone className="h-9 w-10" />
        <Bone className="h-4 w-28" />
        <Bone className="h-9 w-10" />
      </div>

      <Bone className="h-9 w-40" />

      <div className="flex flex-col gap-2">
        <div className="rounded-lg border border-border bg-surface px-3 py-3 flex flex-col gap-3">
          <Bone className="h-8 w-32" />
          <Bone className="h-2" />
        </div>
        <Rows rows={4} />
      </div>

      <Rows rows={3} lines={2} />
    </Screen>
  );
}
