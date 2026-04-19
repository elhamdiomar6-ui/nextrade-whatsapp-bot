"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cloudinaryDestroy } from "@/lib/cloudinary";

type PData = {
  metier: string;
  metierLibre?: string;
  nomSociete: string;
  responsable?: string;
  telephone?: string;
  whatsapp?: string;
  email?: string;
  adresse?: string;
  rc?: string;
  identifiantFiscal?: string;
  specialite?: string;
  zonesIntervention?: string[];
  montantMarche?: number;
  montantPaye?: number;
  dateDebut?: string;
  dateFin?: string;
  statut?: string;
  noteSatisfaction?: number;
  garantieDuree?: string;
  garantieExpiration?: string;
  notes?: string;
  metierData?: Record<string, string>;
  autresMetiers?: string[];
  recommande?: boolean;
  blackliste?: boolean;
};

export async function createPrestataire(data: PData) {
  await prisma.prestataire.create({
    data: {
      metier: data.metier as any,
      metierLibre: data.metierLibre,
      nomSociete: data.nomSociete,
      responsable: data.responsable,
      telephone: data.telephone,
      whatsapp: data.whatsapp,
      email: data.email,
      adresse: data.adresse,
      rc: data.rc,
      identifiantFiscal: data.identifiantFiscal,
      specialite: data.specialite,
      zonesIntervention: data.zonesIntervention?.length ? JSON.stringify(data.zonesIntervention) : null,
      montantMarche: data.montantMarche,
      montantPaye: data.montantPaye ?? 0,
      dateDebut: data.dateDebut ? new Date(data.dateDebut) : null,
      dateFin: data.dateFin ? new Date(data.dateFin) : null,
      statut: (data.statut as any) ?? "EN_COURS",
      noteSatisfaction: data.noteSatisfaction ?? null,
      garantieDuree: data.garantieDuree,
      garantieExpiration: data.garantieExpiration ? new Date(data.garantieExpiration) : null,
      notes: data.notes,
      metierData: data.metierData ? JSON.stringify(data.metierData) : null,
      autresMetiers: data.autresMetiers?.length ? JSON.stringify(data.autresMetiers) : null,
      recommande: data.recommande ?? false,
      blackliste: data.blackliste ?? false,
    },
  });
  revalidatePath("/dashboard/prestataires");
}

export async function updatePrestataire(id: string, data: Partial<PData>) {
  await prisma.prestataire.update({
    where: { id },
    data: {
      metier: data.metier as any,
      metierLibre: data.metierLibre,
      nomSociete: data.nomSociete,
      responsable: data.responsable,
      telephone: data.telephone,
      whatsapp: data.whatsapp,
      email: data.email,
      adresse: data.adresse,
      rc: data.rc,
      identifiantFiscal: data.identifiantFiscal,
      specialite: data.specialite,
      zonesIntervention: data.zonesIntervention !== undefined
        ? (data.zonesIntervention.length ? JSON.stringify(data.zonesIntervention) : null)
        : undefined,
      montantMarche: data.montantMarche,
      montantPaye: data.montantPaye,
      dateDebut: data.dateDebut !== undefined ? (data.dateDebut ? new Date(data.dateDebut) : null) : undefined,
      dateFin: data.dateFin !== undefined ? (data.dateFin ? new Date(data.dateFin) : null) : undefined,
      statut: data.statut as any,
      noteSatisfaction: data.noteSatisfaction !== undefined ? (data.noteSatisfaction || null) : undefined,
      garantieDuree: data.garantieDuree,
      garantieExpiration: data.garantieExpiration !== undefined
        ? (data.garantieExpiration ? new Date(data.garantieExpiration) : null)
        : undefined,
      notes: data.notes,
      metierData: data.metierData !== undefined ? (data.metierData ? JSON.stringify(data.metierData) : null) : undefined,
      autresMetiers: data.autresMetiers !== undefined ? (data.autresMetiers?.length ? JSON.stringify(data.autresMetiers) : null) : undefined,
      recommande: data.recommande !== undefined ? data.recommande : undefined,
      blackliste: data.blackliste !== undefined ? data.blackliste : undefined,
    },
  });
  revalidatePath("/dashboard/prestataires");
}

export async function deletePrestataire(id: string) {
  await prisma.prestataire.delete({ where: { id } });
  revalidatePath("/dashboard/prestataires");
}

export async function addPrestataireDocument(
  prestataireId: string,
  data: { title: string; url: string; type?: string }
) {
  await prisma.prestataireDocument.create({
    data: { prestataireId, title: data.title, url: data.url, type: data.type ?? "autre" },
  });
  revalidatePath("/dashboard/prestataires");
}

export async function deletePrestataireDocument(id: string) {
  const doc = await prisma.prestataireDocument.findUnique({ where: { id } });
  if (doc?.url) await cloudinaryDestroy(doc.url);
  await prisma.prestataireDocument.delete({ where: { id } });
  revalidatePath("/dashboard/prestataires");
}
