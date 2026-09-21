"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { breakdown, type Metric, type SourceItem } from "@/lib/sources";
import { grams, whole } from "./format";

// "Where did it come from?" — tapping a number or a bar on Today opens a panel
// from the bottom listing the foods it's made of, biggest first: the name, the
// amount, its share of the total and a small bar. The top five, then "Show
// all". In the spend panel, anything taking 5% or more of the spend while low
// in protein is tagged.
//
// <Sources> holds the day's foods and the panel; <SourceTap> is what makes a
// piece of the screen open it.

const TOP = 5;

const METRICS: Record<Metric, { title: string; colour: string }> = {
  calories: { title: "Calories", colour: "bg-nutrition" },
  cost: { title: "Spend", colour: "bg-nutrition" },
  protein: { title: "Protein", colour: "bg-protein" },
  carbs: { title: "Carbs", colour: "bg-carbs" },
  sugars_added: { title: "Added sugar", colour: "bg-added-sugar" },
  fibre: { title: "Fibre", colour: "bg-fibre" },
  fat: { title: "Fat", colour: "bg-fat" },
  saturated_fat: { title: "Saturated fat", colour: "bg-saturated" },
};

function amount(value: number, metric: Metric): string {
  if (metric === "calories") return `${whole(value)} kcal`;
  if (metric === "cost") return `${value.toFixed(2)} lei`;
  return grams(value);
}

function share(value: number): string {
  const rounded = Math.round(value);
  return rounded < 1 ? "<1%" : `${rounded}%`;
}

// What a tap opens: a metric, and — when the thing tapped stands for something
// narrower than the screen it's on, as a bar on the stats chart stands for one
// day — that day's own foods and what to call them.
type Chosen = { metric: Metric; items: SourceItem[]; label: string };

const Open = createContext<(metric: Metric, only?: { items: SourceItem[]; label: string }) => void>(
  () => {},
);

export function Sources({
  items,
  label,
  empty = "Nothing logged for this day yet.",
  children,
}: {
  // Every food on the day — or, in the stats, in the range — with what it added
  // up to.
  items: SourceItem[];
  // What the panel's numbers cover: "Today, 12 Sep", "1–9 Sep · 9 days".
  label: string;
  // What to say when there's no food at all behind the number.
  empty?: string;
  children: ReactNode;
}) {
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [all, setAll] = useState(false);

  useEffect(() => {
    if (!chosen) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setChosen(null);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [chosen]);

  function open(metric: Metric, only?: { items: SourceItem[]; label: string }) {
    setAll(false);
    setChosen({ metric, items: only?.items ?? items, label: only?.label ?? label });
  }

  return (
    <Open.Provider value={open}>
      {children}
      {chosen && (
        <Panel
          metric={chosen.metric}
          items={chosen.items}
          label={chosen.label}
          empty={empty}
          all={all}
          onShowAll={() => setAll(true)}
          onClose={() => setChosen(null)}
        />
      )}
    </Open.Provider>
  );
}

function Panel({
  metric,
  items,
  label,
  empty,
  all,
  onShowAll,
  onClose,
}: {
  metric: Metric;
  items: SourceItem[];
  label: string;
  empty: string;
  all: boolean;
  onShowAll: () => void;
  onClose: () => void;
}) {
  const { title, colour } = METRICS[metric];
  const { total, sources } = breakdown(items, metric);
  const shown = all ? sources : sources.slice(0, TOP);

  return (
    <div className="fixed inset-0 z-40 bg-black/55" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        // Never taller than the screen: once "Show all" is tapped, the list
        // scrolls.
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[90dvh] max-w-md flex-col
                   rounded-t-[18px] bg-surface px-4 pt-2.5
                   pb-[calc(max(1.75rem,env(safe-area-inset-bottom))+0.5rem)]"
      >
        <div className="mx-auto mb-3 h-1 w-[38px] shrink-0 rounded-full bg-border-strong" />
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-0.5 mb-3.5 text-xs text-faint tabular-nums">
          {label}
          {sources.length > 0 && ` · ${amount(total, metric)} total`}
        </p>

        {sources.length === 0 ? (
          <p className="pb-3 text-[13px] text-muted">
            {items.length === 0
              ? empty
              : metric === "cost"
                ? "None of it cost anything."
                : `None of it adds any ${title.toLowerCase()}.`}
          </p>
        ) : (
          <ul className="flex min-h-0 flex-col gap-[11px] overflow-y-auto overscroll-contain">
            {shown.map((source) => (
              <li key={source.key}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="flex min-w-0 items-baseline gap-1.5">
                    <span className="truncate">{source.name}</span>
                    {source.lowProtein && (
                      <span className="shrink-0 rounded-full bg-border-strong px-[7px] py-px text-[10px] text-muted">
                        low protein
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-muted tabular-nums">
                    {amount(source.amount, metric)} · {share(source.share)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10" aria-hidden="true">
                  <div
                    className={`h-1.5 rounded-full ${colour}`}
                    // As the mockup draws it: a food that's half the total
                    // fills the bar.
                    style={{ width: `${Math.min(100, source.share * 2)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {!all && sources.length > TOP && (
          <button type="button" onClick={onShowAll} className="mt-3 py-1 text-center text-[13px] text-muted">
            Show all
          </button>
        )}
      </div>
    </div>
  );
}

// A number or a bar that opens its panel when tapped. A link inside it — "set
// a target" — still goes where it says instead.
//
// `only` narrows what the panel shows: a bar on the stats chart is one day, so
// it passes that day's foods rather than the whole range's.
export function SourceTap({
  metric,
  only,
  label,
  className = "",
  children,
}: {
  metric: Metric;
  only?: SourceItem[];
  // What to call what `only` covers: "Tuesday, 15 Sep".
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  const open = useContext(Open);
  const show = () => open(metric, only && label ? { items: only, label } : undefined);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a")) return;
        show();
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          show();
        }
      }}
      className={`cursor-pointer [-webkit-tap-highlight-color:transparent] active:opacity-70 ${className}`}
    >
      {children}
    </div>
  );
}
