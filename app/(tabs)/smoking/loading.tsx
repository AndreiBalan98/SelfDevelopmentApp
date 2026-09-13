import { Pills, Screen } from "../skeleton";
import { TabHeader } from "../headers";
import { PlusIcon } from "../icons";
import { ChartBones } from "./chart-bones";

// The Smoking tab while it loads: the header and its "+", the range pills as
// they open (28), then the chart and the days.
export default function Loading() {
  return (
    <Screen
      gap="gap-4"
      header={
        <TabHeader title="Smoking">
          <span className="flex text-muted">
            <PlusIcon size={23} />
          </span>
        </TabHeader>
      }
    >
      <Pills labels={["7", "14", "28", "All", "Custom"]} chosen="28" />
      <ChartBones />
    </Screen>
  );
}
