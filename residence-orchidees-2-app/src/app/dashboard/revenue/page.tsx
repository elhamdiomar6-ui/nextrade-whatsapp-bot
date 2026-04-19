import { prisma } from "@/lib/prisma";
import { RevenueClient } from "./RevenueClient";

export default async function RevenuePage() {
  const [coOwners, distributions, lots] = await Promise.all([
    prisma.coOwner.findMany({ orderBy: { order: "asc" } }),
    prisma.revenueDistribution.findMany({
      orderBy: { date: "desc" },
      include: {
        sale: { include: { lot: true } },
        shares: { include: { coOwner: true } },
      },
    }),
    prisma.lot.findMany({
      where: { status: "VENDU" },
      include: { sale: true },
    }),
  ]);

  const totalDistributed = distributions.reduce(
    (acc, d) => acc + d.totalAmount,
    0
  );

  const perOwnerTotal = coOwners.map((co) => {
    const total = distributions
      .flatMap((d) => d.shares)
      .filter((s) => s.coOwnerId === co.id)
      .reduce((acc, s) => acc + s.amount, 0);
    return { coOwnerId: co.id, total };
  });

  return (
    <RevenueClient
      coOwners={coOwners.map((co) => ({
        id: co.id,
        name: co.name,
        sharePercent: co.sharePercent,
        totalReceived:
          perOwnerTotal.find((p) => p.coOwnerId === co.id)?.total ?? 0,
      }))}
      distributions={distributions.map((d) => ({
        id: d.id,
        date: d.date.toISOString(),
        totalAmount: d.totalAmount,
        notes: d.notes,
        lotName: d.sale.lot.name,
        shares: d.shares.map((s) => ({
          coOwnerName: s.coOwner.name,
          amount: s.amount,
          sharePercent: s.sharePercent,
        })),
      }))}
      availableLots={lots.map((l) => ({
        id: l.id,
        name: l.name,
        saleId: l.sale?.id ?? null,
        saleAmount: l.sale?.totalAmount ?? 0,
      }))}
      totalDistributed={totalDistributed}
    />
  );
}
