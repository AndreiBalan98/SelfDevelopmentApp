"use client";

import type { Result } from "./actions";
import { useFormAction } from "../form-action";
import { BOX, CARD, HEADING, PRIMARY, ROW } from "../ui";

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
  // Set when this form is creating a separate copy of an existing recipe.
  duplicates?: number;
  // Set when editing an existing recipe in place.
  id?: number;
};

function value(input: number | string | null | undefined): string {
  return input === null || input === undefined ? "" : String(input);
}

// The notes box, several lines tall — a one-line box would drop the line breaks
// in a note and rewrite it on the next save. Shared with the name-and-notes
// form on an eaten recipe.
export function Notes({ defaultValue }: { defaultValue?: string | null }) {
  return (
    <section className="flex flex-col gap-1.5">
      <label htmlFor="recipe-notes" className={HEADING}>
        Notes · optional
      </label>
      <textarea
        id="recipe-notes"
        name="notes"
        rows={3}
        defaultValue={defaultValue ?? ""}
        className="rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-base
                   outline-none focus:border-accent"
      />
    </section>
  );
}

export function RecipeForm({ action, defaults = {}, submitLabel, replaces, duplicates, id }: Props) {
  // Sent by hand, so a refused save keeps everything you typed (form-action.ts).
  const [result, submit, pending] = useFormAction<Result>(action);

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {replaces !== undefined && <input type="hidden" name="replaces" value={replaces} />}
      {duplicates !== undefined && <input type="hidden" name="duplicates" value={duplicates} />}
      {id !== undefined && <input type="hidden" name="id" value={id} />}

      <section className="flex flex-col gap-1.5">
        <div className={CARD}>
          <div className={ROW}>
            <label htmlFor="recipe-name" className="text-[13px]">
              Name
            </label>
            <input
              id="recipe-name"
              name="name"
              type="text"
              defaultValue={defaults.name ?? ""}
              required
              autoComplete="off"
              className={`${BOX} min-w-0 flex-1`}
            />
          </div>

          <div className={ROW}>
            <label htmlFor="recipe-servings" className="text-[13px]">
              Servings
            </label>
            <span className="flex shrink-0 items-center gap-1.5">
              <input
                id="recipe-servings"
                name="servings"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                defaultValue={value(defaults.servings)}
                required
                className={`${BOX} w-20 text-right`}
              />
              <span className="w-7" />
            </span>
          </div>

          <div className={ROW}>
            <label htmlFor="recipe-cooked_weight" className="text-[13px]">
              Cooked weight <span className="text-faint">· optional</span>
            </label>
            <span className="flex shrink-0 items-center gap-1.5">
              <input
                id="recipe-cooked_weight"
                name="cooked_weight"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                defaultValue={value(defaults.cooked_weight)}
                className={`${BOX} w-20 text-right`}
              />
              <span className="w-7 text-xs text-faint">g</span>
            </span>
          </div>
        </div>

        <p className="text-[11px] text-faint">
          Cooked weight is what the pan weighed afterwards. Leave it empty and fill it in
          once you&rsquo;ve weighed it — it can be changed at any time.
        </p>
      </section>

      <Notes defaultValue={defaults.notes} />

      <div className="flex flex-col gap-3">
        <button type="submit" disabled={pending} className={PRIMARY}>
          {pending ? "Saving…" : submitLabel}
        </button>

        {result && (
          <p
            className={`text-[13px] ${result.ok ? "text-muted" : "text-foreground"}`}
            aria-live="polite"
          >
            {result.message}
          </p>
        )}
      </div>
    </form>
  );
}
