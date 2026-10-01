import { desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "./db";
import { expenses, groups, members, payers, shares } from "./db/schema";
import { normName } from "./names";
import { settleExpenses } from "./settle";
import { owedByMember } from "./split";
import type {
  ExpenseInput,
  Member,
  SplitType,
  Transfer,
} from "./types";
import { SPLIT_TYPES } from "./types";

export type GroupSnapshot = {
  id: string;
  token: string;
  title: string;
  members: Member[];
  expenses: (ExpenseInput & { title: string })[];
  nets: Record<string, number>;
  transfers: Transfer[];
};

function splitType(v: string): SplitType {
  if ((SPLIT_TYPES as readonly string[]).includes(v)) return v as SplitType;
  throw new Error("نوع تقسیم نامعتبر");
}

export async function createGroup(title: string, names: string[]) {
  const unique = [
    ...new Set(names.map(normName).filter((n) => n.length > 0)),
  ];
  if (unique.length < 2) {
    throw new Error("حداقل دو نفر لازم است");
  }
  const id = nanoid();
  const token = nanoid(22);
  const t = title.trim() || "گروه دنگ";
  await (await db()).insert(groups).values({ id, token, title: t });
  await (await db())
    .insert(members)
    .values(unique.map((name) => ({ id: nanoid(), groupId: id, name })));
  return { token, title: t };
}

export async function addMember(token: string, name: string) {
  const group = await mustGroup(token);
  const n = normName(name);
  if (!n) throw new Error("اسم خالی");
  const existing = await (await db())
    .select()
    .from(members)
    .where(eq(members.groupId, group.id));
  if (existing.some((m) => normName(m.name) === n)) {
    return existing.find((m) => normName(m.name) === n)!;
  }
  const row = { id: nanoid(), groupId: group.id, name: n };
  await (await db()).insert(members).values(row);
  return row;
}

export type NewExpense = {
  title: string;
  amount: number;
  splitType: SplitType;
  payers: { memberId: string; amount: number }[];
  shares: { memberId: string; weight: number }[];
};

export async function addExpense(token: string, input: NewExpense) {
  const group = await mustGroup(token);
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("مبلغ باید عدد صحیح مثبت باشد");
  }
  const paid = input.payers.reduce((a, p) => a + p.amount, 0);
  if (paid !== input.amount) {
    throw new Error("جمع پرداخت‌ها با مبلغ خرج یکی نیست");
  }
  owedByMember(input.amount, input.splitType, input.shares);

  const id = nanoid();
  await (await db()).insert(expenses).values({
    id,
    groupId: group.id,
    title: input.title.trim() || "خرج",
    amountToman: input.amount,
    splitType: input.splitType,
  });
  await (await db()).insert(payers).values(
    input.payers.map((p) => ({
      expenseId: id,
      memberId: p.memberId,
      amountToman: p.amount,
    })),
  );
  await (await db()).insert(shares).values(
    input.shares.map((s) => ({
      expenseId: id,
      memberId: s.memberId,
      weight: String(s.weight),
    })),
  );
  return id;
}

export async function deleteExpense(token: string, expenseId: string) {
  const group = await mustGroup(token);
  const [row] = await (await db())
    .select()
    .from(expenses)
    .where(eq(expenses.id, expenseId));
  if (!row || row.groupId !== group.id) throw new Error("خرج پیدا نشد");
  await (await db()).delete(expenses).where(eq(expenses.id, expenseId));
}

export async function loadGroup(token: string): Promise<GroupSnapshot | null> {
  const [group] = await (await db())
    .select()
    .from(groups)
    .where(eq(groups.token, token));
  if (!group) return null;
  const mems = await (await db())
    .select()
    .from(members)
    .where(eq(members.groupId, group.id));
  const expRows = await (await db())
    .select()
    .from(expenses)
    .where(eq(expenses.groupId, group.id))
    .orderBy(desc(expenses.createdAt));
  const expIds = expRows.map((e) => e.id);
  const payerRows =
    expIds.length === 0
      ? []
      : await (await db()).select().from(payers).where(inArray(payers.expenseId, expIds));
  const shareRows =
    expIds.length === 0
      ? []
      : await (await db()).select().from(shares).where(inArray(shares.expenseId, expIds));

  const mapped: ExpenseInput[] = expRows.map((e) => ({
    id: e.id,
    title: e.title,
    amount: e.amountToman,
    splitType: splitType(e.splitType),
    payers: payerRows
      .filter((p) => p.expenseId === e.id)
      .map((p) => ({ memberId: p.memberId, amount: p.amountToman })),
    shares: shareRows
      .filter((s) => s.expenseId === e.id)
      .map((s) => ({ memberId: s.memberId, weight: Number(s.weight) })),
  }));

  const memberList: Member[] = mems.map((m) => ({ id: m.id, name: m.name }));
  const { nets, transfers } = settleExpenses(memberList, mapped);
  return {
    id: group.id,
    token: group.token,
    title: group.title,
    members: memberList,
    expenses: mapped,
    nets: Object.fromEntries(nets),
    transfers,
  };
}

async function mustGroup(token: string) {
  const [group] = await (await db())
    .select()
    .from(groups)
    .where(eq(groups.token, token));
  if (!group) throw new Error("گروه پیدا نشد");
  return group;
}
