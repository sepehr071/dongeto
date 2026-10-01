import assert from "node:assert/strict";
import { test } from "node:test";
import { settleExpenses } from "./settle";
import type { ExpenseInput, Member } from "./types";

const members: Member[] = [
  { id: "ana", name: "آنا" },
  { id: "ben", name: "بن" },
  { id: "chloe", name: "کلوئی" },
  { id: "dan", name: "دن" },
];

const expenses: ExpenseInput[] = [
  {
    id: "1",
    title: "هتل",
    amount: 640,
    splitType: "equal",
    payers: [{ memberId: "ana", amount: 640 }],
    shares: members.map((m) => ({ memberId: m.id, weight: 1 })),
  },
  {
    id: "2",
    title: "ماشین",
    amount: 220,
    splitType: "equal",
    payers: [{ memberId: "ben", amount: 220 }],
    shares: members.map((m) => ({ memberId: m.id, weight: 1 })),
  },
  {
    id: "3",
    title: "شام",
    amount: 180,
    splitType: "equal",
    payers: [{ memberId: "chloe", amount: 180 }],
    shares: members.map((m) => ({ memberId: m.id, weight: 1 })),
  },
  {
    id: "4",
    title: "کایاک",
    amount: 150,
    splitType: "equal",
    payers: [{ memberId: "dan", amount: 150 }],
    shares: [
      { memberId: "ana", weight: 1 },
      { memberId: "ben", weight: 1 },
      { memberId: "dan", weight: 1 },
    ],
  },
  {
    id: "5",
    title: "خواربار",
    amount: 96,
    splitType: "equal",
    payers: [{ memberId: "ana", amount: 96 }],
    shares: members.map((m) => ({ memberId: m.id, weight: 1 })),
  },
  {
    id: "6",
    title: "brunch",
    amount: 84,
    splitType: "equal",
    payers: [{ memberId: "ben", amount: 84 }],
    shares: members.map((m) => ({ memberId: m.id, weight: 1 })),
  },
];

test("4-person trip nets sum 0 and few transfers", () => {
  const { nets, transfers } = settleExpenses(members, expenses);
  const sum = [...nets.values()].reduce((a, b) => a + b, 0);
  assert.equal(sum, 0);
  assert.ok(transfers.length <= members.length - 1);
  assert.ok(transfers.length >= 1);
  const paid = transfers.reduce((a, t) => a + t.amount, 0);
  const owed = [...nets.values()].filter((n) => n > 0).reduce((a, b) => a + b, 0);
  assert.equal(paid, owed);
});
