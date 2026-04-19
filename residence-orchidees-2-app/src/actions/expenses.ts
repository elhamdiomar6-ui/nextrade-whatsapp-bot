"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createExpense(data: {
  title: string;
  amount: number;
  categoryId: string;
  description?: string;
  date?: string;
}) {
  await prisma.expense.create({
    data: {
      title: data.title,
      amount: data.amount,
      categoryId: data.categoryId,
      description: data.description ?? null,
      date: data.date ? new Date(data.date) : new Date(),
      residenceId: "orchidees2",
    },
  });

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
}

export async function updateExpense(
  id: string,
  data: { title: string; amount: number; categoryId: string; description?: string; date?: string }
) {
  await prisma.expense.update({
    where: { id },
    data: {
      title: data.title,
      amount: data.amount,
      categoryId: data.categoryId,
      description: data.description ?? null,
      date: data.date ? new Date(data.date) : undefined,
    },
  });
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
}

export async function deleteExpense(id: string) {
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
}
