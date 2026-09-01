import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { timesUsed, updateProduct } from "../actions";
import { ProductForm } from "../product-form";
import { RenameForm } from "./rename-form";
import { DeleteButton, RetireButton } from "./product-buttons";

export const dynamic = "force-dynamic";

const NUTRITION: Array<{ key: string; label: string; unit: string }> = [
  { key: "calories", label: "Energy", unit: "kcal" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "saturated_fat", label: "of which saturates", unit: "g" },
  { key: "carbs", label: "Carbohydrate", unit: "g" },
  { key: "sugars_natural", label: "of which sugars", unit: "g" },
  { key: "sugars_added", label: "of which added", unit: "g" },
  { key: "fibre", label: "Fibre", unit: "g" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "salt", label: "Salt", unit: "g" },
];

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
    sugars_natural: product.sugars_natural,
    sugars_added: product.sugars_added,
    fibre: product.fibre,
    protein: product.protein,
    salt: product.salt,
  };

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">{product.name}</h1>
        <Link href="/products" className="text-sm text-accent">
          Products
        </Link>
      </header>

      {(product.retired || replacement || (predecessors ?? []).length > 0) && (
        <div className="rounded-lg border border-border bg-surface p-3 text-sm text-muted flex flex-col gap-1">
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
          <p className="text-sm text-muted">
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
              sugars_natural: product.sugars_natural,
              sugars_added: product.sugars_added,
              fibre: product.fibre,
              fat: product.fat,
              saturated_fat: product.saturated_fat,
              salt: product.salt,
            }}
          />

          <div className="flex flex-col gap-3 border-t border-border pt-6">
            <RetireButton id={product.id} retired={product.retired} />
            <DeleteButton id={product.id} />
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">
            Used in {used} {used === 1 ? "place" : "places"}, so its price and
            nutrition are frozen — changing them would rewrite meals you have
            already eaten. To record a new price, replace it.
          </p>

          <RenameForm id={product.id} name={product.name} />

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted">What it cost</h2>
            <div className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm flex items-baseline justify-between">
              <span className="tabular-nums">
                {product.package_price} for {product.package_quantity} {product.unit}
              </span>
              <span className="text-muted tabular-nums">
                {perHundred} per 100 {product.unit}
              </span>
            </div>
            {product.piece_grams && (
              <p className="text-xs text-muted tabular-nums">
                One piece is {product.piece_grams} g.
              </p>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted">Per 100 {product.unit}</h2>
            <ul className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
              {NUTRITION.map((row) => (
                <li
                  key={row.key}
                  className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span>{row.label}</span>
                  <span className="tabular-nums">
                    {values[row.key] === null ? (
                      <span className="text-muted">not stated</span>
                    ) : (
                      `${values[row.key]} ${row.unit}`
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {product.ingredients_text && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-muted">Ingredients</h2>
              <p className="rounded-lg border border-border bg-surface p-3 text-sm">
                {product.ingredients_text}
              </p>
            </section>
          )}

          <div className="flex flex-col gap-3 border-t border-border pt-6">
            <Link
              href={`/products/new?copy=${product.id}`}
              className="rounded-lg bg-accent px-4 py-3 text-center font-medium text-black"
            >
              Replace — new price or nutrition
            </Link>
            <RetireButton id={product.id} retired={product.retired} />
          </div>
        </>
      )}
    </main>
  );
}
