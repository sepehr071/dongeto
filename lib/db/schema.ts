import {
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const groups = pgTable("groups", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const members = pgTable("members", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const expenses = pgTable("expenses", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  amountToman: integer("amount_toman").notNull(),
  splitType: text("split_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const payers = pgTable(
  "payers",
  {
    expenseId: text("expense_id")
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    amountToman: integer("amount_toman").notNull(),
  },
  (t) => [primaryKey({ columns: [t.expenseId, t.memberId] })],
);

export const shares = pgTable(
  "shares",
  {
    expenseId: text("expense_id")
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    weight: numeric("weight", { precision: 14, scale: 4 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.expenseId, t.memberId] })],
);
