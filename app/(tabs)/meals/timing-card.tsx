import { clockTime } from "@/lib/sleep";
import type { Timing } from "@/lib/timing";
import { whole } from "./format";

// The timing card: when the eating happens, and an average day drawn from
// 04:00 to 04:00 underneath — sleep, the gap before the first food, the eating
// window, and the average protein in each hour above it.
//
// The strip is drawn as SVG on the server like every other chart here. It has
// no rotate button: it's a fixed 24 hours wide whatever the range, so turning
// it would show the same thing bigger, and the mockup draws none.

const DAY = 24 * 60;

// "4 h 45", "10 h" — as the mockups write a length here.
function hours(minutes: number): string {
  const whole_ = Math.round(minutes);
  const h = Math.floor(whole_ / 60);
  const m = whole_ % 60;

  if (h === 0) return `${m} m`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

// A position on the 04:00 day, as a clock reads it.
const at = (minute: number) => clockTime(minute + 4 * 60);

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-border py-2.5 text-[13px] first:border-t-0">
      <span className="text-muted">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The average day
// ---------------------------------------------------------------------------

const WIDTH = 320;
const HEIGHT = 140;
const LEFT = 10;
const RIGHT = 10;
const PLOT = WIDTH - LEFT - RIGHT;

// Where the strip itself sits, and how tall the protein bars above it are.
const STRIP_TOP = 96;
const STRIP_HEIGHT = 14;
const BARS_TOP = 24;
const BARS_BOTTOM = STRIP_TOP - 6;

function AverageDay({ timing }: { timing: Timing }) {
  const x = (minute: number) => LEFT + (minute / DAY) * PLOT;
  const width = (from: number, to: number) => Math.max(0, x(to) - x(from));

  const tallest = Math.max(...timing.proteinByHour, 0);
  const height = (grams: number) =>
    tallest <= 0 ? 0 : (grams / tallest) * (BARS_BOTTOM - BARS_TOP);

  // The night, drawn as up to two blocks: the day starts at 04:00, so a night
  // that runs past it comes out as one block at each end.
  const sleeping =
    timing.sleep === null
      ? []
      : timing.sleep.bed <= timing.sleep.wake
        ? [[timing.sleep.bed, timing.sleep.wake] as const]
        : [
            [0, timing.sleep.wake] as const,
            [timing.sleep.bed, DAY] as const,
          ];

  const hourLabels = [0, 4, 8, 12, 16, 20, 24];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      role="img"
      aria-label="An average day, from 04:00 to 04:00"
    >
      <text x={LEFT} y={12} fontSize={11} className="fill-faint">
        Protein by hour (g)
      </text>

      {timing.proteinByHour.map((grams, hour) =>
        grams <= 0 ? null : (
          <rect
            key={hour}
            x={x(hour * 60) + 1}
            y={BARS_BOTTOM - height(grams)}
            width={Math.max(1, PLOT / 24 - 2)}
            height={height(grams)}
            className="fill-protein"
          />
        ),
      )}

      {sleeping.map(([from, to]) => (
        <rect
          key={from}
          x={x(from)}
          y={STRIP_TOP}
          width={width(from, to)}
          height={STRIP_HEIGHT}
          className="fill-sleep"
          fillOpacity={0.45}
        />
      ))}

      {/* From waking up to the first thing eaten. */}
      {timing.sleep !== null && timing.firstFood !== null && timing.firstFood > timing.sleep.wake && (
        <rect
          x={x(timing.sleep.wake)}
          y={STRIP_TOP}
          width={width(timing.sleep.wake, timing.firstFood)}
          height={STRIP_HEIGHT}
          className="fill-foreground"
          fillOpacity={0.16}
        />
      )}

      {timing.firstFood !== null && timing.lastFood !== null && (
        <rect
          x={x(timing.firstFood)}
          y={STRIP_TOP}
          width={width(timing.firstFood, timing.lastFood)}
          height={STRIP_HEIGHT}
          className="fill-zone"
          fillOpacity={0.55}
        />
      )}

      {hourLabels.map((hour) => (
        <text
          key={hour}
          x={x(hour * 60)}
          y={HEIGHT - 12}
          textAnchor={hour === 0 ? "start" : hour === 24 ? "end" : "middle"}
          fontSize={11}
          className="fill-faint"
        >
          {String((hour + 4) % 24).padStart(2, "0")}
        </text>
      ))}
    </svg>
  );
}

function Key({ colour, opacity, label }: { colour: string; opacity: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-2 w-3.5 rounded-[2px] ${colour} ${opacity}`} />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------

export function TimingCard({ timing, dates }: { timing: Timing; dates: string }) {
  if (timing.days === 0) return null;

  const { wakeToFirst, lateNight } = timing;

  return (
    <section className="flex flex-col gap-2">
      <div>
        <h2 className="text-sm font-semibold">Timing</h2>
        <p className="text-xs text-faint tabular-nums">{dates} · average day</p>
      </div>

      <div className="flex flex-col rounded-xl bg-surface px-3.5 pb-3">
        <Row
          label="Wake → first food"
          value={
            wakeToFirst === null
              ? "no sleep logged"
              : // The shortest and longest are only worth writing when they
                // differ — one day would otherwise read "5 h (5 h–5 h)".
                wakeToFirst.shortest === wakeToFirst.longest
                ? hours(wakeToFirst.average)
                : `${hours(wakeToFirst.average)} (${hours(wakeToFirst.shortest)}–${hours(
                    wakeToFirst.longest,
                  )})`
          }
        />
        <Row
          label="First food"
          value={timing.firstFood === null ? "—" : `~${at(timing.firstFood)}`}
        />
        <Row label="Last food" value={timing.lastFood === null ? "—" : `~${at(timing.lastFood)}`} />
        <Row label="Eating window" value={timing.window === null ? "—" : `~${hours(timing.window)}`} />
        <Row
          label="Eaten after 01:00"
          value={
            lateNight.meals === 0
              ? "nothing"
              : `${lateNight.meals} ${lateNight.meals === 1 ? "meal" : "meals"} · ${whole(
                  lateNight.calories,
                )} kcal`
          }
        />

        <div className="pt-2">
          <AverageDay timing={timing} />
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
          <Key colour="bg-sleep" opacity="opacity-45" label="Sleep" />
          <Key colour="bg-foreground" opacity="opacity-20" label="No food yet" />
          <Key colour="bg-zone" opacity="opacity-55" label="Eating window" />
          <Key colour="bg-protein" opacity="" label="Protein" />
        </div>

        {wakeToFirst !== null && wakeToFirst.days < timing.days && (
          <p className="pt-2 text-[11px] text-faint tabular-nums">
            Wake-up times from {wakeToFirst.days} of {timing.days} days.
          </p>
        )}
      </div>
    </section>
  );
}
