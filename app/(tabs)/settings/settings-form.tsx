"use client";

import { startTransition, useActionState, useState, type ReactNode } from "react";
import {
  ACTIVITY_LEVELS,
  GOAL_PHASES,
  SEXES,
  type SettingsText,
} from "@/lib/settings-fields";
import { ChevronRightIcon } from "../icons";
import { saveSettings, type Result } from "./actions";

const INPUT =
  "rounded-md border border-border bg-background px-2 py-1 text-right text-base tabular-nums " +
  "outline-none focus:border-accent";

// A heading above a card, small and quiet, as the mockups draw it.
function Heading({ children }: { children: ReactNode }) {
  return <h2 className="text-xs text-faint">{children}</h2>;
}

// One line of a card: what it is on the left, the box to change it on the
// right. Tapping the words focuses the box.
function Row({ id, label, children }: { id: string; label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border-t border-border py-1.5 first:border-t-0">
      <label htmlFor={id} className="min-w-0 flex-1 text-[13px]">
        {label}
      </label>
      <span className="flex shrink-0 items-center gap-1.5">{children}</span>
    </div>
  );
}

// What kind of target a line is, after its name: "· ceiling" or "· ±10%".
function Kind({ children }: { children: ReactNode }) {
  return <span className="text-[11px] text-faint"> · {children}</span>;
}

// The unit after a box, in a fixed width so every box on a card lines up.
function Unit({ children }: { children?: ReactNode }) {
  return <span className="w-7 text-xs text-faint">{children}</span>;
}

export function SettingsForm({ initial }: { initial: SettingsText }) {
  // Every box is held here rather than left to the page, so a refused save
  // keeps everything you typed and only the message changes.
  const [values, setValues] = useState(initial);
  const set = (name: keyof SettingsText, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));

  const [result, action, pending] = useActionState<Result | null, FormData>(
    async (previous, form) => {
      const outcome = await saveSettings(previous, form);
      // Shows what was actually stored: rounded, and with any comma read as a
      // decimal point.
      if (outcome.ok) setValues(outcome.saved);
      return outcome;
    },
    null,
  );

  const number = (
    name: keyof SettingsText,
    width = "w-20",
    inputMode: "decimal" | "numeric" = "decimal",
  ) => (
    <input
      id={name}
      name={name}
      type="text"
      inputMode={inputMode}
      autoComplete="off"
      value={values[name]}
      onChange={(event) => set(name, event.target.value)}
      className={`${INPUT} ${width}`}
    />
  );

  const choice = (
    name: "sex" | "activity_level",
    options: Array<{ value: string; label: string }>,
  ) => (
    <span className="relative flex items-center text-muted">
      <select
        id={name}
        name={name}
        value={values[name]}
        onChange={(event) => set(name, event.target.value)}
        className="appearance-none bg-transparent py-1 pr-5 text-right text-base outline-none
                   [text-align-last:right]"
      >
        <option value="">Not set</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-0 text-faint">
        <ChevronRightIcon size={14} />
      </span>
    </span>
  );

  // Calories change kind with the goal: a ceiling on a cut, a zone otherwise.
  // Until a goal is picked, the line doesn't say.
  const calorieKind =
    values.goal_phase === "cut" ? "ceiling" : values.goal_phase ? "±10%" : null;

  return (
    <form
      // Sent by hand rather than through the form's `action`: that route has
      // React put every box back to how the screen opened after each save, and
      // for the goal and the two dropdowns it does so without redrawing them —
      // so the screen went on showing your choice while the next Save quietly
      // sent the old one. Found by testing.
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(() => action(form));
      }}
      className="flex flex-col gap-5"
    >
      <section className="flex flex-col gap-1.5">
        <Heading>Goal</Heading>
        <div className="rounded-xl bg-surface px-3.5 pt-2.5">
          <div className="flex rounded-[9px] bg-border p-0.5">
            {GOAL_PHASES.map((phase) => {
              const chosen = values.goal_phase === phase.value;
              return (
                <label
                  key={phase.value}
                  className={`flex-1 rounded-[7px] py-1.5 text-center text-xs has-[:focus-visible]:outline ${
                    chosen ? "bg-segment font-medium text-foreground" : "text-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="goal_phase"
                    value={phase.value}
                    checked={chosen}
                    onChange={() => set("goal_phase", phase.value)}
                    className="sr-only"
                  />
                  {phase.label}
                </label>
              );
            })}
          </div>
          <p className="mt-1.5 mb-1 text-[11px] text-faint">
            On a cut, calories are a ceiling. On maintain or bulk, a ±10% zone.
          </p>
          <Row id="goal_weight" label="Goal weight">
            {number("goal_weight")}
            <Unit>kg</Unit>
          </Row>
        </div>
      </section>

      <section className="flex flex-col gap-1.5">
        <Heading>Daily targets</Heading>
        <div className="flex flex-col rounded-xl bg-surface px-3.5">
          <Row
            id="calorie_target"
            label={<>Calories{calorieKind && <Kind>{calorieKind}</Kind>}</>}
          >
            {number("calorie_target", "w-20", "numeric")}
            <Unit>kcal</Unit>
          </Row>
          <Row id="daily_budget" label={<>Daily spend<Kind>ceiling</Kind></>}>
            {number("daily_budget")}
            <Unit>lei</Unit>
          </Row>
          <Row id="protein_target" label={<><span className="text-protein">Protein</span><Kind>±10%</Kind></>}>
            {number("protein_target")}
            <Unit>g</Unit>
          </Row>
          <Row id="carbs_target" label={<><span className="text-carbs">Carbs</span><Kind>±10%</Kind></>}>
            {number("carbs_target")}
            <Unit>g</Unit>
          </Row>
          <Row id="added_sugar_max" label={<><span className="text-added-sugar">Added sugar</span><Kind>ceiling</Kind></>}>
            {number("added_sugar_max")}
            <Unit>g</Unit>
          </Row>
          <Row id="fibre_target" label={<><span className="text-fibre">Fibre</span><Kind>±10%</Kind></>}>
            {number("fibre_target")}
            <Unit>g</Unit>
          </Row>
          <Row id="fat_target" label={<><span className="text-fat">Fat</span><Kind>±10%</Kind></>}>
            {number("fat_target")}
            <Unit>g</Unit>
          </Row>
          <Row id="unsat_per_sat" label={<span className="text-fat">Saturated : unsaturated</span>}>
            <span className="text-base text-muted">1 :</span>
            {number("unsat_per_sat", "w-14")}
            <Unit />
          </Row>
        </div>
      </section>

      <section className="flex flex-col gap-1.5">
        <Heading>Body, for the formula estimate</Heading>
        <div className="flex flex-col rounded-xl bg-surface px-3.5">
          <Row id="height_cm" label="Height">
            {number("height_cm")}
            <Unit>cm</Unit>
          </Row>
          <Row id="birth_year" label="Birth year">
            {number("birth_year", "w-20", "numeric")}
            <Unit />
          </Row>
          <Row id="sex" label="Sex">
            {choice("sex", SEXES)}
          </Row>
          <Row id="activity_level" label="Activity level">
            {choice("activity_level", ACTIVITY_LEVELS)}
          </Row>
        </div>
      </section>

      <section className="flex flex-col gap-1.5">
        <Heading>Workout</Heading>
        <div className="flex flex-col rounded-xl bg-surface px-3.5">
          <Row id="gym_start_date" label="Gym start date">
            {values.gym_start_date && (
              <button
                type="button"
                onClick={() => set("gym_start_date", "")}
                className="px-1 text-xs text-faint"
              >
                Clear
              </button>
            )}
            <input
              id="gym_start_date"
              name="gym_start_date"
              type="date"
              value={values.gym_start_date}
              onChange={(event) => set("gym_start_date", event.target.value)}
              // A fixed width: left to itself the box sizes to the browser's own
              // date picker, which can push the label onto two lines.
              className={`${INPUT} min-h-8 w-36 [&::-webkit-date-and-time-value]:text-right`}
            />
          </Row>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-3 font-medium text-black disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>

        {result && (
          <span
            className={`text-sm ${result.ok ? "text-muted" : "text-foreground"}`}
            aria-live="polite"
          >
            {result.message}
          </span>
        )}
      </div>
    </form>
  );
}
