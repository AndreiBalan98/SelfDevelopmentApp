import Link from "next/link";
import type { ReactNode } from "react";
import { PlusIcon, ToggleLeftIcon } from "./icons";
import { PILL, PILL_CHOSEN, PILL_OTHER } from "./ui";

// Loading skeletons: what a screen shows the instant you tap through to it,
// while the server is still fetching its data.
//
// The layout and the fixed words — the tab's header and sub-tabs, the headings,
// the field labels — are real. Grey blocks stand in for anything that comes from the database. Each
// screen's skeleton sits next to it as loading.tsx and follows its layout, so
// the data lands where the blocks were instead of shoving the page around.
// When a screen is redesigned, its skeleton changes with it.
//
// The screens that change date without being left — the day arrows on meals,
// tapping an older entry on weight, sleep and smoking — show the same
// skeleton while the other date loads. Those pages wrap their contents in a
// Suspense keyed on the date to get that.

// A grey block where data will be. It pulses until the data arrives (see .bone
// in globals.css).
export function Bone({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`bone ${className}`} />;
}

// The frame every screen shares. A tab's main screen puts its real header in
// (TabHeader, or NutritionHeader with its sub-tabs); a screen further in uses
// DetailHeader below.
export function Screen({
  header,
  gap = "gap-6",
  children,
}: {
  header: ReactNode;
  gap?: string;
  children: ReactNode;
}) {
  return (
    <main
      aria-busy="true"
      className={`flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col ${gap}`}
    >
      {header}
      {children}
    </main>
  );
}

// A screen further in: the title on the left, the way back on the right.
// Either is a block when it comes from the database — a product's name, the
// day a meal belongs to.
export function DetailHeader({
  title,
  back,
}: {
  title: string | null;
  back: { href: string; label: string } | null;
}) {
  return (
    <header className="flex min-h-7 items-center justify-between gap-4">
      {title === null ? (
        <Bone className="h-6 w-40" />
      ) : (
        <h1 className="text-lg font-semibold">{title}</h1>
      )}

      {back === null ? (
        <Bone className="h-5 w-16" />
      ) : (
        <Link href={back.href} className="text-sm text-accent">
          {back.label}
        </Link>
      )}
    </header>
  );
}

// A labelled field still waiting for its value.
export function Field({ label, tall = false }: { label: string; tall?: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-sm text-muted">{label}</span>
      <Bone className={tall ? "h-[3.625rem]" : "h-[3.125rem]"} />
    </div>
  );
}

// A list whose rows haven't arrived: a name and a number on each, and a
// second, smaller line where the real rows have one.
export function Rows({ rows, lines = 1 }: { rows: number; lines?: 1 | 2 }) {
  return (
    <div className="rounded-lg border border-border bg-surface divide-y divide-[var(--border)]">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex flex-col gap-2 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <Bone className="h-4 w-2/5" />
            <Bone className="h-4 w-14" />
          </div>
          {lines === 2 && <Bone className="h-3 w-1/4" />}
        </div>
      ))}
    </div>
  );
}

// A row of pills as they'll be: the words are fixed, so they're real.
export function Pills({ labels, chosen }: { labels: string[]; chosen: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <span key={label} className={`${PILL} ${label === chosen ? PILL_CHOSEN : PILL_OTHER}`}>
          {label}
        </span>
      ))}
    </div>
  );
}

// The Products and Recipes lists (value-list.tsx) while they load: the toggle,
// "+ New", the search box and the sort pills as they'll be, then rows with a
// name and the two value numbers.
export function ValueListBones({ noun, rows }: { noun: string; rows: number }) {
  return (
    <>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-[13px]">
          <span className="flex items-center gap-1.5 text-muted">
            <ToggleLeftIcon size={20} />
            Show retired
          </span>
          <span className="flex items-center gap-1 text-accent">
            <PlusIcon size={15} />
            New {noun}
          </span>
        </div>
        <div className="h-[2.625rem] rounded-[10px] bg-surface" />
        <Pills labels={["A–Z", "Cheapest protein", "Cheapest calories"]} chosen="A–Z" />
      </div>

      <div className="flex flex-col">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-3 border-t border-border py-3 first:border-t-0"
          >
            <Bone className="h-4 w-2/5" />
            <div className="flex flex-col items-end gap-1.5">
              <Bone className="h-4 w-24" />
              <Bone className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// A card of labelled rows, each waiting for its box or value on the right —
// the new look's forms and figures (a product, a recipe).
export function CardBones({ labels, box = "w-24" }: { labels: string[]; box?: string }) {
  return (
    <div className="flex flex-col rounded-xl bg-surface px-3.5">
      {labels.map((label) => (
        <div
          key={label}
          className="flex min-h-12 items-center justify-between gap-3 border-t border-border py-1.5 first:border-t-0"
        >
          <span className="text-[13px]">{label}</span>
          <Bone className={`h-8 ${box}`} />
        </div>
      ))}
    </div>
  );
}

// A section heading with its list underneath.
export function Section({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-muted">{heading}</h2>
      {children}
    </section>
  );
}
