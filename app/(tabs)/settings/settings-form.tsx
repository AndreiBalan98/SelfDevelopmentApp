"use client";

import { useActionState } from "react";
import type { Targets } from "@/lib/settings";
import { saveTargets, type Result } from "./actions";

const FIELDS: Array<{
  name: keyof Targets;
  label: string;
  unit: string;
  hint: string;
}> = [
  {
    name: "calorie_target",
    label: "Calories a day",
    unit: "kcal",
    hint: "What you're aiming to eat, not a limit.",
  },
  {
    name: "protein_target",
    label: "Protein a day",
    unit: "g",
    hint: "A floor — the bar fills as you get there.",
  },
  {
    name: "fibre_min",
    label: "Fibre a day",
    unit: "g",
    hint: "Also a floor.",
  },
  {
    name: "added_sugar_max",
    label: "Added sugar a day",
    unit: "g",
    hint: "A ceiling. Your own estimate, since no label states it.",
  },
  {
    name: "daily_budget",
    label: "Money a day",
    unit: "",
    hint: "What a day's food is meant to cost.",
  },
];

export function SettingsForm({ targets }: { targets: Targets }) {
  const [result, action, pending] = useActionState<Result | null, FormData>(saveTargets, null);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
        {FIELDS.map((field) => (
          <label key={field.name} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="flex min-w-0 flex-col">
              <span className="text-sm">{field.label}</span>
              <span className="text-xs text-muted">{field.hint}</span>
            </span>

            <span className="flex shrink-0 items-baseline gap-1.5">
              <input
                name={field.name}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                defaultValue={targets[field.name] === null ? "" : String(targets[field.name])}
                className="w-24 rounded-md border border-border bg-background px-2 py-1.5
                           text-right text-base tabular-nums outline-none focus:border-accent"
              />
              <span className="w-8 text-xs text-muted">{field.unit}</span>
            </span>
          </label>
        ))}
      </div>

      <p className="-mt-2 text-xs text-muted">
        Leave any of them empty. Empty means you haven&rsquo;t decided yet — the day
        screen shows the number without a bar, which is the right way round while
        you&rsquo;re still working out what it should be.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-3 font-medium text-black disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>

        {result && (
          <span
            className={`text-sm ${result.ok ? "text-muted" : "text-foreground"}`}
            aria-live="polite"
          >
            {result.message}
          </span>
        )}
      </div>
    </form>
  );
}
