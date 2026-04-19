"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createOccupant(data: {
  nom: string; prenom: string; cin?: string; dateNaissance?: string;
  nationalite?: string; situationFam?: string; nbEnfants?: number; nomConjoint?: string;
  telephone?: string; whatsapp?: string; email?: string; adresse?: string;
  unitId?: string; type?: string; dateEntree?: string; dateSortie?: string;
  loyer?: number; caution?: number; statut?: string;
}) {
  await prisma.occupant.create({
    data: {
      nom: data.nom,
      prenom: data.prenom,
      cin: data.cin,
      dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
      nationalite: data.nationalite ?? "Marocaine",
      situationFam: (data.situationFam as any) ?? "CELIBATAIRE",
      nbEnfants: data.nbEnfants ?? 0,
      nomConjoint: data.nomConjoint,
      telephone: data.telephone,
      whatsapp: data.whatsapp,
      email: data.email,
      adresse: data.adresse,
      unitId: data.unitId || null,
      type: (data.type as any) ?? "LOCATAIRE",
      dateEntree: data.dateEntree ? new Date(data.dateEntree) : null,
      dateSortie: data.dateSortie ? new Date(data.dateSortie) : null,
      loyer: data.loyer,
      caution: data.caution,
      statut: (data.statut as any) ?? "ACTIF",
    },
  });
  revalidatePath("/dashboard/occupants");
}

export async function updateOccupant(id: string, data: Partial<{
  nom: string; prenom: string; cin: string; dateNaissance: string;
  nationalite: string; situationFam: string; nbEnfants: number; nomConjoint: string;
  telephone: string; whatsapp: string; email: string; adresse: string;
  unitId: string; type: string; dateEntree: string; dateSortie: string;
  loyer: number; caution: number; statut: string;
}>) {
  await prisma.occupant.update({
    where: { id },
    data: {
      ...data,
      dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
      dateEntree: data.dateEntree ? new Date(data.dateEntree) : undefined,
      dateSortie: data.dateSortie ? new Date(data.dateSortie) : undefined,
      situationFam: data.situationFam as any,
      type: data.type as any,
      statut: data.statut as any,
      unitId: data.unitId || null,
    },
  });
  revalidatePath("/dashboard/occupants");
}

export async function deleteOccupant(id: string) {
  await prisma.occupant.delete({ where: { id } });
  revalidatePath("/dashboard/occupants");
}
