import { Bone, Rows, Screen } from "../skeleton";

// The targets screen while it loads.
export default function Loading() {
  return (
    <Screen title="Targets" back={{ href: "/", label: "Home" }}>
      <div className="flex flex-col gap-2">
        <Bone className="h-4" />
        <Bone className="h-4" />
        <Bone className="h-4 w-3/5" />
      </div>

      <Rows rows={5} />
      <Bone className="h-12" />
    </Screen>
  );
}
