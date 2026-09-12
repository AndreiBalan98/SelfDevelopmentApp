"use client";

import { useActionState } from "react";
import { deleteProduct, setRetired, type Result } from "../actions";

export function RetireButton({ id, retired }: { id: number; retired: boolean }) {
  const [result, action, pending] = useActionState<Result | null, FormData>(
    setRetired,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="retired" value={String(!retired)} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-border bg-surface px-4 py-3 text-sm disabled:opacity-50"
      >
        {pending ? "…" : retired ? "Put back in use" : "Retire"}
      </button>

      {result && !result.ok && <p className="text-sm text-foreground">{result.message}</p>}
    </form>
  );
}

export function DeleteButton({ id }: { id: number }) {
  const [result, action, pending] = useActionState<Result | null, FormData>(
    deleteProduct,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-border bg-surface px-4 py-3 text-sm disabled:opacity-50"
      >
        {pending ? "…" : "Delete"}
      </button>

      {result && !result.ok && <p className="text-sm text-foreground">{result.message}</p>}
    </form>
  );
}
