import { prisma } from "./prisma";
import type { AttachmentRow } from "@/actions/attachments";

/**
 * Récupère toutes les pièces jointes pour une liste d'entités du même type.
 * Retourne un Map entityId → AttachmentRow[]
 */
export async function getAttachmentMap(
  entityType: string,
  entityIds: string[]
): Promise<Record<string, AttachmentRow[]>> {
  if (entityIds.length === 0) return {};

  const rows = await prisma.attachment.findMany({
    where: { entityType, entityId: { in: entityIds } },
    orderBy: { createdAt: "desc" },
  });

  const map: Record<string, AttachmentRow[]> = {};
  for (const r of rows) {
    if (!map[r.entityId]) map[r.entityId] = [];
    map[r.entityId].push({
      id:        r.id,
      url:       r.url,
      name:      r.name,
      mimeType:  r.mimeType,
      size:      r.size,
      createdAt: r.createdAt.toISOString(),
    });
  }
  return map;
}
