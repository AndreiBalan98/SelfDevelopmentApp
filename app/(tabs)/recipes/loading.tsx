import { Screen, ValueListBones } from "../skeleton";
import { NutritionHeader } from "../headers";

// The recipes list while it loads.
export default function Loading() {
  return (
    <Screen header={<NutritionHeader active="recipes" />} gap="gap-4">
      <ValueListBones noun="recipe" rows={5} />
    </Screen>
  );
}
