export const SPLIT_TYPES = ["equal", "exact", "percent", "shares"] as const;
export type SplitType = (typeof SPLIT_TYPES)[number];

export type Member = {
  id: string;
  name: string;
};

export type Payer = {
  memberId: string;
  amount: number;
};

export type Share = {
  memberId: string;
  weight: number;
};

export type ExpenseInput = {
  id: string;
  title: string;
  amount: number;
  splitType: SplitType;
  payers: Payer[];
  shares: Share[];
};

export type Transfer = {
  fromId: string;
  toId: string;
  amount: number;
};

export type DraftExpense = {
  title: string;
  amount: number;
  splitType: SplitType;
  payers: { name: string; amount: number }[];
  shares: { name: string; weight: number }[];
};
