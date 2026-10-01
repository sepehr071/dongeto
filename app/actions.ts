"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addExpense,
  addMember,
  createGroup,
  deleteExpense,
  type NewExpense,
} from "@/lib/group";

export async function createGroupAction(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const namesRaw = String(formData.get("names") ?? "");
  const names = namesRaw.split(/[,\n،]/);
  const { token } = await createGroup(title, names);
  redirect(`/g/${token}`);
}

export async function addMemberAction(token: string, name: string) {
  const row = await addMember(token, name);
  revalidatePath(`/g/${token}`);
  return { id: row.id, name: row.name };
}

export async function addExpenseAction(token: string, input: NewExpense) {
  const id = await addExpense(token, input);
  revalidatePath(`/g/${token}`);
  return { id };
}

export async function deleteExpenseAction(token: string, expenseId: string) {
  await deleteExpense(token, expenseId);
  revalidatePath(`/g/${token}`);
}
