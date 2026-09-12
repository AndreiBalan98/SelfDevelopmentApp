import type { ReactNode } from "react";
import { Bone, Screen } from "../skeleton";
import { TabHeader } from "../headers";

// A card of settings lines still waiting for their values: the real labels,
// a grey block where each box will be.
function Card({ labels, children }: { labels: string[]; children?: ReactNode }) {
  return (
    <div className="flex flex-col rounded-xl bg-surface px-3.5">
      {children}
      {labels.map((label, index) => (
        <div
          key={label}
          className={`flex min-h-12 items-center justify-between gap-3 py-1.5 text-[13px] ${
            index > 0 || children ? "border-t border-border" : ""
          }`}
        >
          <span>{label}</span>
          <Bone className="h-8 w-28" />
        </div>
      ))}
    </div>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="text-xs text-faint">{children}</h2>;
}

// The Settings tab while it loads: goal, targets, body, workout, then the
// backup.
export default function Loading() {
  return (
    <Screen header={<TabHeader title="Settings" />} gap="gap-5">
      <section className="flex flex-col gap-1.5">
        <Heading>Goal</Heading>
        <Card labels={["Goal weight"]}>
          <div className="pt-2.5 pb-1">
            <Bone className="h-7" />
            <Bone className="mt-2 h-3 w-4/5" />
          </div>
        </Card>
      </section>

      <section className="flex flex-col gap-1.5">
        <Heading>Daily targets</Heading>
        <Card
          labels={[
            "Calories",
            "Daily spend",
            "Protein",
            "Carbs",
            "Added sugar",
            "Fibre",
            "Fat",
            "Saturated : unsaturated",
          ]}
        />
      </section>

      <section className="flex flex-col gap-1.5">
        <Heading>Body, for the formula estimate</Heading>
        <Card labels={["Height", "Birth year", "Sex", "Activity level"]} />
      </section>

      <section className="flex flex-col gap-1.5">
        <Heading>Workout</Heading>
        <Card labels={["Gym start date"]} />
      </section>

      <Bone className="h-12 w-20" />

      <section className="flex flex-col gap-1.5">
        <Heading>Data</Heading>
        <Bone className="h-[3.25rem]" />
      </section>
    </Screen>
  );
}
