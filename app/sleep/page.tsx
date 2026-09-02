import Link from "next/link";
import { db } from "@/lib/supabase";
import { today } from "@/lib/day";
import { asTimeField, formatDuration, minutesAsleep } from "@/lib/sleep";
import { averageOver } from "@/lib/series";
import { SleepForm } from "./sleep-form";
import { DeleteButton } from "./delete-button";

export const dynamic = "force-dynamic";

const RECENT_NIGHTS = 14;
const AVERAGE_OVER = 7;

export default async function SleepPage({ searchParams }: PageProps<"/sleep">) {
  const { date } = await searchParams;
  const now = today();
  const selected =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : now;

  const supabase = db();

  const [entry, recent] = await Promise.all([
    supabase
      .from("sleep")
      .select("bedtime, wake_time, quality, notes")
      .eq("date", selected)
      .maybeSingle(),
    supabase
      .from("sleep")
      .select("id, date, bedtime, wake_time, quality, notes")
      .order("date", { ascending: false })
      .limit(RECENT_NIGHTS),
  ]);

  const failure = entry.error?.message ?? recent.error?.message ?? null;
  const nights = recent.data ?? [];

  // The average length of a night, over the nights that actually have both
  // times. A night logged with only a score has no length to average.
  const lengths = nights.flatMap((night) => {
    const minutes = minutesAsleep(night.bedtime, night.wake_time);
    return minutes === null ? [] : [{ date: night.date, value: minutes }];
  });

  const average = averageOver(lengths, now, AVERAGE_OVER);

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-7">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Sleep</h1>
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
          {/* Keyed on the day so switching days resets the fields rather than
              leaving the previous night's times sitting in them. */}
          <SleepForm
            key={selected}
            date={selected}
            today={now}
            existing={
              entry.data
                ? {
                    bedtime: asTimeField(entry.data.bedtime),
                    wake_time: asTimeField(entry.data.wake_time),
                    quality: entry.data.quality,
                    notes: entry.data.notes,
                  }
                : null
            }
          />

          {average && (
            <p className="-mt-3 text-sm text-muted tabular-nums">
              Last {AVERAGE_OVER} nights: {formatDuration(Math.round(average.average))} a
              night
              {/* Said out loud when the week has gaps in it, because an average
                  over four nights is a different claim from one over seven. */}
              {average.counted < average.window &&
                ` · over the ${average.counted} you logged`}
            </p>
          )}

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted">Last {RECENT_NIGHTS} nights</h2>

            {nights.length === 0 ? (
              <p className="text-sm text-muted">
                Nothing logged yet. The first night goes in above.
              </p>
            ) : (
              <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
                {nights.map((night) => {
                  const minutes = minutesAsleep(night.bedtime, night.wake_time);

                  return (
                    <li
                      key={night.id}
                      className="flex items-baseline justify-between gap-3 px-3 py-2.5 text-sm"
                    >
                      <Link
                        href={`/sleep?date=${night.date}`}
                        className={`flex-1 ${night.date === selected ? "text-accent" : ""}`}
                      >
                        <span className="tabular-nums">{night.date}</span>
                        {night.notes && (
                          <span className="block text-xs text-muted">{night.notes}</span>
                        )}
                      </Link>

                      <span className="tabular-nums">
                        {minutes === null ? (
                          <span className="text-muted">—</span>
                        ) : (
                          formatDuration(minutes)
                        )}
                      </span>

                      <span className="w-6 text-right text-xs tabular-nums text-muted">
                        {night.quality ?? ""}
                      </span>

                      <DeleteButton id={night.id} />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
