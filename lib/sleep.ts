// How long a night was.
//
// Nothing here is stored — `sleep` holds two clock times and the duration is
// worked out from them every time it's shown. That's what makes a mistyped time
// visible while you're still looking at it.
//
// Crossing midnight is arithmetic, not a question. If you went to bed later on
// the clock than you got up, the night crossed midnight; if you didn't, you went
// to bed after midnight and got up the same morning. Both are obvious from the
// two numbers, so the app never asks which day bedtime was on.

// Postgres time columns come back as "22:30:00". A form sends "22:30". Both
// have to mean the same thing.
function minutesInto(time: string | null): number | null {
  if (!time) return null;

  const match = /^(\d{2}):(\d{2})/.exec(time.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

const DAY = 24 * 60;

export function minutesAsleep(
  bedtime: string | null,
  wakeTime: string | null,
): number | null {
  const bed = minutesInto(bedtime);
  const woke = minutesInto(wakeTime);

  if (bed === null || woke === null) return null;

  // Bed at 23:30, up at 07:00 — the night crossed midnight.
  if (bed > woke) return DAY - bed + woke;

  // Bed at 01:30, up at 09:00 — same morning.
  return woke - bed;
}

// "7 h 20 m". Minutes are dropped when there are none, so a tidy eight hours
// reads as "8 h" rather than "8 h 0 m".
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest} m`;
  if (rest === 0) return `${hours} h`;

  return `${hours} h ${rest} m`;
}

// The times as they should appear in a form: "22:30", never "22:30:00".
export function asTimeField(time: string | null): string {
  if (!time) return "";
  const match = /^(\d{2}):(\d{2})/.exec(time.trim());
  return match ? `${match[1]}:${match[2]}` : "";
}
