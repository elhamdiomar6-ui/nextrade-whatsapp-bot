"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addPaymentTranche(data: {
  saleId: string;
  label: string;
  amount: number;
  dueDate: string;
}) {
  await prisma.paymentSchedule.create({
    data: {
      saleId: data.saleId,
      label:  data.label || null,
      amount: data.amount,
      dueDate: new Date(data.dueDate),
      paid: false,
    },
  });
  revalidatePath("/dashboard/sales");
}

export async function markTranchePaid(id: string, paid: boolean) {
  await prisma.paymentSchedule.update({
    where: { id },
    data: { paid, paidAt: paid ? new Date() : null },
  });
  revalidatePath("/dashboard/sales");
}

export async function deletePaymentTranche(id: string) {
  await prisma.paymentSchedule.delete({ where: { id } });
  revalidatePath("/dashboard/sales");
}
