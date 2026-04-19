import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MonEspaceClient } from "./MonEspaceClient";

type SessionUser = { id?: string; name?: string | null; role?: string; unitId?: string | null };

export default async function MonEspacePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as SessionUser;

  // Allow OCCUPANT + any role that has a unitId
  const unitId = user.unitId;
  if (!unitId) {
    // No unit linked — show empty state
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
          Aucune unité liée à votre compte
        </h2>
        <p>Contactez l&apos;administrateur pour lier votre compte à une unité.</p>
      </div>
    );
  }

  // Fetch unit with subscriptions, meters, readings, invoices, documents
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      subscriptions: {
        where: { status: { not: "TERMINATED" } },
        include: {
          meters: {
            include: {
              readings: { orderBy: { date: "desc" }, take: 3 },
            },
          },
          invoices: {
            orderBy: { dueDate: "desc" },
            take: 10,
          },
          documents: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      },
    },
  });

  if (!unit) redirect("/dashboard");

  // Active interventions for the residence
  const interventions = await prisma.intervention.findMany({
    where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
    orderBy: { date: "desc" },
    take: 5,
  });

  // Unread notifications
  const notifications = await prisma.occupantNotification.findMany({
    where: { userId: user.id!, read: false },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Unread messages count
  const unreadMessages = await prisma.occupantMessage.count({
    where: { unitId, isAdmin: true, read: false },
  });

  return (
    <MonEspaceClient
      unit={unit as any}
      userName={user.name ?? ""}
      interventions={interventions as any}
      notifications={notifications as any}
      unreadMessages={unreadMessages}
    />
  );
}
