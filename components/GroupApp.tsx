"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Chat } from "./Chat";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";
import { SettlementSlips, settlementText } from "./SettlementSlips";
import { rememberGroup, speakerKey } from "@/lib/recent";
import type { GroupSnapshot } from "@/lib/group";

function readSpeaker(token: string) {
  return () => localStorage.getItem(speakerKey(token)) ?? "";
}

export function GroupApp({ initial }: { initial: GroupSnapshot }) {
  const group = initial;
  const router = useRouter();
  const storedSpeaker = useSyncExternalStore(
    () => () => {},
    readSpeaker(group.token),
    () => "",
  );
  const [speakerOverride, setSpeakerOverride] = useState<string | null>(null);
  const speaker = speakerOverride ?? storedSpeaker;
  const [copied, setCopied] = useState<"link" | "settle" | null>(null);
  const [, start] = useTransition();

  useEffect(() => {
    rememberGroup(group.token, group.title);
  }, [group.token, group.title]);

  function refresh() {
    start(() => router.refresh());
  }

  async function copy(kind: "link" | "settle") {
    const text =
      kind === "link"
        ? window.location.href
        : settlementText(group);
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col lg:max-w-5xl">
      <header className="sticky top-0 z-10 border-b-2 border-ink bg-paper/95 px-4 pb-3 pt-3 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href="/" className="inline-flex min-h-6 items-center text-sm text-stamp">
              دنگتو
            </Link>
            <h1 className="mt-1 text-3xl font-black leading-none">
              {group.title}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => void copy("link")}
            className="inline-flex min-h-11 shrink-0 items-center border border-ink px-3 text-sm"
          >
            {copied === "link" ? "کپی شد" : "بفرست لینک"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="ml-1 text-xs text-ink/60">تو کدومی؟</span>
          {group.members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                localStorage.setItem(speakerKey(group.token), m.name);
                setSpeakerOverride(m.name);
              }}
              className={`inline-flex min-h-11 items-center px-3 text-sm ${
                speaker === m.name
                  ? "bg-ink text-paper"
                  : "border border-rule hover:border-ink"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 py-5 pb-28 lg:grid lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-10 lg:py-8">
        <aside className="order-first lg:sticky lg:top-36 lg:order-none lg:col-start-2 lg:row-start-1">
          {group.expenses.length === 0 ? (
            <div className="border-2 border-dashed border-rule px-4 py-5">
              <p className="font-bold">هنوز خرجی ثبت نشده</p>
              <p className="mt-2 text-sm leading-7 text-ink/70">
                پایین صفحه بنویس کی چی داد، مثلا:
              </p>
              <p className="mt-2 bg-paper-2 px-3 py-2 text-sm leading-7">
                بنزین ۸۰۰ هزار رو سارا داد، بین همه
              </p>
              <p className="mt-3 text-xs text-ink/60">
                رسید تسویه همین‌جا ساخته می‌شه.
              </p>
            </div>
          ) : (
            <SettlementSlips
              group={group}
              onCopy={() => void copy("settle")}
              copied={copied === "settle"}
            />
          )}
        </aside>
        <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
          <ExpenseList group={group} onChanged={refresh} />
          <Chat group={group} speaker={speaker || undefined} onChanged={refresh} />
          <ExpenseForm group={group} onChanged={refresh} />
        </div>
      </div>
    </div>
  );
}
