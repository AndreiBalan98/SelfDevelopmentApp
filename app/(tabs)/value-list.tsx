"use client";

import Link from "next/link";
import { useState } from "react";
import { sortByValue, type Sort, type Value } from "@/lib/value";
import { PlusIcon, ToggleLeftIcon, ToggleRightIcon } from "./icons";
import { PILL, PILL_CHOSEN, PILL_OTHER } from "./ui";

// The Products and Recipes lists, which are the same screen with different
// things in it: a retired toggle and "+ New", the search box, the sort pills,
// and a row per item with its two value numbers — lei per 30 g of protein and
// lei per 1,000 kcal (lib/value.ts).
//
// Everything happens on the phone. The screen arrives with every item, retired
// ones included, and searching, sorting and the toggle only change which are
// shown and in what order — nothing reloads, so the page stays where it was.
// None of it survives leaving the screen.

export type ValueRow = {
  id: number;
  name: string;
  retired: boolean;
  href: string;
  // Null for a recipe with no ingredients yet.
  value: Value | null;
};

const SORTS: Array<{ key: Sort; label: string }> = [
  { key: "name", label: "A–Z" },
  { key: "protein", label: "Cheapest protein" },
  { key: "calories", label: "Cheapest calories" },
];

const lei = (value: number) =>
  `${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lei`;

// One of the two numbers, with what it's per; or the label that replaces it
// when the number would be absurd.
type Figure = { amount: number | null; per: string; low: string };

function figures(value: Value, sort: Sort): [Figure, Figure] {
  const protein = { amount: value.perProtein, per: "30 g protein", low: "low protein" };
  const kcal = { amount: value.perKcal, per: "1,000 kcal", low: "low calorie" };
  // The number the list is sorted by is the big one.
  return sort === "calories" ? [kcal, protein] : [protein, kcal];
}

export function ValueList({
  rows,
  noun,
  newHref,
}: {
  rows: ValueRow[];
  // "product" or "recipe", for the words on the screen.
  noun: string;
  newHref: string;
}) {
  const [text, setText] = useState("");
  const [showRetired, setShowRetired] = useState(false);
  const [sort, setSort] = useState<Sort>("name");

  const search = text.trim();
  const term = search.toLowerCase();

  // Retired items stay in the database forever so old meals still add up.
  // They're hidden here by default, and the toggle is how you get at the price
  // history — oats, oats 2, oats 3.
  const shown = sortByValue(
    rows.filter((row) => (showRetired || !row.retired) && row.name.toLowerCase().includes(term)),
    sort,
  );

  const ranked = sort !== "name";

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-[13px]">
          <button
            type="button"
            aria-pressed={showRetired}
            onClick={() => setShowRetired(!showRetired)}
            className={`flex items-center gap-1.5 ${showRetired ? "text-accent" : "text-muted"}`}
          >
            {showRetired ? <ToggleRightIcon size={20} /> : <ToggleLeftIcon size={20} />}
            Show retired
          </button>

          <Link href={newHref} className="flex items-center gap-1 text-accent">
            <PlusIcon size={15} />
            New {noun}
          </Link>
        </div>

        <input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Search"
          aria-label={`Search ${noun}s`}
          autoComplete="off"
          // 16px text, or iOS zooms the page when it's tapped.
          className="rounded-[10px] border border-transparent bg-surface px-3 py-2 text-base
                     outline-none placeholder:text-faint focus:border-accent"
        />

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Sort">
          {SORTS.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={sort === option.key}
              onClick={() => setSort(option.key)}
              className={`${PILL} ${sort === option.key ? PILL_CHOSEN : PILL_OTHER}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted">
          {search ? `Nothing matching “${search}”.` : showRetired ? "Nothing here yet." : `No ${noun}s yet.`}
        </p>
      ) : (
        <ul className="flex flex-col">
          {shown.map((row, index) => {
            const [main, second] = row.value ? figures(row.value, sort) : [null, null];
            // In a value sort, items without the sorted-by number sit at the
            // bottom, unranked and greyed.
            const unranked = ranked && (main === null || main.amount === null);

            return (
              <li key={row.id} className="border-t border-border first:border-t-0">
                <Link href={row.href} className="flex items-center gap-2.5 py-2.5 text-[13px]">
                  {/* Ranked items come first, so a row's place is its rank. */}
                  {ranked && (
                    <span className="w-4 shrink-0 text-xs text-faint tabular-nums">
                      {unranked ? "" : index + 1}
                    </span>
                  )}

                  <span
                    className={`min-w-0 flex-1 break-words ${
                      unranked ? "text-faint" : ""
                    } ${row.retired ? "line-through" : ""}`}
                  >
                    {row.name}
                  </span>

                  <span className="shrink-0 text-right tabular-nums">
                    {main === null || second === null ? (
                      <span className="text-xs text-faint">no ingredients</span>
                    ) : (
                      <>
                        {main.amount === null ? (
                          <span className="inline-block rounded-full bg-border-strong px-[7px] py-px text-[10px] text-muted">
                            {main.low}
                          </span>
                        ) : (
                          <span className="block text-sm font-semibold">
                            {lei(main.amount)}{" "}
                            <span className="text-[10px] font-normal text-faint">/ {main.per}</span>
                          </span>
                        )}
                        <span className="mt-0.5 block text-[11px] text-muted">
                          {second.amount === null ? (
                            <span className="text-faint">{second.low}</span>
                          ) : (
                            `${lei(second.amount)} / ${second.per}`
                          )}
                        </span>
                      </>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
