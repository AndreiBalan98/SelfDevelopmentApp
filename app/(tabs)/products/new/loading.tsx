import { Bone, CardBones, Screen } from "../../skeleton";
import { HEADING } from "../../ui";

// The product form while it loads. It only has something to fetch when it
// opens as a copy of an existing product — to replace it or duplicate it —
// which is also what decides the title, so the title waits too.
export default function Loading() {
  return (
    <Screen
      gap="gap-5"
      header={
        <header className="flex min-h-7 items-center justify-between gap-4">
          <Bone className="h-6 w-40" />
          <span className="text-sm text-accent">Cancel</span>
        </header>
      }
    >
      <CardBones labels={["Name", "Sold by"]} box="w-44" />

      <section className="flex flex-col gap-1.5">
        <h2 className={HEADING}>What it cost</h2>
        <CardBones labels={["Package price", "Package size"]} />
      </section>

      <CardBones labels={["Grams in one piece"]} />

      <section className="flex flex-col gap-1.5">
        <h2 className={HEADING}>Per 100</h2>
        <CardBones labels={["Energy", "Fat", "Carbohydrate"]} box="w-20" />
      </section>
    </Screen>
  );
}
