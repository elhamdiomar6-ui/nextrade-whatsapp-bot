import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";

async function getDashboardStats() {
  const [
    totalUnits, totalMeters, totalReadings, totalExpenses,
    openInterventions, openAlerts, recentReadings,
    coOwners, sales, elecMeters,
  ] = await Promise.all([
    prisma.unit.count(),
    prisma.meter.count(),
    prisma.meterReading.count(),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.intervention.count({ where: { status: { not: "COMPLETED" } } }),
    prisma.alert.count({ where: { read: false } }),
    prisma.meterReading.findMany({
      take: 8,
      orderBy: { date: "desc" },
      include: { meter: { include: { subscription: { include: { unit: true } } } } },
    }),
    prisma.coOwner.findMany({ orderBy: { order: "asc" } }),
    prisma.sale.findMany({
      include: { distributions: { include: { shares: { include: { coOwner: true } } } } },
    }),
    // Electricity meters with last 2 readings
    prisma.meter.findMany({
      where: { serviceType: "ELECTRICITY" },
      include: { readings: { orderBy: { date: "desc" }, take: 2 } },
    }),
  ]);

  // KPI électricité
  const totalElecMeters = elecMeters.length;
  const totalElecKwh = Math.round(
    elecMeters.reduce((acc, m) => acc + (m.readings[0]?.value ?? 0), 0)
  );
  const totalElecConsumption = Math.round(
    elecMeters.reduce((acc, m) => {
      if (m.readings.length >= 2) return acc + (m.readings[0].value - m.readings[1].value);
      return acc;
    }, 0)
  );

  const coOwnerStats = coOwners.map((co) => {
    let received = 0;
    for (const sale of sales) {
      for (const dist of sale.distributions) {
        for (const share of dist.shares) {
          if (share.coOwnerId === co.id) received += share.amount;
        }
      }
    }
    const theoreticalShare = sales.reduce((acc, s) => acc + s.totalAmount * (co.sharePercent / 100), 0);
    return { id: co.id, name: co.name, sharePercent: co.sharePercent, totalReceived: received, theoreticalShare };
  });

  return {
    totalUnits,
    totalMeters,
    totalReadings,
    totalExpensesAmount: totalExpenses._sum.amount ?? 0,
    openInterventions,
    openAlerts,
    coOwnerStats,
    totalElecMeters,
    totalElecKwh,
    totalElecConsumption,
    recentReadings: recentReadings.map((r) => ({
      id: r.id,
      value: r.value,
      previousValue: r.previousValue,
      date: r.date.toISOString(),
      unitName: r.meter.subscription.unit?.name ?? null,
      meterSerial: r.meter.serialNumber,
      serviceType: r.meter.serviceType as string,
      consumption: r.previousValue !== null ? +(r.value - r.previousValue).toFixed(2) : null,
      anomaly: r.previousValue !== null ? r.value < r.previousValue : false,
    })),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const userRole = (session?.user as { role?: string })?.role;
  if (userRole === "OCCUPANT") redirect("/dashboard/mon-espace");
  const stats = await getDashboardStats();

  return (
    <DashboardClient
      stats={stats}
      userName={session?.user?.name ?? "—"}
      userRole={(session?.user as { role?: string })?.role ?? "VIEWER"}
    />
  );
}
