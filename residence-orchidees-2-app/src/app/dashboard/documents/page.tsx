import { prisma } from "@/lib/prisma";
import { DocumentsClient } from "./DocumentsClient";

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({
    orderBy: { date: "desc" },
    include: {
      subscription: { include: { unit: true } },
      intervention: true,
      expense: true,
    },
  });

  return (
    <DocumentsClient
      documents={documents.map((d) => ({
        id: d.id,
        title: d.title,
        type: d.type,
        url: d.url,
        date: d.date.toISOString(),
        context: d.intervention?.title ?? d.expense?.title ?? d.subscription?.unit?.name ?? "Général",
      }))}
    />
  );
}
