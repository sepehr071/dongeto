"use client";

import { useState } from "react";
import { addExpenseAction, addMemberAction } from "@/app/actions";
import { formatToman } from "@/lib/money";
import { findMemberId } from "@/lib/names";
import { owedByMember } from "@/lib/split";
import type { GroupSnapshot } from "@/lib/group";
import type { DraftExpense } from "@/lib/types";

const TYPE_FA: Record<string, string> = {
  equal: "مساوی",
  exact: "دقیق",
  percent: "درصد",
  shares: "سهم",
};

export function ConfirmDraft({
  group,
  draft,
  onDone,
  onCancel,
}: {
  group: GroupSnapshot;
  draft: DraftExpense;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // per-person preview from the same split code that settles; names stand in for ids
  let owed: Map<string, number> | null = null;
  try {
    owed = owedByMember(
      draft.amount,
      draft.splitType,
      draft.shares.map((s) => ({ memberId: s.name, weight: s.weight })),
    );
  } catch {}

  async function confirm() {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      let members = [...group.members];
      async function idOf(name: string): Promise<string> {
        const found = findMemberId(members, name);
        if (found) return found;
        const row = await addMemberAction(group.token, name);
        members = [...members, row];
        return row.id;
      }
      const payers = await Promise.all(
        draft.payers.map(async (p) => ({
          memberId: await idOf(p.name),
          amount: p.amount,
        })),
      );
      const shares = await Promise.all(
        draft.shares.map(async (s) => ({
          memberId: await idOf(s.name),
          weight: s.weight,
        })),
      );
      await addExpenseAction(group.token, {
        title: draft.title,
        amount: draft.amount,
        splitType: draft.splitType,
        payers,
        shares,
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ثبت نشد");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="slip p-4">
      <div className="slip-perforation -mx-4 -mt-4 mb-3" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-ink/70">اگر درسته ثبت کن، وگرنه بیخیال.</p>
        <span className="stamp-mark shrink-0 text-xs">پیش‌نویس</span>
      </div>
      <p className="mt-1 text-lg font-bold">{draft.title}</p>
      <p className="tabular text-2xl font-black">
        {formatToman(draft.amount)} تومان
      </p>
      <p className="mt-2 text-sm">
        پرداخت:{" "}
        {draft.payers
          .map((p) => `${p.name} ${formatToman(p.amount)}`)
          .join("، ")}
      </p>
      <p className="text-sm">
        {TYPE_FA[draft.splitType]} · شریک{" "}
        {draft.shares.map((s) => s.name).join("، ")}
      </p>
      {owed && (
        <ul className="mt-3 grid grid-cols-2 gap-x-4 border-t border-dashed border-ink/30 pt-2 text-sm sm:grid-cols-4">
          {[...owed].map(([n, v]) => (
            <li key={n} className="flex items-baseline justify-between gap-2 py-0.5">
              <span className="text-ink/75">{n}</span>
              <span className="tabular font-bold">{formatToman(v)}</span>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 text-sm text-stamp">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void confirm()}
          className="min-h-11 bg-pistachio px-5 font-bold text-paper disabled:bg-ink/15 disabled:text-ink/70"
        >
          {busy ? "…" : "ثبت"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 border border-ink px-4"
        >
          بیخیال
        </button>
      </div>
    </div>
  );
}
