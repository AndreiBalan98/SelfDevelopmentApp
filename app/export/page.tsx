import Link from "next/link";
import { backupStatus, type BackupLevel } from "@/lib/backup";
import { ExportButton } from "./export-button";

export const dynamic = "force-dynamic";

const LEVEL_COLOUR: Record<BackupLevel, string> = {
  unknown: "text-muted",
  never: "text-warn",
  ok: "text-muted",
  warn: "text-warn",
  late: "text-danger",
};

export default async function ExportPage() {
  const backup = await backupStatus();

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Backup</h1>
        <p className={`text-sm ${LEVEL_COLOUR[backup.level]}`}>{backup.label}</p>
      </header>

      <ExportButton />

      <p className="text-sm text-muted">
        Every row in the database, in one file. Supabase keeps no backups of its
        own on the free plan, so this file is the only copy of your history that
        exists anywhere else. Save it somewhere that lasts — iCloud Drive, or
        mailed to yourself.
      </p>

      <Link href="/" className="text-sm text-accent">
        Back
      </Link>
    </main>
  );
}
