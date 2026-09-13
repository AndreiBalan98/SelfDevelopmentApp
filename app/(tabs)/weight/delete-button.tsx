"use client";

import { useActionState } from "react";
import { deleteWeight, type SaveResult } from "./actions";
import { QUIET } from "../ui";

// On a weighed day's entry screen. Deleting goes back to the chart, where the
// day is now a skipped one.
export function DeleteButton({ id, back }: { id: number; back: string }) {
  const [result, action, pending] = useActionState<SaveResult | null, FormData>(deleteWeight, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="back" value={back} />

      <button type="submit" disabled={pending} className={QUIET}>
        {pending ? "…" : "Delete this weigh-in"}
      </button>

      {result && !result.ok && <p className="text-[13px] text-foreground">{result.message}</p>}
    </form>
  );
}
