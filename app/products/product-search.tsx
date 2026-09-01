"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// The search box and the retired toggle. Both just rewrite the URL, so the
// server does the filtering and the result survives a reload.
export function ProductSearch({
  search,
  showRetired,
}: {
  search: string;
  showRetired: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState(search);

  // Waits until you stop typing before reloading the list, so a five-letter
  // search isn't five trips to the database.
  useEffect(() => {
    if (text === search) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (text.trim()) params.set("q", text.trim());
      if (showRetired) params.set("retired", "1");
      const query = params.toString();
      router.replace(query ? `/products?${query}` : "/products");
    }, 250);

    return () => clearTimeout(timer);
  }, [text, search, showRetired, router]);

  function toggleRetired() {
    const params = new URLSearchParams();
    if (text.trim()) params.set("q", text.trim());
    if (!showRetired) params.set("retired", "1");
    const query = params.toString();
    router.replace(query ? `/products?${query}` : "/products");
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Search"
        aria-label="Search products"
        autoComplete="off"
        className="rounded-lg border border-border bg-surface px-4 py-2.5 text-base
                   outline-none focus:border-accent"
      />

      <button
        type="button"
        onClick={toggleRetired}
        className={`self-start text-xs ${showRetired ? "text-accent" : "text-muted"}`}
      >
        {showRetired ? "Hide retired products" : "Show retired products"}
      </button>
    </div>
  );
}
