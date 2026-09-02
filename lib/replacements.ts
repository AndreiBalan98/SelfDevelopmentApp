// Following the replacement chain: oats → oats 2 → oats 3.
//
// Retired things are never deleted, so a line written months ago can point at a
// product you stopped buying. When a recipe is copied, the copy should be built
// out of what you'd buy today — this is what works out what that is.
//
// It lives here rather than in a server action so it stays a plain function
// with no database access, which is what makes it checkable on its own.

export type Replaceable = { id: number; retired: boolean; replaced_by: number | null };

export function currentVersion(
  startId: number,
  byId: Map<number, Replaceable>,
): number {
  const seen = new Set<number>();
  let id = startId;

  while (!seen.has(id)) {
    seen.add(id);

    const row = byId.get(id);

    // Stops on anything still in use, on a retired thing with nothing pointing
    // onwards, on something that isn't in the list at all, and — thanks to the
    // seen set — on a chain that loops back on itself.
    if (!row || !row.retired || row.replaced_by === null) return id;

    id = row.replaced_by;
  }

  return id;
}
