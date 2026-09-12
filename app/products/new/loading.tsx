import { Bone, Screen } from "../../skeleton";

// The new-product form while it loads. It only has something to fetch when it
// opens as a replacement for an existing product.
export default function Loading() {
  return (
    <Screen title={null} back={{ href: "/products", label: "Products" }}>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 6 }, (_, index) => (
          <Bone key={index} className="h-[3.125rem]" />
        ))}
      </div>
    </Screen>
  );
}
