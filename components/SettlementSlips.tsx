"use client";

import { formatToman } from "@/lib/money";
import type { GroupSnapshot } from "@/lib/group";

export function settlementText(group: GroupSnapshot): string {
  const name = (id: string) =>
    group.members.find((m) => m.id === id)?.name ?? id;
  const lines = [
    `دنگتو — ${group.title}`,
    "",
    ...group.transfers.map(
      (t) =>
        `${name(t.fromId)} ← ${name(t.toId)}    ${formatToman(t.amount)} تومان`,
    ),
  ];
  if (group.transfers.length === 0) lines.push("حساب‌ها صاف است.");
  return lines.join("\n");
}

export function SettlementSlips({
  group,
  onCopy,
  copied,
}: {
  group: GroupSnapshot;
  onCopy?: () => void;
  copied?: boolean;
}) {
  const name = (id: string) =>
    group.members.find((m) => m.id === id)?.name ?? id;

  if (group.expenses.length === 0) return null;

  if (group.transfers.length === 0) {
    return (
      <article className="slip px-4 py-4">
        <p className="font-bold text-pistachio">حساب‌ها صاف است.</p>
      </article>
    );
  }

  const payees = [...new Set(group.transfers.map((t) => t.toId))];
  const onePayee = payees.length === 1;
  const payeeName = onePayee ? name(payees[0]) : null;

  return (
    <article className="slip overflow-hidden">
      <div className="slip-perforation" />
      <header className="flex items-start justify-between gap-3 px-4 pt-3 pb-2">
        <div>
          <p className="text-xs text-ink/70">رسید تسویه</p>
          <h2 className="mt-1 text-xl font-black leading-tight">
            {onePayee ? `بریزین به ${payeeName}` : "کی به کی بده"}
          </h2>
        </div>
        <span className="stamp-mark mt-1 shrink-0 text-sm">دنگتو</span>
      </header>
      <ul className="border-t border-dashed border-ink/30">
        {group.transfers.map((t) => (
          <li
            key={`${t.fromId}-${t.toId}`}
            className="flex items-baseline justify-between gap-3 px-4 py-2.5"
          >
            <span className="font-bold">
              {onePayee ? (
                name(t.fromId)
              ) : (
                <>
                  {name(t.fromId)}
                  <span className="mx-1.5 text-stamp">←</span>
                  {name(t.toId)}
                </>
              )}
            </span>
            <span className="tabular text-lg font-black text-stamp">
              {formatToman(t.amount)}
              <span className="mr-1 text-xs font-bold text-ink/70">ت</span>
            </span>
          </li>
        ))}
      </ul>
      <footer className="flex items-center justify-between gap-2 border-t border-ink/20 px-2 py-1 text-xs text-ink/70">
        <span className="px-2">
          {group.transfers.length.toLocaleString("fa-IR")} کارت به کارت
        </span>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="min-h-11 px-3 text-sm underline decoration-stamp/60 underline-offset-4"
          >
            {copied ? "کپی شد" : "کپی برای تلگرام"}
          </button>
        )}
      </footer>
    </article>
  );
}
