// What the red dots say: which of the day's logs are still missing, and how old
// the backup is.
//
// Every date here is the 04:00 day (dayFor), the same one meals use, so the
// whole app agrees on what today is. At 00:30 it is still yesterday, and last
// night hasn't been slept yet, so no sleep dot goes up for it.

import { db } from "@/lib/supabase";
import { dayFor, shiftDays } from "@/lib/day";
import { backupStatus, type BackupLevel } from "@/lib/backup";

export type Status = {
  // Last night: the sleep row dated today, since a night is stored under the
  // day you woke up.
  sleepMissing: boolean;
  // Yesterday: smoking is always logged a day behind.
  smokingMissing: boolean;
  // Today's weigh-in.
  weightMissing: boolean;
  backup: BackupLevel;
};

// Meals never get a dot: a skipped meal and a forgotten one look the same.
export async function readStatus(): Promise<Status> {
  const day = dayFor(new Date());
  const supabase = db();

  const [sleep, smoking, weight, backup] = await Promise.all([
    supabase.from("sleep").select("id").eq("date", day).maybeSingle(),
    supabase.from("smoking").select("id").eq("date", shiftDays(day, -1)).maybeSingle(),
    supabase.from("weight").select("id").eq("date", day).maybeSingle(),
    backupStatus(),
  ]);

  // A question the database couldn't answer isn't a missing log. It gets no
  // dot rather than a false alarm.
  return {
    sleepMissing: !sleep.error && sleep.data === null,
    smokingMissing: !smoking.error && smoking.data === null,
    weightMissing: !weight.error && weight.data === null,
    backup: backup.level,
  };
}
