"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { isCorrectPin } from "@/lib/pin";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionValue,
} from "@/lib/session";

const MAX_FAILURES = 5;
const WINDOW_MINUTES = 15;

const UNREACHABLE = "Can't reach the database. Try again shortly.";

function windowStart(): string {
  return new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
}

// How long until the lock lifts: the oldest of the five most recent failures has
// to age out of the window. 0 means not locked.
//
// Throws if the database can't be reached. That's deliberate — see the note in
// submitPin about failing closed.
async function minutesLocked(): Promise<number> {
  const { data, error } = await db()
    .from("login_attempts")
    .select("at")
    .gte("at", windowStart())
    .order("at", { ascending: false })
    .limit(MAX_FAILURES);

  if (error) throw new Error(error.message);
  if (!data || data.length < MAX_FAILURES) return 0;

  const oldest = new Date(data[data.length - 1].at as string).getTime();
  const clearsAt = oldest + WINDOW_MINUTES * 60_000;

  return Math.max(1, Math.ceil((clearsAt - Date.now()) / 60_000));
}

async function recordFailure(): Promise<number> {
  const supabase = db();

  const { error } = await supabase.from("login_attempts").insert({});
  if (error) throw new Error(error.message);

  // Stop the table growing without limit if someone sits there guessing.
  // Anything this old is long past mattering to the fifteen-minute window.
  const yesterday = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  await supabase.from("login_attempts").delete().lt("at", yesterday);

  const { count, error: countError } = await supabase
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .gte("at", windowStart());

  if (countError) throw new Error(countError.message);
  return count ?? 0;
}

export async function submitPin(
  _previous: string | null,
  formData: FormData,
): Promise<string | null> {
  const pin = String(formData.get("pin") ?? "").trim();

  // A mistyped short PIN isn't an attempt — it would be a poor reason to lock
  // yourself out for a quarter of an hour.
  if (!/^\d{6}$/.test(pin)) {
    return "Six digits.";
  }

  // Everything below refuses to continue if the database is unreachable, rather
  // than carrying on with the lockout quietly switched off. The app is useless
  // without the database anyway, so there is nothing to gain by letting you in.
  let locked: number;
  try {
    locked = await minutesLocked();
  } catch {
    return UNREACHABLE;
  }

  if (locked > 0) {
    return `Too many attempts. Try again in ${locked} minute${locked === 1 ? "" : "s"}.`;
  }

  if (!(await isCorrectPin(pin))) {
    let failures: number;
    try {
      failures = await recordFailure();
    } catch {
      return UNREACHABLE;
    }

    const remaining = MAX_FAILURES - failures;
    return remaining <= 0
      ? "Wrong PIN. Locked for 15 minutes."
      : `Wrong PIN. ${remaining} ${remaining === 1 ? "try" : "tries"} left.`;
  }

  // Correct: forget the failures entirely.
  const { error } = await db().from("login_attempts").delete().gt("id", 0);
  if (error) return UNREACHABLE;

  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionValue(), {
    httpOnly: true, // the browser holds it but no script can read it
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  // Straight to Nutrition → Today, where the app always opens.
  redirect("/meals");
}
