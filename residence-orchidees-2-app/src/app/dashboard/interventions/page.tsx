import { prisma } from "@/lib/prisma";
import { InterventionsClient } from "./InterventionsClient";
import { getAttachmentMap } from "@/lib/attachments";

export default async function InterventionsPage() {
  const interventions = await prisma.intervention.findMany({
    orderBy: { date: "desc" },
    include: { contractor: true, _count: { select: { media: true, documents: true } } },
  });

  const attMap = await getAttachmentMap("intervention", interventions.map((i) => i.id));

  return (
    <InterventionsClient
      interventions={interventions.map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        date: i.date.toISOString(),
        status: i.status,
        contractorName: i.contractor?.name ?? null,
        contractorPhone: i.contractor?.phone ?? null,
        mediaCount: i._count.media,
        documentsCount: i._count.documents,
        attachments: attMap[i.id] ?? [],
      }))}
    />
  );
}
