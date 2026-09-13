import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/supabase";
import { dayFor } from "@/lib/day";
import { rangeQuery, shortDate } from "@/lib/range";
import { asTimeField } from "@/lib/sleep";
import { SleepForm } from "../sleep-form";
import { DeleteButton } from "../delete-button";
import Loading from "./loading";

export const dynamic = "force-dynamic";

// One night: the entry form behind the Sleep tab's "+", and behind the clock in
// night view. Any night, added or changed. A night is stored under the day you
// woke up, and it opens on last night — the one the red dot asks for.
export default async function SleepNightPage({ searchParams }: PageProps<"/sleep/night">) {
  const params = await searchParams;
  const { date } = params;
  // The 04:00 day, like meals: at 00:30 last night hasn't happened yet.
  const now = dayFor(new Date());
  const selected = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : now;

  // A period's range, carried through so Back and Save return to it.
  const back = rangeQuery(params);

  // Keyed on the night, so picking another one swaps straight to the skeleton
  // while it loads, rather than leaving the old night on screen.
  return (
    <Suspense key={selected} fallback={<Loading />}>
      <Night selected={selected} now={now} back={back} />
    </Suspense>
  );
}

async function Night({ selected, now, back }: { selected: string; now: string; back: string }) {
  const { data: entry, error } = await db()
    .from("sleep")
    .select("id, bedtime, wake_time, quality, notes")
    .eq("date", selected)
    .maybeSingle();

  // Back to the period it came from, or to this night on the clock.
  const clock = back ? `/sleep?${back}` : selected === now ? "/sleep" : `/sleep?date=${selected}`;

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-5">
      <header className="flex min-h-7 items-center justify-between gap-4">
        <h1 className="text-lg font-semibold tabular-nums">
          Night to {shortDate(selected, selected.slice(0, 4) !== now.slice(0, 4))}
        </h1>
        <Link href={clock} className="text-sm text-accent">
          Sleep
        </Link>
      </header>

      {error ? (
        <p className="rounded-xl bg-surface p-3.5 text-sm">Could not reach the database: {error.message}</p>
      ) : (
        <>
          {/* Keyed on the night so switching nights resets the boxes rather
              than leaving the previous night's times sitting in them. */}
          <SleepForm
            key={selected}
            date={selected}
            today={now}
            back={back}
            existing={
              entry
                ? {
                    bedtime: asTimeField(entry.bedtime),
                    wake_time: asTimeField(entry.wake_time),
                    quality: entry.quality,
                    notes: entry.notes,
                  }
                : null
            }
          />

          {entry && (
            <div className="pt-2">
              <DeleteButton id={entry.id} date={selected} back={back} />
            </div>
          )}
        </>
      )}
    </main>
  );
}
