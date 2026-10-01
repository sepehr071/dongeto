"use client";

import { useMemo, useRef, useState } from "react";
import { addExpenseAction, addMemberAction } from "@/app/actions";
import { parseToman } from "@/lib/money";
import type { GroupSnapshot } from "@/lib/group";
import type { SplitType } from "@/lib/types";

const TYPES: { id: SplitType; label: string; hint: string }[] = [
  { id: "equal", label: "مساوی", hint: "مبلغ بین کسانی که تیک خوردن یکسان پخش می‌شود." },
  { id: "exact", label: "دقیق", hint: "برای هر نفر مبلغ دقیق به تومان بنویس. جمع باید با کل خرج یکی باشد." },
  { id: "percent", label: "درصد", hint: "سهم هر نفر به درصد. جمع باید ۱۰۰ شود." },
  { id: "shares", label: "سهم", hint: "وزن نسبی. مثلا ۲ و ۱ یعنی یکی دو برابر دیگری می‌دهد." },
];

export function ExpenseForm({
  group,
  onChanged,
}: {
  group: GroupSnapshot;
  onChanged: () => void;
}) {
  const box = useRef<HTMLDetailsElement>(null);
  const [title, setTitle] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [payerId, setPayerId] = useState<string | null>(null);
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [showSplitTypes, setShowSplitTypes] = useState(false);
  const [selected, setSelected] = useState<string[] | null>(null);
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const amount = useMemo(() => parseToman(amountRaw), [amountRaw]);
  const memberIds = group.members.map((m) => m.id);
  const payer =
    payerId && memberIds.includes(payerId)
      ? payerId
      : (group.members[0]?.id ?? "");
  const selectedIds = (selected ?? memberIds).filter((id) =>
    memberIds.includes(id),
  );

  function toggle(id: string) {
    const s = selectedIds;
    setSelected(s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!amount || amount <= 0) {
      setError("مبلغ را به تومان بنویس، مثلا ۴۵۰ هزار");
      return;
    }
    if (!payer) {
      setError("کی داده؟");
      return;
    }
    if (selectedIds.length === 0) {
      setError("حداقل یک شریک");
      return;
    }
    const shares = selectedIds.map((id) => {
      if (splitType === "equal") return { memberId: id, weight: 1 };
      const w = Number(weights[id] ?? 0);
      return { memberId: id, weight: w };
    });
    setBusy(true);
    try {
      await addExpenseAction(group.token, {
        title: title.trim() || "خرج",
        amount,
        splitType,
        payers: [{ memberId: payer, amount }],
        shares,
      });
      setTitle("");
      setAmountRaw("");
      setSplitType("equal");
      setShowSplitTypes(false);
      if (box.current) box.current.open = false;
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت نشد");
    } finally {
      setBusy(false);
    }
  }

  async function onAddMember() {
    const n = newName.trim();
    if (!n) return;
    await addMemberAction(group.token, n);
    setNewName("");
    onChanged();
  }

  return (
    <details ref={box} className="border-t border-rule pt-3">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink/70 hover:text-ink">
        <span aria-hidden className="inline-flex size-5 items-center justify-center border border-current text-xs">+</span>
        ثبت دستی، بدون چت
      </summary>
      <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold">عنوان</span>
        <span className="text-xs text-ink/70">این خرید چی بود؟ شام، بنزین، هتل.</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="شام"
          className="min-h-11 border border-rule bg-paper px-3 focus:border-ink"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold">مبلغ به تومان</span>
        <span className="text-xs text-ink/70">
          عدد یا عبارت. «۴۵۰ هزار» و «۱ میلیون» هم قبول است.
        </span>
        <input
          value={amountRaw}
          onChange={(e) => setAmountRaw(e.target.value)}
          placeholder="۱ میلیون"
          className="min-h-11 border border-rule bg-paper px-3 focus:border-ink"
          inputMode="text"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">کی پرداخت کرد؟</span>
        <span className="text-xs font-normal text-ink/70">
          کسی که از جیب خودش داده، نه کسی که دنگ می‌دهد.
        </span>
        <select
          value={payer}
          onChange={(e) => setPayerId(e.target.value)}
          className="mt-1 min-h-11 w-full border border-rule bg-paper px-3"
        >
          {group.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-bold">کیا شریک این خرج‌ان؟</legend>
        <p className="text-xs text-ink/70">
          اسم کسی که نبوده را خاموش کن تا دنگ به او نخورد.
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {group.members.map((m) => {
            const on = selectedIds.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle(m.id)}
                className={`min-h-11 border px-3 text-sm ${
                  on ? "border-ink bg-pistachio/20" : "border-rule text-ink/50"
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      </fieldset>
      {showSplitTypes ? (
        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-bold">جورِ تقسیم</legend>
          <p className="text-xs text-ink/70">
            {TYPES.find((t) => t.id === splitType)?.hint}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSplitType(t.id)}
                className={`min-h-11 px-3 text-sm ${
                  splitType === t.id
                    ? "bg-ink text-paper"
                    : "border border-ink bg-paper"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>
      ) : (
        <button
          type="button"
          onClick={() => setShowSplitTypes(true)}
          className="min-h-11 self-start text-sm text-ink/70 underline underline-offset-4"
        >
          تقسیم دیگر
        </button>
      )}
      {showSplitTypes && splitType !== "equal" && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-bold">
            {splitType === "exact"
              ? "مبلغ هر نفر به تومان"
              : splitType === "percent"
                ? "درصد هر نفر"
                : "وزن سهم هر نفر"}
          </legend>
          {selectedIds.map((id) => {
            const m = group.members.find((x) => x.id === id);
            return (
              <label key={id} className="flex items-center gap-2 text-sm">
                <span className="w-24">{m?.name}</span>
                <input
                  value={weights[id] ?? ""}
                  onChange={(e) =>
                    setWeights((w) => ({ ...w, [id]: e.target.value }))
                  }
                  className="min-h-11 flex-1 border border-rule bg-paper px-2"
                  inputMode="decimal"
                />
              </label>
            );
          })}
        </fieldset>
      )}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold">نفر جدید به گروه</span>
        <span className="text-xs text-ink/70">
          اگر اسمی جا مانده، همین‌جا اضافه کن. بعد می‌توانی شریک خرجش کنی.
        </span>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="اسم"
            className="min-h-11 min-w-0 flex-1 border border-rule bg-paper px-3"
          />
          <button
            type="button"
            onClick={onAddMember}
            className="min-h-11 border border-ink px-3"
          >
            اضافه
          </button>
        </div>
      </label>
      {error && <p className="text-sm text-stamp">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="min-h-11 w-full bg-ink text-paper disabled:opacity-40"
      >
        {busy ? "داره ثبت می‌شه" : "ثبت خرج"}
      </button>
      </form>
    </details>
  );
}
