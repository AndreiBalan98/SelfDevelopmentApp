"use client";

import { useActionState } from "react";
import { renameProduct, type Result } from "../actions";

// The name is the one thing that stays editable once a product has been used.
// It's a label for you; nothing calculates anything from it.
export function RenameForm({ id, name }: { id: number; name: string }) {
  const [result, action, pending] = useActionState<Result | null, FormData>(
    renameProduct,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Name</span>
        <div className="flex gap-2">
          <input
            name="name"
            type="text"
            defaultValue={name}
            required
            autoComplete="off"
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5
                       text-base outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-border bg-surface px-4 text-sm disabled:opacity-50"
          >
            {pending ? "…" : "Rename"}
          </button>
        </div>
      </label>

      {result && (
        <p className={`text-sm ${result.ok ? "text-muted" : "text-danger"}`}>
          {result.message}
        </p>
      )}
    </form>
  );
}
