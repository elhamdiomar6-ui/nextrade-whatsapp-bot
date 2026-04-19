import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminDocumentsClient } from "./AdminDocumentsClient";

export default async function AdminDocumentsPage() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") redirect("/dashboard");

  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscription: { include: { unit: true } },
      intervention: true,
      expense: true,
      invoice: true,
    },
  });

  return (
    <AdminDocumentsClient
      documents={documents.map((d) => ({
        id: d.id,
        title: d.title,
        type: d.type as string,
        url: d.url,
        date: d.date.toISOString(),
        createdAt: d.createdAt.toISOString(),
        isOfficial: (d as unknown as { isOfficial?: boolean }).isOfficial ?? false,
        context: d.intervention?.title ?? d.expense?.title ?? d.subscription?.unit?.name ?? "Général",
        entityType: d.interventionId ? "intervention" : d.expenseId ? "expense" : d.subscriptionId ? "subscription" : d.invoiceId ? "invoice" : "general",
        subscriptionId: d.subscriptionId,
        interventionId: d.interventionId,
        expenseId: d.expenseId,
        invoiceId: d.invoiceId,
      }))}
    />
  );
}
