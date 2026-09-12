"use client";

import { useActionState } from "react";
import { deleteWeight, type SaveResult } from "./actions";

export function DeleteButton({ id }: { id: number }) {
  const [result, action, pending] = useActionState<SaveResult | null, FormData>(
    deleteWeight,
    null,
  );

  return (
    <form action={action} className="contents">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        aria-label="Delete this weigh-in"
        className="text-sm text-muted disabled:opacity-50"
      >
        {pending ? "…" : result && !result.ok ? "Failed" : "Delete"}
      </button>
    </form>
  );
}
