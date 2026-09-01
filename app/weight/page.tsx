import Link from "next/link";
import { db } from "@/lib/supabase";
import { today } from "@/lib/day";
import { WeightForm } from "./weight-form";
import { DeleteButton } from "./delete-button";

export const dynamic = "force-dynamic";

const RECENT_DAYS = 14;

// "78.4 kg", and "+0.3" against the day before it.
function formatChange(kg: number, previous: number | undefined): string | null {
  if (previous === undefined) return null;
  const difference = Math.round((kg - previous) * 10) / 10;
  if (difference === 0) return "—";
  return difference > 0 ? `+${difference}` : String(difference);
}

export default async function WeightPage({ searchParams }: PageProps<"/weight">) {
  const { date } = await searchParams;
  const now = today();
  const selected = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : now;

  const supabase = db();

  const [entry, recent] = await Promise.all([
    supabase.from("weight").select("id, kg, notes").eq("date", selected).maybeSingle(),
    supabase
      .from("weight")
      .select("id, date, kg, notes")
      .order("date", { ascending: false })
      .limit(RECENT_DAYS),
  ]);

  const failure = entry.error?.message ?? recent.error?.message ?? null;
  const entries = recent.data ?? [];

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-7">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Weight</h1>
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
              leaving the previous day's number sitting in them. */}
          <WeightForm
            key={selected}
            date={selected}
            today={now}
            existing={entry.data ?? null}
          />

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted">
              Last {RECENT_DAYS} entries
            </h2>

            {entries.length === 0 ? (
              <p className="text-sm text-muted">
                Nothing logged yet. The first one goes in above.
              </p>
            ) : (
              <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
                {entries.map((row, index) => (
                  <li
                    key={row.id}
                    className="flex items-baseline justify-between gap-3 px-3 py-2.5 text-sm"
                  >
                    <Link
                      href={`/weight?date=${row.date}`}
                      className={`flex-1 ${row.date === selected ? "text-accent" : ""}`}
                    >
                      <span className="tabular-nums">{row.date}</span>
                      {row.notes && (
                        <span className="block text-xs text-muted">{row.notes}</span>
                      )}
                    </Link>

                    <span className="tabular-nums">{row.kg} kg</span>

                    <span className="w-10 text-right text-xs tabular-nums text-muted">
                      {formatChange(row.kg, entries[index + 1]?.kg)}
                    </span>

                    <DeleteButton id={row.id} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
