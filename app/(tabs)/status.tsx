"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Status } from "@/lib/status";

// Hands the red-dot status (lib/status.ts), read once by the tab layout, to
// everything that shows a dot: the tab bar, and the Weight sub-tab. Shared
// rather than read again by each, so they can never disagree.

const StatusContext = createContext<Status | null>(null);

export function StatusProvider({ status, children }: { status: Status; children: ReactNode }) {
  return <StatusContext.Provider value={status}>{children}</StatusContext.Provider>;
}

// Null only outside the tabs, where there are no dots to draw.
export function useStatus(): Status | null {
  return useContext(StatusContext);
}

// The dot itself: red for a missing log or a backup 14+ days old, amber for a
// backup that's getting old.
export function Dot({ tone = "danger", className }: { tone?: "danger" | "warn"; className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute rounded-full ${tone === "warn" ? "bg-warn" : "bg-danger"} ${className}`}
    />
  );
}
