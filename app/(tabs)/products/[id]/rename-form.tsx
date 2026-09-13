"use client";

import { useActionState } from "react";
import { renameProduct, type Result } from "../actions";
import { BOX, CARD, ROW, SMALL } from "../../ui";

// The name is the one thing that stays editable once a product has been used.
// It's a label for you; nothing calculates anything from it.
export function RenameForm({ id, name }: { id: number; name: string }) {
  const [result, action, pending] = useActionState<Result | null, FormData>(
    renameProduct,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-1.5">
      <input type="hidden" name="id" value={id} />

      <div className={CARD}>
        <div className={ROW}>
          <label htmlFor="product-rename" className="text-[13px]">
            Name
          </label>
          {/* min-w-0 so the box can shrink: a text input carries a built-in
              width of about 20 characters, which with the button beside it is
              more than a small phone has. */}
          <input
            id="product-rename"
            name="name"
            type="text"
            defaultValue={name}
            required
            autoComplete="off"
            className={`${BOX} min-w-0 flex-1`}
          />
          <button type="submit" disabled={pending} className={SMALL}>
            {pending ? "…" : "Rename"}
          </button>
        </div>
      </div>

      {result && (
        <p className={`text-[13px] ${result.ok ? "text-muted" : "text-foreground"}`}>
          {result.message}
        </p>
      )}
    </form>
  );
}
