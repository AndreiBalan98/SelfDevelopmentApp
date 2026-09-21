import { barAxis, labelIndexes } from "@/lib/chart";
import { shortDate } from "@/lib/range";
import { ZONE, judge, type Kind } from "@/lib/targets";

// The stats chart: a bar a day over the range, read against the target.
//
// Drawn by hand as SVG on the server like every other chart, twice — once
// shaped for the phone upright and once for it on its side — so the phone
// downloads no chart code and the rotate button has something to lay across
// the screen.
//
// The target is drawn by the same rules Today's bars follow (lib/targets.ts),
// so the two can never disagree: a ceiling is a line, a ±10% zone is a green
// band with the target through it. The part of a bar past the limit is red,
// and a day short of a zone gets a thin red cap — every day here is a finished
// one, since the range ends yesterday.
//
// A day with no food logged has no bar at all. That's the same rule the
// averages follow: a day not logged isn't a day of eating nothing.

export type Shape = {
  width: number;
  height: number;
  left: number;
  top: number;
  bottom: number;
  labels: number;
};

export const PORTRAIT: Shape = { width: 320, height: 210, left: 34, top: 10, bottom: 24, labels: 5 };
export const LANDSCAPE: Shape = { width: 660, height: 280, left: 36, top: 10, bottom: 24, labels: 10 };

const RIGHT = 8;

// How tall a red cap is on a day short of its zone.
const CAP = 3;

export type Target = { value: number; kind: Kind } | null;

export function StatsChart({
  dates,
  values,
  target,
  average,
  colour,
  tick,
  title,
  shape,
  className = "w-full",
}: {
  dates: string[];
  // What was eaten, by date. A date that isn't here had no food logged.
  values: Map<string, number>;
  target: Target;
  average: number;
  // The bar's colour, as a Tailwind class: "fill-protein".
  colour: string;
  // How a number up the side is written.
  tick: (value: number) => string;
  // For anyone who can't see it: "Calories a day".
  title: string;
  shape: Shape;
  className?: string;
}) {
  const { width, height, left, top, bottom, labels } = shape;

  const zoneTop = target === null ? 0 : target.kind === "zone" ? target.value * (1 + ZONE) : target.value;
  const { max, ticks } = barAxis(Math.max(0, ...values.values(), zoneTop, average));

  const plotWidth = width - left - RIGHT;
  const plotHeight = height - top - bottom;
  const step = plotWidth / Math.max(1, dates.length);
  const barWidth = Math.max(1, step * 0.66);
  const baseline = top + plotHeight;

  const x = (index: number) => left + index * step + step / 2;
  const y = (value: number) => baseline - (Math.min(value, max) / max) * plotHeight;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label={title}>
      {ticks.map((value) => (
        <g key={value}>
          <line x1={left} x2={width - RIGHT} y1={y(value)} y2={y(value)} className="stroke-border" />
          <text x={left - 6} y={y(value) + 4} textAnchor="end" fontSize={11} className="fill-faint">
            {tick(value)}
          </text>
        </g>
      ))}

      {/* The zone a ±10% target asks you to land in. */}
      {target?.kind === "zone" && (
        <rect
          x={left}
          y={y(target.value * (1 + ZONE))}
          width={plotWidth}
          height={y(target.value * (1 - ZONE)) - y(target.value * (1 + ZONE))}
          className="fill-zone"
          fillOpacity={0.22}
        />
      )}

      {dates.map((date, index) => {
        const value = values.get(date);
        if (value === undefined) return null;

        // Every day here is finished, so being short of a zone counts as
        // missed — that's what the red cap says.
        const judgement = target === null ? null : judge(value, target.value, target.kind, true);
        const over = judgement?.status === "over";
        const under = judgement?.status === "below";
        const capped = over ? (judgement as { redFrom: number }).redFrom : value;

        return (
          <g key={date}>
            <rect
              x={x(index) - barWidth / 2}
              y={y(capped)}
              width={barWidth}
              height={baseline - y(capped)}
              rx={Math.min(1.5, barWidth / 2)}
              className={colour}
            />

            {over && (
              <rect
                x={x(index) - barWidth / 2}
                y={y(value)}
                width={barWidth}
                height={y(capped) - y(value)}
                rx={Math.min(1.5, barWidth / 2)}
                className="fill-danger"
              />
            )}

            {under && (
              <rect
                x={x(index) - barWidth / 2}
                y={y(value) - CAP}
                width={barWidth}
                height={CAP}
                className="fill-danger"
              />
            )}
          </g>
        );
      })}

      {target !== null && (
        <line
          x1={left}
          x2={width - RIGHT}
          y1={y(target.value)}
          y2={y(target.value)}
          className="stroke-muted"
        />
      )}

      <line
        x1={left}
        x2={width - RIGHT}
        y1={y(average)}
        y2={y(average)}
        strokeWidth={1.5}
        strokeDasharray="5 4"
        className="stroke-foreground"
      />

      {labelIndexes(dates.length, labels).map((index) => (
        <text
          key={dates[index]}
          x={x(index)}
          y={height - 4}
          textAnchor={
            index === 0 && dates.length > 1
              ? "start"
              : index === dates.length - 1 && dates.length > 1
                ? "end"
                : "middle"
          }
          fontSize={11}
          className="fill-faint"
        >
          {shortDate(dates[index])}
        </text>
      ))}
    </svg>
  );
}

// Where each day's column sits across the drawing, as percentages, so a row of
// invisible buttons can be laid over the chart to open "where did it come
// from?" for that day.
export function columns(shape: Shape): { left: string; right: string } {
  return {
    left: `${(shape.left / shape.width) * 100}%`,
    right: `${(RIGHT / shape.width) * 100}%`,
  };
}
