import { Bone, Field, Screen } from "../../skeleton";

// The new-recipe form while it loads. It only has something to fetch when it
// opens as a replacement for an existing recipe.
export default function Loading() {
  return (
    <Screen title={null} back={{ href: "/recipes", label: "Recipes" }}>
      <div className="flex flex-col gap-4">
        <Field label="Name" />
        <div className="flex gap-3">
          <Field label="Servings" />
          <Field label="Cooked weight (g)" />
        </div>
        <Bone className="h-12" />
      </div>
    </Screen>
  );
}
