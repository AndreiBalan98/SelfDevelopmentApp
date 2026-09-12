"use client";

import { useActionState, useState } from "react";
import { dayFor, dayLabel, localTimestamp, weekdayName } from "@/lib/day";
import { updateMeal, type Result } from "../actions";

const FIELD =
  "rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-accent";

type Props = {
  id: number;
  date: string;
  time: string;
  day: string;
  type: "meal" | "snack";
  note: string | null;
  score: number | null;
};

export function MealDetailsForm({ id, date, time, day, type, note, score }: Props) {
  const [result, action, pending] = useActionState<Result | null, FormData>(updateMeal, null);

  const [when, setWhen] = useState({ date, time });
  const [countsTowards, setCountsTowards] = useState(day);
  const [mealType, setMealType] = useState(type);
  const [chosenScore, setChosenScore] = useState<number | null>(score);

  // What the 04:00 rule makes of the date and time as they currently stand.
  // Recomputed as you type, which is the only thing that makes a 02:20 snack
  // landing on the previous day visible rather than surprising.
  let byTheRule: string | null = null;
  try {
    byTheRule = dayFor(new Date(localTimestamp(when.date, when.time)));
  } catch {
    byTheRule = null;
  }

  const disagrees = byTheRule !== null && byTheRule !== countsTowards;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="type" value={mealType} />
      <input type="hidden" name="score" value={chosenScore ?? ""} />

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm text-muted">Date</span>
          <input
            name="date"
            type="date"
            value={when.date}
            onChange={(event) => setWhen({ ...when, date: event.target.value })}
            required
            className={`${FIELD} tabular-nums`}
          />
        </label>

        <label className="flex w-32 flex-col gap-1.5">
          <span className="text-sm text-muted">Time</span>
          <input
            name="time"
            type="time"
            value={when.time}
            onChange={(event) => setWhen({ ...when, time: event.target.value })}
            required
            className={`${FIELD} tabular-nums`}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">
          Counts towards{" "}
          {countsTowards && (
            <span className="text-foreground">{weekdayName(countsTowards)}</span>
          )}
        </span>
        <input
          name="day"
          type="date"
          value={countsTowards}
          onChange={(event) => setCountsTowards(event.target.value)}
          required
          className={`${FIELD} tabular-nums`}
        />
      </label>

      {disagrees && byTheRule && (
        <div className="-mt-2 flex items-baseline justify-between gap-3 text-xs text-muted">
          <span>
            Anything before 04:00 counts towards the day before. By that rule this one
            belongs to {dayLabel(byTheRule)}.
          </span>
          <button
            type="button"
            onClick={() => setCountsTowards(byTheRule)}
            className="shrink-0 text-accent"
          >
            Use it
          </button>
        </div>
      )}

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm text-muted">Meal or snack</legend>
        <div className="flex gap-2">
          {(["meal", "snack"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMealType(option)}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-center capitalize ${
                mealType === option ? "border-accent text-accent" : "border-border text-muted"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Note (optional)</span>
        <input
          name="note"
          type="text"
          defaultValue={note ?? ""}
          autoComplete="off"
          className={FIELD}
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">
          Score (optional){chosenScore !== null && <span> · {chosenScore}</span>}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => (
            <button
              key={number}
              type="button"
              aria-label={`Score ${number}`}
              onClick={() => setChosenScore(chosenScore === number ? null : number)}
              className={`flex-1 rounded-md border py-2 text-xs tabular-nums ${
                chosenScore === number
                  ? "border-accent text-accent"
                  : "border-border text-muted"
              }`}
            >
              {number}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm disabled:opacity-50"
        >
          {pending ? "…" : "Save"}
        </button>

        {result && (
          <span className={`text-sm ${result.ok ? "text-muted" : "text-foreground"}`}>
            {result.message}
          </span>
        )}
      </div>
    </form>
  );
}
