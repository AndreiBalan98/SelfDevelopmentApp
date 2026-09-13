import type { ReactNode } from "react";
import { arcPath, CLOCK, dialDegrees, dialPoint, overlapOpacity, spreadLabels } from "@/lib/clock";
import { clockDuration, clockTime, type Period, type Span } from "@/lib/sleep";

// The Sleep clock, drawn by hand as SVG on the server, as the mockups draw it:
// a 12-hour face — a clear circle, twelve hour marks — with the night on the
// rim as a thick blue arc from bedtime to wake-up. Every position on a 12-hour
// face means two times, so the times at the ends of an arc are always written
// out in 24-hour form.

const { size, centre, radius } = CLOCK;
// Where the times sit, just outside the rim.
const LABEL_RADIUS = radius + 26;

function Dial({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[22rem]" role="img" aria-label={label}>
      <circle cx={centre} cy={centre} r={radius} fill="none" strokeWidth={2} className="stroke-border-strong" />
      {Array.from({ length: 12 }, (_, hour) => {
        const degrees = hour * 30;
        const inner = dialPoint(degrees, radius - 18);
        const outer = dialPoint(degrees, radius - 10);
        const number = dialPoint(degrees, radius - 32);
        return (
          <g key={hour}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} strokeWidth={2} className="stroke-faint" />
            <text x={number.x} y={number.y + 4} textAnchor="middle" fontSize={12} className="fill-faint">
              {hour === 0 ? 12 : hour}
            </text>
          </g>
        );
      })}
      {children}
    </svg>
  );
}

// A time just outside the rim, with a small word under it in the period view.
function RimLabel({ degrees, time, under }: { degrees: number; time: string; under?: string }) {
  const { x, y } = dialPoint(degrees, LABEL_RADIUS);
  return (
    <g>
      <text x={x} y={under ? y - 1 : y + 4} textAnchor="middle" fontSize={12} fontWeight={600} className="fill-foreground">
        {time}
      </text>
      {under && (
        <text x={x} y={y + 12} textAnchor="middle" fontSize={10} className="fill-faint">
          {under}
        </text>
      )}
    </g>
  );
}

// The two ends of a night, labelled, and pushed apart when they'd collide —
// a night of about twelve hours starts and ends in the same place.
function EndLabels({ bed, wake, under }: { bed: number; wake: number; under?: [string, string] }) {
  const [bedAt, wakeAt] = spreadLabels(dialDegrees(bed), dialDegrees(wake));
  return (
    <>
      <RimLabel degrees={bedAt} time={clockTime(bed)} under={under?.[0]} />
      <RimLabel degrees={wakeAt} time={clockTime(wake)} under={under?.[1]} />
    </>
  );
}

// The middle of the dial: a big number and a line under it.
function Centre({ big, small, bigSize = 34 }: { big: string; small: string | null; bigSize?: number }) {
  return (
    <>
      <text x={centre} y={centre + 4} textAnchor="middle" fontSize={bigSize} fontWeight={600} className="fill-foreground">
        {big}
      </text>
      {small && (
        <text x={centre} y={centre + (bigSize > 30 ? 28 : 24)} textAnchor="middle" fontSize={13} className="fill-muted">
          {small}
        </text>
      )}
    </>
  );
}

// One night with both times: the arc, its two times, the length and the score.
export function NightDial({ span, quality }: { span: Span; quality: number | null }) {
  const path = arcPath(span.bed, span.wake);
  return (
    <Dial label={`Asleep from ${clockTime(span.bed)} to ${clockTime(span.wake)}`}>
      {path && <path d={path} fill="none" strokeWidth={12} strokeLinecap="round" className="stroke-sleep" />}
      <EndLabels bed={span.bed} wake={span.wake} />
      <Centre big={clockDuration(span.minutes)} small={quality === null ? null : `quality ${quality}`} />
    </Dial>
  );
}

// A night logged without its times — only a score or a note: no arc.
export function UntimedDial({ message, quality }: { message: string; quality: number | null }) {
  return (
    <Dial label={message}>
      <text x={centre} y={centre - (quality === null ? -4 : 4)} textAnchor="middle" fontSize={14} className="fill-muted">
        {message}
      </text>
      {quality !== null && (
        <text x={centre} y={centre + 20} textAnchor="middle" fontSize={13} className="fill-muted">
          quality {quality}
        </text>
      )}
    </Dial>
  );
}

// A night not logged: a big "+" in the middle (the link around it is the
// screen's).
export function EmptyDial() {
  return (
    <Dial label="Not logged yet">
      <circle cx={centre} cy={centre} r={38} strokeWidth={2} className="fill-sleep/20 stroke-sleep" />
      <line x1={centre - 14} y1={centre} x2={centre + 14} y2={centre} strokeWidth={4} strokeLinecap="round" className="stroke-accent-pale" />
      <line x1={centre} y1={centre - 14} x2={centre} y2={centre + 14} strokeWidth={4} strokeLinecap="round" className="stroke-accent-pale" />
    </Dial>
  );
}

// A run of nights: one see-through arc each, overlapping into a heatmap, the
// average bedtime and wake-up on the rim, the average length and score inside.
export function PeriodDial({ period }: { period: Period }) {
  const opacity = overlapOpacity(period.spans.length);
  const quality = period.quality === null ? "avg" : `avg · quality ${period.quality.toFixed(1)}`;

  return (
    <Dial label={`${period.timed} nights on the clock`}>
      {period.spans.map((span, index) => {
        const path = arcPath(span.bed, span.wake);
        return (
          path && (
            <path key={index} d={path} fill="none" strokeWidth={12} strokeOpacity={opacity} className="stroke-sleep" />
          )
        );
      })}

      {period.bed && period.wake && (
        <EndLabels bed={period.bed.average} wake={period.wake.average} under={["avg bed", "avg wake"]} />
      )}

      {period.minutes !== null ? (
        <Centre big={clockDuration(period.minutes)} small={quality} bigSize={30} />
      ) : (
        <Centre big="—" small={period.quality === null ? "No times logged" : `No times logged · quality ${period.quality.toFixed(1)}`} bigSize={30} />
      )}
    </Dial>
  );
}
