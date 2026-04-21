"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { InterventionStatus } from "@prisma/client";
import { notifyAllOwners } from "@/lib/whatsapp";

export async function createIntervention(data: {
  title: string;
  description?: string;
  contractorName?: string;
  contractorPhone?: string;
}) {
  let contractorId: string | undefined;

  if (data.contractorName?.trim()) {
    const c = await prisma.contractor.create({
      data: {
        name: data.contractorName.trim(),
        phone: data.contractorPhone?.trim() ?? null,
      },
    });
    contractorId = c.id;
  }

  await prisma.intervention.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      residenceId: "orchidees2",
      contractorId: contractorId ?? null,
    },
  });

  // Notify all co-owners
  notifyAllOwners(
    `🔧 *Orchidées 2 — Nouvelle intervention*\n${data.title}${data.description ? `\n${data.description}` : ""}${data.contractorName ? `\nPrestataire : ${data.contractorName}` : ""}\nDate : ${new Date().toLocaleDateString("fr-MA")}`
  ).catch(() => {});

  revalidatePath("/dashboard/interventions");
  revalidatePath("/dashboard");
}

export async function updateIntervention(
  id: string,
  data: {
    title: string;
    description?: string;
    status: InterventionStatus;
    contractorName?: string;
    contractorPhone?: string;
  }
) {
  const intervention = await prisma.intervention.findUnique({
    where: { id },
    include: { contractor: true },
  });

  let contractorId: string | null = intervention?.contractorId ?? null;

  if (data.contractorName?.trim()) {
    if (intervention?.contractor) {
      await prisma.contractor.update({
        where: { id: intervention.contractor.id },
        data: {
          name: data.contractorName.trim(),
          phone: data.contractorPhone?.trim() ?? null,
        },
      });
    } else {
      const c = await prisma.contractor.create({
        data: {
          name: data.contractorName.trim(),
          phone: data.contractorPhone?.trim() ?? null,
        },
      });
      contractorId = c.id;
    }
  } else {
    contractorId = null;
  }

  await prisma.intervention.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description ?? null,
      status: data.status,
      contractorId,
    },
  });

  revalidatePath("/dashboard/interventions");
  revalidatePath("/dashboard");
}

export async function deleteIntervention(id: string) {
  await prisma.intervention.delete({ where: { id } });
  revalidatePath("/dashboard/interventions");
  revalidatePath("/dashboard");
}
