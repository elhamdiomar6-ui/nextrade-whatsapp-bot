import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AcquereursClient from "./AcquereursClient";

export default async function AcquereursPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const acquereurs = await prisma.acquereur.findMany({
    include: {
      contacts: { orderBy: { date: "desc" } },
      documents: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: acquereurs.length,
    actifs: acquereurs.filter((a) => !["PERDU", "ACTE"].includes(a.statut)).length,
    enNegociation: acquereurs.filter((a) => a.statut === "NEGOCIATION").length,
    actes: acquereurs.filter((a) => a.statut === "ACTE").length,
  };

  return (
    <AcquereursClient
      acquereurs={acquereurs as any}
      stats={stats}
      userRole={(session.user as { role?: string })?.role ?? "VIEWER"}
    />
  );
}
