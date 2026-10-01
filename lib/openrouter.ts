import OpenAI from "openai";
import { formatToman } from "./money";
import { parseToman } from "./money";
import { addMember, loadGroup, type GroupSnapshot } from "./group";
import { findMemberId } from "./names";
import type { DraftExpense, SplitType } from "./types";
import { SPLIT_TYPES } from "./types";

export function openrouterClient(): OpenAI {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY missing");
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: key,
    defaultHeaders: {
      "HTTP-Referer":
        process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
      "X-Title": "Dongeto",
    },
  });
}

export const CHAT_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_group",
      description: "لیست اعضا، خرج‌ها و بدهی فعلی. قبل از ثبت خرج صدا بزن.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "add_member",
      description: "نفر جدید به گروه اضافه کن.",
      parameters: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_expense",
      description:
        "پیشنهاد ثبت خرج. مبلغ را به تومان صحیح بده. تا کاربر تأیید نکند ذخیره نمی‌شود.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          amount_toman: { type: "integer", description: "مبلغ به تومان صحیح" },
          split_type: { type: "string", enum: [...SPLIT_TYPES] },
          payers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                amount: { type: "integer" },
              },
              required: ["name", "amount"],
            },
          },
          shares: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                weight: {
                  type: "number",
                  description:
                    "equal: 1، exact: مبلغ تومان، percent: درصد، shares: سهم نسبی",
                },
              },
              required: ["name", "weight"],
            },
          },
        },
        required: ["title", "amount_toman", "split_type", "payers", "shares"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "explain_settlement",
      description: "نتیجه موتور تسویه. خودت جمع و تفریق نکن.",
      parameters: { type: "object", properties: {} },
    },
  },
];

function systemPrompt(group: GroupSnapshot, speaker?: string): string {
  const names = group.members.map((m) => m.name).join("، ");
  const me = speaker
    ? `کاربر خودش را «${speaker}» معرفی کرده. اگر گفت «من»، یعنی ${speaker}.`
    : `اگر گفت «من» بپرس کدام عضو است.`;
  return `تو دستیار دنگتو هستی. فارسی خودمونی حرف بزن، کوتاه.
گروه: ${group.title}
اعضا: ${names}
${me}

قواعد:
- هیچ جمع و تفریقی نکن. مبلغ را به تومان صحیح بده به ابزار.
- «X داد / پرداخت / حساب کرد / فاکتور رو داد» یعنی X پرداخت‌کننده است. نپرس.
- فقط اگر واقعاً اسم پرداخت‌کننده یا شریک‌ها نیامده بود بپرس.
- add_expense پیش‌نویس است. بعد از ابزار بگو کارت تأیید را ببیند.
- دونگ مساوی: split_type=equal و برای هر شریک weight=1.
- کسی که شریک نیست را در shares نگذار.
- عدد تسویه را خودت نساز؛ explain_settlement.`;
}

function snapshotText(g: GroupSnapshot): string {
  const name = (id: string) => g.members.find((m) => m.id === id)?.name ?? id;
  const exp = g.expenses
    .slice(0, 20)
    .map(
      (e) =>
        `${e.title}: ${formatToman(e.amount)} ت — پرداخت ${e.payers.map((p) => `${name(p.memberId)} ${formatToman(p.amount)}`).join("، ")} — شریک ${e.shares.map((s) => name(s.memberId)).join("، ")} (${e.splitType})`,
    )
    .join("\n");
  const transfers = g.transfers
    .map(
      (t) =>
        `${name(t.fromId)} ← ${name(t.toId)} ${formatToman(t.amount)} تومان`,
    )
    .join("\n");
  return JSON.stringify(
    {
      members: g.members.map((m) => m.name),
      expenses: exp || "خالی",
      settlement: transfers || "حساب‌ها صاف است",
    },
    null,
    2,
  );
}

export type ChatResult = {
  text: string;
  drafts: DraftExpense[];
};

export async function runChat(
  token: string,
  messages: { role: "user" | "assistant"; content: string }[],
  speaker?: string,
): Promise<ChatResult> {
  let group = await loadGroup(token);
  if (!group) throw new Error("گروه پیدا نشد");

  const client = openrouterClient();
  const model = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";
  const drafts: DraftExpense[] = [];

  const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt(group, speaker) },
    ...messages.slice(-16).map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  for (let step = 0; step < 8; step++) {
    const res = await client.chat.completions.create({
      model,
      messages: apiMessages,
      tools: CHAT_TOOLS,
      temperature: 0.2,
    });
    const msg = res.choices[0]?.message;
    if (!msg) break;
    apiMessages.push(msg);

    if (!msg.tool_calls?.length) {
      return { text: msg.content ?? "", drafts };
    }

    for (const call of msg.tool_calls) {
      if (call.type !== "function") continue;
      const name = call.function.name;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }
      let result = "";
      try {
        if (name === "list_group" || name === "explain_settlement") {
          group = (await loadGroup(token))!;
          result = snapshotText(group);
        } else if (name === "add_member") {
          const n = String(args.name ?? "");
          const row = await addMember(token, n);
          group = (await loadGroup(token))!;
          result = JSON.stringify({ ok: true, name: row.name });
        } else if (name === "add_expense") {
          const draft = await buildDraft(group, args);
          drafts.push(draft);
          result = JSON.stringify({
            status: "draft",
            message: "پیش‌نویس به کاربر نشان داده شد. منتظر تأیید است.",
            draft,
          });
        } else {
          result = JSON.stringify({ error: "unknown tool" });
        }
      } catch (err) {
        result = JSON.stringify({
          error: err instanceof Error ? err.message : "خطا",
        });
      }
      apiMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result,
      });
    }
  }

  return {
    text: "نتونستم تمامش کنم. دوباره کوتاه‌تر بگو.",
    drafts,
  };
}

async function buildDraft(
  group: GroupSnapshot,
  args: Record<string, unknown>,
): Promise<DraftExpense> {
  const title = String(args.title ?? "خرج");
  const rawAmount = args.amount_toman;
  const amount =
    typeof rawAmount === "number"
      ? Math.round(rawAmount)
      : parseToman(String(rawAmount ?? ""));
  if (!amount || amount <= 0) throw new Error("مبلغ نامعتبر");
  const st = String(args.split_type ?? "equal");
  if (!(SPLIT_TYPES as readonly string[]).includes(st)) {
    throw new Error("نوع تقسیم نامعتبر");
  }
  const payersIn = Array.isArray(args.payers) ? args.payers : [];
  const sharesIn = Array.isArray(args.shares) ? args.shares : [];
  if (payersIn.length === 0) throw new Error("پرداخت‌کننده مشخص نیست");
  if (sharesIn.length === 0) throw new Error("شریک‌ها مشخص نیستند");

  const payers = payersIn.map((p) => {
    const o = p as { name: string; amount: number };
    return { name: String(o.name), amount: Math.round(Number(o.amount)) };
  });
  const shares = sharesIn.map((s) => {
    const o = s as { name: string; weight: number };
    return {
      name: String(o.name),
      weight: st === "equal" ? 1 : Number(o.weight),
    };
  });
  for (const p of [...payers, ...shares]) {
    if (!findMemberId(group.members, p.name)) {
      throw new Error(`«${p.name}» در گروه نیست. اول add_member بزن.`);
    }
  }
  return {
    title,
    amount,
    splitType: st as SplitType,
    payers,
    shares,
  };
}
