import { Bone, Rows, Screen, Section } from "../skeleton";
import { TabHeader } from "../headers";

// The Settings tab while it loads: the targets, then the backup.
export default function Loading() {
  return (
    <Screen header={<TabHeader title="Settings" />}>
      <Section heading="Daily targets">
        <div className="flex flex-col gap-2">
          <Bone className="h-4" />
          <Bone className="h-4" />
          <Bone className="h-4 w-3/5" />
        </div>
        <Rows rows={5} />
        <Bone className="h-12 w-24" />
      </Section>

      <Section heading="Data">
        <Bone className="h-[3.25rem]" />
      </Section>
    </Screen>
  );
}
