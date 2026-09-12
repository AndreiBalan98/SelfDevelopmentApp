import { Bone, Rows, Screen } from "../skeleton";
import { NutritionHeader } from "../headers";

// The products list while it loads.
export default function Loading() {
  return (
    <Screen header={<NutritionHeader active="products" />}>
      <div className="flex flex-col gap-2">
        <Bone className="h-11" />
        <Bone className="h-3 w-32" />
      </div>

      <Rows rows={8} lines={2} />
    </Screen>
  );
}
