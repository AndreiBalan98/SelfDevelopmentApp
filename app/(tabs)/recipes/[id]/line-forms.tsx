"use client";

import { useActionState } from "react";
import { addLine, removeLine, setLineQuantity, type Result } from "../actions";
import { useFormAction } from "../../form-action";
import { BOX, SMALL, SMALL_PRIMARY } from "../../ui";

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
  const [result, submit, pending] = useFormAction<Result>(async (previous, form) => {
    const outcome = await addLine(previous, form);
    if (outcome.ok) onAdded();
    return outcome;
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5 py-2.5">
      <input type="hidden" name="recipe_id" value={recipeId} />
      <input type="hidden" name="product_id" value={productId} />

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[13px]">{name}</span>
          {pieceGrams && (
            <span className="text-xs text-faint tabular-nums">one piece is {pieceGrams} g</span>
          )}
        </span>

        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          <input
            name="quantity"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`How much ${name}`}
            className={`${BOX} w-16 text-right`}
          />
          <span className="w-6 text-xs text-faint">{unit}</span>
          <button type="submit" disabled={pending} className={SMALL_PRIMARY}>
            {pending ? "…" : "Add"}
          </button>
        </span>
      </div>

      {result && !result.ok && <p className="text-[13px] text-foreground">{result.message}</p>}
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
  const [saveResult, save, saving] = useFormAction<Result>(setLineQuantity);
  const [removeResult, remove, removing] = useActionState<Result | null, FormData>(
    removeLine,
    null,
  );

  const failure = saveResult && !saveResult.ok ? saveResult : removeResult;

  return (
    <>
      <div className="flex justify-end">
        <span className="flex shrink-0 items-center gap-1.5">
          <form onSubmit={save} className="flex items-center gap-1.5">
            <input type="hidden" name="recipe_id" value={recipeId} />
            <input type="hidden" name="line_id" value={lineId} />

            <input
              name="quantity"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              aria-label="Quantity"
              defaultValue={quantity}
              className={`${BOX} w-16 text-right`}
            />
            <span className="w-6 text-xs text-faint">{unit}</span>

            <button type="submit" disabled={saving} className={SMALL}>
              {saving ? "…" : "Save"}
            </button>
          </form>

          <form action={remove}>
            <input type="hidden" name="recipe_id" value={recipeId} />
            <input type="hidden" name="line_id" value={lineId} />

            <button type="submit" disabled={removing} className={SMALL}>
              {removing ? "…" : "Remove"}
            </button>
          </form>
        </span>
      </div>

      {failure && (
        <p className={`text-[13px] ${failure.ok ? "text-muted" : "text-foreground"}`}>
          {failure.message}
        </p>
      )}
    </>
  );
}
