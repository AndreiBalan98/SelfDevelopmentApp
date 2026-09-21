import { dayFor, monthName } from "@/lib/day";
import { Bone, Pills } from "../skeleton";

// Nutrition → Today while it loads, in pieces: the day at the top, and the
// stats section underneath. They arrive separately — stepping to another day
// leaves the stats alone, and choosing another range leaves the day alone — so
// each has its own blocks.
//
// The fixed words are real: the nutrient names, the range pills, the labels on
// the eight boxes. Only what comes from the database is a grey block.

const BARS = ["Protein", "Carbs", "Added sugar", "Fibre", "Fat"];

export function DayBones() {
  return (
    <>
      <div className="-mt-2 flex justify-center py-1.5">
        <Bone className="h-[18px] w-44" />
      </div>

      <div className="flex items-end gap-[18px]">
        <div className="flex flex-col gap-1.5">
          <Bone className="h-8 w-32" />
          <Bone className="h-3 w-12" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Bone className="h-[17px] w-20" />
          <Bone className="h-3 w-12" />
        </div>
      </div>

      <div className="flex flex-col gap-[15px]">
        {BARS.map((name) => (
          <div key={name}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
              <span>{name}</span>
              <Bone className="h-3.5 w-24" />
            </div>
            <Bone className="h-2" />
          </div>
        ))}
      </div>

      <div className="flex flex-col rounded-xl bg-surface px-3.5">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0"
          >
            <div className="flex justify-between gap-3">
              <Bone className="h-3.5 w-2/5" />
              <Bone className="h-3.5 w-24" />
            </div>
            <Bone className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </>
  );
}

const BOX = "rounded-[10px] bg-surface px-2.5 py-2";

// The two cards at the top of the stats section. The month's name comes from
// the clock, not the database, so it's real here too.
export function DigestBones() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className={BOX}>
        <p className="text-[11px] text-faint">Weekly digest</p>
        <p className="mt-0.5 text-xs text-muted">Tap to open</p>
      </div>
      <div className={BOX}>
        <p className="text-[11px] text-faint">Food spend · {monthName(dayFor(new Date()))}</p>
        <Bone className="mt-1 h-4 w-20" />
      </div>
    </div>
  );
}

const BOXES = [
  "Calories / day",
  "Spend / day",
  "Protein / day",
  "Carbs / day",
  "Added sugar / day",
  "Fibre / day",
  "Fat / day",
  "Meals · snacks / day",
];

export function BoxBones() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {BOXES.map((label) => (
        <div key={label} className={BOX}>
          <p className="text-[11px] text-faint">{label}</p>
          <Bone className="mt-1 h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

// The whole stats section, for the first load of the screen.
export function StatsBones() {
  return (
    <section className="flex flex-col gap-3">
      <DigestBones />
      <div className="flex flex-col gap-2">
        <Pills labels={["4", "7", "14", "28", "Custom"]} chosen="7" />
        <Bone className="h-3.5 w-32" />
      </div>
      <BoxBones />
    </section>
  );
}
