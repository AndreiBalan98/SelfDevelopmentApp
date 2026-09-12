import Link from "next/link";
import type { ReactNode } from "react";
import { readGymStartDate } from "@/lib/settings";
import { dayFor, daysBetween, longDate } from "@/lib/day";
import { BarbellIcon } from "../icons";

export const dynamic = "force-dynamic";

function plural(count: number): string {
  return count === 1 ? "1 day" : `${count} days`;
}

// The screen's frame: everything centred, under the coral barbell.
function Frame({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col items-center justify-center text-center">
      <div className="mb-6.5 flex size-30 items-center justify-center rounded-full bg-workout/16 text-workout">
        <BarbellIcon size={64} />
      </div>
      {children}
    </main>
  );
}

function ChangeDate() {
  return (
    <Link href="/settings" className="mt-7 text-xs text-faint">
      Change the date in Settings
    </Link>
  );
}

// The Workout tab, a placeholder until phase 8: a countdown to the gym start
// date set in Settings. Days are counted on the 04:00 day, like the rest of
// the app.
export default async function WorkoutPage() {
  const gym = await readGymStartDate();

  if ("error" in gym) {
    return (
      <Frame>
        <p className="text-sm text-muted">
          Couldn&rsquo;t read the gym start date. ({gym.error})
        </p>
      </Frame>
    );
  }

  if (gym.date === null) {
    return (
      <Frame>
        <p className="text-[17px]">Set your gym start date</p>
        <Link
          href="/settings"
          className="mt-6 rounded-lg bg-accent px-4 py-3 font-medium text-black"
        >
          Open Settings
        </Link>
      </Frame>
    );
  }

  const away = daysBetween(dayFor(new Date()), gym.date);

  return (
    <Frame>
      <p className="text-[15px] text-muted">
        {away > 0 ? "Gym starts in" : away === 0 ? "Gym starts" : "Gym started"}
      </p>
      <p className="my-1 text-[52px] font-semibold leading-[1.1] tabular-nums">
        {away > 0 ? plural(away) : away === 0 ? "today" : `${plural(-away)} ago`}
      </p>
      <p className="text-sm text-muted">{longDate(gym.date)}</p>
      {away < 0 && <p className="mt-3 text-sm text-muted">Workout tracking is coming</p>}
      <ChangeDate />
    </Frame>
  );
}
