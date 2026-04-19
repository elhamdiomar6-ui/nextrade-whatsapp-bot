"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ContactType } from "@prisma/client";

export async function addProspectContact(data: {
  prospectId: string;
  type: ContactType;
  notes?: string;
  date?: string;
}) {
  await prisma.prospectContact.create({
    data: {
      prospectId: data.prospectId,
      type: data.type,
      notes: data.notes ?? null,
      date: data.date ? new Date(data.date) : new Date(),
    },
  });
  // Touch updatedAt so stale-check cron resets
  await prisma.prospect.update({
    where: { id: data.prospectId },
    data: { updatedAt: new Date() },
  });
  revalidatePath("/dashboard/prospects");
}

export async function deleteProspectContact(id: string) {
  await prisma.prospectContact.delete({ where: { id } });
  revalidatePath("/dashboard/prospects");
}
