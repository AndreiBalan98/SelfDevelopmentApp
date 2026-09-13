import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { createProduct } from "../actions";
import { ProductForm } from "../product-form";

export const dynamic = "force-dynamic";

// "oats" becomes "oats 2"; "oats 2" becomes "oats 3". Only a starting point —
// the name is yours to change, and it's the one field that's always editable.
function nextName(name: string): string {
  const match = /^(.*?)(\d+)$/.exec(name.trim());
  if (!match) return `${name} 2`;
  return `${match[1]}${Number(match[2]) + 1}`;
}

const asId = (raw: string | string[] | undefined) =>
  typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : null;

// The add form, which opens three ways:
//   * empty, for a new product;
//   * ?copy=12, as the replacement for product 12 — saving retires it and
//     links the two;
//   * ?duplicate=12, as a separate copy of product 12 — saving leaves it
//     exactly as it was.
export default async function NewProductPage({ searchParams }: PageProps<"/products/new">) {
  const { copy, duplicate } = await searchParams;

  const replaceId = asId(copy);
  const duplicateId = replaceId === null ? asId(duplicate) : null;
  const sourceId = replaceId ?? duplicateId;

  // Both copies open the form filled in from the original, so nothing has to be
  // re-typed — nine nutrition values, the price, the piece weight.
  let original = null;

  if (sourceId !== null) {
    const { data, error } = await db()
      .from("products")
      .select("*")
      .eq("id", sourceId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) notFound();
    original = data;
  }

  const replacing = original !== null && replaceId !== null;
  const duplicating = original !== null && duplicateId !== null;

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-5">
      <header className="flex min-h-7 items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">
          {replacing ? "Replace product" : duplicating ? "Duplicate product" : "New product"}
        </h1>
        <Link href={original ? `/products/${original.id}` : "/products"} className="text-sm text-accent">
          Cancel
        </Link>
      </header>

      {replacing && original && (
        <p className="rounded-xl bg-surface p-3.5 text-[13px] text-muted">
          A copy of <span className="text-foreground">{original.name}</span>. Change
          what&rsquo;s different — usually the price — and save. The old one is
          retired and pointed at this one, so every meal you&rsquo;ve already logged
          keeps the numbers it was logged with.
        </p>
      )}

      {duplicating && original && (
        <p className="rounded-xl bg-surface p-3.5 text-[13px] text-muted">
          A copy of <span className="text-foreground">{original.name}</span>, to start
          a new product from. Give it its own name and change what&rsquo;s different.
          Saving makes a separate product; {original.name} stays exactly as it is.
        </p>
      )}

      <ProductForm
        action={createProduct}
        submitLabel={replacing ? "Save replacement" : "Save product"}
        replaces={replacing && original ? original.id : undefined}
        defaults={
          original
            ? {
                name: replacing ? nextName(original.name) : `${original.name} (copy)`,
                unit: original.unit,
                package_price: original.package_price,
                package_quantity: original.package_quantity,
                ingredients_text: original.ingredients_text,
                piece_grams: original.piece_grams,
                calories: original.calories,
                protein: original.protein,
                carbs: original.carbs,
                sugars_total: original.sugars_total,
                sugars_added: original.sugars_added,
                fibre: original.fibre,
                fat: original.fat,
                saturated_fat: original.saturated_fat,
                salt: original.salt,
              }
            : undefined
        }
      />
    </main>
  );
}
