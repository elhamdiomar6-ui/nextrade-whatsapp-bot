"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createAcquereur(data: {
  nom: string; prenom: string; cin?: string; dateNaissance?: string;
  nationalite?: string; profession?: string; situationFam?: string; nbEnfants?: number;
  telephone?: string; whatsapp?: string; email?: string; adresse?: string;
  unitesCiblees?: string[]; budgetMax?: number; financement?: string;
  banque?: string; apport?: number; agentResponsable?: string; notes?: string;
}) {
  await prisma.acquereur.create({
    data: {
      nom: data.nom,
      prenom: data.prenom,
      cin: data.cin,
      dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
      nationalite: data.nationalite ?? "Marocaine",
      profession: data.profession,
      situationFam: (data.situationFam as any) ?? "CELIBATAIRE",
      nbEnfants: data.nbEnfants ?? 0,
      telephone: data.telephone,
      whatsapp: data.whatsapp,
      email: data.email,
      adresse: data.adresse,
      unitesCiblees: data.unitesCiblees ? JSON.stringify(data.unitesCiblees) : null,
      budgetMax: data.budgetMax,
      financement: (data.financement as any) ?? "CASH",
      banque: data.banque,
      apport: data.apport,
      agentResponsable: data.agentResponsable,
      notes: data.notes,
      statut: "NOUVEAU",
    },
  });
  revalidatePath("/dashboard/acquereurs");
}

export async function updateAcquereur(id: string, data: Partial<{
  nom: string; prenom: string; cin: string; dateNaissance: string;
  nationalite: string; profession: string; situationFam: string; nbEnfants: number;
  telephone: string; whatsapp: string; email: string; adresse: string;
  unitesCiblees: string[]; budgetMax: number; financement: string;
  banque: string; apport: number; statut: string; agentResponsable: string;
  prochaineAction: string; prochaineDate: string; notes: string;
}>) {
  await prisma.acquereur.update({
    where: { id },
    data: {
      ...data,
      dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
      prochaineDate: data.prochaineDate ? new Date(data.prochaineDate) : undefined,
      situationFam: data.situationFam as any,
      financement: data.financement as any,
      statut: data.statut as any,
      unitesCiblees: data.unitesCiblees ? JSON.stringify(data.unitesCiblees) : undefined,
    },
  });
  revalidatePath("/dashboard/acquereurs");
}

export async function deleteAcquereur(id: string) {
  await prisma.acquereur.delete({ where: { id } });
  revalidatePath("/dashboard/acquereurs");
}

export async function addAcquereurContact(acquereurId: string, data: {
  type: string; date: string; notes?: string;
}) {
  await prisma.acquereurContact.create({
    data: {
      acquereurId,
      type: data.type,
      date: new Date(data.date),
      notes: data.notes,
    },
  });
  revalidatePath("/dashboard/acquereurs");
}
