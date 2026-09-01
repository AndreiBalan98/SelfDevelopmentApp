"use server";

import { db } from "@/lib/supabase";

// A round trip that writes, reads back, and cleans up after itself.
//
// It uses a date far outside any real logging (1970) so it can never collide
// with a genuine weigh-in, and it deletes the row again at the end. Nothing is
// left behind either way.
const TEST_DATE = "1970-01-01";

export async function runWriteTest(): Promise<string> {
  const supabase = db();

  // Clear any leftover from an interrupted run.
  await supabase.from("weight").delete().eq("date", TEST_DATE);

  const { error: insertError } = await supabase
    .from("weight")
    .insert({ date: TEST_DATE, kg: 1, notes: "connection test" });

  if (insertError) return `Write failed: ${insertError.message}`;

  const { data, error: readError } = await supabase
    .from("weight")
    .select("kg")
    .eq("date", TEST_DATE)
    .single();

  if (readError) return `Wrote, but reading it back failed: ${readError.message}`;
  if (!data) return "Wrote, but the row was not there when read back.";

  const { error: deleteError } = await supabase
    .from("weight")
    .delete()
    .eq("date", TEST_DATE);

  if (deleteError) {
    return `Wrote and read back, but cleaning up failed: ${deleteError.message}`;
  }

  return "Wrote a row, read it back, deleted it. Round trip works.";
}
