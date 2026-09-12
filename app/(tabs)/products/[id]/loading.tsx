import { Bone, DetailHeader, Screen } from "../../skeleton";

// One product while it loads. What it shows depends on whether the product has
// been used — the full form, or just the name and its figures — so this is the
// shape both have in common: a line of explanation, then fields.
export default function Loading() {
  return (
    <Screen header={<DetailHeader title={null} back={{ href: "/products", label: "Products" }} />}>
      <Bone className="h-4 w-4/5" />

      <div className="flex flex-col gap-4">
        {Array.from({ length: 6 }, (_, index) => (
          <Bone key={index} className="h-[3.125rem]" />
        ))}
      </div>
    </Screen>
  );
}
