import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/supabase";
import { dateRowLabel, dayFor, shiftDays } from "@/lib/day";
import { rangeQuery } from "@/lib/range";
import { SmokingForm } from "../smoking-form";
import { DeleteButton } from "../delete-button";
import Loading from "./loading";

export const dynamic = "force-dynamic";

// One day's cigarettes: the entry form behind the Smoking tab's "+", and behind
// every row under the chart. Any day, added or changed.
export default async function SmokingDayPage({ searchParams }: PageProps<"/smoking/day">) {
  const params = await searchParams;
  const { date } = params;
  // The 04:00 day, like meals.
  const now = dayFor(new Date());
  // Smoking is always logged a day behind, so the form opens on yesterday —
  // the day the red dot asks for — and a count can't land on today by default.
  // Logging today early means changing the date.
  const selected =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : shiftDays(now, -1);

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
    .from("smoking")
    .select("id, count, notes")
    .eq("date", selected)
    .maybeSingle();

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-5">
      <header className="flex min-h-7 items-center justify-between gap-4">
        <h1 className="text-lg font-semibold tabular-nums">{dateRowLabel(selected, now)}</h1>
        <Link href={`/smoking${back ? `?${back}` : ""}`} className="text-sm text-accent">
          Smoking
        </Link>
      </header>

      {error ? (
        <p className="rounded-xl bg-surface p-3.5 text-sm">Could not reach the database: {error.message}</p>
      ) : (
        <>
          {/* Keyed on the day so switching days resets the boxes rather than
              leaving the previous day's number sitting in them. */}
          <SmokingForm key={selected} date={selected} today={now} existing={entry ?? null} back={back} />

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
