import { Bone, CardBones, DetailHeader, Screen } from "../../skeleton";
import { CARD, HEADING } from "../../ui";

// One recipe while it loads: a line of explanation, its details, then the
// ingredients.
export default function Loading() {
  return (
    <Screen
      gap="gap-5"
      header={<DetailHeader title={null} back={{ href: "/recipes", label: "Recipes" }} />}
    >
      <Bone className="h-4 w-4/5" />
      <CardBones labels={["Name", "Servings"]} box="w-40" />

      <section className="flex flex-col gap-1.5">
        <h2 className={HEADING}>Ingredients</h2>
        <div className={CARD}>
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0"
            >
              <div className="flex justify-between gap-3">
                <Bone className="h-3.5 w-2/5" />
                <Bone className="h-3.5 w-24" />
              </div>
              <Bone className="h-3 w-1/5" />
            </div>
          ))}
        </div>
      </section>
    </Screen>
  );
}
