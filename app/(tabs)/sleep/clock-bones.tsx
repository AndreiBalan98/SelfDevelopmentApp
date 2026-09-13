import { Bone } from "../skeleton";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "../icons";

// The clock while it loads: the date row (night) or the line saying what the
// range covers (period), then the dial's shape, and the times card under a
// period.
export function ClockBones({ night }: { night: boolean }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      {night ? (
        <div className="flex items-center justify-center gap-2 text-muted">
          <span className="flex p-1.5">
            <ChevronLeftIcon size={18} />
          </span>
          <Bone className="h-3.5 w-24" />
          <span className="flex p-1.5">
            <ChevronRightIcon size={18} />
          </span>
          <span className="flex p-1.5 text-accent">
            <CalendarIcon size={18} />
          </span>
        </div>
      ) : (
        <div className="flex h-4 justify-center">
          <Bone className="h-3 w-36" />
        </div>
      )}
      <div className="mx-auto aspect-square w-full max-w-[22rem] p-[17.5%]">
        <div className="bone size-full rounded-full" />
      </div>
      {!night && <div className="h-[4.75rem] rounded-xl bg-surface" />}
    </div>
  );
}
