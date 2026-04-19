import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminDataClient } from "./AdminDataClient";

export default async function AdminDataPage() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") redirect("/dashboard");

  const [units, meters, subscriptions, coOwners] = await Promise.all([
    prisma.unit.findMany({
      orderBy: [{ kind: "asc" }, { name: "asc" }],
    }),
    prisma.meter.findMany({
      orderBy: { serialNumber: "asc" },
      include: { subscription: { include: { unit: true } } },
    }),
    prisma.subscription.findMany({
      include: { unit: true },
      orderBy: [{ serviceType: "asc" }, { scope: "asc" }],
    }),
    prisma.coOwner.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <AdminDataClient
      units={units.map((u) => ({
        id: u.id,
        name: u.name,
        kind: u.kind,
        floor: u.floor,
        area: (u as unknown as { area?: number }).area ?? null,
        description: (u as unknown as { description?: string }).description ?? null,
        occupantName: (u as unknown as { occupantName?: string }).occupantName ?? null,
        occupantPhone: (u as unknown as { occupantPhone?: string }).occupantPhone ?? null,
        occupantEmail: (u as unknown as { occupantEmail?: string }).occupantEmail ?? null,
        occupantType: (u as unknown as { occupantType?: string }).occupantType ?? null,
        occupantSince: (u as unknown as { occupantSince?: Date }).occupantSince?.toISOString() ?? null,
      }))}
      meters={meters.map((m) => ({
        id: m.id,
        serialNumber: m.serialNumber,
        serviceType: m.serviceType,
        installedAt: m.installedAt?.toISOString() ?? null,
        unitId: m.subscription.unitId,
        unitName: m.subscription.unit?.name ?? null,
        subscriptionId: m.subscriptionId,
      }))}
      subscriptions={subscriptions.map((s) => ({
        id: s.id,
        serviceType: s.serviceType,
        scope: s.scope,
        status: s.status,
        contractNumber: s.contractNumber,
        provider: s.provider,
        power: (s as unknown as { power?: string }).power ?? null,
        unitName: s.unit?.name ?? null,
        unitId: s.unitId,
      }))}
      coOwners={coOwners.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        sharePercent: c.sharePercent,
        order: c.order,
      }))}
    />
  );
}
