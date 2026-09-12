import { readSettings } from "@/lib/settings";
import { settingsAsText } from "@/lib/settings-fields";
import { backupStatus } from "@/lib/backup";
import { TabHeader } from "../headers";
import { SettingsForm } from "./settings-form";
import { ExportButton } from "./export-button";

export const dynamic = "force-dynamic";

// The Settings tab: the goal, the daily targets, the body figures for the
// formula estimate, the gym start date, and the backup.
export default async function SettingsPage() {
  const [settings, backup] = await Promise.all([readSettings(), backupStatus()]);

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-5">
      <TabHeader title="Settings" />

      {"error" in settings ? (
        // Not an empty form: Save sends every field at once, so a form drawn
        // blank after a failed read would wipe every real setting in one tap.
        <p className="rounded-xl bg-surface p-3.5 text-sm">
          Couldn&rsquo;t read your settings, so they aren&rsquo;t shown. Try again in a
          moment. ({settings.error})
        </p>
      ) : (
        <SettingsForm initial={settingsAsText(settings.settings)} />
      )}

      <section className="flex flex-col gap-1.5">
        <h2 className="text-xs text-faint">Data</h2>
        <ExportButton lastExport={backup} />
      </section>
    </main>
  );
}
