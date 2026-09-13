import { Pills, Screen } from "../skeleton";
import { TabHeader } from "../headers";
import { ChartLineIcon, PlusIcon } from "../icons";
import { ClockBones } from "./clock-bones";

// The Sleep tab while it loads: the header with its chart switch and "+", the
// range pills as they open (Night), then last night's clock.
export default function Loading() {
  return (
    <Screen
      gap="gap-4"
      header={
        <TabHeader title="Sleep">
          <div className="flex items-center gap-4 text-muted">
            <span className="flex">
              <ChartLineIcon size={23} />
            </span>
            <span className="flex">
              <PlusIcon size={23} />
            </span>
          </div>
        </TabHeader>
      }
    >
      <Pills labels={["Night", "7", "14", "28", "Custom"]} chosen="Night" />
      <ClockBones night />
    </Screen>
  );
}
