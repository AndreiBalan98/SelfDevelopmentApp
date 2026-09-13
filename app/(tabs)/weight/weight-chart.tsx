import { labelIndexes, lineRuns } from "@/lib/chart";
import { shortDate } from "@/lib/range";
import { weightAxis } from "@/lib/weight";

// The Weight chart, drawn by hand as SVG on the server, as the mockups draw it:
// a dot for each weigh-in, the 4-day and 7-day moving averages as two lines, the
// kilos up the side and a few dates along the bottom. No bars.
//
// A skipped day gets a hollow grey dot on a straight line between the weigh-ins
// either side (lib/weight.ts), so it's plainly not real. Those invented points
// are only for the eye: the averages never include them.

type Shape = {
  width: number;
  height: number;
  // Room for the kilos on the left, above the chart, and for the dates below.
  left: number;
  top: number;
  bottom: number;
  // How many dates fit along the bottom.
  labels: number;
};

export const PORTRAIT: Shape = { width: 320, height: 210, left: 28, top: 10, bottom: 24, labels: 5 };
export const LANDSCAPE: Shape = { width: 660, height: 280, left: 30, top: 10, bottom: 24, labels: 10 };

const RIGHT = 8;

export function WeightChart({
  dates,
  weights,
  invented,
  short,
  long,
  shape,
  className = "w-full",
}: {
  dates: string[];
  // What was weighed, by date. A date that isn't here wasn't.
  weights: Map<string, number>;
  // The invented points on skipped days, by date.
  invented: Map<string, number>;
  // The two moving averages, one value per date (null where there's nothing to
  // average).
  short: Array<number | null>;
  long: Array<number | null>;
  shape: Shape;
  className?: string;
}) {
  const { width, height, left, top, bottom, labels } = shape;

  // The axis fits everything that's drawn, the averages and invented points
  // included, so nothing ever sits off the edge.
  const drawn = [
    ...weights.values(),
    ...invented.values(),
    ...short.filter((value) => value !== null),
    ...long.filter((value) => value !== null),
  ];
  const axis = weightAxis(drawn) ?? { low: 0, high: 1, ticks: [] };

  const plotWidth = width - left - RIGHT;
  const plotHeight = height - top - bottom;
  const step = plotWidth / Math.max(1, dates.length);
  const baseline = top + plotHeight;
  // Big enough to see on a week, small enough not to run into each other on
  // All.
  const radius = Math.min(4.5, Math.max(1.5, step * 0.35));

  const x = (index: number) => left + index * step + step / 2;
  const y = (value: number) => baseline - ((value - axis.low) / (axis.high - axis.low)) * plotHeight;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Weight each day, with the 4-day and 7-day averages"
    >
      {axis.ticks.map((tick) => (
        <g key={tick}>
          <line x1={left} x2={width - RIGHT} y1={y(tick)} y2={y(tick)} className="stroke-border" />
          <text x={left - 6} y={y(tick) + 4} textAnchor="end" fontSize={11} className="fill-faint">
            {tick}
          </text>
        </g>
      ))}

      {lineRuns(short, x, y).map((points) => (
        <polyline
          key={`4-${points}`}
          points={points}
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          className="stroke-weight-average-4"
        />
      ))}
      {lineRuns(long, x, y).map((points) => (
        <polyline
          key={`7-${points}`}
          points={points}
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          className="stroke-average-7"
        />
      ))}

      {dates.map((date, index) => {
        const kg = weights.get(date);
        if (kg !== undefined) {
          return <circle key={date} cx={x(index)} cy={y(kg)} r={radius} className="fill-nutrition" />;
        }

        const guess = invented.get(date);
        if (guess === undefined) return null;

        return (
          <circle
            key={date}
            cx={x(index)}
            cy={y(guess)}
            r={Math.max(1.2, radius - 0.6)}
            fill="none"
            strokeWidth={radius < 3 ? 1.2 : 1.8}
            className="stroke-muted"
          />
        );
      })}

      {labelIndexes(dates.length, labels).map((index) => (
        <text
          key={dates[index]}
          x={x(index)}
          y={height - 4}
          textAnchor={index === 0 && dates.length > 1 ? "start" : index === dates.length - 1 && dates.length > 1 ? "end" : "middle"}
          fontSize={11}
          className="fill-faint"
        >
          {shortDate(dates[index])}
        </text>
      ))}
    </svg>
  );
}
