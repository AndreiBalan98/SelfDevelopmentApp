import Link from "next/link";
import type { ReactNode } from "react";

// Loading skeletons: what a screen shows the instant you tap through to it,
// while the server is still fetching its data.
//
// The layout and the fixed words — the title, the headings, the field labels —
// are real. Grey blocks stand in for anything that comes from the database. Each
// screen's skeleton sits next to it as loading.tsx and follows its layout, so
// the data lands where the blocks were instead of shoving the page around.
// When a screen is redesigned, its skeleton changes with it.
//
// The screens that change date without being left — the day arrows on meals,
// tapping an older entry on weight, sleep and cigarettes — show the same
// skeleton while the other date loads. Those pages wrap their contents in a
// Suspense keyed on the date to get that.

// A grey block where data will be. It pulses until the data arrives (see .bone
// in globals.css).
export function Bone({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`bone ${className}`} />;
}

// The frame every screen shares: the title on the left, the way back on the
// right. Either is a block when it comes from the database — a product's name,
// the day a meal belongs to.
export function Screen({
  title,
  back,
  gap = "gap-6",
  children,
}: {
  title: string | null;
  back: { href: string; label: string } | null;
  gap?: string;
  children: ReactNode;
}) {
  return (
    <main
      aria-busy="true"
      className={`flex-1 px-5 py-8 mx-auto w-full max-w-md flex flex-col ${gap}`}
    >
      <header className="flex items-baseline justify-between gap-4">
        {title === null ? (
          <Bone className="h-7 w-40" />
        ) : (
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        )}

        {back === null ? (
          <Bone className="h-5 w-16" />
        ) : (
          <Link href={back.href} className="text-sm text-accent">
            {back.label}
          </Link>
        )}
      </header>

      {children}
    </main>
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
