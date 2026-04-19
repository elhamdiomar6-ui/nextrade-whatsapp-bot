import { prisma } from "@/lib/prisma";
import { SalesClient } from "./SalesClient";
import { getAttachmentMap } from "@/lib/attachments";

export default async function SalesPage() {
  const [sales, availableLots] = await Promise.all([
    prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        lot: true,
        paymentSchedule: { orderBy: { dueDate: "asc" } },
        distributions: { include: { shares: { include: { coOwner: true } } } },
      },
    }),
    prisma.lot.findMany({ where: { status: "DISPONIBLE" }, orderBy: { name: "asc" } }),
  ]);

  const attMap = await getAttachmentMap("sale", sales.map((s) => s.id));

  const stats = {
    reserve:     sales.filter((s) => s.status === "RESERVE").length,
    enCours:     sales.filter((s) => s.status === "EN_COURS").length,
    acteSigne:   sales.filter((s) => s.status === "ACTE_SIGNE").length,
    livre:       sales.filter((s) => s.status === "LIVRE").length,
    totalRevenue: sales
      .filter((s) => s.status === "ACTE_SIGNE" || s.status === "LIVRE")
      .reduce((acc, s) => acc + s.totalAmount, 0),
  };

  return (
    <SalesClient
      sales={sales.map((s) => ({
        id: s.id, status: s.status, totalAmount: s.totalAmount,
        depositAmount: s.depositAmount, contractUrl: s.contractUrl,
        buyerName: s.buyerName, buyerPhone: s.buyerPhone,
        notaryName: s.notaryName, notaryPhone: s.notaryPhone,
        signingDate: s.signingDate?.toISOString() ?? null,
        deliveryDate: s.deliveryDate?.toISOString() ?? null,
        notes: s.notes,
        lot: { id: s.lot.id, name: s.lot.name, kind: s.lot.kind },
        paidTotal: s.paymentSchedule.filter((p) => p.paid).reduce((acc, p) => acc + p.amount, 0),
        scheduledCount: s.paymentSchedule.length,
        paidCount: s.paymentSchedule.filter((p) => p.paid).length,
        createdAt: s.createdAt.toISOString(),
        attachments: attMap[s.id] ?? [],
        paymentSchedule: s.paymentSchedule.map((t) => ({
          id: t.id, label: t.label, amount: t.amount,
          dueDate: t.dueDate.toISOString(), paid: t.paid,
          paidAt: t.paidAt?.toISOString() ?? null,
        })),
      }))}
      stats={stats}
      availableLots={availableLots.map((l) => ({ id: l.id, name: l.name, kind: l.kind, price: l.price }))}
    />
  );
}
