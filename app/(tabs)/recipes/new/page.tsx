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

const asId = (raw: string | string[] | undefined) =>
  typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : null;

const count = (number: number, word: string) => `${number} ${number === 1 ? word : `${word}s`}`;

// The add form, which opens three ways:
//   * empty, for a new recipe;
//   * ?copy=12, as the replacement for recipe 12 — its ingredients come across,
//     retired ones followed to what replaced them, and saving retires it and
//     links the two;
//   * ?duplicate=12, as a separate copy of recipe 12 — its ingredients come
//     across exactly as they are, and saving leaves it exactly as it was.
export default async function NewRecipePage({ searchParams }: PageProps<"/recipes/new">) {
  const { copy, duplicate } = await searchParams;

  const replaceId = asId(copy);
  const duplicateId = replaceId === null ? asId(duplicate) : null;
  const sourceId = replaceId ?? duplicateId;

  let original = null;
  let lines: Awaited<ReturnType<typeof linesForCopy>> = [];

  if (sourceId !== null) {
    const { data, error } = await db()
      .from("recipes")
      .select("*")
      .eq("id", sourceId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) notFound();

    original = data;
    lines = await linesForCopy(sourceId, replaceId !== null);
  }

  const replacing = original !== null && replaceId !== null;
  const duplicating = original !== null && duplicateId !== null;

  const moved = lines.filter((line) => line.toId !== line.fromId);
  const stillRetired = lines.filter((line) => line.retired);

  return (
    <main className="flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col gap-5">
      <header className="flex min-h-7 items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">
          {replacing ? "Replace recipe" : duplicating ? "Duplicate recipe" : "New recipe"}
        </h1>
        <Link href={original ? `/recipes/${original.id}` : "/recipes"} className="text-sm text-accent">
          Cancel
        </Link>
      </header>

      {replacing && original && (
        <div className="flex flex-col gap-2 rounded-xl bg-surface p-3.5 text-[13px] text-muted">
          <p>
            A copy of <span className="text-foreground">{original.name}</span>, with
            its {count(lines.length, "ingredient")}. Change what&rsquo;s different and save.
            The old one is retired and pointed at this one, so every meal you&rsquo;ve
            already eaten keeps the numbers it was logged with.
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
      )}

      {duplicating && original && (
        <div className="flex flex-col gap-2 rounded-xl bg-surface p-3.5 text-[13px] text-muted">
          <p>
            A copy of <span className="text-foreground">{original.name}</span>, with
            its {count(lines.length, "ingredient")} exactly as they are, to start a new
            recipe from. Give it its own name; the ingredients can be changed once
            it&rsquo;s saved. {original.name} stays exactly as it is.
          </p>

          {stillRetired.length > 0 && (
            <p className="border-t border-border pt-2">
              {stillRetired.map((line) => line.toName).join(", ")}{" "}
              {stillRetired.length === 1 ? "is a retired product" : "are retired products"},
              copied as {stillRetired.length === 1 ? "it is" : "they are"}.
            </p>
          )}
        </div>
      )}

      {original === null && (
        <p className="text-[13px] text-muted">
          Name it and say how many servings it makes. The ingredients go in on the
          next screen, one at a time.
        </p>
      )}

      <RecipeForm
        action={createRecipe}
        submitLabel={replacing ? "Save replacement" : "Save recipe"}
        replaces={replacing && original ? original.id : undefined}
        duplicates={duplicating && original ? original.id : undefined}
        defaults={
          original
            ? {
                name: replacing ? nextName(original.name) : `${original.name} (copy)`,
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
