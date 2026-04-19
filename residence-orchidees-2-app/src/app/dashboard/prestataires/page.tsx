import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PrestatairesClient from "./PrestatairesClient";

export default async function PrestatairesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const prestataires = await prisma.prestataire.findMany({
    include: { documents: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: prestataires.length,
    enCours: prestataires.filter((p) => p.statut === "EN_COURS").length,
    termines: prestataires.filter((p) => p.statut === "TERMINE").length,
    totalMarche: prestataires.reduce((s, p) => s + (p.montantMarche ?? 0), 0),
    totalPaye: prestataires.reduce((s, p) => s + (p.montantPaye ?? 0), 0),
  };

  return (
    <PrestatairesClient
      prestataires={prestataires as any}
      stats={stats}
      userRole={(session.user as { role?: string })?.role ?? "VIEWER"}
    />
  );
}
