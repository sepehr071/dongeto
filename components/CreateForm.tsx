"use client";

import { useState } from "react";
import { createGroupAction } from "@/app/actions";

export function CreateForm() {
  const [names, setNames] = useState("");
  const chips = names
    .split(/[,\n،]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <form action={createGroupAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">اسم کسانی که شریک‌ان</span>
        <span className="text-xs text-ink/70">
          با ویرگول جدا کن. لازم نیست وارد سایت بشن؛ فقط اسم‌شان را بنویس.
        </span>
        <textarea
          name="names"
          rows={3}
          value={names}
          onChange={(e) => setNames(e.target.value)}
          placeholder="علی، سارا، مامان"
          className="border border-ink bg-paper px-3 py-2 leading-7 placeholder:text-ink/45 focus:border-stamp"
          required
        />
      </label>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <span
              key={c}
              className="border border-ink bg-pistachio/15 px-2 py-0.5 text-sm"
            >
              {c}
            </span>
          ))}
        </div>
      )}
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">اسم گروه (اختیاری)</span>
        <span className="text-xs text-ink/70">
          مثلا سفر شمال. خالی بذاری می‌شه گروه دنگ.
        </span>
        <input
          name="title"
          placeholder="سفر شمال"
          className="min-h-11 border border-ink bg-paper px-3 py-2 placeholder:text-ink/45 focus:border-stamp"
        />
      </label>
      <button
        type="submit"
        disabled={chips.length < 2}
        className="min-h-12 bg-stamp px-4 py-3 text-lg font-bold text-paper shadow-[3px_4px_0_var(--shadow)] transition active:translate-y-0.5 active:shadow-none disabled:bg-ink/15 disabled:text-ink/70 disabled:shadow-none"
      >
        {chips.length < 2 ? "حداقل دو اسم" : "گروه بساز"}
      </button>
    </form>
  );
}
