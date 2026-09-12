import { Bone, Field, Rows, Screen, Section } from "../skeleton";
import { NutritionHeader } from "../headers";

// The weight screen while it loads: the form, then the recent weigh-ins.
export default function Loading() {
  return (
    <Screen header={<NutritionHeader active="weight" />} gap="gap-7">
      <div className="flex flex-col gap-4">
        <Field label="Day" />
        <Field label="Weight (kg)" tall />
        <Field label="Note (optional)" />
        <Bone className="h-12" />
      </div>

      <Section heading="Last 14 entries">
        <Rows rows={6} />
      </Section>
    </Screen>
  );
}
