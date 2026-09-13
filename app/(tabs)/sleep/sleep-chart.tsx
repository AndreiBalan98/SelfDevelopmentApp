import { labelIndexes, lineRuns, runsOf, timeAxis } from "@/lib/chart";
import { shortDate } from "@/lib/range";
import { clockTime } from "@/lib/sleep";

// The Sleep chart, drawn by hand as SVG on the server, as the mockups draw it:
// the days along the bottom, the time of day up the side — running on across
// midnight, so 23:30 and 00:30 sit next to each other — a line for bedtime and
// one for the wake-up, the band between them shaded light blue so its
// thickness is how long you slept, and a dashed line at each average.
//
// A night that's missing, or logged without its times, breaks both lines and
// the shading: there's nothing to draw through.

type Shape = {
  width: number;
  height: number;
  // Room for the times on the left, the average labels on the right, above
  // the chart and for the dates below.
  left: number;
  right: number;
  top: number;
  bottom: number;
  // How many dates fit along the bottom.
  labels: number;
};

export const PORTRAIT: Shape = { width: 360, height: 240, left: 40, right: 62, top: 10, bottom: 24, labels: 5 };
export const LANDSCAPE: Shape = { width: 660, height: 280, left: 42, right: 66, top: 10, bottom: 24, labels: 10 };

export function SleepChart({
  dates,
  beds,
  wakes,
  averageBed,
  averageWake,
  shape,
  className = "w-full",
}: {
  dates: string[];
  // Each night's bedtime and wake-up on one continuous line of minutes
  // (lib/sleep.ts), one per date; null where the night has no times.
  beds: Array<number | null>;
  wakes: Array<number | null>;
  averageBed: number;
  averageWake: number;
  shape: Shape;
  className?: string;
}) {
  const { width, height, left, right, top, bottom, labels } = shape;

  const drawn = [...beds, ...wakes].filter((value) => value !== null);
  const axis = timeAxis(drawn) ?? { low: 0, high: 60, ticks: [] };

  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const step = plotWidth / Math.max(1, dates.length);
  const baseline = top + plotHeight;
  const dot = Math.min(3, Math.max(1.5, step * 0.3));

  const x = (index: number) => left + index * step + step / 2;
  // Later is higher: the wake-up line runs above the bedtime line.
  const y = (minute: number) => baseline - ((minute - axis.low) / (axis.high - axis.low)) * plotHeight;

  // The band between the lines, one piece per unbroken run of nights. A night
  // on its own gets a narrow bar, so it still shows.
  const bands = runsOf(beds).map((run) => {
    if (run.length === 1) {
      const index = run[0];
      const half = Math.min(step * 0.3, 6);
      return `${x(index) - half},${y(wakes[index] as number)} ${x(index) + half},${y(wakes[index] as number)} ${x(index) + half},${y(beds[index] as number)} ${x(index) - half},${y(beds[index] as number)}`;
    }
    const upper = run.map((index) => `${x(index).toFixed(1)},${y(wakes[index] as number).toFixed(1)}`);
    const lower = [...run].reverse().map((index) => `${x(index).toFixed(1)},${y(beds[index] as number).toFixed(1)}`);
    return [...upper, ...lower].join(" ");
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Bedtime and wake-up each night, with their averages"
    >
      {axis.ticks.map((tick) => (
        <g key={tick}>
          <line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} className="stroke-border" />
          <text x={left - 6} y={y(tick) + 4} textAnchor="end" fontSize={11} className="fill-faint">
            {clockTime(tick)}
          </text>
        </g>
      ))}

      {bands.map((points) => (
        <polygon key={points} points={points} className="fill-sleep/18" />
      ))}

      {lineRuns(wakes, x, y).map((points) => (
        <polyline key={`w-${points}`} points={points} fill="none" strokeWidth={2.5} strokeLinejoin="round" className="stroke-wake" />
      ))}
      {lineRuns(beds, x, y).map((points) => (
        <polyline key={`b-${points}`} points={points} fill="none" strokeWidth={2.5} strokeLinejoin="round" className="stroke-bedtime" />
      ))}

      {dates.map((date, index) => (
        <g key={date}>
          {wakes[index] !== null && <circle cx={x(index)} cy={y(wakes[index] as number)} r={dot} className="fill-wake" />}
          {beds[index] !== null && <circle cx={x(index)} cy={y(beds[index] as number)} r={dot} className="fill-bedtime" />}
        </g>
      ))}

      {/* The averages: dashed across the chart, labelled on the right. */}
      <line x1={left} x2={width - right} y1={y(averageWake)} y2={y(averageWake)} strokeWidth={1.5} strokeDasharray="5 4" className="stroke-wake" />
      <line x1={left} x2={width - right} y1={y(averageBed)} y2={y(averageBed)} strokeWidth={1.5} strokeDasharray="5 4" className="stroke-bedtime" />
      <text x={width - right + 6} y={y(averageWake) + 4} fontSize={11} className="fill-muted">
        avg {clockTime(averageWake)}
      </text>
      <text x={width - right + 6} y={y(averageBed) + 4} fontSize={11} className="fill-muted">
        avg {clockTime(averageBed)}
      </text>

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
