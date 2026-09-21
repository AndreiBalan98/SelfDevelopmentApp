"use client";

import { useActionState, useRef } from "react";
import { submitPin } from "./actions";

// The PIN box, in the new look: a rounded surface like every other card in the
// app, the digits large and spaced out.
//
// This is deliberately the one form in the app still sent through React's form
// `action` rather than by hand (step 7.7c): every other form keeps what you
// typed when a save is refused, but here a wrong PIN should clear the field so
// the next attempt starts empty.
export function PinForm() {
  const [message, action, pending] = useActionState(submitPin, null);
  const form = useRef<HTMLFormElement>(null);

  return (
    <form ref={form} action={action} className="flex flex-col items-center gap-4">
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
        className="w-52 rounded-xl border border-border bg-surface px-4 py-3.5
                   text-center text-2xl tracking-[0.4em] tabular-nums
                   outline-none focus:border-accent disabled:opacity-50"
      />

      {/* Kept at a fixed height so the box doesn't jump when a message
          appears. Never red: red means a missing log, a missed target or an
          overdue backup, and nothing else. */}
      <p className="h-5 text-[13px] text-muted" aria-live="polite">
        {pending ? "Checking…" : (message ?? "")}
      </p>
    </form>
  );
}
