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

export default async function Home() {
  const backup = await backupStatus();

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Life Tracker</h1>
      <p className="text-sm text-muted">
        Skeleton is running. Nothing to log yet.
      </p>

      <Link
        href="/export"
        className={`mt-4 text-sm underline underline-offset-4 ${LEVEL_COLOUR[backup.level]}`}
      >
        {backup.label}
      </Link>
    </main>
  );
}
