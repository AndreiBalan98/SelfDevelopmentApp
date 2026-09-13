import { Bone, CardBones, Screen } from "../../skeleton";

// One day's weigh-in while it loads: the day as the title, then the form.
export default function Loading() {
  return (
    <Screen
      gap="gap-5"
      header={
        <header className="flex min-h-7 items-center justify-between gap-4">
          <Bone className="h-6 w-40" />
          <span className="text-sm text-accent">Weight</span>
        </header>
      }
    >
      <CardBones labels={["Day", "Weight", "Note"]} box="w-36" />
      <Bone className="h-12 rounded-lg" />
    </Screen>
  );
}
