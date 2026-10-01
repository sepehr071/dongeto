"use client";

import { useState } from "react";
import { ConfirmDraft } from "./ConfirmDraft";
import type { GroupSnapshot } from "@/lib/group";
import type { DraftExpense } from "@/lib/types";

type Msg = { role: "user" | "assistant"; content: string };

function friendlyError(raw: string): string {
  if (raw.includes("پیدا نشد")) return "گروه لود نشد. یک‌بار صفحه رو رفرش کن.";
  if (raw.includes("کلید") || raw.includes("OPENROUTER") || raw.includes("401"))
    return "چت وصل نشد. کلید مدل رو چک کن.";
  if (raw.includes("زیادی") || raw.includes("429"))
    return "خیلی پشت‌سرهم فرستادی. کمی صبر کن.";
  return raw;
}

export function Chat({
  group,
  speaker,
  onChanged,
}: {
  group: GroupSnapshot;
  speaker?: string;
  onChanged: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [drafts, setDrafts] = useState<DraftExpense[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailed, setLastFailed] = useState<string | null>(null);

  const activeDraft = drafts[0];

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setError(null);
    setLastFailed(null);
    const last = messages[messages.length - 1];
    const next =
      last?.role === "user" && last.content === t
        ? messages
        : [...messages, { role: "user" as const, content: t }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch(`/api/g/${encodeURIComponent(group.token)}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, speaker }),
      });
      const data = (await res.json()) as {
        text?: string;
        drafts?: DraftExpense[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "خطا");
      if (data.text) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.text as string },
        ]);
      }
      if (data.drafts?.length) setDrafts((d) => [...d, ...data.drafts!]);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "خطا";
      setError(friendlyError(raw));
      setLastFailed(t);
    } finally {
      setBusy(false);
    }
  }

  function shiftDraft() {
    setDrafts((xs) => xs.slice(1));
  }

  return (
    <>
      {(messages.length > 0 || busy || error) && (
      <section
        className={`flex flex-col gap-3 ${activeDraft ? "pb-48" : ""}`}
      >
        <div className="flex flex-col gap-2">
          {messages.map((m, i) => (
            <p
              key={i}
              className={
                m.role === "user"
                  ? "max-w-[85%] self-start bg-paper-2 px-3 py-2 text-sm leading-7 ring-1 ring-ink/80 shadow-[2px_2px_0_var(--shadow)]"
                  : "max-w-[85%] self-end border-r-2 border-pistachio px-3 text-sm leading-7 text-ink/85"
              }
            >
              {m.content}
            </p>
          ))}
          {busy && (
            <p className="flex items-center gap-2 self-end text-sm text-ink/70" role="status">
              داره خرج رو می‌خونه
              <span className="typing inline-flex gap-0.5 text-pistachio" aria-hidden>
                <span>●</span>
                <span>●</span>
                <span>●</span>
              </span>
            </p>
          )}
        </div>
        {error && (
          <div className="bg-stamp/10 px-3 py-2 text-sm text-stamp">
            <p>{error}</p>
            {lastFailed && (
              <button
                type="button"
                className="mt-1 min-h-11 underline underline-offset-4"
                onClick={() => void send(lastFailed)}
              >
                دوباره بفرست
              </button>
            )}
          </div>
        )}
      </section>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-ink bg-paper/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur"
      >
        <div className="mx-auto flex max-w-lg flex-col gap-3 lg:max-w-5xl lg:pe-[24.5rem]">
          {activeDraft && (
            <ConfirmDraft
              group={group}
              draft={activeDraft}
              onDone={() => {
                shiftDraft();
                onChanged();
              }}
              onCancel={shiftDraft}
            />
          )}
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="dong-chat">
              پیام
            </label>
            <input
              id="dong-chat"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                speaker
                  ? `${speaker}، کی پول داد و چند تومن؟`
                  : "کی پول داد، چند تومن، کیا بودن؟"
              }
              className="min-h-12 min-w-0 flex-1 border border-ink bg-paper px-3 placeholder:text-ink/45 focus:border-stamp"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="min-h-12 bg-stamp px-5 font-bold text-paper disabled:bg-ink/15 disabled:text-ink/70"
            >
              بفرست
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
