"use client";

import { useActionState } from "react";
import { deleteSleep, type Result } from "./actions";
import { QUIET } from "../ui";

// On a logged night's entry screen. Deleting goes back to the clock, where the
// night is now unlogged.
export function DeleteButton({ id, date, back }: { id: number; date: string; back: string }) {
  const [result, action, pending] = useActionState<Result | null, FormData>(deleteSleep, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="back" value={back} />

      <button type="submit" disabled={pending} className={QUIET}>
        {pending ? "…" : "Delete this night"}
      </button>

      {result && !result.ok && <p className="text-[13px] text-foreground">{result.message}</p>}
    </form>
  );
}
