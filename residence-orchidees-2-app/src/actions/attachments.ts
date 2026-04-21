"use server";

import { prisma } from "@/lib/prisma";
import { cloudinaryDestroy } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

export interface AttachmentRow {
  id: string;
  url: string;
  name: string;
  mimeType: string;
  size: number;
  category: string | null;
  createdAt: string;
}

const entityPaths: Record<string, string> = {
  intervention: "/dashboard/interventions",
  visit:        "/dashboard/visits",
  expense:      "/dashboard/expenses",
  invoice:      "/dashboard/invoices",
  prospect:     "/dashboard/prospects",
  sale:         "/dashboard/sales",
  reading:      "/dashboard/readings",
  unit:         "/dashboard/units",
  meter:        "/dashboard/meters",
};

export async function addAttachment(data: {
  url: string;
  name: string;
  mimeType: string;
  size: number;
  entityType: string;
  entityId: string;
  category?: string | null;
}): Promise<AttachmentRow> {
  const att = await prisma.attachment.create({ data });
  revalidatePath(entityPaths[data.entityType] ?? "/dashboard");
  return {
    id:        att.id,
    url:       att.url,
    name:      att.name,
    mimeType:  att.mimeType,
    size:      att.size,
    category:  att.category ?? null,
    createdAt: att.createdAt.toISOString(),
  };
}

export async function deleteAttachment(
  id: string,
  url: string,
  entityType: string
): Promise<void> {
  await prisma.attachment.delete({ where: { id } });
  await cloudinaryDestroy(url);
  revalidatePath(entityPaths[entityType] ?? "/dashboard");
}
