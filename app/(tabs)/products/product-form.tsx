"use client";

import { useState, type ReactNode } from "react";
import type { Result } from "./actions";
import { useFormAction } from "../form-action";
import { BOX, CARD, HEADING, PRIMARY, ROW, SEGMENT, SEGMENT_CHOSEN, SEGMENTS } from "../ui";

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

const NUMBER = `${BOX} w-24 text-right`;

// A quiet line of explanation under a card or a row.
function Hint({ children }: { children: ReactNode }) {
  return <p className="text-[11px] text-faint">{children}</p>;
}

// The unit after a box, in a fixed width so every box on a card lines up.
function Unit({ children }: { children: ReactNode }) {
  return <span className="w-7 text-xs text-faint">{children}</span>;
}

function value(input: number | string | null | undefined): string {
  return input === null || input === undefined ? "" : String(input);
}

// One line of the nutrition card. The "of which" lines sit indented, as they
// do on a label.
function Nutrient({
  name,
  label,
  unit,
  defaultValue,
  required,
  hint,
  indent = 0,
}: {
  name: string;
  label: string;
  unit: string;
  defaultValue?: number | string | null;
  required?: boolean;
  hint?: string;
  indent?: 0 | 1 | 2;
}) {
  return (
    <div className={ROW}>
      <label
        htmlFor={`product-${name}`}
        className={`flex min-w-0 flex-1 flex-col text-[13px] ${
          indent === 1 ? "pl-3 text-muted" : indent === 2 ? "pl-6 text-muted" : ""
        }`}
      >
        <span>
          {label}
          {required && <span className="text-faint"> · required</span>}
        </span>
        {hint && <span className="text-[11px] text-faint">{hint}</span>}
      </label>

      <span className="flex shrink-0 items-center gap-1.5">
        <input
          id={`product-${name}`}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={value(defaultValue)}
          className={`${BOX} w-20 text-right`}
        />
        <Unit>{unit}</Unit>
      </span>
    </div>
  );
}

export function ProductForm({ action, defaults = {}, submitLabel, replaces, id }: Props) {
  // Sent by hand, so a refused save keeps everything you typed (form-action.ts).
  const [result, submit, pending] = useFormAction<Result>(action);

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
    <form onSubmit={submit} className="flex flex-col gap-5">
      {replaces !== undefined && <input type="hidden" name="replaces" value={replaces} />}
      {id !== undefined && <input type="hidden" name="id" value={id} />}

      <section className="flex flex-col gap-1.5">
        <div className={CARD}>
          <div className={ROW}>
            <label htmlFor="product-name" className="text-[13px]">
              Name
            </label>
            <input
              id="product-name"
              name="name"
              type="text"
              defaultValue={defaults.name ?? ""}
              required
              autoComplete="off"
              className={`${BOX} min-w-0 flex-1`}
            />
          </div>

          <div className={ROW}>
            <span className="text-[13px]">Sold by</span>
            <div className={`${SEGMENTS} w-44`} role="radiogroup" aria-label="Sold by">
              {(["g", "ml"] as const).map((option) => (
                <label
                  key={option}
                  className={`${SEGMENT} has-[:focus-visible]:outline ${
                    unit === option ? SEGMENT_CHOSEN : "text-muted"
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
          </div>
        </div>
        <Hint>Whichever the label uses. 1 ml counts as 1 g when a recipe is weighed.</Hint>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className={HEADING}>What it cost</h2>
        <div className={CARD}>
          <div className={ROW}>
            <label htmlFor="product-package_price" className="text-[13px]">
              Package price
            </label>
            <span className="flex shrink-0 items-center gap-1.5">
              <input
                id="product-package_price"
                name="package_price"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
                className={NUMBER}
              />
              <Unit>lei</Unit>
            </span>
          </div>

          <div className={ROW}>
            <label htmlFor="product-package_quantity" className="text-[13px]">
              Package size
            </label>
            <span className="flex shrink-0 items-center gap-1.5">
              <input
                id="product-package_quantity"
                name="package_quantity"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
                className={NUMBER}
              />
              <Unit>{unit}</Unit>
            </span>
          </div>
        </div>
        <p className="text-[11px] text-faint tabular-nums" aria-live="polite">
          {perHundred
            ? `${perHundred} lei per 100 ${unit}. If that looks wrong, the package size probably is.`
            : "Price per 100 appears here once both are filled in."}
        </p>
      </section>

      <section className="flex flex-col gap-1.5">
        <div className={CARD}>
          <div className={ROW}>
            <label htmlFor="product-piece_grams" className="text-[13px]">
              Grams in one piece <span className="text-faint">· optional</span>
            </label>
            <span className="flex shrink-0 items-center gap-1.5">
              <input
                id="product-piece_grams"
                name="piece_grams"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                defaultValue={value(defaults.piece_grams)}
                placeholder="1 egg = 60"
                className={`${NUMBER} placeholder:text-faint`}
              />
              <Unit>g</Unit>
            </span>
          </div>
        </div>
        <Hint>
          Leave empty for anything sold loose. Filling it in lets you log &ldquo;2 eggs&rdquo;
          instead of &ldquo;120 g&rdquo;.
        </Hint>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className={HEADING}>Per 100 {unit}</h2>
        <Hint>
          In the order they appear on the packet, so you can type straight down it. Leave
          anything the label doesn&rsquo;t give you empty — empty means &ldquo;not
          stated&rdquo;, which is not the same as zero.
        </Hint>

        <div className={CARD}>
          <Nutrient name="calories" label="Energy" unit="kcal" required defaultValue={defaults.calories} />
          <Nutrient name="fat" label="Fat" unit="g" defaultValue={defaults.fat} />
          <Nutrient name="saturated_fat" label="of which saturates" unit="g" indent={1} defaultValue={defaults.saturated_fat} />
          <Nutrient name="carbs" label="Carbohydrate" unit="g" defaultValue={defaults.carbs} />
          {/* These two overlap on purpose: the second is a part of the first,
              not an amount on top of it. Nothing in the app ever adds them. */}
          <Nutrient
            name="sugars_total"
            label="of which sugars"
            unit="g"
            indent={1}
            hint="Straight off the label — natural and added together"
            defaultValue={defaults.sugars_total}
          />
          <Nutrient
            name="sugars_added"
            label="of which added"
            unit="g"
            indent={2}
            hint="How much of the figure above you reckon is added sugar. Never on an EU label — leave empty if you can't tell."
            defaultValue={defaults.sugars_added}
          />
          <Nutrient name="fibre" label="Fibre" unit="g" defaultValue={defaults.fibre} />
          <Nutrient name="protein" label="Protein" unit="g" defaultValue={defaults.protein} />
          <Nutrient name="salt" label="Salt" unit="g" defaultValue={defaults.salt} />
        </div>
      </section>

      <section className="flex flex-col gap-1.5">
        <label htmlFor="product-ingredients_text" className={HEADING}>
          Ingredients · optional
        </label>
        <textarea
          id="product-ingredients_text"
          name="ingredients_text"
          rows={3}
          defaultValue={defaults.ingredients_text ?? ""}
          className="rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-base
                     outline-none focus:border-accent"
        />
      </section>

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
