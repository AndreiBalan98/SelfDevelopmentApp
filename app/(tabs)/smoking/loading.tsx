import { Bone, Field, Rows, Screen, Section } from "../skeleton";
import { TabHeader } from "../headers";

// The cigarettes screen while it loads: the form, then the recent days.
export default function Loading() {
  return (
    <Screen header={<TabHeader title="Smoking" />} gap="gap-7">
      <div className="flex flex-col gap-4">
        <Field label="Day" />
        <Field label="Cigarettes" tall />
        <Field label="Note (optional)" />
        <Bone className="h-12" />
      </div>

      <Section heading="Last 14 days">
        <Rows rows={6} />
      </Section>
    </Screen>
  );
}
