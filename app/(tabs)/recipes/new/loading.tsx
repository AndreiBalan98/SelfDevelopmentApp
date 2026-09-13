import { Bone, CardBones, Screen } from "../../skeleton";
import { HEADING } from "../../ui";

// The recipe form while it loads. It only has something to fetch when it
// opens as a copy of an existing recipe — to replace it or duplicate it —
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
      <CardBones labels={["Name", "Servings", "Cooked weight"]} box="w-40" />

      <section className="flex flex-col gap-1.5">
        <h2 className={HEADING}>Notes · optional</h2>
        <Bone className="h-[5.25rem] rounded-xl" />
      </section>
    </Screen>
  );
}
