"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ProspectStatus } from "@prisma/client";

export async function createProspect(data: {
  name: string;
  phone?: string;
  whatsapp?: string;
  lotIds: string[];
}) {
  await prisma.prospect.create({
    data: {
      name: data.name,
      phone: data.phone ?? null,
      whatsapp: data.whatsapp ?? null,
      prospectLots: {
        create: data.lotIds.map((lotId) => ({ lotId })),
      },
    },
  });

  revalidatePath("/dashboard/prospects");
}

export async function updateProspect(
  id: string,
  data: {
    name: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    status: ProspectStatus;
    notes?: string;
  }
) {
  await prisma.prospect.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone ?? null,
      whatsapp: data.whatsapp ?? null,
      email: data.email ?? null,
      status: data.status,
      notes: data.notes ?? null,
    },
  });
  revalidatePath("/dashboard/prospects");
}

export async function deleteProspect(id: string) {
  await prisma.prospect.delete({ where: { id } });
  revalidatePath("/dashboard/prospects");
}
