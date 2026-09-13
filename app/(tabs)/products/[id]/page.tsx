import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { timesUsed, updateProduct } from "../actions";
import { ProductForm } from "../product-form";
import { RenameForm } from "./rename-form";
import { DeleteButton, RetireButton } from "./product-buttons";
import { CARD, HEADING, PRIMARY, QUIET } from "../../ui";

export const dynamic = "force-dynamic";

// Same order as the form and an EU label; "of which" lines sit indented.
const NUTRITION: Array<{ key: string; label: string; unit: string; indent: 0 | 1 | 2 }> = [
  { key: "calories", label: "Energy", unit: "kcal", indent: 0 },
  { key: "fat", label: "Fat", unit: "g", indent: 0 },
  { key: "saturated_fat", label: "of which saturates", unit: "g", indent: 1 },
  { key: "carbs", label: "Carbohydrate", unit: "g", indent: 0 },
  { key: "sugars_total", label: "of which sugars", unit: "g", indent: 1 },
  { key: "sugars_added", label: "of which added", unit: "g", indent: 2 },
  { key: "fibre", label: "Fibre", unit: "g", indent: 0 },
  { key: "protein", label: "Protein", unit: "g", indent: 0 },
  { key: "salt", label: "Salt", unit: "g", indent: 0 },
];

const INDENT = ["", "pl-3 text-muted", "pl-6 text-muted"] as const;

const LINE = "flex items-baseline justify-between gap-3 border-t border-border py-2.5 first:border-t-0";

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) notFound();
  const productId = Number(id);

  const supabase = db();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!product) notFound();

  const used = await timesUsed(productId);

  // Both directions of the replacement chain, which is also the price history:
  // oats → oats 2 → oats 3.
  const [{ data: replacement }, { data: predecessors }] = await Promise.all([
    product.replaced_by
      ? supabase.from("products").select("id, name").eq("id", product.replaced_by).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("products").select("id, name").eq("replaced_by", productId),
  ]);

  const perHundred = ((product.package_price / product.package_quantity) * 100).toFixed(2);

  const values: Record<string, number | null> = {
    calories: product.calories,
    fat: product.fat,
    saturated_fat: product.saturated_fat,
    carbs: product.carbs,
    sugars_total: product.sugars_total,
    sugars_added: product.sugars_added,
    fibre: product.fibre,
    protein: product.protein,
    salt: product.salt,
  };

  // Duplicate is there for any product, used or not, retired or not: it starts
  // a new product from this one and leaves this one exactly as it is.
  const duplicate = (
    <Link href={`/products/new?duplicate=${product.id}`} className={`${QUIET} text-center`}>
      Duplicate
    </Link>
  );

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-5">
      <header className="flex min-h-7 items-center justify-between gap-4">
        <h1 className="min-w-0 break-words text-lg font-semibold">{product.name}</h1>
        <Link href="/products" className="shrink-0 text-sm text-accent">
          Products
        </Link>
      </header>

      {(product.retired || replacement || (predecessors ?? []).length > 0) && (
        <div className="flex flex-col gap-1 rounded-xl bg-surface p-3.5 text-[13px] text-muted">
          {product.retired && <p>Retired — hidden when logging, kept so old meals still add up.</p>}
          {replacement && (
            <p>
              Replaced by{" "}
              <Link href={`/products/${replacement.id}`} className="text-accent">
                {replacement.name}
              </Link>
            </p>
          )}
          {(predecessors ?? []).map((older) => (
            <p key={older.id}>
              Replaces{" "}
              <Link href={`/products/${older.id}`} className="text-accent">
                {older.name}
              </Link>
            </p>
          ))}
        </div>
      )}

      {used === 0 ? (
        <>
          <p className="text-[13px] text-muted">
            Not used in any recipe or meal yet, so everything about it is still safe
            to change.
          </p>

          <ProductForm
            action={updateProduct}
            submitLabel="Save changes"
            id={product.id}
            defaults={{
              name: product.name,
              unit: product.unit,
              package_price: product.package_price,
              package_quantity: product.package_quantity,
              ingredients_text: product.ingredients_text,
              piece_grams: product.piece_grams,
              calories: product.calories,
              protein: product.protein,
              carbs: product.carbs,
              sugars_total: product.sugars_total,
              sugars_added: product.sugars_added,
              fibre: product.fibre,
              fat: product.fat,
              saturated_fat: product.saturated_fat,
              salt: product.salt,
            }}
          />

          <div className="flex flex-col gap-3 pt-2">
            {duplicate}
            <RetireButton id={product.id} retired={product.retired} />
            <DeleteButton id={product.id} />
          </div>
        </>
      ) : (
        <>
          <p className="text-[13px] text-muted">
            Used in {used} {used === 1 ? "place" : "places"}, so its price and
            nutrition are frozen — changing them would rewrite meals you have
            already eaten. To record a new price, replace it.
          </p>

          <RenameForm id={product.id} name={product.name} />

          <section className="flex flex-col gap-1.5">
            <h2 className={HEADING}>What it cost</h2>
            <ul className={`${CARD} text-[13px]`}>
              <li className={LINE}>
                <span>Package</span>
                <span className="tabular-nums">
                  {product.package_price.toFixed(2)} lei for {product.package_quantity} {product.unit}
                </span>
              </li>
              <li className={LINE}>
                <span>Per 100 {product.unit}</span>
                <span className="tabular-nums">{perHundred} lei</span>
              </li>
              {product.piece_grams && (
                <li className={LINE}>
                  <span>One piece</span>
                  <span className="tabular-nums">{product.piece_grams} g</span>
                </li>
              )}
            </ul>
          </section>

          <section className="flex flex-col gap-1.5">
            <h2 className={HEADING}>Per 100 {product.unit}</h2>
            <ul className={`${CARD} text-[13px]`}>
              {NUTRITION.map((row) => (
                <li key={row.key} className={LINE}>
                  <span className={INDENT[row.indent]}>{row.label}</span>
                  <span className={`tabular-nums ${row.indent > 0 ? "text-muted" : ""}`}>
                    {values[row.key] === null ? (
                      <span className="text-faint">not stated</span>
                    ) : (
                      `${values[row.key]} ${row.unit}`
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {product.ingredients_text && (
            <section className="flex flex-col gap-1.5">
              <h2 className={HEADING}>Ingredients</h2>
              <p className="rounded-xl bg-surface p-3.5 text-[13px]">{product.ingredients_text}</p>
            </section>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Link href={`/products/new?copy=${product.id}`} className={`${PRIMARY} text-center`}>
              Replace — new price or nutrition
            </Link>
            {duplicate}
            <RetireButton id={product.id} retired={product.retired} />
          </div>
        </>
      )}
    </main>
  );
}
