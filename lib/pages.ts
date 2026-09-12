// Reading every row of something, however many there are.
//
// Supabase hands back at most 1,000 rows to any one question and says nothing
// about the rest — the answer simply stops. So anything that needs every row
// asks 1,000 at a time until a page comes back short. The question must be put
// in a fixed order (by id), or the pages could overlap or skip rows.
//
// Any page failing fails the whole read: a list with a page quietly missing
// would look complete and not be.

export const PAGE = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

export async function everyRow<T>(ask: (from: number, to: number) => Page<T>): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await ask(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

// The same, answering the way a single Supabase question does — { data, error }
// — so it drops into code that already handles that shape.
export async function allRows<T>(
  ask: (from: number, to: number) => Page<T>,
): Promise<{ data: T[] | null; error: { message: string } | null }> {
  try {
    return { data: await everyRow(ask), error: null };
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : String(error) } };
  }
}

// The rule, from 2026-09-12: any question that isn't held small by what it
// asks for — one day, one item, the last few — goes through everyRow or
// allRows, in an order that includes the id so no two rows can tie.
