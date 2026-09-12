"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// iOS often keeps a home-screen app in memory while you're elsewhere, and
// hands it back exactly as you left it — last night's screen, yesterday's
// idea of what "today" is, and red dots that were right at the time. So
// whenever the app comes back to the front, the current screen is redrawn
// from the server. Nothing typed is lost: a redraw keeps what's in the fields.
export function RefreshOnReturn() {
  const router = useRouter();

  useEffect(() => {
    function onChange() {
      if (document.visibilityState === "visible") router.refresh();
    }

    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, [router]);

  return null;
}
