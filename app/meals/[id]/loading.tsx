import { Bone, Field, Rows, Screen, Section } from "../../skeleton";

// One meal while it loads: what was in it, the search box, when it was.
export default function Loading() {
  return (
    <Screen title={null} back={null}>
      <Section heading="What was in it">
        <Rows rows={3} lines={2} />
        <Bone className="mt-1 h-11" />
      </Section>

      <Section heading="When, and how it was">
        <div className="flex gap-3">
          <Field label="Date" />
          <Field label="Time" />
        </div>
      </Section>
    </Screen>
  );
}
