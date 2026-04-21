"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface CreateInvoiceInput {
  subscriptionId: string;
  reference?: string;
  amount: number;
  period: string;       // YYYY-MM-DD
  dueDate?: string;     // YYYY-MM-DD
  previousIndex?: number;
  currentIndex?: number;
  notes?: string;
}

export async function createInvoiceManual(input: CreateInvoiceInput) {
  const session = await auth();
  if (!session) throw new Error("Non autorisé");

  const invoice = await prisma.invoice.create({
    data: {
      subscriptionId: input.subscriptionId,
      reference: input.reference || null,
      amount: input.amount,
      period: new Date(input.period),
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      paid: false,
    },
  });

  // Create meter reading if indexes provided
  if (input.previousIndex !== undefined || input.currentIndex !== undefined) {
    const sub = await prisma.subscription.findUnique({
      where: { id: input.subscriptionId },
      include: { meters: { take: 1 } },
    });
    const meter = sub?.meters[0];
    if (meter && input.currentIndex !== undefined) {
      const lastReading = await prisma.meterReading.findFirst({
        where: { meterId: meter.id },
        orderBy: { date: "desc" },
      });
      await prisma.meterReading.create({
        data: {
          meterId: meter.id,
          value: input.currentIndex,
          previousValue: input.previousIndex ?? lastReading?.value ?? null,
          date: input.dueDate ? new Date(input.dueDate) : new Date(input.period),
          mode: "MANUAL",
        },
      });
    }
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard/readings");
  return invoice.id;
}

export async function markInvoicePaid(id: string, paid: boolean) {
  const session = await auth();
  if (!session) throw new Error("Non autorisé");
  await prisma.invoice.update({
    where: { id },
    data: { paid, paidAt: paid ? new Date() : null },
  });
  revalidatePath("/dashboard/invoices");
}
