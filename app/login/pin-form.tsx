"use client";

import { useActionState, useRef } from "react";
import { submitPin } from "./actions";

export function PinForm() {
  const [message, action, pending] = useActionState(submitPin, null);
  const form = useRef<HTMLFormElement>(null);

  return (
    <form ref={form} action={action} className="flex flex-col items-center gap-5">
      <input
        name="pin"
        type="password"
        // Summons the iPhone number pad rather than the full keyboard.
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        autoFocus
        disabled={pending}
        aria-label="PIN"
        onChange={(event) => {
          // Strip anything that isn't a digit, then submit as soon as the
          // sixth one lands — no button to reach for one-handed.
          const digits = event.target.value.replace(/\D/g, "").slice(0, 6);
          event.target.value = digits;
          if (digits.length === 6) form.current?.requestSubmit();
        }}
        className="w-48 rounded-lg border border-border bg-surface px-4 py-3
                   text-center text-2xl tracking-[0.4em] tabular-nums
                   outline-none focus:border-accent disabled:opacity-50"
      />

      <p className="h-5 text-sm text-muted" aria-live="polite">
        {pending ? "Checking…" : (message ?? "")}
      </p>
    </form>
  );
}
