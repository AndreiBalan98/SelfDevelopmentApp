"use client";

import { useActionState } from "react";
import type { Result } from "./actions";

export type RecipeDefaults = {
  name?: string;
  servings?: number | string;
  cooked_weight?: number | string | null;
  notes?: string | null;
};

type Props = {
  action: (previous: Result | null, form: FormData) => Promise<Result>;
  defaults?: RecipeDefaults;
  submitLabel: string;
  // Set when this form is creating the replacement for an existing recipe.
  replaces?: number;
  // Set when editing an existing recipe in place.
  id?: number;
};

const FIELD =
  "rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-accent";

function value(input: number | string | null | undefined): string {
  return input === null || input === undefined ? "" : String(input);
}

export function RecipeForm({ action, defaults = {}, submitLabel, replaces, id }: Props) {
  const [result, submit, pending] = useActionState<Result | null, FormData>(action, null);

  return (
    <form action={submit} className="flex flex-col gap-5">
      {replaces !== undefined && <input type="hidden" name="replaces" value={replaces} />}
      {id !== undefined && <input type="hidden" name="id" value={id} />}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Name</span>
        <input
          name="name"
          type="text"
          defaultValue={defaults.name ?? ""}
          required
          autoComplete="off"
          className={FIELD}
        />
      </label>

      {/* min-w-0 for the same reason as the product form: two text inputs side
          by side would otherwise insist on their built-in width and push the
          screen sideways. */}
      <div className="flex gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-sm text-muted">Servings</span>
          <input
            name="servings"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            defaultValue={value(defaults.servings)}
            required
            className={`${FIELD} tabular-nums`}
          />
        </label>

        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-sm text-muted">Cooked weight (g)</span>
          <input
            name="cooked_weight"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            defaultValue={value(defaults.cooked_weight)}
            className={`${FIELD} tabular-nums`}
          />
        </label>
      </div>

      <p className="-mt-3 text-xs text-muted">
        Cooked weight is what the pan weighed afterwards. Leave it empty and fill it
        in once you&rsquo;ve weighed it — it can be changed at any time.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Notes (optional)</span>
        <textarea name="notes" rows={3} defaultValue={defaults.notes ?? ""} className={FIELD} />
      </label>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-3 font-medium text-black disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>

        {result && (
          <p
            className={`text-sm ${result.ok ? "text-muted" : "text-foreground"}`}
            aria-live="polite"
          >
            {result.message}
          </p>
        )}
      </div>
    </form>
  );
}
