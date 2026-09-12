import { Bone, Rows, Screen } from "../skeleton";

// The products list while it loads.
export default function Loading() {
  return (
    <Screen title="Products" back={{ href: "/", label: "Home" }}>
      <div className="flex flex-col gap-2">
        <Bone className="h-11" />
        <Bone className="h-3 w-32" />
      </div>

      <Rows rows={8} lines={2} />
    </Screen>
  );
}
