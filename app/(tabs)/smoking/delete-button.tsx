"use client";

import { useActionState } from "react";
import { deleteSmoking, type Result } from "./actions";

export function DeleteButton({ id }: { id: number }) {
  const [result, action, pending] = useActionState<Result | null, FormData>(
    deleteSmoking,
    null,
  );

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />

      <button
        type="submit"
        disabled={pending}
        aria-label="Delete this day"
        className="text-xs text-danger disabled:opacity-50"
      >
        {pending ? "…" : "Delete"}
      </button>

      {result && !result.ok && <span className="text-xs text-danger">{result.message}</span>}
    </form>
  );
}
