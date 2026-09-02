import Link from "next/link";
import { backupStatus, type BackupLevel } from "@/lib/backup";

export const dynamic = "force-dynamic";

const LEVEL_COLOUR: Record<BackupLevel, string> = {
  unknown: "text-muted",
  never: "text-warn",
  ok: "text-muted",
  warn: "text-warn",
  late: "text-danger",
};

// One line per destination. It grows a line as each phase lands, which is
// honest about how far along the app is; a tab bar can come when there are
// enough screens to fill one.
export default async function Home() {
  const backup = await backupStatus();

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-7">
      <h1 className="text-2xl font-semibold tracking-tight">Life Tracker</h1>

      <nav className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
        <Link href="/weight" className="flex items-baseline justify-between gap-4 px-4 py-3.5">
          <span>Weight</span>
          <span className="text-sm text-muted">Log today</span>
        </Link>

        <Link href="/products" className="flex items-baseline justify-between gap-4 px-4 py-3.5">
          <span>Products</span>
          <span className="text-sm text-muted">What you buy</span>
        </Link>

        <Link href="/recipes" className="flex items-baseline justify-between gap-4 px-4 py-3.5">
          <span>Recipes</span>
          <span className="text-sm text-muted">What you cook</span>
        </Link>

        <Link href="/export" className="flex items-baseline justify-between gap-4 px-4 py-3.5">
          <span>Backup</span>
          <span className={`text-sm ${LEVEL_COLOUR[backup.level]}`}>
            {backup.label}
          </span>
        </Link>
      </nav>
    </main>
  );
}
