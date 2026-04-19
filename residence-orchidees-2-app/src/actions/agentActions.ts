"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function agentCreatePrestataire(data: {
  metier: string;
  nomSociete: string;
  responsable?: string;
  telephone?: string;
  adresse?: string;
  montantMarche?: number;
  montantPaye?: number;
  metierData?: Record<string, string>;
  notes?: string;
}) {
  await prisma.prestataire.create({
    data: {
      metier: data.metier as any,
      nomSociete: data.nomSociete,
      responsable: data.responsable,
      telephone: data.telephone,
      adresse: data.adresse,
      montantMarche: data.montantMarche,
      montantPaye: data.montantPaye ?? 0,
      statut: "EN_COURS" as any,
      metierData: data.metierData ? JSON.stringify(data.metierData) : null,
      notes: data.notes,
    },
  });
  revalidatePath("/dashboard/prestataires");
}

export async function agentSaveMemory(key: string, value: string, context?: string) {
  await prisma.agentMemory.upsert({
    where: { key },
    update: { value, context, updatedAt: new Date() },
    create: { key, value, context },
  });
}

export async function agentGetMemory(key: string): Promise<string | null> {
  const m = await prisma.agentMemory.findUnique({ where: { key } });
  return m?.value ?? null;
}

export async function agentGetAlertCount(): Promise<number> {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [alerts, guarantees, unpaidInvoices] = await Promise.all([
    prisma.alert.count({ where: { read: false } }),
    prisma.prestataire.count({ where: { garantieExpiration: { gte: now, lte: in30Days } } }),
    prisma.invoice.count({ where: { paid: false } }).catch(() => 0),
  ]);
  return alerts + guarantees + unpaidInvoices;
}
