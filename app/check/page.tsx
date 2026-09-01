import { db } from "@/lib/supabase";
import { WriteTest } from "./write-test";

// Always fetched fresh — a cached answer would defeat the point of a check.
export const dynamic = "force-dynamic";

const TABLES = [
  "settings",
  "products",
  "recipes",
  "recipe_items",
  "meals",
  "meal_items",
  "sleep",
  "weight",
  "smoking",
] as const;

type TableCount = { table: string; count: number | null; error: string | null };

async function countRows(): Promise<TableCount[]> {
  const supabase = db();

  return Promise.all(
    TABLES.map(async (table) => {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      return {
        table,
        count: count ?? null,
        error: error?.message ?? null,
      };
    }),
  );
}

export default async function CheckPage() {
  let rows: TableCount[];
  let fatal: string | null = null;

  try {
    rows = await countRows();
  } catch (error) {
    rows = [];
    fatal = error instanceof Error ? error.message : String(error);
  }

  const failures = rows.filter((row) => row.error !== null);

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Connection check</h1>
        <p className="text-sm text-muted">
          Temporary. Proves the app can reach the database. Deleted once real
          screens exist.
        </p>
      </header>

      {fatal ? (
        <p className="rounded-lg border border-border bg-surface p-3 text-sm">
          Could not reach the database: {fatal}
        </p>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted">
            Reading — rows in each table
          </h2>

          <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
            {rows.map((row) => (
              <li
                key={row.table}
                className="flex items-baseline justify-between gap-4 px-3 py-2 text-sm"
              >
                <span className="font-mono">{row.table}</span>
                <span className={row.error ? "text-xs" : "tabular-nums"}>
                  {row.error ?? row.count}
                </span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted">
            {failures.length === 0
              ? "All nine tables readable. settings should be 1, the rest 0."
              : `${failures.length} table(s) could not be read.`}
          </p>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Writing</h2>
        <WriteTest />
        <p className="text-xs text-muted">
          Adds a weigh-in dated 1970, reads it back, then deletes it. Your real
          data is never touched.
        </p>
      </section>
    </main>
  );
}
