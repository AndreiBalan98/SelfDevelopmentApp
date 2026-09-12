"use client";

import { useActionState, useState } from "react";
import type { Result } from "./actions";

export type ProductDefaults = {
  name?: string;
  unit?: "g" | "ml";
  package_price?: number | string;
  package_quantity?: number | string;
  ingredients_text?: string | null;
  piece_grams?: number | string | null;
  calories?: number | string | null;
  protein?: number | string | null;
  carbs?: number | string | null;
  sugars_total?: number | string | null;
  sugars_added?: number | string | null;
  fibre?: number | string | null;
  fat?: number | string | null;
  saturated_fat?: number | string | null;
  salt?: number | string | null;
};

type Props = {
  action: (previous: Result | null, form: FormData) => Promise<Result>;
  defaults?: ProductDefaults;
  submitLabel: string;
  // Set when this form is creating the replacement for an existing product.
  replaces?: number;
  // Set when editing an existing product in place.
  id?: number;
};

const FIELD =
  "rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-accent";

function value(input: number | string | null | undefined): string {
  return input === null || input === undefined ? "" : String(input);
}

// One row of the nutrition panel.
function Nutrient({
  name,
  label,
  unit,
  defaultValue,
  required,
  hint,
}: {
  name: string;
  label: string;
  unit: string;
  defaultValue?: number | string | null;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 px-3 py-2">
      <span className="flex flex-col">
        <span className="text-sm">
          {label}
          {required && <span className="text-muted"> · required</span>}
        </span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>

      <span className="flex items-baseline gap-1.5">
        <input
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={value(defaultValue)}
          className="w-20 rounded-md border border-border bg-background px-2 py-1.5
                     text-right text-base tabular-nums outline-none focus:border-accent"
        />
        <span className="w-8 text-xs text-muted">{unit}</span>
      </span>
    </label>
  );
}

export function ProductForm({ action, defaults = {}, submitLabel, replaces, id }: Props) {
  const [result, submit, pending] = useActionState<Result | null, FormData>(action, null);

  // Only used to work out the price per 100 as you type, which is the cheapest
  // possible check on the mistake that matters: typing 100 g for a 1 kg bag.
  const [unit, setUnit] = useState<"g" | "ml">(defaults.unit ?? "g");
  const [price, setPrice] = useState(value(defaults.package_price));
  const [quantity, setQuantity] = useState(value(defaults.package_quantity));

  const priceNumber = Number(price.replace(",", "."));
  const quantityNumber = Number(quantity.replace(",", "."));
  const perHundred =
    Number.isFinite(priceNumber) &&
    Number.isFinite(quantityNumber) &&
    quantityNumber > 0 &&
    price.trim() !== "" &&
    quantity.trim() !== ""
      ? ((priceNumber / quantityNumber) * 100).toFixed(2)
      : null;

  return (
    <form action={submit} className="flex flex-col gap-6">
      {replaces !== undefined && <input type="hidden" name="replaces" value={replaces} />}
      {id !== undefined && <input type="hidden" name="id" value={id} />}

      <section className="flex flex-col gap-3">
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

        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm text-muted">Sold by</legend>
          <div className="flex gap-2">
            {(["g", "ml"] as const).map((option) => (
              <label
                key={option}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-center ${
                  unit === option ? "border-accent text-accent" : "border-border text-muted"
                }`}
              >
                <input
                  type="radio"
                  name="unit"
                  value={option}
                  checked={unit === option}
                  onChange={() => setUnit(option)}
                  className="sr-only"
                />
                {option === "g" ? "Grams" : "Millilitres"}
              </label>
            ))}
          </div>
          <span className="text-xs text-muted">
            Whichever the label uses. 1 ml counts as 1 g when a recipe is weighed.
          </span>
        </fieldset>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">What it cost</h2>

        {/* min-w-0 on each half is what stops this row running off the screen.
            A text input carries its own built-in width of about 20 characters,
            and a flex column refuses to shrink below its contents unless told
            to, so two of them side by side ask for more than any phone has. */}
        <div className="flex gap-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-sm text-muted">Package price</span>
            <input
              name="package_price"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
              className={`${FIELD} tabular-nums`}
            />
          </label>

          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-sm text-muted">Package size ({unit})</span>
            <input
              name="package_quantity"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
              className={`${FIELD} tabular-nums`}
            />
          </label>
        </div>

        <p className="text-xs text-muted" aria-live="polite">
          {perHundred
            ? `${perHundred} per 100 ${unit}. If that looks wrong, the package size probably is.`
            : "Price per 100 appears here once both are filled in."}
        </p>
      </section>

      <section className="flex flex-col gap-1.5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-muted">Grams in one piece (optional)</span>
          <input
            name="piece_grams"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            defaultValue={value(defaults.piece_grams)}
            placeholder="1 egg = 60"
            className={`${FIELD} tabular-nums`}
          />
        </label>
        <span className="text-xs text-muted">
          Leave empty for anything sold loose. Filling it in lets you log &ldquo;2
          eggs&rdquo; instead of &ldquo;120 g&rdquo;.
        </span>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted">Per 100 {unit}</h2>
        <p className="text-xs text-muted">
          In the order they appear on the packet, so you can type straight down it.
          Leave anything the label doesn&rsquo;t give you empty — empty means
          &ldquo;not stated&rdquo;, which is not the same as zero.
        </p>

        <div className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
          <Nutrient name="calories" label="Energy" unit="kcal" required defaultValue={defaults.calories} />
          <Nutrient name="fat" label="Fat" unit="g" defaultValue={defaults.fat} />
          <Nutrient name="saturated_fat" label="of which saturates" unit="g" defaultValue={defaults.saturated_fat} />
          <Nutrient name="carbs" label="Carbohydrate" unit="g" defaultValue={defaults.carbs} />
          {/* These two overlap on purpose: the second is a part of the first,
              not an amount on top of it. Nothing in the app ever adds them. */}
          <Nutrient
            name="sugars_total"
            label="of which sugars"
            unit="g"
            hint="Straight off the label — natural and added together"
            defaultValue={defaults.sugars_total}
          />
          <Nutrient
            name="sugars_added"
            label="of which added"
            unit="g"
            hint="How much of the figure above you reckon is added sugar. Never on an EU label — leave empty if you can't tell."
            defaultValue={defaults.sugars_added}
          />
          <Nutrient name="fibre" label="Fibre" unit="g" defaultValue={defaults.fibre} />
          <Nutrient name="protein" label="Protein" unit="g" defaultValue={defaults.protein} />
          <Nutrient name="salt" label="Salt" unit="g" defaultValue={defaults.salt} />
        </div>
      </section>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Ingredients (optional)</span>
        <textarea
          name="ingredients_text"
          rows={3}
          defaultValue={defaults.ingredients_text ?? ""}
          className={FIELD}
        />
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
            className={`text-sm ${result.ok ? "text-muted" : "text-danger"}`}
            aria-live="polite"
          >
            {result.message}
          </p>
        )}
      </div>
    </form>
  );
}
