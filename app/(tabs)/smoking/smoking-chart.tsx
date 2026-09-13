import { countTicks, labelIndexes } from "@/lib/chart";
import { shortDate } from "@/lib/range";

// The Smoking chart, drawn by hand as SVG on the server, as the mockups draw
// it: a bar a day from zero up to exactly the highest count in the range, the
// 4-day and 7-day moving averages as two lines, a few counts up the side and a
// few dates along the bottom.
//
// A logged zero shows as a small 0 on the baseline; a day with no entry has no
// bar and no label — "none" and "didn't log it" are different facts.

type Shape = {
  width: number;
  height: number;
  // Room for the counts on the left, above the chart, and for the dates below.
  left: number;
  top: number;
  bottom: number;
  // How many dates fit along the bottom.
  labels: number;
};

export const PORTRAIT: Shape = { width: 320, height: 210, left: 28, top: 10, bottom: 24, labels: 5 };
export const LANDSCAPE: Shape = { width: 660, height: 280, left: 30, top: 10, bottom: 24, labels: 10 };

const RIGHT = 8;

export function SmokingChart({
  dates,
  counts,
  short,
  long,
  shape,
  className = "w-full",
}: {
  dates: string[];
  // What was logged, by date. A date that isn't here wasn't logged.
  counts: Map<string, number>;
  // The two moving averages, one value per date (null where there's nothing to
  // average).
  short: Array<number | null>;
  long: Array<number | null>;
  shape: Shape;
  className?: string;
}) {
  const { width, height, left, top, bottom, labels } = shape;

  const logged = dates.flatMap((date) => (counts.has(date) ? [counts.get(date) as number] : []));
  const max = Math.max(0, ...logged);
  // The axis stops at exactly the highest count. All zeros still needs a
  // height to draw in.
  const ceiling = max > 0 ? max : 1;

  const plotWidth = width - left - RIGHT;
  const plotHeight = height - top - bottom;
  const step = plotWidth / Math.max(1, dates.length);
  const barWidth = Math.max(1, step * 0.66);
  const baseline = top + plotHeight;

  const x = (index: number) => left + index * step + step / 2;
  const y = (value: number) => baseline - (value / ceiling) * plotHeight;

  // A line through the days that have an average, broken where one doesn't.
  const line = (values: Array<number | null>) => {
    const runs: string[] = [];
    let run: string[] = [];
    values.forEach((value, index) => {
      if (value === null) {
        if (run.length > 1) runs.push(run.join(" "));
        run = [];
      } else {
        run.push(`${x(index).toFixed(1)},${y(value).toFixed(1)}`);
      }
    });
    if (run.length > 1) runs.push(run.join(" "));
    return runs;
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Cigarettes a day, with the 4-day and 7-day averages"
    >
      {countTicks(max).map((tick) => (
        <g key={tick}>
          <line x1={left} x2={width - RIGHT} y1={y(tick)} y2={y(tick)} className="stroke-border" />
          <text x={left - 6} y={y(tick) + 4} textAnchor="end" fontSize={11} className="fill-faint">
            {tick}
          </text>
        </g>
      ))}

      {dates.map((date, index) => {
        const count = counts.get(date);
        if (count === undefined) return null;

        if (count === 0) {
          return (
            <text
              key={date}
              x={x(index)}
              y={baseline - 3}
              textAnchor="middle"
              fontSize={9}
              className="fill-accent-pale"
            >
              0
            </text>
          );
        }

        return (
          <rect
            key={date}
            x={x(index) - barWidth / 2}
            y={y(count)}
            width={barWidth}
            height={baseline - y(count)}
            rx={Math.min(1.5, barWidth / 2)}
            className="fill-smoking"
          />
        );
      })}

      {line(short).map((points) => (
        <polyline key={`4-${points}`} points={points} fill="none" strokeWidth={2} strokeLinejoin="round" className="stroke-average-4" />
      ))}
      {line(long).map((points) => (
        <polyline key={`7-${points}`} points={points} fill="none" strokeWidth={2} strokeLinejoin="round" className="stroke-average-7" />
      ))}

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
