import { Bone, Pills, Screen } from "../skeleton";
import { NutritionHeader } from "../headers";
import { PlusIcon } from "../icons";
import { ChartBones } from "../chart-bones";

// Nutrition → Weight while it loads: the header and its "+", the range pills
// as they open (28), the goal line, then the chart and the weigh-ins.
export default function Loading() {
  return (
    <Screen
      gap="gap-4"
      header={
        <NutritionHeader active="weight">
          <span className="flex text-muted">
            <PlusIcon size={23} />
          </span>
        </NutritionHeader>
      }
    >
      <Pills labels={["7", "14", "28", "All", "Custom"]} chosen="28" />
      <div className="flex h-8 items-center">
        <Bone className="h-6 w-44" />
      </div>
      <ChartBones />
    </Screen>
  );
}
