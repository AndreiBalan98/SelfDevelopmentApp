import { readTargets } from "@/lib/settings";
import { backupStatus } from "@/lib/backup";
import { TabHeader } from "../headers";
import { SettingsForm } from "./settings-form";
import { ExportButton } from "./export-button";

export const dynamic = "force-dynamic";

// The Settings tab: the daily targets, and the backup. Step 7.3 adds the goal,
// the rest of the targets, the body figures and the gym date.
export default async function SettingsPage() {
  const [targets, backup] = await Promise.all([readTargets(), backupStatus()]);

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-6">
      <TabHeader title="Settings" />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Daily targets</h2>

        <p className="text-sm text-muted">
          What a day is measured against on the meals screen. Set them roughly now and
          change them whenever — once there&rsquo;s enough weight and food history, the app
          will be able to work out what your calories actually should be.
        </p>

        <SettingsForm targets={targets} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Data</h2>

        <ExportButton lastExport={backup} />

        <p className="text-xs text-muted">
          Every row in the database, in one file. Supabase keeps no backups of its own on
          the free plan, so this file is the only copy of your history that exists
          anywhere else. Save it somewhere that lasts — iCloud Drive, or mailed to
          yourself.
        </p>
      </section>
    </main>
  );
}
