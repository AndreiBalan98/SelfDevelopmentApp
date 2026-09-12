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
