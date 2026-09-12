"use client";

import { useActionState, useState } from "react";
import {
  addMealLine,
  deleteMeal,
  removeMealLine,
  setMealLineAmount,
  type Result,
} from "../actions";

const NUMBER =
  "w-24 rounded-md border border-border bg-background px-2 py-1.5 text-right text-base tabular-nums outline-none focus:border-accent";

const SMALL_BUTTON =
  "rounded-md border border-border bg-surface px-3 py-1.5 text-sm disabled:opacity-50";

// Adding a line, then telling the search box it worked so it can empty itself.
// The meal redraws in place with the new line in it; the page doesn't reload,
// so it stays where you'd scrolled to.
function useAddLine(onAdded: () => void) {
  return useActionState<Result | null, FormData>(async (previous, form) => {
    const outcome = await addMealLine(previous, form);
    if (outcome.ok) onAdded();
    return outcome;
  }, null);
}

// A product in the search results. When the product says what one piece weighs,
// the box counts pieces by default — that's the whole reason the product has
// that figure — and shows what it comes to in grams as you type.
export function AddProductLine({
  mealId,
  productId,
  name,
  unit,
  pieceGrams,
  onAdded,
}: {
  mealId: number;
  productId: number;
  name: string;
  unit: "g" | "ml";
  pieceGrams: number | null;
  onAdded: () => void;
}) {
  const [result, action, pending] = useAddLine(onAdded);
  const [pieces, setPieces] = useState(pieceGrams !== null);
  const [amount, setAmount] = useState("");

  const typed = Number(amount.replace(",", "."));
  const inGrams =
    pieces && pieceGrams !== null && amount.trim() !== "" && Number.isFinite(typed)
      ? typed * pieceGrams
      : null;

  return (
    <form action={action} className="flex flex-col gap-1.5 px-3 py-2.5">
      <input type="hidden" name="meal_id" value={mealId} />
      <input type="hidden" name="kind" value="product" />
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="quantity_unit" value={pieces ? "piece" : "unit"} />

      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm">{name}</span>
          {inGrams !== null && (
            <span className="text-xs text-muted tabular-nums">
              = {Math.round(inGrams * 100) / 100} {unit}
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
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={NUMBER}
          />

          {pieceGrams === null ? (
            <span className="w-12 text-xs text-muted">{unit}</span>
          ) : (
            <button
              type="button"
              onClick={() => setPieces(!pieces)}
              aria-label="Switch between pieces and weight"
              className="w-12 text-xs text-accent"
            >
              {pieces ? "pieces" : unit}
            </button>
          )}

          <button type="submit" disabled={pending} className={SMALL_BUTTON}>
            {pending ? "…" : "Add"}
          </button>
        </span>
      </div>

      {result && !result.ok && <p className="text-sm text-foreground">{result.message}</p>}
    </form>
  );
}

// A recipe in the search results. Logged as servings, halves allowed.
export function AddRecipeLine({
  mealId,
  recipeId,
  name,
  caloriesPerServing,
  onAdded,
}: {
  mealId: number;
  recipeId: number;
  name: string;
  caloriesPerServing: number;
  onAdded: () => void;
}) {
  const [result, action, pending] = useAddLine(onAdded);

  return (
    <form action={action} className="flex flex-col gap-1.5 px-3 py-2.5">
      <input type="hidden" name="meal_id" value={mealId} />
      <input type="hidden" name="kind" value="recipe" />
      <input type="hidden" name="recipe_id" value={recipeId} />

      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm">
            {name} <span className="text-xs text-accent">recipe</span>
          </span>
          <span className="text-xs text-muted tabular-nums">
            {caloriesPerServing} kcal a serving
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          <input
            name="servings"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`How many servings of ${name}`}
            defaultValue="1"
            className={NUMBER}
          />
          <span className="w-12 text-xs text-muted">servings</span>

          <button type="submit" disabled={pending} className={SMALL_BUTTON}>
            {pending ? "…" : "Add"}
          </button>
        </span>
      </div>

      {result && !result.ok && <p className="text-sm text-foreground">{result.message}</p>}
    </form>
  );
}

// Something already in the meal. Nothing points at a meal, so everything here
// stays changeable forever.
export function EditMealLine({
  mealId,
  lineId,
  kind,
  amount,
  unit,
}: {
  mealId: number;
  lineId: number;
  kind: "product" | "recipe";
  amount: number;
  unit: string;
}) {
  const [saveResult, save, saving] = useActionState<Result | null, FormData>(
    setMealLineAmount,
    null,
  );
  const [removeResult, remove, removing] = useActionState<Result | null, FormData>(
    removeMealLine,
    null,
  );

  const failure = saveResult && !saveResult.ok ? saveResult : removeResult;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <form action={save} className="flex items-center gap-2">
          <input type="hidden" name="meal_id" value={mealId} />
          <input type="hidden" name="line_id" value={lineId} />
          <input type="hidden" name="kind" value={kind} />

          <input
            name={kind === "recipe" ? "servings" : "quantity"}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label="How much"
            defaultValue={amount}
            className={NUMBER}
          />
          <span className="w-12 text-xs text-muted">{unit}</span>

          <button type="submit" disabled={saving} className={SMALL_BUTTON}>
            {saving ? "…" : "Save"}
          </button>
        </form>

        <form action={remove}>
          <input type="hidden" name="meal_id" value={mealId} />
          <input type="hidden" name="line_id" value={lineId} />

          <button
            type="submit"
            disabled={removing}
            className={SMALL_BUTTON}
          >
            {removing ? "…" : "Remove"}
          </button>
        </form>
      </div>

      {failure && (
        <p className={`text-sm ${failure.ok ? "text-muted" : "text-foreground"}`}>
          {failure.message}
        </p>
      )}
    </div>
  );
}

export function DeleteMealButton({ id, day }: { id: number; day: string }) {
  const [result, action, pending] = useActionState<Result | null, FormData>(deleteMeal, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="day" value={day} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-border bg-surface px-4 py-3 text-sm disabled:opacity-50"
      >
        {pending ? "…" : "Delete this meal"}
      </button>

      {result && !result.ok && <p className="text-sm text-foreground">{result.message}</p>}
    </form>
  );
}
