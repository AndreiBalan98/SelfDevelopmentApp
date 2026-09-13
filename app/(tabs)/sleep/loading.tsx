import { Pills, Screen } from "../skeleton";
import { TabHeader } from "../headers";
import { PlusIcon } from "../icons";
import { ClockBones } from "./clock-bones";

// The Sleep tab while it loads: the header and its "+", the range pills as
// they open (Night), then last night's clock.
export default function Loading() {
  return (
    <Screen
      gap="gap-4"
      header={
        <TabHeader title="Sleep">
          <span className="flex text-muted">
            <PlusIcon size={23} />
          </span>
        </TabHeader>
      }
    >
      <Pills labels={["Night", "7", "14", "28", "Custom"]} chosen="Night" />
      <ClockBones night />
    </Screen>
  );
}
