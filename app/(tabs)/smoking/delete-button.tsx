"use client";

import { useActionState } from "react";
import { deleteSmoking, type Result } from "./actions";
import { QUIET } from "../ui";

// On a logged day's entry screen. Deleting goes back to the chart, where the
// day now has no bar — not logged, which isn't the same as a zero.
export function DeleteButton({ id, back }: { id: number; back: string }) {
  const [result, action, pending] = useActionState<Result | null, FormData>(deleteSmoking, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="back" value={back} />

      <button type="submit" disabled={pending} className={QUIET}>
        {pending ? "…" : "Delete this day"}
      </button>

      {result && !result.ok && <p className="text-[13px] text-foreground">{result.message}</p>}
    </form>
  );
}
