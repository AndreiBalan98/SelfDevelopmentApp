"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BackupLevel, BackupStatus } from "@/lib/backup";
import { DownloadIcon } from "../icons";

// Getting the file off the phone.
//
// On iOS the reliable route is the share sheet: one tap to Save to Files, AirDrop
// it to the laptop, or mail it to yourself. Plain downloads inside a home-screen
// app are unpredictable — sometimes a preview, sometimes nothing visible at all —
// which is the wrong behaviour for the one feature whose whole job is making sure
// the file really got saved.
//
// Anywhere without a share sheet (a desktop browser) it falls back to a download.

function filenameFrom(header: string | null): string {
  const match = header ? /filename="([^"]+)"/.exec(header) : null;
  return match ? match[1] : "life-tracker.json";
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Quiet under a week, amber at a week, red at a fortnight or if there has
// never been an export.
const LEVEL_COLOUR: Record<BackupLevel, string> = {
  unknown: "text-muted",
  never: "text-danger",
  ok: "text-muted",
  warn: "text-warn",
  late: "text-danger",
};

export function ExportButton({ lastExport }: { lastExport: BackupStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setStatus(null);

    try {
      const response = await fetch("/api/export", { cache: "no-store" });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setStatus(body?.error ?? `The export failed (${response.status}).`);
        return;
      }

      // If the three-month session has run out, the gate answers with the login
      // page instead. Without this check that page would be saved as your
      // backup, named .json and looking perfectly fine.
      if (!(response.headers.get("content-type") ?? "").includes("application/json")) {
        setStatus(
          "Your session has expired. Close and reopen the app, enter your PIN, then try again.",
        );
        return;
      }

      const name = filenameFrom(response.headers.get("content-disposition"));
      const blob = await response.blob();
      const file = new File([blob], name, { type: "application/json" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          setStatus("Sent to the share sheet. Save it somewhere it will survive.");
        } catch (error) {
          // Tapping Cancel throws too, and that isn't a failure.
          if (error instanceof Error && error.name === "AbortError") {
            setStatus("Cancelled — nothing was saved.");
            return;
          }
          download(blob, name);
          setStatus(`Sharing didn't work, so it downloaded instead: ${name}`);
        }
      } else {
        download(blob, name);
        setStatus(`Downloaded ${name}`);
      }
    } catch (error) {
      setStatus(
        `The export failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setBusy(false);
      // Brings the "Last export" line, and the dot on the Settings tab, up to
      // date without reloading the app.
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3.5 py-3.5
                   text-left text-sm disabled:opacity-50"
      >
        <span className="flex items-center gap-2">
          <DownloadIcon size={18} />
          {busy ? "Exporting…" : "Export everything"}
        </span>
        <span className={`text-xs ${LEVEL_COLOUR[lastExport.level]}`}>{lastExport.label}</span>
      </button>

      {status && (
        <p
          className="rounded-lg border border-border bg-surface p-3 text-sm"
          aria-live="polite"
        >
          {status}
        </p>
      )}
    </div>
  );
}
