import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ConstructionClient from "./ConstructionClient";

// Métiers liés à la construction
const CONSTRUCTION_METIERS = [
  "VENDEUR_TERRAIN", "ORGANISME_URBANISME", "NOTAIRE",
  "GEOMETRE", "TOPOGRAPHIE",
  "ARCHITECTE", "INGENIEUR_GENIE_CIVIL", "BUREAU_CONTROLE",
  "TERRASSEMENT", "MACONNERIE", "BETON_COFFRAGE",
  "PLOMBERIE_SANITAIRE", "ELECTRICITE", "CLIMATISATION_VENTILATION",
  "MENUISERIE_BOIS", "MENUISERIE_ALUMINIUM", "FERRONNERIE_SERRURERIE",
  "CARRELAGE_REVETEMENT", "PEINTURE_BATIMENT", "PLATRERIE_ENDUIT",
  "ETANCHEITE_ISOLATION", "ASCENSEUR",
  "SECURITE_INCENDIE", "TRANSPORT_LIVRAISON", "LOCATION_ENGINS",
  "FOURNISSEUR_MATERIAUX",
] as const;

export default async function ConstructionPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const prestataires = await prisma.prestataire.findMany({
    include: { documents: true },
    orderBy: { createdAt: "desc" },
  });

  // KPIs financiers
  const total = prestataires.reduce((s, p) => s + (p.montantMarche ?? 0), 0);
  const paye  = prestataires.reduce((s, p) => s + (p.montantPaye  ?? 0), 0);
  const reste = total - paye;
  const actifs = prestataires.filter(p => p.statut === "EN_COURS").length;
  const garantie = prestataires.filter(p => p.statut === "GARANTIE").length;
  const termines = prestataires.filter(p => p.statut === "TERMINE" || p.statut === "CLOTURE").length;

  // Garanties expirant dans 60j
  const in60 = new Date();
  in60.setDate(in60.getDate() + 60);
  const garantiesProches = prestataires.filter(
    p => p.garantieExpiration && new Date(p.garantieExpiration) <= in60 && new Date(p.garantieExpiration) > new Date()
  ).length;

  const stats = { total, paye, reste, actifs, garantie, termines, garantiesProches };

  return (
    <ConstructionClient
      prestataires={prestataires as any}
      stats={stats}
      userRole={(session.user as { role?: string })?.role ?? "VIEWER"}
    />
  );
}
