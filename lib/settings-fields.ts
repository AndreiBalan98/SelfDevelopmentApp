// The Settings tab's fields: the fixed choices, and turning the stored values
// into the text the form's boxes show. Kept apart from lib/settings.ts, which
// talks to the database, because the form on the phone needs these too and
// must never load anything that does.

import type { ActivityLevel, Database, GoalPhase, Sex } from "@/lib/types";

export const GOAL_PHASES: Array<{ value: GoalPhase; label: string }> = [
  { value: "cut", label: "Cut" },
  { value: "maintain", label: "Maintain" },
  { value: "bulk", label: "Bulk" },
];

export const SEXES: Array<{ value: Sex; label: string }> = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export const ACTIVITY_LEVELS: Array<{ value: ActivityLevel; label: string }> = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "very_active", label: "Very active" },
];

// Everything the Settings tab edits: the whole row except its id, the hidden
// 04:00 boundary, and the two timestamps.
export type SettingsValues = Omit<
  Database["public"]["Tables"]["settings"]["Row"],
  "id" | "day_boundary_hour" | "created_at" | "last_export_at"
>;

// The same fields as the text the form's boxes show: empty for "not set".
export type SettingsText = Record<keyof SettingsValues, string>;

export function settingsAsText(values: SettingsValues): SettingsText {
  const entries = Object.entries(values).map(([key, value]) => [
    key,
    value === null ? "" : String(value),
  ]);
  return Object.fromEntries(entries) as SettingsText;
}
