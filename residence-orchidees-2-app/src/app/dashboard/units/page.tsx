import { prisma } from "@/lib/prisma";
import { UnitsClient } from "./UnitsClient";

export default async function UnitsPage() {
  const units = await prisma.unit.findMany({
    orderBy: [{ kind: "asc" }, { name: "asc" }],
    include: {
      subscriptions: { include: { meters: true } },
      lot: true,
    },
  });

  return (
    <UnitsClient
      units={units.map((u) => ({
        id: u.id,
        name: u.name,
        kind: u.kind,
        floor: u.floor,
        subscriptionsCount: u.subscriptions.length,
        metersCount: u.subscriptions.flatMap((s) => s.meters).length,
        hasLot: !!u.lot,
        lotStatus: u.lot?.status ?? null,
        lotPrice: u.lot?.price ?? null,
      }))}
    />
  );
}
