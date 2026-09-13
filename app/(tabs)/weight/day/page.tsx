import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/supabase";
import { dateRowLabel, dayFor } from "@/lib/day";
import { rangeQuery } from "@/lib/range";
import { WeightForm } from "../weight-form";
import { DeleteButton } from "../delete-button";
import Loading from "./loading";

export const dynamic = "force-dynamic";

// One day's weigh-in: the entry form behind the Weight "+", and behind every
// row under the chart. Any day, added or changed.
export default async function WeightDayPage({ searchParams }: PageProps<"/weight/day">) {
  const params = await searchParams;
  const { date } = params;
  // The 04:00 day, like meals. It opens on today — the day the red dot asks for.
  const now = dayFor(new Date());
  const selected = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : now;

  // The chart's range, carried through so Back and Save return to it.
  const back = rangeQuery(params);

  // Keyed on the day, so picking another day swaps straight to the skeleton
  // while it loads, rather than leaving the old day on screen.
  return (
    <Suspense key={selected} fallback={<Loading />}>
      <Day selected={selected} now={now} back={back} />
    </Suspense>
  );
}

async function Day({ selected, now, back }: { selected: string; now: string; back: string }) {
  const { data: entry, error } = await db()
    .from("weight")
    .select("id, kg, notes")
    .eq("date", selected)
    .maybeSingle();

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-5">
      <header className="flex min-h-7 items-center justify-between gap-4">
        <h1 className="text-lg font-semibold tabular-nums">{dateRowLabel(selected, now)}</h1>
        <Link href={`/weight${back ? `?${back}` : ""}`} className="text-sm text-accent">
          Weight
        </Link>
      </header>

      {error ? (
        <p className="rounded-xl bg-surface p-3.5 text-sm">Could not reach the database: {error.message}</p>
      ) : (
        <>
          {/* Keyed on the day so switching days resets the boxes rather than
              leaving the previous day's number sitting in them. */}
          <WeightForm key={selected} date={selected} today={now} existing={entry ?? null} back={back} />

          {entry && (
            <div className="pt-2">
              <DeleteButton id={entry.id} back={back} />
            </div>
          )}
        </>
      )}
    </main>
  );
}
