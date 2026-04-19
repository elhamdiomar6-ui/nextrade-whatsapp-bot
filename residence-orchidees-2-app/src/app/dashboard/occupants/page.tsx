import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import OccupantsClient from "./OccupantsClient";

export default async function OccupantsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [occupants, units] = await Promise.all([
    prisma.occupant.findMany({
      include: { unit: true, documents: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
  ]);

  const stats = {
    total: occupants.length,
    actifs: occupants.filter((o) => o.statut === "ACTIF").length,
    locataires: occupants.filter((o) => o.type === "LOCATAIRE").length,
    proprietaires: occupants.filter((o) => o.type === "PROPRIETAIRE").length,
  };

  return (
    <OccupantsClient
      occupants={occupants as any}
      units={units as any}
      stats={stats}
      userRole={(session.user as { role?: string })?.role ?? "VIEWER"}
    />
  );
}
