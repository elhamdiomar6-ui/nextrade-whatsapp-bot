"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createStaff(data: {
  name: string; role: string; phone?: string; email?: string;
  address?: string; cin?: string; startDate?: string;
  salary?: number; salaryType?: string; notes?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Non autorisé");
  const residence = await prisma.residence.findFirst();
  if (!residence) throw new Error("Résidence introuvable");
  await prisma.staff.create({
    data: {
      name: data.name,
      role: data.role as never,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      cin: data.cin || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      salary: data.salary ?? null,
      salaryType: (data.salaryType as never) ?? "MONTHLY",
      notes: data.notes || null,
      residenceId: residence.id,
    },
  });
  revalidatePath("/dashboard/personnel");
}

export async function updateStaff(id: string, data: {
  name?: string; phone?: string; email?: string; address?: string;
  cin?: string; salary?: number; salaryType?: string; notes?: string; active?: boolean;
}) {
  const session = await auth();
  if (!session) throw new Error("Non autorisé");
  await prisma.staff.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.cin !== undefined && { cin: data.cin || null }),
      ...(data.salary !== undefined && { salary: data.salary }),
      ...(data.salaryType !== undefined && { salaryType: data.salaryType as never }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.active !== undefined && { active: data.active }),
    },
  });
  revalidatePath("/dashboard/personnel");
}

export async function createStaffTask(data: {
  staffId: string; date: string; areas: string[];
  duration?: number; status?: string; notes?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Non autorisé");
  await prisma.staffTask.create({
    data: {
      staffId: data.staffId,
      date: new Date(data.date),
      areas: JSON.stringify(data.areas),
      duration: data.duration ?? null,
      status: (data.status as never) ?? "DONE",
      notes: data.notes || null,
    },
  });
  revalidatePath("/dashboard/personnel");
}

export async function createStaffPlanning(data: {
  staffId: string; date: string; areas: string[]; notes?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Non autorisé");
  await prisma.staffPlanning.create({
    data: {
      staffId: data.staffId,
      date: new Date(data.date),
      areas: JSON.stringify(data.areas),
      notes: data.notes || null,
    },
  });
  revalidatePath("/dashboard/personnel");
}

export async function markPlanningDone(id: string, done: boolean) {
  const session = await auth();
  if (!session) throw new Error("Non autorisé");
  await prisma.staffPlanning.update({ where: { id }, data: { done } });
  revalidatePath("/dashboard/personnel");
}

export async function createStaffPayment(data: {
  staffId: string; amount: number; date: string;
  period?: string; salaryType?: string; notes?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Non autorisé");
  await prisma.staffPayment.create({
    data: {
      staffId: data.staffId,
      amount: data.amount,
      date: new Date(data.date),
      period: data.period || null,
      salaryType: (data.salaryType as never) ?? "MONTHLY",
      notes: data.notes || null,
    },
  });
  revalidatePath("/dashboard/personnel");
}

export async function deleteStaffTask(id: string) {
  const session = await auth();
  if (!session) throw new Error("Non autorisé");
  await prisma.staffTask.delete({ where: { id } });
  revalidatePath("/dashboard/personnel");
}
