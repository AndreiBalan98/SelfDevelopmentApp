import { Bone } from "./skeleton";

// A chart and the days under it while they load — Smoking's and Weight's: the
// line saying what the chart covers, the chart's own shape, the key, and a few
// rows. `card` adds the shape of a card between the key and the rows, where
// Weight's TDEE estimate goes.
export function ChartBones({ card = false }: { card?: boolean }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex h-[26px] items-center">
          <Bone className="h-3 w-40" />
        </div>
        <Bone className="aspect-[320/210] w-full rounded-lg" />
      </div>
      <Bone className="-mt-2 h-3 w-48" />
      {card && <div className="h-[6.25rem] rounded-xl bg-surface" />}
      <div className="flex flex-col">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="flex items-center justify-between border-t border-border py-3 first:border-t-0">
            <Bone className="h-3.5 w-24" />
            <Bone className="h-3.5 w-6" />
          </div>
        ))}
      </div>
    </div>
  );
}
