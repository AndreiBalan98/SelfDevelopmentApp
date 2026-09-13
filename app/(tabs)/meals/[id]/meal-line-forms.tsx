"use client";

import { useActionState, useState } from "react";
import {
  addMealLine,
  deleteMeal,
  removeMealLine,
  setMealLineAmount,
  type Result,
} from "../actions";
import { useFormAction } from "../../form-action";
import { BOX, QUIET, SMALL, SMALL_PRIMARY } from "../../ui";

// Adding a line, then telling the search box it worked so it can empty itself.
// The meal redraws in place with the new line in it; the page doesn't reload,
// so it stays where you'd scrolled to. Sent by hand, so a refused add keeps what
// you typed (form-action.ts).
function useAddLine(onAdded: () => void) {
  return useFormAction<Result>(async (previous, form) => {
    const outcome = await addMealLine(previous, form);
    if (outcome.ok) onAdded();
    return outcome;
  });
}

function Failure({ result }: { result: Result | null }) {
  if (!result || result.ok) return null;
  return <p className="text-[13px] text-foreground">{result.message}</p>;
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
  const [result, submit, pending] = useAddLine(onAdded);
  const [pieces, setPieces] = useState(pieceGrams !== null);
  const [amount, setAmount] = useState("");

  const typed = Number(amount.replace(",", "."));
  const inGrams =
    pieces && pieceGrams !== null && amount.trim() !== "" && Number.isFinite(typed)
      ? typed * pieceGrams
      : null;

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5 py-2.5">
      <input type="hidden" name="meal_id" value={mealId} />
      <input type="hidden" name="kind" value="product" />
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="quantity_unit" value={pieces ? "piece" : "unit"} />

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[13px]">{name}</span>
          {inGrams !== null && (
            <span className="text-xs text-faint tabular-nums">
              = {Math.round(inGrams * 100) / 100} {unit}
            </span>
          )}
        </span>

        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          <input
            name="quantity"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`How much ${name}`}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={`${BOX} w-16 text-right`}
          />

          {pieceGrams === null ? (
            <span className="w-11 text-xs text-faint">{unit}</span>
          ) : (
            <button
              type="button"
              onClick={() => setPieces(!pieces)}
              aria-label="Switch between pieces and weight"
              className="w-11 text-left text-xs text-accent"
            >
              {pieces ? "pieces" : unit}
            </button>
          )}

          <button type="submit" disabled={pending} className={SMALL_PRIMARY}>
            {pending ? "…" : "Add"}
          </button>
        </span>
      </div>

      <Failure result={result} />
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
  const [result, submit, pending] = useAddLine(onAdded);

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5 py-2.5">
      <input type="hidden" name="meal_id" value={mealId} />
      <input type="hidden" name="kind" value="recipe" />
      <input type="hidden" name="recipe_id" value={recipeId} />

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <span className="flex min-w-0 flex-col">
          <span className="flex min-w-0 items-center gap-1.5 text-[13px]">
            <span className="truncate">{name}</span>
            <span className="shrink-0 rounded-full bg-border-strong px-[7px] py-px text-[10px] text-muted">
              recipe
            </span>
          </span>
          <span className="text-xs text-faint tabular-nums">
            {caloriesPerServing} kcal a serving
          </span>
        </span>

        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          <input
            name="servings"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`How many servings of ${name}`}
            defaultValue="1"
            className={`${BOX} w-16 text-right`}
          />
          <span className="w-11 text-xs text-faint">servings</span>

          <button type="submit" disabled={pending} className={SMALL_PRIMARY}>
            {pending ? "…" : "Add"}
          </button>
        </span>
      </div>

      <Failure result={result} />
    </form>
  );
}

// The box to change how much of something is in the meal, and to take it out.
// Nothing points at a meal, so everything here stays changeable forever.
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
  const [saveResult, save, saving] = useFormAction<Result>(setMealLineAmount);
  const [removeResult, remove, removing] = useActionState<Result | null, FormData>(
    removeMealLine,
    null,
  );

  const failure = saveResult && !saveResult.ok ? saveResult : removeResult;

  return (
    <>
      <div className="flex justify-end">
        <span className="flex shrink-0 items-center gap-1.5">
          <form onSubmit={save} className="flex items-center gap-1.5">
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
              className={`${BOX} w-16 text-right`}
            />
            <span className="w-11 text-xs text-faint">{unit}</span>

            <button type="submit" disabled={saving} className={SMALL}>
              {saving ? "…" : "Save"}
            </button>
          </form>

          <form action={remove}>
            <input type="hidden" name="meal_id" value={mealId} />
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

export function DeleteMealButton({ id, day }: { id: number; day: string }) {
  const [result, action, pending] = useActionState<Result | null, FormData>(deleteMeal, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="day" value={day} />

      <button type="submit" disabled={pending} className={QUIET}>
        {pending ? "…" : "Delete this meal"}
      </button>

      <Failure result={result} />
    </form>
  );
}
