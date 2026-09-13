"use client";

import { startTransition, useActionState, type FormEvent } from "react";

// A form's save, sent by hand rather than through the form's `action`.
//
// Sent through `action`, React puts every box back to how the screen opened
// once the save is over — refused or not. A refused save (a price that isn't a
// number, say) then wiped everything else you'd typed, and the next save stored
// the old values; boxes the screen holds itself, like the grams/millilitres
// choice or the sleep times, could go on showing your choice while the form held
// the old one. Found in Settings in step 7.3, fixed there by hand, and fixed
// everywhere else with this in step 7.7c.
//
// Sent this way nothing is reset: a refused save leaves every box as you left
// it, and after a successful one the boxes keep what you typed.
//
// Use: `const [result, submit, pending] = useFormAction(saveThing);` and then
// `<form onSubmit={submit}>`.
export function useFormAction<R>(action: (previous: R | null, form: FormData) => Promise<R>) {
  const [result, dispatch, pending] = useActionState<R | null, FormData>(action, null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => dispatch(form));
  }

  return [result, submit, pending] as const;
}
