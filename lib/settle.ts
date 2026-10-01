import { owedByMember } from "./split";
import type { ExpenseInput, Member, Transfer } from "./types";

export type Nets = Map<string, number>;

export function netsOf(
  members: Member[],
  expenses: ExpenseInput[],
): Nets {
  const nets: Nets = new Map(members.map((m) => [m.id, 0]));
  for (const exp of expenses) {
    const paidSum = exp.payers.reduce((a, p) => a + p.amount, 0);
    if (paidSum !== exp.amount) {
      throw new Error(
        `جمع پرداخت‌کننده‌ها (${paidSum}) با مبلغ خرج (${exp.amount}) یکی نیست`,
      );
    }
    for (const p of exp.payers) {
      nets.set(p.memberId, (nets.get(p.memberId) ?? 0) + p.amount);
    }
    const owed = owedByMember(exp.amount, exp.splitType, exp.shares);
    for (const [id, amt] of owed) {
      nets.set(id, (nets.get(id) ?? 0) - amt);
    }
  }
  return nets;
}

/**
 * Greedy min-transfers. At most n-1 payments.
 * # ponytail: greedy n-1, exact min-transactions DP if groups > ~20
 */
export function settle(nets: Nets): Transfer[] {
  type Node = { id: string; amt: number };
  const debtors: Node[] = [];
  const creditors: Node[] = [];
  for (const [id, amt] of nets) {
    if (amt < -0.5) debtors.push({ id, amt });
    else if (amt > 0.5) creditors.push({ id, amt });
  }

  const transfers: Transfer[] = [];
  debtors.sort((a, b) => a.amt - b.amt);
  creditors.sort((a, b) => b.amt - a.amt);
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const pay = Math.min(-d.amt, c.amt);
    if (pay > 0) {
      transfers.push({ fromId: d.id, toId: c.id, amount: pay });
      d.amt += pay;
      c.amt -= pay;
    }
    if (d.amt >= -0.5) i += 1;
    if (c.amt <= 0.5) j += 1;
  }
  return transfers;
}

export function settleExpenses(
  members: Member[],
  expenses: ExpenseInput[],
): { nets: Nets; transfers: Transfer[] } {
  const nets = netsOf(members, expenses);
  return { nets, transfers: settle(nets) };
}
