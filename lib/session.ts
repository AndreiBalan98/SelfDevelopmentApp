// The session cookie: proof that someone typed the right PIN, in a form the
// browser can hold but cannot forge.
//
// The cookie is just an expiry date plus a signature of that date, made with
// SESSION_SECRET. Change the expiry by a single digit and the signature stops
// matching, so a browser can't extend its own session or invent one.
//
// This file runs in two very different places — the gate that checks every
// request, and the server action that logs you in — so it deliberately uses only
// Web Crypto, which exists in both.

export const SESSION_COOKIE = "life_tracker_session";

const SESSION_DAYS = 90;
export const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error(
      "SESSION_SECRET is missing. Locally it lives in .env.local; on Vercel it is " +
        "an environment variable.",
    );
  }
  return value;
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Compares two strings without leaking, through how long it takes, how much of
// them matched. Overkill here, but it's four lines.
function equals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}

export async function createSessionValue(): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  return `${expiresAt}.${await sign(String(expiresAt))}`;
}

export async function isValidSession(value: string | undefined): Promise<boolean> {
  if (!value) return false;

  const separator = value.indexOf(".");
  if (separator === -1) return false;

  const expiresAt = value.slice(0, separator);
  const signature = value.slice(separator + 1);

  if (!/^\d+$/.test(expiresAt)) return false;
  if (!equals(signature, await sign(expiresAt))) return false;

  return Number(expiresAt) > Date.now();
}
