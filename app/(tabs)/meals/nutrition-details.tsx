import { round, type Nutrient, type Nutrition } from "@/lib/nutrition";

// The full label figures, in the order an EU label prints them, then the cost.
// Used for a whole day on Today and for one meal on its own screen, so the two
// always read the same way. `indent` is how far in an "of which" line sits.
const DETAILS: Array<{
  key: Nutrient;
  label: string;
  unit: string;
  decimals: number;
  indent: 0 | 1 | 2;
}> = [
  { key: "calories", label: "Energy", unit: "kcal", decimals: 0, indent: 0 },
  { key: "fat", label: "Fat", unit: "g", decimals: 1, indent: 0 },
  { key: "saturated_fat", label: "of which saturates", unit: "g", decimals: 1, indent: 1 },
  { key: "carbs", label: "Carbohydrates", unit: "g", decimals: 1, indent: 0 },
  { key: "sugars_total", label: "of which sugars", unit: "g", decimals: 1, indent: 1 },
  { key: "sugars_added", label: "of which added", unit: "g", decimals: 1, indent: 2 },
  { key: "fibre", label: "Fibre", unit: "g", decimals: 1, indent: 0 },
  { key: "protein", label: "Protein", unit: "g", decimals: 1, indent: 0 },
  { key: "salt", label: "Salt", unit: "g", decimals: 2, indent: 0 },
];

const INDENT = ["", "pl-3 text-muted", "pl-6 text-muted"] as const;

export function NutritionDetails({
  heading,
  nutrition,
  cost,
}: {
  heading: string;
  nutrition: Nutrition;
  cost: number;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">{heading}</h2>

      <ul className="flex flex-col rounded-xl bg-surface px-3.5 text-[13px]">
        {DETAILS.map((row) => (
          <li
            key={row.key}
            className="flex items-baseline justify-between gap-3 border-t border-border py-2.5 first:border-t-0"
          >
            <span className={INDENT[row.indent]}>{row.label}</span>
            <span className={`tabular-nums ${row.indent > 0 ? "text-muted" : ""}`}>
              {round(nutrition[row.key], row.decimals).toLocaleString("en-GB")} {row.unit}
            </span>
          </li>
        ))}

        <li className="flex items-baseline justify-between gap-3 border-t border-border py-2.5">
          <span>Cost</span>
          <span className="tabular-nums">{cost.toFixed(2)} lei</span>
        </li>
      </ul>
    </section>
  );
}
