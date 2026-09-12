"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Dot, useStatus } from "./status";

// The top of a tab's main screen: its name, on the left. Screens further in
// (one meal, one product) keep their own header with the way back.
export function TabHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="flex min-h-7 items-center justify-between gap-4">
      <h1 className="text-lg font-semibold">{title}</h1>
      {children}
    </header>
  );
}

type SubTab = "today" | "recipes" | "products" | "weight";

const SUB_TABS: Array<{ key: SubTab; label: string; href: string }> = [
  { key: "today", label: "Today", href: "/meals" },
  { key: "recipes", label: "Recipes", href: "/recipes" },
  { key: "products", label: "Products", href: "/products" },
  { key: "weight", label: "Weight", href: "/weight" },
];

// Nutrition's header: the tab's name, then the four sub-tabs as a segmented
// control — a grey track with the one you're on raised above it. Weight gets a
// red dot while today's weigh-in is missing, the same dot that sits on the
// Nutrition icon in the tab bar.
export function NutritionHeader({ active }: { active: SubTab }) {
  const status = useStatus();

  return (
    <div className="flex flex-col gap-3">
      <TabHeader title="Nutrition" />

      <nav aria-label="Nutrition" className="flex rounded-[9px] bg-border p-0.5">
        {SUB_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={tab.key === active ? "page" : undefined}
            className={`relative flex-1 rounded-[7px] py-1.5 text-center text-xs ${
              tab.key === active ? "bg-segment font-medium text-foreground" : "text-muted"
            }`}
          >
            {tab.label}
            {tab.key === "weight" && status?.weightMissing && (
              <Dot className="top-[3px] right-[5px] size-1.5" />
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
