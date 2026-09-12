import { Bone, DetailHeader, Rows, Screen, Section } from "../../skeleton";

// One recipe while it loads: a line of explanation, its details, then the
// ingredients.
export default function Loading() {
  return (
    <Screen header={<DetailHeader title={null} back={{ href: "/recipes", label: "Recipes" }} />}>
      <Bone className="h-4 w-4/5" />

      <div className="flex flex-col gap-4">
        <Bone className="h-[3.125rem]" />
        <Bone className="h-[3.125rem]" />
      </div>

      <Section heading="Ingredients">
        <Rows rows={4} lines={2} />
      </Section>
    </Screen>
  );
}
