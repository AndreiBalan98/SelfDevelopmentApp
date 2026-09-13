import { Screen, ValueListBones } from "../skeleton";
import { NutritionHeader } from "../headers";

// The products list while it loads.
export default function Loading() {
  return (
    <Screen header={<NutritionHeader active="products" />} gap="gap-4">
      <ValueListBones noun="product" rows={8} />
    </Screen>
  );
}
