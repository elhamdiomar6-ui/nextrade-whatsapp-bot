"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ReadingMode } from "@prisma/client";
import { sendWhatsApp, getOmarPhone } from "@/lib/whatsapp";

export async function createReading(data: {
  meterId: string;
  value: number;
  notes?: string;
  photoUrl?: string;
}) {
  const last = await prisma.meterReading.findFirst({
    where: { meterId: data.meterId },
    orderBy: { date: "desc" },
  });

  const reading = await prisma.meterReading.create({
    data: {
      meterId: data.meterId,
      value: data.value,
      previousValue: last?.value ?? null,
      mode: ReadingMode.MANUAL,
      notes: data.notes ?? null,
      photoUrl: data.photoUrl ?? null,
    },
    include: { meter: { include: { subscription: { include: { unit: true } } } } },
  });

  // ── Notification WhatsApp si anomalie ─────────────────────────────────────
  const isAnomaly = last !== null && data.value < last.value;
  if (isAnomaly) {
    const unitName = reading.meter.subscription.unit?.name ?? "Inconnue";
    const conso    = (data.value - (last?.value ?? 0)).toFixed(2);
    const omar     = await getOmarPhone();
    if (omar) {
      await sendWhatsApp(
        omar,
        `⚠️ *Orchidées 2 — Anomalie relevé*\nUnité : ${unitName}\nCompteur : ${reading.meter.serialNumber}\nNouveau relevé : ${data.value} m³\nPrécédent : ${last?.value} m³\nConsommation : ${conso} m³ (ANORMAL)\nDate : ${new Date().toLocaleDateString("fr-MA")}`
      );
    }
  }

  revalidatePath("/dashboard/readings");
  revalidatePath("/dashboard/meters");
  revalidatePath("/dashboard");
}
