"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { getServerRecent, loadRecent, subscribeRecent } from "@/lib/recent";

export function RecentGroups() {
  const items = useSyncExternalStore(
    subscribeRecent,
    loadRecent,
    getServerRecent,
  );
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm text-ink/60">گروه‌های این مرورگر</h2>
      <ul className="flex flex-col gap-2">
        {items.map((g) => (
          <li key={g.token}>
            <Link
              href={`/g/${g.token}`}
              className="flex items-center justify-between border border-rule bg-paper-2 px-3 py-2 hover:border-ink"
            >
              <span>{g.title}</span>
              <span className="text-xs text-ink/50">باز کن</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
