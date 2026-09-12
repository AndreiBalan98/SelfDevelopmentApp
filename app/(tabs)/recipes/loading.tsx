import { Bone, Rows, Screen } from "../skeleton";
import { NutritionHeader } from "../headers";

// The recipes list while it loads.
export default function Loading() {
  return (
    <Screen header={<NutritionHeader active="recipes" />}>
      <div className="flex flex-col gap-2">
        <Bone className="h-11" />
        <Bone className="h-3 w-32" />
      </div>

      <Rows rows={5} lines={2} />
    </Screen>
  );
}
