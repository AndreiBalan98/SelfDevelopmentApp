// Where things go on the Sleep clock: a 12-hour face, drawn by hand as SVG.
//
// Pure, like the rest of lib/. Times come in as minutes of the day, any number
// of days along (lib/sleep.ts puts a night on one continuous line); the face
// only cares where they land on the dial, so 22:30 and 10:30 share a position —
// which is why the labels always say the time in 24-hour form.

const HALF_DAY = 12 * 60;

// The dial's centre and radius, in the SVG's own units (a 320 × 320 square).
export const CLOCK = { size: 320, centre: 160, radius: 104 };

// Degrees round the dial, clockwise from 12.
export function dialDegrees(minute: number): number {
  return ((((minute % HALF_DAY) + HALF_DAY) % HALF_DAY) / HALF_DAY) * 360;
}

// A point at `radius` from the centre, at `degrees` round the dial.
export function dialPoint(degrees: number, radius: number): { x: number; y: number } {
  const angle = (degrees / 180) * Math.PI;
  return {
    x: CLOCK.centre + radius * Math.sin(angle),
    y: CLOCK.centre - radius * Math.cos(angle),
  };
}

// The arc on the rim from bedtime to wake-up, as an SVG path. Twelve hours or
// more goes all the way round, drawn as a full ring; nothing at all for a night
// of no length.
export function arcPath(bed: number, wake: number, radius = CLOCK.radius): string | null {
  const length = wake - bed;
  if (length <= 0) return null;

  const { centre } = CLOCK;
  if (length >= HALF_DAY) {
    // Two half circles: a single arc can't start and end at the same point.
    return (
      `M ${centre} ${centre - radius} ` +
      `A ${radius} ${radius} 0 1 1 ${centre} ${centre + radius} ` +
      `A ${radius} ${radius} 0 1 1 ${centre} ${centre - radius}`
    );
  }

  const start = dialPoint(dialDegrees(bed), radius);
  const end = dialPoint(dialDegrees(wake), radius);
  const large = length > HALF_DAY / 2 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

// How see-through each of `count` overlapping arcs is, so that all of them on
// top of each other build up to the full blue: 90% cover where every night
// overlaps, as the mockups draw seven nights at 0.28 each.
export function overlapOpacity(count: number): number {
  if (count <= 1) return 1;
  return 1 - Math.pow(0.1, 1 / count);
}

// Two labels round the dial, moved apart when they'd sit on top of each other:
// each is pushed away from their midpoint until they're `apart` degrees apart.
// Labels far enough apart already are left where they are.
export function spreadLabels(first: number, second: number, apart = 40): [number, number] {
  // The shorter way round from the first to the second, -180 to 180.
  const gap = ((((second - first) % 360) + 540) % 360) - 180;
  if (Math.abs(gap) >= apart) return [first, second];

  const middle = first + gap / 2;
  const direction = gap >= 0 ? 1 : -1;
  return [middle - (direction * apart) / 2, middle + (direction * apart) / 2];
}
