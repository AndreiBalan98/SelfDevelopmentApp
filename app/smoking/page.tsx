import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/supabase";
import { today } from "@/lib/day";
import { averageOver, type Average } from "@/lib/series";
import { SmokingForm } from "./smoking-form";
import { DeleteButton } from "./delete-button";
import Loading from "./loading";

export const dynamic = "force-dynamic";

const RECENT_DAYS = 14;
const SHORT_WINDOW = 4;
const LONG_WINDOW = 7;

// "9.3 a day", with the gap said out loud when the window isn't full. An average
// over four of the last seven days is a different claim from one over seven.
function describe(average: Average): string {
  const rounded = (Math.round(average.average * 10) / 10).toFixed(1);
  const shown = `${rounded} a day`;

  if (average.counted === average.window) return shown;

  return `${shown}, over the ${average.counted} you logged`;
}

export default async function SmokingPage({ searchParams }: PageProps<"/smoking">) {
  const { date } = await searchParams;
  const now = today();
  const selected =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : now;

  // Keyed on the day, so picking another day swaps straight to the skeleton
  // while it loads, rather than leaving the old day on screen.
  return (
    <Suspense key={selected} fallback={<Loading />}>
      <Smoking selected={selected} now={now} />
    </Suspense>
  );
}

async function Smoking({ selected, now }: { selected: string; now: string }) {
  const supabase = db();

  const [entry, recent] = await Promise.all([
    supabase.from("smoking").select("count, notes").eq("date", selected).maybeSingle(),
    supabase
      .from("smoking")
      .select("id, date, count, notes")
      .order("date", { ascending: false })
      .limit(RECENT_DAYS),
  ]);

  const failure = entry.error?.message ?? recent.error?.message ?? null;
  const days = recent.data ?? [];

  const values = days.map((day) => ({ date: day.date, value: day.count }));
  const shortRun = averageOver(values, now, SHORT_WINDOW);
  const longRun = averageOver(values, now, LONG_WINDOW);

  // The trend, which the plan says is the point rather than the bad days. One
  // comparison between two numbers already on screen, stated flatly — this is
  // the only place in the app that interprets rather than reports, so it never
  // congratulates and never scolds.
  const direction =
    shortRun && longRun && Math.abs(shortRun.average - longRun.average) >= 0.05
      ? shortRun.average < longRun.average
        ? "The last four days are below the week."
        : "The last four days are above the week."
      : null;

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-7">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Cigarettes</h1>
        <Link href="/" className="text-sm text-accent">
          Home
        </Link>
      </header>

      {failure ? (
        <p className="rounded-lg border border-border bg-surface p-3 text-sm">
          Could not reach the database: {failure}
        </p>
      ) : (
        <>
          {/* Keyed on the day so switching days resets the field rather than
              leaving the previous day's number sitting in it. */}
          <SmokingForm
            key={selected}
            date={selected}
            today={now}
            existing={entry.data ?? null}
          />

          {(shortRun || longRun) && (
            <div className="-mt-3 flex flex-col gap-1 text-sm text-muted tabular-nums">
              {shortRun && <p>Last {SHORT_WINDOW} days: {describe(shortRun)}</p>}
              {longRun && <p>Last {LONG_WINDOW} days: {describe(longRun)}</p>}
              {direction && <p className="text-foreground">{direction}</p>}
            </div>
          )}

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted">Last {RECENT_DAYS} days</h2>

            {days.length === 0 ? (
              <p className="text-sm text-muted">
                Nothing logged yet. The first day goes in above.
              </p>
            ) : (
              <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
                {days.map((day) => (
                  <li
                    key={day.id}
                    className="flex items-baseline justify-between gap-3 px-3 py-2.5 text-sm"
                  >
                    <Link
                      href={`/smoking?date=${day.date}`}
                      className={`flex-1 ${day.date === selected ? "text-accent" : ""}`}
                    >
                      <span className="tabular-nums">{day.date}</span>
                      {day.notes && (
                        <span className="block text-xs text-muted">{day.notes}</span>
                      )}
                    </Link>

                    <span className="tabular-nums">{day.count}</span>

                    <DeleteButton id={day.id} />
                  </li>
                ))}
              </ul>
            )}

            <p className="text-xs text-muted">
              A day that isn&rsquo;t here wasn&rsquo;t logged, which is not the same as a
              day of none — a zero is a real entry and counts towards the averages.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
