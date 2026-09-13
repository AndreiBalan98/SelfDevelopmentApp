import { rangeQuery, type RangeParams } from "@/lib/range";

// What the Sleep tab carries to the entry form and back: the range it was on
// (lib/range.ts), and "view=chart" when it was showing the chart. "" means a
// single night on the clock. Rebuilt from its checked parts, so nothing else
// in an address can ride along into a redirect.
export function sleepQuery(params: RangeParams & { view?: string | string[] }): string {
  return [rangeQuery(params), params.view === "chart" ? "view=chart" : ""].filter(Boolean).join("&");
}
