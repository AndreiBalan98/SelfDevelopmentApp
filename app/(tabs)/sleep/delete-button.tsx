"use client";

import { useActionState } from "react";
import { deleteSleep, type Result } from "./actions";

export function DeleteButton({ id }: { id: number }) {
  const [result, action, pending] = useActionState<Result | null, FormData>(deleteSleep, null);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />

      <button
        type="submit"
        disabled={pending}
        aria-label="Delete this night"
        className="text-xs text-danger disabled:opacity-50"
      >
        {pending ? "…" : "Delete"}
      </button>

      {result && !result.ok && <span className="text-xs text-danger">{result.message}</span>}
    </form>
  );
}
