import Link from "next/link";
import { readTargets } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const targets = await readTargets();

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Targets</h1>
        <Link href="/" className="text-sm text-accent">
          Home
        </Link>
      </header>

      <p className="text-sm text-muted">
        What a day is measured against on the meals screen. Set them roughly now and
        change them whenever — once there&rsquo;s enough weight and food history, the app
        will be able to work out what your calories actually should be.
      </p>

      <SettingsForm targets={targets} />
    </main>
  );
}
