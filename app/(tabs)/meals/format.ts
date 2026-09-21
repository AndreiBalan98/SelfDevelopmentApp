// How numbers are written on Nutrition → Today, in one place, so the stats
// boxes and the "where did it come from?" panels can never write the same
// figure two different ways.

// "2,101". Calories, and anything else counted whole.
export function whole(value: number): string {
  return Math.round(value).toLocaleString("en-GB");
}

// Grams keep a decimal while they're small, so a light day's sugar isn't
// written as "0 g".
export function grams(value: number): string {
  const shown = value < 10 ? Math.round(value * 10) / 10 : Math.round(value);
  return `${shown.toLocaleString("en-GB")} g`;
}
