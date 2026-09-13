"use client";

import { useActionState } from "react";
import { deleteRecipe, setCookedWeight, setRetired, updateLabels, type Result } from "../actions";
import { Notes } from "../recipe-form";
import { BOX, CARD, QUIET, ROW, SMALL } from "../../ui";

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
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />

      <div className={CARD}>
        <div className={ROW}>
          <label htmlFor="recipe-name" className="text-[13px]">
            Name
          </label>
          <input
            id="recipe-name"
            name="name"
            type="text"
            defaultValue={name}
            required
            autoComplete="off"
            className={`${BOX} min-w-0 flex-1`}
          />
        </div>
      </div>

      <Notes defaultValue={notes} />

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={SMALL}>
          {pending ? "…" : "Save"}
        </button>

        {result && (
          <span className={`text-[13px] ${result.ok ? "text-muted" : "text-foreground"}`}>
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
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={id} />

      <span className="flex items-center gap-1.5">
        <input
          name="cooked_weight"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label="Cooked weight in grams"
          defaultValue={cookedWeight ?? ""}
          className={`${BOX} w-20 text-right`}
        />
        <span className="text-xs text-faint">g</span>

        <button type="submit" disabled={pending} className={SMALL}>
          {pending ? "…" : "Save"}
        </button>
      </span>

      {result && (
        <span className={`text-[11px] ${result.ok ? "text-muted" : "text-foreground"}`}>
          {result.message}
        </span>
      )}
    </form>
  );
}

export function RetireButton({ id, retired }: { id: number; retired: boolean }) {
  const [result, action, pending] = useActionState<Result | null, FormData>(setRetired, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="retired" value={String(!retired)} />

      <button type="submit" disabled={pending} className={QUIET}>
        {pending ? "…" : retired ? "Put back in use" : "Retire"}
      </button>

      {result && !result.ok && <p className="text-[13px] text-foreground">{result.message}</p>}
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

      <button type="submit" disabled={pending} className={QUIET}>
        {pending ? "…" : "Delete"}
      </button>

      {result && !result.ok && <p className="text-[13px] text-foreground">{result.message}</p>}
    </form>
  );
}
