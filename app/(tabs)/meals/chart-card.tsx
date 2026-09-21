"use client";

import { useState, type ReactNode } from "react";
import { ChartFrame } from "../chart-frame";
import { PILL, PILL_CHOSEN, PILL_OTHER } from "../ui";

// The stats chart and its metric buttons.
//
// All seven charts arrive drawn from the server — upright and sideways — and
// tapping a button simply shows another one. Nothing is fetched and nothing is
// drawn on the phone, so the switch is instant.

export type Chart = {
  key: string;
  // What the button says: "Calories".
  label: string;
  portrait: ReactNode;
  landscape: ReactNode;
  // Under the chart: "average 2,101 kcal (dashed) · target 2,000 kcal max".
  footer: string;
};

export function ChartCard({ charts }: { charts: Chart[] }) {
  const [chosen, setChosen] = useState(charts[0]?.key);
  const chart = charts.find((candidate) => candidate.key === chosen) ?? charts[0];

  if (!chart) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">Over time</h2>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="What to chart">
        {charts.map((candidate) => (
          <button
            key={candidate.key}
            type="button"
            aria-pressed={candidate.key === chart.key}
            onClick={() => setChosen(candidate.key)}
            className={`${PILL} ${candidate.key === chart.key ? PILL_CHOSEN : PILL_OTHER}`}
          >
            {candidate.label}
          </button>
        ))}
      </div>

      {/* The line above the chart says which metric it is, not which days —
          the range is written once, under the pills at the top of the section,
          and repeating it here put the same sentence on screen twice. */}
      <ChartFrame
        title="Nutrition"
        label={chart.label}
        portrait={chart.portrait}
        landscape={chart.landscape}
      />

      <p className="text-xs text-faint tabular-nums">{chart.footer}</p>
    </section>
  );
}
