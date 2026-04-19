"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface AdminSession {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

async function getAdminSession(): Promise<AdminSession> {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== "ADMIN") throw new Error("Unauthorized");
  return session as unknown as AdminSession;
}

async function logAudit(
  session: AdminSession,
  entity: string,
  entityId: string,
  entityLabel: string,
  changes: Record<string, { old: string | null; new: string | null }>
) {
  for (const [field, { old: oldValue, new: newValue }] of Object.entries(changes)) {
    if (oldValue === newValue) continue;
    await prisma.auditLog.create({
      data: {
        userName: session.user.name ?? "Admin",
        userEmail: session.user.email ?? "",
        entity,
        entityId,
        entityLabel,
        field,
        oldValue,
        newValue,
      },
    });
  }
}

export async function updateUnitAdmin(
  id: string,
  data: {
    name?: string;
    floor?: number | null;
    area?: number | null;
    description?: string | null;
    occupantName?: string | null;
    occupantPhone?: string | null;
    occupantEmail?: string | null;
    occupantType?: string | null;
    occupantSince?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getAdminSession();
    const before = await prisma.unit.findUnique({ where: { id } });
    if (!before) return { success: false, error: "Introuvable" };

    await prisma.unit.update({
      where: { id },
      data: {
        ...data,
        occupantSince: data.occupantSince ? new Date(data.occupantSince) : null,
      },
    });

    await logAudit(session, "Unit", id, before.name, {
      name: { old: before.name, new: data.name ?? before.name },
      floor: { old: String(before.floor ?? ""), new: String(data.floor ?? "") },
      area: { old: String(before.area ?? ""), new: String(data.area ?? "") },
      description: { old: before.description ?? null, new: data.description ?? null },
      occupantName: { old: before.occupantName ?? null, new: data.occupantName ?? null },
      occupantPhone: { old: before.occupantPhone ?? null, new: data.occupantPhone ?? null },
      occupantType: { old: before.occupantType ?? null, new: data.occupantType ?? null },
    });

    revalidatePath("/dashboard/admin/data");
    revalidatePath("/dashboard/units");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateMeterAdmin(
  id: string,
  data: {
    serialNumber?: string;
    installedAt?: string | null;
    unitId?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getAdminSession();
    const before = await prisma.meter.findUnique({
      where: { id },
      include: { subscription: true },
    });
    if (!before) return { success: false, error: "Introuvable" };

    await prisma.meter.update({
      where: { id },
      data: {
        serialNumber: data.serialNumber,
        installedAt: data.installedAt ? new Date(data.installedAt) : null,
      },
    });

    // Update unitId on subscription if provided
    if (data.unitId !== undefined) {
      await prisma.subscription.update({
        where: { id: before.subscriptionId },
        data: { unitId: data.unitId },
      });
    }

    await logAudit(session, "Meter", id, before.serialNumber, {
      serialNumber: { old: before.serialNumber, new: data.serialNumber ?? before.serialNumber },
      installedAt: { old: before.installedAt?.toISOString() ?? null, new: data.installedAt ?? null },
    });

    revalidatePath("/dashboard/admin/data");
    revalidatePath("/dashboard/meters");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateSubscriptionAdmin(
  id: string,
  data: {
    contractNumber?: string | null;
    provider?: string | null;
    power?: string | null;
    status?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getAdminSession();
    const before = await prisma.subscription.findUnique({ where: { id } });
    if (!before) return { success: false, error: "Introuvable" };

    await prisma.subscription.update({
      where: { id },
      data: data as Parameters<typeof prisma.subscription.update>[0]["data"],
    });

    await logAudit(session, "Subscription", id, `${before.serviceType} ${before.scope}`, {
      contractNumber: { old: before.contractNumber ?? null, new: data.contractNumber ?? null },
      provider: { old: before.provider ?? null, new: data.provider ?? null },
      power: { old: (before as { power?: string }).power ?? null, new: data.power ?? null },
    });

    revalidatePath("/dashboard/admin/data");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateCoOwnerAdmin(
  id: string,
  data: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    sharePercent?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getAdminSession();
    const before = await prisma.coOwner.findUnique({ where: { id } });
    if (!before) return { success: false, error: "Introuvable" };

    await prisma.coOwner.update({ where: { id }, data });

    await logAudit(session, "CoOwner", id, before.name, {
      name: { old: before.name, new: data.name ?? before.name },
      email: { old: before.email ?? null, new: data.email ?? null },
      phone: { old: before.phone ?? null, new: data.phone ?? null },
      sharePercent: { old: String(before.sharePercent), new: String(data.sharePercent ?? before.sharePercent) },
    });

    revalidatePath("/dashboard/admin/data");
    revalidatePath("/dashboard/revenue");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function getAuditLogs(entity: string, entityId: string) {
  return prisma.auditLog.findMany({
    where: { entity, entityId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
