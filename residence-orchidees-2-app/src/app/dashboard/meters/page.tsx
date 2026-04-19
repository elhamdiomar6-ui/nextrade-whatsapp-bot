import { prisma } from "@/lib/prisma";
import { MetersClient } from "./MetersClient";

export default async function MetersPage() {
  const meters = await prisma.meter.findMany({
    orderBy: { serialNumber: "asc" },
    include: {
      subscription: { include: { unit: true } },
      readings: { orderBy: { date: "desc" }, take: 1 },
    },
  });

  return (
    <MetersClient
      meters={meters.map((m) => ({
        id: m.id,
        serialNumber: m.serialNumber,
        serviceType: m.serviceType,
        unitName: m.subscription.unit?.name ?? "Général",
        scope: m.subscription.scope,
        lastReading: m.readings[0]
          ? { value: m.readings[0].value, date: m.readings[0].date.toISOString(), validated: m.readings[0].validated }
          : null,
      }))}
    />
  );
}
