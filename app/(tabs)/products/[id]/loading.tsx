import { Bone, CardBones, DetailHeader, Screen } from "../../skeleton";
import { HEADING } from "../../ui";

// One product while it loads. What it shows depends on whether the product has
// been used — the full form, or just the name and its figures — so this is the
// shape both have in common: a line of explanation, the name, then what it cost.
export default function Loading() {
  return (
    <Screen
      gap="gap-5"
      header={<DetailHeader title={null} back={{ href: "/products", label: "Products" }} />}
    >
      <Bone className="h-4 w-4/5" />
      <CardBones labels={["Name"]} box="w-40" />

      <section className="flex flex-col gap-1.5">
        <h2 className={HEADING}>What it cost</h2>
        <CardBones labels={["Package", "Per 100"]} />
      </section>
    </Screen>
  );
}
