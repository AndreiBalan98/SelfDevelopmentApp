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

export default async function NewProductPage({ searchParams }: PageProps<"/products/new">) {
  const { copy } = await searchParams;

  const copyId = typeof copy === "string" && /^\d+$/.test(copy) ? Number(copy) : null;

  // When you're replacing a product, the form opens as a copy of the old one.
  // That's the whole point: change the price, save, and the old one is retired
  // and linked in one go — no re-typing nine nutrition values.
  let original = null;

  if (copyId !== null) {
    const { data, error } = await db()
      .from("products")
      .select("*")
      .eq("id", copyId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) notFound();
    original = data;
  }

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">
          {original ? "Replace product" : "Add a product"}
        </h1>
        <Link href="/products" className="text-sm text-accent">
          Cancel
        </Link>
      </header>

      {original && (
        <p className="rounded-lg border border-border bg-surface p-3 text-sm text-muted">
          A copy of <span className="text-foreground">{original.name}</span>. Change
          what&rsquo;s different — usually the price — and save. The old one is
          retired and pointed at this one, so every meal you&rsquo;ve already logged
          keeps the numbers it was logged with.
        </p>
      )}

      <ProductForm
        action={createProduct}
        submitLabel={original ? "Save replacement" : "Save product"}
        replaces={original?.id}
        defaults={
          original
            ? {
                name: nextName(original.name),
                unit: original.unit,
                package_price: original.package_price,
                package_quantity: original.package_quantity,
                ingredients_text: original.ingredients_text,
                piece_grams: original.piece_grams,
                calories: original.calories,
                protein: original.protein,
                carbs: original.carbs,
                sugars_natural: original.sugars_natural,
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
