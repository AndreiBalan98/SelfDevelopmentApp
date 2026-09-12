import { db } from "@/lib/supabase";
import { dateIn, daysBetween, today } from "@/lib/day";

// The backup: reading every row out of the database, and remembering when that
// last happened.
//
// This matters more than it looks. The Supabase free tier keeps no snapshots of
// anything, so if a table is wiped the data is gone permanently. The file this
// builds is the only safety net the app has.

// Every table that holds data worth keeping, in the order a future restore would
// have to put them back: a thing is always listed after whatever it points at.
//
// login_attempts is deliberately absent. It's a list of timestamps used by the
// lockout and nothing else — worthless in a backup, and nothing you'd ever want
// restored.
const EXPORT_TABLES = [
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

type ExportFile = {
  app: string;
  format: number;
  exported_at: string;
  tables: Record<string, unknown[]>;
};

// Either the whole file or nothing. A backup missing a table it couldn't read
// would be worse than no backup at all, because it would look complete.
export async function buildExport(): Promise<
  { payload: ExportFile } | { error: string }
> {
  const supabase = db();
  const tables: Record<string, unknown[]> = {};

  for (const table of EXPORT_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("id", { ascending: true });

    if (error) return { error: `Reading ${table} failed: ${error.message}` };
    tables[table] = data ?? [];
  }

  return {
    payload: {
      app: "life-tracker",
      // Bumped only if the shape of this file ever changes, so an old backup can
      // still be recognised for what it is.
      format: 1,
      exported_at: new Date().toISOString(),
      tables,
    },
  };
}

export async function markExported(): Promise<void> {
  await db()
    .from("settings")
    .update({ last_export_at: new Date().toISOString() })
    .eq("id", 1);
}

export type BackupLevel = "unknown" | "never" | "ok" | "warn" | "late";

export type BackupStatus = {
  label: string;
  level: BackupLevel;
};

// Quiet under a week, amber at a week, red at a fortnight — and red if there has
// never been one, which is the worst case of all.
export async function backupStatus(): Promise<BackupStatus> {
  let lastExportAt: string | null;

  try {
    const { data, error } = await db()
      .from("settings")
      .select("last_export_at")
      .eq("id", 1)
      .single();

    if (error) throw new Error(error.message);
    lastExportAt = data?.last_export_at ?? null;
  } catch {
    // The database being unreachable is not something a screen should crash
    // over — it says so and carries on.
    return { label: "Last export: unknown", level: "unknown" };
  }

  if (!lastExportAt) return { label: "Never exported", level: "never" };

  const days = daysBetween(dateIn(new Date(lastExportAt)), today());
  const when = days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
  const level: BackupLevel = days >= 14 ? "late" : days >= 7 ? "warn" : "ok";

  return { label: `Last export: ${when}`, level };
}
