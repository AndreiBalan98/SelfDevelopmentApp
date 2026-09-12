import { Bone } from "../skeleton";
import { BarbellIcon } from "../icons";

// The Workout tab while it loads: the barbell is real, the countdown is grey.
export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col items-center justify-center text-center"
    >
      <div className="mb-6.5 flex size-30 items-center justify-center rounded-full bg-workout/16 text-workout">
        <BarbellIcon size={64} />
      </div>
      <Bone className="h-4 w-24" />
      <Bone className="my-2 h-12 w-40" />
      <Bone className="h-4 w-32" />
    </main>
  );
}
