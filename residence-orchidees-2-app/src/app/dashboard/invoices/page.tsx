import { prisma } from "@/lib/prisma";
import { InvoicesClient } from "./InvoicesClient";
import { getAttachmentMap } from "@/lib/attachments";

async function getDashboardData() {
  const [invoices, subscriptions] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { period: "desc" },
      include: { subscription: { include: { unit: true } } },
    }),
    prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { unit: { select: { name: true } } },
      orderBy: [{ unit: { name: "asc" } }, { serviceType: "asc" }],
    }),
  ]);
  return { invoices, subscriptions };
}

export default async function InvoicesPage() {
  const { invoices, subscriptions } = await getDashboardData();
  const attMap = await getAttachmentMap("invoice", invoices.map((i) => i.id));

  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.paid).length,
    pending: invoices.filter((i) => !i.paid).length,
    totalAmount: invoices.reduce((acc, i) => acc + i.amount, 0),
    pendingAmount: invoices.filter((i) => !i.paid).reduce((acc, i) => acc + i.amount, 0),
  };

  return (
    <InvoicesClient
      invoices={invoices.map((i) => ({
        id: i.id, reference: i.reference, amount: i.amount,
        period: i.period.toISOString(), dueDate: i.dueDate?.toISOString() ?? null,
        paid: i.paid, paidAt: i.paidAt?.toISOString() ?? null,
        unitName: i.subscription.unit?.name ?? "Général",
        serviceType: i.subscription.serviceType,
        attachments: attMap[i.id] ?? [],
      }))}
      stats={stats}
      subscriptions={subscriptions.map(s => ({
        id: s.id,
        serviceType: s.serviceType,
        unitName: s.unit?.name ?? "Général",
      }))}
    />
  );
}
