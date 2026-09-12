import { Bone, Field, Rows, Screen, Section } from "../skeleton";

// The sleep screen while it loads: the form, then the recent nights.
export default function Loading() {
  return (
    <Screen title="Sleep" back={{ href: "/", label: "Home" }} gap="gap-7">
      <div className="flex flex-col gap-4">
        <Field label="Woke up on" />
        <div className="flex gap-3">
          <Field label="Went to bed" />
          <Field label="Got up" />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted">How it was</span>
          <Bone className="h-9" />
        </div>
        <Field label="Note (optional)" />
        <Bone className="h-12" />
      </div>

      <Section heading="Last 14 nights">
        <Rows rows={6} />
      </Section>
    </Screen>
  );
}
