import { NextResponse } from "next/server";
import { runChat } from "@/lib/openrouter";
import { rateLimit } from "@/lib/ratelimit";

type Body = {
  messages?: { role: "user" | "assistant"; content: string }[];
  speaker?: string;
};

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!rateLimit(`chat:${token}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "زیادی پیام دادی. چند دقیقه صبر کن." },
      { status: 429 },
    );
  }
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "کلید OpenRouter روی سرور تنظیم نشده." },
      { status: 503 },
    );
  }
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "بدنه‌ی نامعتبر" }, { status: 400 });
  }
  const messages = (body.messages ?? []).filter(
    (m) =>
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim().length > 0,
  );
  if (messages.length === 0) {
    return NextResponse.json({ error: "پیام خالی" }, { status: 400 });
  }
  try {
    const result = await runChat(token, messages, body.speaker);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطای مدل";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
