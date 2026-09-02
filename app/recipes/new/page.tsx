import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { createRecipe, linesForCopy } from "../actions";
import { RecipeForm } from "../recipe-form";

export const dynamic = "force-dynamic";

// "burrito" becomes "burrito 2"; "burrito 2" becomes "burrito 3". Only a
// starting point — the name is yours to change, and it's always editable.
function nextName(name: string): string {
  const match = /^(.*?)(\d+)$/.exec(name.trim());
  if (!match) return `${name} 2`;
  return `${match[1]}${Number(match[2]) + 1}`;
}

export default async function NewRecipePage({ searchParams }: PageProps<"/recipes/new">) {
  const { copy } = await searchParams;

  const copyId = typeof copy === "string" && /^\d+$/.test(copy) ? Number(copy) : null;

  // When you're replacing a recipe, the form opens as a copy of the old one and
  // its ingredients come across with it. That's the whole point: change what's
  // different, save, and the old one is retired and linked in one go.
  let original = null;
  let lines: Awaited<ReturnType<typeof linesForCopy>> = [];

  if (copyId !== null) {
    const { data, error } = await db()
      .from("recipes")
      .select("*")
      .eq("id", copyId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) notFound();

    original = data;
    lines = await linesForCopy(copyId);
  }

  const moved = lines.filter((line) => line.toId !== line.fromId);

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">
          {original ? "Replace recipe" : "Add a recipe"}
        </h1>
        <Link href="/recipes" className="text-sm text-accent">
          Cancel
        </Link>
      </header>

      {original ? (
        <div className="rounded-lg border border-border bg-surface p-3 text-sm text-muted flex flex-col gap-2">
          <p>
            A copy of <span className="text-foreground">{original.name}</span>, with
            its {lines.length} {lines.length === 1 ? "ingredient" : "ingredients"}.
            Change what&rsquo;s different and save. The old one is retired and pointed
            at this one, so every meal you&rsquo;ve already eaten keeps the numbers it
            was logged with.
          </p>

          {moved.length > 0 && (
            <div className="flex flex-col gap-1 border-t border-border pt-2">
              <p className="text-foreground">
                {moved.length === 1 ? "One ingredient has" : `${moved.length} ingredients have`}{" "}
                moved to the product that replaced it:
              </p>
              {moved.map((line) => (
                <p key={line.fromId} className="tabular-nums">
                  {line.fromName} → {line.toName}
                </p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted">
          Name it and say how many servings it makes. The ingredients go in on the
          next screen, one at a time.
        </p>
      )}

      <RecipeForm
        action={createRecipe}
        submitLabel={original ? "Save replacement" : "Save recipe"}
        replaces={original?.id}
        defaults={
          original
            ? {
                name: nextName(original.name),
                servings: original.servings,
                cooked_weight: original.cooked_weight,
                notes: original.notes,
              }
            : undefined
        }
      />
    </main>
  );
}
