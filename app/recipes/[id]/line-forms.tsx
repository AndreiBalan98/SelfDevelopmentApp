"use client";

import { useActionState } from "react";
import { addLine, removeLine, setLineQuantity, type Result } from "../actions";

const NUMBER =
  "w-24 rounded-md border border-border bg-background px-2 py-1.5 text-right text-base tabular-nums outline-none focus:border-accent";

// One search result, with somewhere to type how much goes in. Adding redraws
// the recipe in place with the new line in it — the page doesn't reload, so it
// stays where you'd scrolled to — and tells the search box to empty itself.
export function AddLineForm({
  recipeId,
  productId,
  name,
  unit,
  pieceGrams,
  onAdded,
}: {
  recipeId: number;
  productId: number;
  name: string;
  unit: "g" | "ml";
  pieceGrams: number | null;
  onAdded: () => void;
}) {
  const [result, action, pending] = useActionState<Result | null, FormData>(
    async (previous, form) => {
      const outcome = await addLine(previous, form);
      if (outcome.ok) onAdded();
      return outcome;
    },
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-1.5 px-3 py-2.5">
      <input type="hidden" name="recipe_id" value={recipeId} />
      <input type="hidden" name="product_id" value={productId} />

      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm">{name}</span>
          {pieceGrams && (
            <span className="text-xs text-muted tabular-nums">
              one piece is {pieceGrams} g
            </span>
          )}
        </span>

        <span className="flex shrink-0 items-center gap-2">
          <input
            name="quantity"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`How much ${name}`}
            className={NUMBER}
          />
          <span className="w-5 text-xs text-muted">{unit}</span>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {pending ? "…" : "Add"}
          </button>
        </span>
      </div>

      {result && !result.ok && <p className="text-sm text-danger">{result.message}</p>}
    </form>
  );
}

// An ingredient already in the recipe, while the recipe is still free to
// change: the quantity can be corrected, or the line taken out.
export function EditLineForm({
  recipeId,
  lineId,
  quantity,
  unit,
}: {
  recipeId: number;
  lineId: number;
  quantity: number;
  unit: "g" | "ml";
}) {
  const [saveResult, save, saving] = useActionState<Result | null, FormData>(
    setLineQuantity,
    null,
  );
  const [removeResult, remove, removing] = useActionState<Result | null, FormData>(
    removeLine,
    null,
  );

  const failure = saveResult && !saveResult.ok ? saveResult : removeResult;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <form action={save} className="flex items-center gap-2">
          <input type="hidden" name="recipe_id" value={recipeId} />
          <input type="hidden" name="line_id" value={lineId} />

          <input
            name="quantity"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label="Quantity"
            defaultValue={quantity}
            className={NUMBER}
          />
          <span className="w-5 text-xs text-muted">{unit}</span>

          <button
            type="submit"
            disabled={saving}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {saving ? "…" : "Save"}
          </button>
        </form>

        <form action={remove}>
          <input type="hidden" name="recipe_id" value={recipeId} />
          <input type="hidden" name="line_id" value={lineId} />

          <button
            type="submit"
            disabled={removing}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-danger disabled:opacity-50"
          >
            {removing ? "…" : "Remove"}
          </button>
        </form>
      </div>

      {failure && (
        <p className={`text-sm ${failure.ok ? "text-muted" : "text-danger"}`}>
          {failure.message}
        </p>
      )}
    </div>
  );
}
