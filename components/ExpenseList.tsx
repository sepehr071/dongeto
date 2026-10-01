"use client";

import { deleteExpenseAction } from "@/app/actions";
import { formatToman } from "@/lib/money";
import type { GroupSnapshot } from "@/lib/group";

const TYPE_FA: Record<string, string> = {
  equal: "مساوی",
  exact: "دقیق",
  percent: "درصد",
  shares: "سهم",
};

export function ExpenseList({
  group,
  onChanged,
}: {
  group: GroupSnapshot;
  onChanged: () => void;
}) {
  const name = (id: string) =>
    group.members.find((m) => m.id === id)?.name ?? id;

  if (group.expenses.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 flex items-baseline justify-between text-sm font-bold">
        خرج‌ها
        <span className="tabular text-xs font-normal text-ink/60">
          {group.expenses.length.toLocaleString("fa-IR")} مورد · جمع{" "}
          {formatToman(group.expenses.reduce((a, e) => a + e.amount, 0))} تومان
        </span>
      </h2>
      <ul className="divide-y divide-rule/80 border-y-2 border-ink">
        {group.expenses.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between gap-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{e.title}</p>
              <p className="truncate text-xs text-ink/70">
                {e.payers.map((p) => name(p.memberId)).join("، ")} ·{" "}
                {TYPE_FA[e.splitType]} ·{" "}
                {e.shares.map((s) => name(s.memberId)).join("، ")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="tabular whitespace-nowrap text-sm font-black">
                {formatToman(e.amount)}
              </span>
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-sm text-stamp"
                onClick={async () => {
                  if (!confirm("این خرج پاک بشه؟")) return;
                  await deleteExpenseAction(group.token, e.id);
                  onChanged();
                }}
              >
                حذف
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
