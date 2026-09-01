"use client";

import { useActionState } from "react";
import { runWriteTest } from "./actions";

export function WriteTest() {
  const [result, action, pending] = useActionState<string | null>(
    () => runWriteTest(),
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-3 font-medium text-black disabled:opacity-50"
      >
        {pending ? "Testing…" : "Run write test"}
      </button>

      {result && (
        <p className="rounded-lg border border-border bg-surface p-3 text-sm">
          {result}
        </p>
      )}
    </form>
  );
}
