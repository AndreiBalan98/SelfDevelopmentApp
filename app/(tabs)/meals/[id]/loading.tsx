import { Bone, Screen } from "../../skeleton";
import { CARD, HEADING, ROW } from "../../ui";

// One meal while it loads: what was in it, the search box, then when it was.
export default function Loading() {
  return (
    <Screen
      gap="gap-5"
      header={
        <header className="flex min-h-7 items-center justify-between gap-4">
          <Bone className="h-6 w-32" />
          <Bone className="h-4 w-16" />
        </header>
      }
    >
      <section className="flex flex-col gap-1.5">
        <h2 className={HEADING}>What was in it</h2>
        <div className={CARD}>
          {[0, 1].map((row) => (
            <div
              key={row}
              className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0"
            >
              <div className="flex justify-between gap-3">
                <Bone className="h-3.5 w-2/5" />
                <Bone className="h-3.5 w-24" />
              </div>
              <div className="flex justify-between gap-3">
                <Bone className="h-3 w-1/4" />
                <Bone className="h-7 w-40" />
              </div>
            </div>
          ))}
        </div>
        <Bone className="mt-1 h-11" />
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className={HEADING}>When, and how it was</h2>
        <div className={CARD}>
          {["Date", "Time", "Counts towards", "Meal or snack", "Note"].map((label) => (
            <div key={label} className={ROW}>
              <span className="text-[13px]">{label}</span>
              <Bone className="h-8 w-36" />
            </div>
          ))}
        </div>
      </section>
    </Screen>
  );
}
