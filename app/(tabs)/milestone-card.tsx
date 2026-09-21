import { db } from "@/lib/supabase";
import { allRows } from "@/lib/pages";
import {
  sleepMilestone,
  smokingMilestone,
  weightMilestone,
  type Milestone,
} from "@/lib/milestones";

// The milestone card: one line, in the tab's own colour, when something worth
// noticing has happened in the last week.
//
// Deliberately plain — no badge, no icon, no number going up. The plan rules
// those out, and the point is that the sentence itself is the reward. It
// appears and disappears on its own, and nothing else on the screen moves when
// it does.
export function MilestoneCard({ milestone }: { milestone: Milestone | null }) {
  if (milestone === null) return null;

  return (
    <p className="rounded-xl bg-surface px-3.5 py-2.5 text-[13px] text-accent-pale tabular-nums">
      {milestone.text}
    </p>
  );
}

// Each tab's own milestone, read and worked out on its own so the chart beside
// it never waits for it. A question the database can't answer simply shows no
// card — the same rule the red dots follow, since a milestone that isn't true
// is worse than none.
//
// These read the whole of their table (lib/pages.ts, a page at a time): the
// records they compare against go back as far as the logging does.

export async function WeightMilestone({ today }: { today: string }) {
  const { data } = await allRows((from, to) =>
    db()
      .from("weight")
      .select("date, kg")
      .order("date", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to),
  );

  return (
    <MilestoneCard
      milestone={weightMilestone(
        (data ?? []).map((row) => ({ date: row.date, value: row.kg })),
        today,
      )}
    />
  );
}

export async function SmokingMilestone({ today }: { today: string }) {
  const { data } = await allRows((from, to) =>
    db()
      .from("smoking")
      .select("date, count")
      .order("date", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to),
  );

  return (
    <MilestoneCard
      milestone={smokingMilestone(
        (data ?? []).map((row) => ({ date: row.date, value: row.count })),
        today,
      )}
    />
  );
}

export async function SleepMilestone({ today }: { today: string }) {
  const { data } = await allRows((from, to) =>
    db()
      .from("sleep")
      .select("date, bedtime, wake_time, quality")
      .order("date", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to),
  );

  return <MilestoneCard milestone={sleepMilestone(data ?? [], today)} />;
}
