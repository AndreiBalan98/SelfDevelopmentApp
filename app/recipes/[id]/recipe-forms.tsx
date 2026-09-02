"use client";

import { useActionState } from "react";
import { deleteRecipe, setCookedWeight, setRetired, updateLabels, type Result } from "../actions";

const FIELD =
  "rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-accent";

// The name and the notes are the two things that stay editable once a recipe
// has been eaten. They're labels for you; nothing calculates anything from them.
export function LabelsForm({
  id,
  name,
  notes,
}: {
  id: number;
  name: string;
  notes: string | null;
}) {
  const [result, action, pending] = useActionState<Result | null, FormData>(
    updateLabels,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Name</span>
        <input
          name="name"
          type="text"
          defaultValue={name}
          required
          autoComplete="off"
          className={FIELD}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Notes</span>
        <textarea name="notes" rows={3} defaultValue={notes ?? ""} className={FIELD} />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm disabled:opacity-50"
        >
          {pending ? "…" : "Save"}
        </button>

        {result && (
          <span className={`text-sm ${result.ok ? "text-muted" : "text-danger"}`}>
            {result.message}
          </span>
        )}
      </div>
    </form>
  );
}

// The cooked weight stays editable forever, even on a recipe you've eaten: a
// meal records servings, so nothing about its calories or cost comes from this
// number. It only says what a portion weighs and how much the pan lost.
export function CookedWeightForm({
  id,
  cookedWeight,
}: {
  id: number;
  cookedWeight: number | null;
}) {
  const [result, action, pending] = useActionState<Result | null, FormData>(
    setCookedWeight,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-1.5">
      <input type="hidden" name="id" value={id} />

      <div className="flex items-center gap-2">
        <input
          name="cooked_weight"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label="Cooked weight in grams"
          defaultValue={cookedWeight ?? ""}
          className="w-28 rounded-md border border-border bg-background px-2 py-1.5
                     text-right text-base tabular-nums outline-none focus:border-accent"
        />
        <span className="w-5 text-xs text-muted">g</span>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {pending ? "…" : "Save"}
        </button>

        {result && (
          <span className={`text-sm ${result.ok ? "text-muted" : "text-danger"}`}>
            {result.message}
          </span>
        )}
      </div>
    </form>
  );
}

export function RetireButton({ id, retired }: { id: number; retired: boolean }) {
  const [result, action, pending] = useActionState<Result | null, FormData>(setRetired, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="retired" value={String(!retired)} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-border bg-surface px-4 py-3 text-sm disabled:opacity-50"
      >
        {pending ? "…" : retired ? "Put back in use" : "Retire"}
      </button>

      {result && !result.ok && <p className="text-sm text-danger">{result.message}</p>}
    </form>
  );
}

export function DeleteButton({ id }: { id: number }) {
  const [result, action, pending] = useActionState<Result | null, FormData>(
    deleteRecipe,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-danger disabled:opacity-50"
      >
        {pending ? "…" : "Delete"}
      </button>

      {result && !result.ok && <p className="text-sm text-danger">{result.message}</p>}
    </form>
  );
}
