import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

// The one place in the app that holds the database key.
//
// This key bypasses every security rule on the database, so it must never reach
// the browser. Nothing in here is ever imported by a file marked "use client";
// the check below is a tripwire in case that ever happens by accident.
//
// It's told the shape of the database (lib/types.ts), so a mistyped table or
// column name is a red line here rather than an error on your phone.

let client: SupabaseClient<Database> | null = null;

export function db(): SupabaseClient<Database> {
  if (typeof window !== "undefined") {
    throw new Error("The database client was imported into browser code.");
  }

  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SECRET_KEY are missing. " +
        "Locally they live in .env.local; on Vercel they are environment variables.",
    );
  }

  client = createClient<Database>(url, secretKey, {
    // There are no user accounts and no browser session to keep alive.
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
