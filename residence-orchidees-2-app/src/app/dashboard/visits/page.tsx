import { prisma } from "@/lib/prisma";
import { VisitsClient } from "./VisitsClient";
import { getAttachmentMap } from "@/lib/attachments";

export default async function VisitsPage() {
  const visits = await prisma.agentVisit.findMany({
    orderBy: { date: "desc" },
    include: {
      readings: { include: { meter: { include: { subscription: { include: { unit: true } } } } } },
      _count: { select: { documents: true } },
    },
  });

  const attMap = await getAttachmentMap("visit", visits.map((v) => v.id));

  return (
    <VisitsClient
      visits={visits.map((v) => ({
        id: v.id,
        date: v.date.toISOString(),
        agentName: v.agentName,
        company: v.company,
        notes: v.notes,
        readingsCount: v.readings.length,
        documentsCount: v._count.documents,
        unitsVisited: [
          ...new Set(
            v.readings
              .map((r) => r.meter.subscription.unit?.name)
              .filter(Boolean) as string[]
          ),
        ],
        attachments: attMap[v.id] ?? [],
      }))}
    />
  );
}
