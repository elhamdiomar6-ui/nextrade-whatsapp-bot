import { prisma } from "@/lib/prisma";
import { ReadingsClient } from "./ReadingsClient";
import { getAttachmentMap } from "@/lib/attachments";

export default async function ReadingsPage() {
  const [readings, meters] = await Promise.all([
    prisma.meterReading.findMany({
      orderBy: { date: "desc" },
      take: 100,
      include: { meter: { include: { subscription: { include: { unit: true } } } } },
    }),
    prisma.meter.findMany({
      include: {
        subscription: { include: { unit: true } },
        readings: { orderBy: { date: "desc" }, take: 1 },
      },
      orderBy: { serialNumber: "asc" },
    }),
  ]);

  const attMap = await getAttachmentMap("reading", readings.map((r) => r.id));

  return (
    <ReadingsClient
      readings={readings.map((r) => ({
        id: r.id, value: r.value, previousValue: r.previousValue,
        date: r.date.toISOString(), validated: r.validated, notes: r.notes, photoUrl: r.photoUrl,
        meterSerial: r.meter.serialNumber, serviceType: r.meter.serviceType,
        unitName: r.meter.subscription.unit?.name ?? "Général",
        consumption: r.previousValue !== null ? +(r.value - r.previousValue).toFixed(2) : null,
        anomaly: r.previousValue !== null ? r.value < r.previousValue : false,
        attachments: attMap[r.id] ?? [],
      }))}
      meters={meters.map((m) => ({
        id: m.id,
        serial: m.serialNumber,
        unitName: m.subscription.unit?.name ?? "Général",
        lastValue: m.readings[0]?.value ?? null,
      }))}
    />
  );
}
