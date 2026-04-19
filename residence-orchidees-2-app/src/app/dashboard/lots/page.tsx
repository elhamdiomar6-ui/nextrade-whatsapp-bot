import { prisma } from "@/lib/prisma";
import { LotsClient } from "./LotsClient";

export default async function LotsPage() {
  const lots = await prisma.lot.findMany({
    orderBy: [{ floor: "asc" }, { name: "asc" }],
    include: {
      unit: true,
      sale: true,
      prospectLots: { include: { prospect: true } },
      media: true,
    },
  });

  const stats = {
    disponible: lots.filter((l) => l.status === "DISPONIBLE").length,
    reserve: lots.filter((l) => l.status === "RESERVE").length,
    vendu: lots.filter((l) => l.status === "VENDU").length,
  };

  return (
    <LotsClient
      lots={lots.map((l) => ({
        id: l.id,
        name: l.name,
        reference: l.reference,
        status: l.status,
        price: l.price,
        area: l.area,
        floor: l.floor,
        kind: l.kind,
        description: l.description,
        mediaCount: l.media.length,
        prospectsCount: l.prospectLots.length,
        hasSale: !!l.sale,
        saleStatus: l.sale?.status ?? null,
      }))}
      stats={stats}
    />
  );
}
