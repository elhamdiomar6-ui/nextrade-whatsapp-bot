"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface WASettings {
  WA_OMAR: string;
  WA_MOHAMED: string;
  WA_BRAHIM: string;
  WA_LAHOUCINE: string;
}

export async function getWhatsAppSettings(): Promise<WASettings> {
  const keys = ["WA_OMAR", "WA_MOHAMED", "WA_BRAHIM", "WA_LAHOUCINE"];
  const rows = await prisma.appSetting.findMany({ where: { key: { in: keys } } });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    WA_OMAR:      map["WA_OMAR"]      ?? process.env.WA_OMAR      ?? "",
    WA_MOHAMED:   map["WA_MOHAMED"]   ?? process.env.WA_MOHAMED   ?? "",
    WA_BRAHIM:    map["WA_BRAHIM"]    ?? process.env.WA_BRAHIM    ?? "",
    WA_LAHOUCINE: map["WA_LAHOUCINE"] ?? process.env.WA_LAHOUCINE ?? "",
  };
}

export async function saveWhatsAppSettings(data: WASettings): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return { success: false, error: "Accès refusé" };
  }

  const entries = Object.entries(data) as [string, string][];

  await Promise.all(
    entries.map(([key, value]) =>
      prisma.appSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    )
  );

  revalidatePath("/dashboard/whatsapp");
  return { success: true };
}

export async function testWhatsApp(to: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return { success: false, error: "Accès refusé" };
  }
  if (!to) return { success: false, error: "Numéro manquant" };

  const { sendWhatsApp } = await import("@/lib/whatsapp");
  await sendWhatsApp(to, `✅ *Orchidées 2 — Test WhatsApp*\nMessage de test envoyé depuis le tableau de bord.\n${new Date().toLocaleString("fr-MA")}`);
  return { success: true };
}
