"use client";

import { useState } from "react";
import { dayFor, dayLabel, localTimestamp, weekdayName } from "@/lib/day";
import { updateMeal, type Result } from "../actions";
import { useFormAction } from "../../form-action";
import { BOX, CARD, PRIMARY, ROW, SEGMENT, SEGMENT_CHOSEN, SEGMENTS } from "../../ui";

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
  // Sent by hand, so a refused save keeps everything you typed (form-action.ts).
  const [result, submit, pending] = useFormAction<Result>(updateMeal);

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
    <form onSubmit={submit} className="flex flex-col gap-4">
      {/* The type and the score are buttons, so they travel in hidden fields. */}
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="type" value={mealType} />
      <input type="hidden" name="score" value={chosenScore ?? ""} />

      <div className={CARD}>
        <div className={ROW}>
          <label htmlFor="meal-date" className="text-[13px]">
            Date
          </label>
          <input
            id="meal-date"
            name="date"
            type="date"
            value={when.date}
            onChange={(event) => setWhen({ ...when, date: event.target.value })}
            required
            className={`${BOX} min-h-8 w-36 [&::-webkit-date-and-time-value]:text-right`}
          />
        </div>

        <div className={ROW}>
          <label htmlFor="meal-time" className="text-[13px]">
            Time
          </label>
          <input
            id="meal-time"
            name="time"
            type="time"
            value={when.time}
            onChange={(event) => setWhen({ ...when, time: event.target.value })}
            required
            // Wide enough for a phone set to 12-hour time ("02:20 AM").
            className={`${BOX} min-h-8 w-32 [&::-webkit-date-and-time-value]:text-right`}
          />
        </div>

        <div className={ROW}>
          <label htmlFor="meal-day" className="text-[13px]">
            Counts towards
            {countsTowards && (
              <span className="text-faint"> · {weekdayName(countsTowards)}</span>
            )}
          </label>
          <input
            id="meal-day"
            name="day"
            type="date"
            value={countsTowards}
            onChange={(event) => setCountsTowards(event.target.value)}
            required
            className={`${BOX} min-h-8 w-36 [&::-webkit-date-and-time-value]:text-right`}
          />
        </div>

        {disagrees && byTheRule && (
          <div className="-mt-0.5 flex items-baseline justify-between gap-3 pb-2.5 text-[11px] text-faint">
            <span>
              Anything before 04:00 counts towards the day before. By that rule this one
              belongs to {dayLabel(byTheRule)}.
            </span>
            <button
              type="button"
              onClick={() => setCountsTowards(byTheRule)}
              className="shrink-0 text-xs text-accent"
            >
              Use it
            </button>
          </div>
        )}

        <div className={ROW}>
          <span className="whitespace-nowrap text-[13px]">Meal or snack</span>
          <div className={`${SEGMENTS} w-36`}>
            {(["meal", "snack"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mealType === option}
                onClick={() => setMealType(option)}
                className={`${SEGMENT} ${
                  mealType === option
                    ? `${SEGMENT_CHOSEN} ${option === "snack" ? "text-snack-label" : "text-meal-label"}`
                    : "text-muted"
                }`}
              >
                {option === "snack" ? "Snack" : "Meal"}
              </button>
            ))}
          </div>
        </div>

        <div className={ROW}>
          <label htmlFor="meal-note" className="text-[13px]">
            Note
          </label>
          <input
            id="meal-note"
            name="note"
            type="text"
            defaultValue={note ?? ""}
            placeholder="optional"
            autoComplete="off"
            className={`${BOX} min-w-0 flex-1 text-left placeholder:text-faint`}
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-border py-2.5">
          <span className="text-[13px]">
            Score
            <span className="text-faint">
              {chosenScore !== null ? ` · ${chosenScore}` : " · optional"}
            </span>
          </span>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => (
              <button
                key={number}
                type="button"
                aria-label={`Score ${number}`}
                aria-pressed={chosenScore === number}
                onClick={() => setChosenScore(chosenScore === number ? null : number)}
                className={`flex-1 rounded-md py-1.5 text-xs tabular-nums ${
                  chosenScore === number
                    ? "bg-accent font-semibold text-black"
                    : "bg-background text-muted"
                }`}
              >
                {number}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={PRIMARY}>
          {pending ? "Saving…" : "Save"}
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
