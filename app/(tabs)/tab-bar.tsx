"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BarbellIcon, MoonIcon, SaladIcon, SettingsIcon, SmokingIcon } from "./icons";
import { Dot, useStatus } from "./status";

type Tab = {
  key: "sleep" | "smoking" | "nutrition" | "workout" | "settings";
  label: string;
  href: string;
  icon: ReactNode;
  // Tailwind can only see class names written out in full, so each tab's
  // colour is spelled out here rather than built from its key.
  activeColour: string;
};

// Left to right, as the plan orders them.
const TABS: Tab[] = [
  { key: "sleep", label: "Sleep", href: "/sleep", icon: <MoonIcon size={26} />, activeColour: "text-sleep" },
  { key: "smoking", label: "Smoking", href: "/smoking", icon: <SmokingIcon size={26} />, activeColour: "text-smoking" },
  { key: "nutrition", label: "Nutrition", href: "/meals", icon: <SaladIcon size={26} />, activeColour: "text-nutrition" },
  { key: "workout", label: "Workout", href: "/workout", icon: <BarbellIcon size={26} />, activeColour: "text-workout" },
  { key: "settings", label: "Settings", href: "/settings", icon: <SettingsIcon size={26} />, activeColour: "text-settings" },
];

// Which tab a screen belongs to. Everything that isn't Sleep, Smoking, Workout
// or Settings is part of Nutrition: Today, Recipes, Products, Weight, and the
// screens behind them.
function activeTab(pathname: string): Tab["key"] {
  if (pathname.startsWith("/sleep")) return "sleep";
  if (pathname.startsWith("/smoking")) return "smoking";
  if (pathname.startsWith("/workout")) return "workout";
  if (pathname.startsWith("/settings")) return "settings";
  return "nutrition";
}

// The bar along the bottom of every screen: icons only, no labels. The one
// you're in is in its tab's colour, the rest muted. A red dot means a log is
// missing; on Settings it means the backup is getting old (amber) or overdue
// (red).
export function TabBar() {
  const pathname = usePathname();
  const status = useStatus();
  const active = activeTab(pathname);

  const dot: Record<Tab["key"], "danger" | "warn" | null> = {
    sleep: status?.sleepMissing ? "danger" : null,
    smoking: status?.smokingMissing ? "danger" : null,
    nutrition: status?.weightMissing ? "danger" : null,
    // The placeholder has nothing to log, so nothing to miss.
    workout: null,
    settings:
      status?.backup === "late" || status?.backup === "never"
        ? "danger"
        : status?.backup === "warn"
          ? "warn"
          : null,
  };

  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background
                 pt-3 pb-[max(1.75rem,env(safe-area-inset-bottom))]"
    >
      <ul className="mx-auto flex max-w-md justify-around">
        {TABS.map((tab) => {
          const tone = dot[tab.key];

          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-label={tone ? `${tab.label} — needs attention` : tab.label}
                aria-current={tab.key === active ? "page" : undefined}
                className={`relative flex ${tab.key === active ? tab.activeColour : "text-faint"}`}
              >
                {tab.icon}
                {tone && <Dot tone={tone} className="-top-px -right-1.5 size-2" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
