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

// "7h 55", as the clock's centre writes a length: the mockups' shorter form.
export function clockDuration(minutes: number): string {
  const whole = Math.round(minutes);
  return `${Math.floor(whole / 60)}h ${String(whole % 60).padStart(2, "0")}`;
}

// A minute of the day, any number of days along, as a 24-hour clock reads it:
// 1,470 (00:30 the next day) is "00:30".
export function clockTime(minute: number): string {
  const within = ((Math.round(minute) % DAY) + DAY) % DAY;
  return `${String(Math.floor(within / 60)).padStart(2, "0")}:${String(within % 60).padStart(2, "0")}`;
}

// A night on one continuous line of minutes, so that nights either side of
// midnight can be averaged and compared: bedtime counted from the noon before
// (23:30 is 1,410, 00:30 is 1,470 — next to each other, as they are), and the
// wake-up as bedtime plus the length. Null without both times.
export type Span = { bed: number; wake: number; minutes: number };

export function nightSpan(bedtime: string | null, wakeTime: string | null): Span | null {
  const bed = minutesInto(bedtime);
  const minutes = minutesAsleep(bedtime, wakeTime);
  if (bed === null || minutes === null) return null;

  const fromNoon = bed < DAY / 2 ? bed + DAY : bed;
  return { bed: fromNoon, wake: fromNoon + minutes, minutes };
}

export type Night = {
  date: string;
  bedtime: string | null;
  wake_time: string | null;
  quality: number | null;
};

// What the period view shows for a run of nights: the nights with both times
// (for the arcs), the earliest, latest and average bedtime and wake-up, the
// average length, and the average score.
//
// The times and the length go by the nights with both times; the score by every
// night with one, times or not. Averaging on the continuous line keeps 23:30 and
// 00:30 averaging to 00:00, not midday, and makes the average wake-up exactly
// the average bedtime plus the average length.
export type Period = {
  spans: Span[];
  bed: { earliest: number; latest: number; average: number } | null;
  wake: { earliest: number; latest: number; average: number } | null;
  minutes: number | null;
  quality: number | null;
  // How many nights had both times, and how many had a score.
  timed: number;
  scored: number;
};

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

export function periodOf(nights: Night[]): Period {
  const spans = nights.flatMap((night) => {
    const span = nightSpan(night.bedtime, night.wake_time);
    return span === null ? [] : [span];
  });
  const scores = nights.flatMap((night) => (night.quality === null ? [] : [night.quality]));

  const summary = (values: number[]) =>
    values.length === 0
      ? null
      : { earliest: Math.min(...values), latest: Math.max(...values), average: mean(values) };

  return {
    spans,
    bed: summary(spans.map((span) => span.bed)),
    wake: summary(spans.map((span) => span.wake)),
    minutes: spans.length === 0 ? null : mean(spans.map((span) => span.minutes)),
    quality: scores.length === 0 ? null : mean(scores),
    timed: spans.length,
    scored: scores.length,
  };
}

// The times as they should appear in a form: "22:30", never "22:30:00".
export function asTimeField(time: string | null): string {
  if (!time) return "";
  const match = /^(\d{2}):(\d{2})/.exec(time.trim());
  return match ? `${match[1]}:${match[2]}` : "";
}
