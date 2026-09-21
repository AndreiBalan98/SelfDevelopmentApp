// How numbers are written on Nutrition → Today, in one place, so the stats
// boxes, the chart and the "where did it come from?" panels can never write the
// same figure two different ways.

// "2,101". Calories, and anything else counted whole.
export function whole(value: number): string {
  return Math.round(value).toLocaleString("en-GB");
}

// Grams keep a decimal while they're small, so a light day's sugar isn't
// written as "0 g". This is the number on its own, for places that add the
// unit themselves — the chart's footer, which writes it once.
export function gramsValue(value: number): string {
  return value < 10 ? String(Math.round(value * 10) / 10) : whole(value);
}

export function grams(value: number): string {
  return `${gramsValue(value)} g`;
}
