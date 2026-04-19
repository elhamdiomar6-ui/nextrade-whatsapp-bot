"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface SuggestedAction {
  id: string;
  type: string;
  label: string;
  priority: number;
  data: Record<string, unknown>;
}

interface ConfirmPayload {
  fileUrl: string;
  fileName: string;
  docType: string;
  confidence: number;
  linkedUnit: string | null;
  linkedMeter: string | null;
  data: Record<string, unknown>;
  selectedActions: SuggestedAction[];
}

export async function smartIntakeConfirm(payload: ConfirmPayload) {
  const session = await auth();
  if (!session) throw new Error("Non autorisé");

  const user = session.user as { email?: string; name?: string };
  const done: string[] = [];
  const errors: string[] = [];
  const residence = await prisma.residence.findFirst();
  if (!residence) throw new Error("Résidence introuvable");

  for (const action of payload.selectedActions) {
    try {
      switch (action.type) {

        case "CREATE_INVOICE": {
          // Find subscription
          let sub: { id: string } | null = null;
          if (payload.linkedUnit) {
            const unit = await prisma.unit.findFirst({ where: { name: payload.linkedUnit, residenceId: residence.id } });
            if (unit) {
              const svcType = payload.docType === "water_bill" ? "WATER" : "ELECTRICITY";
              sub = await prisma.subscription.findFirst({ where: { unitId: unit.id, serviceType: svcType } });
            }
          }
          if (!sub) break;
          const d = payload.data;
          await prisma.invoice.create({
            data: {
              subscriptionId: sub.id,
              reference: (d.clientNumber as string) ?? (d.reference as string) ?? undefined,
              amount: (d.amountTTC as number) ?? (d.amount as number) ?? 0,
              period: d.periodStart ? new Date(d.periodStart as string) : new Date(),
              dueDate: d.dueDate ? new Date(d.dueDate as string) : undefined,
              paid: false,
            },
          });
          done.push("Facture créée");
          revalidatePath("/dashboard/invoices");
          break;
        }

        case "CREATE_READING": {
          const d = payload.data;
          const serial = (d.meterNumber as string) ?? payload.linkedMeter;
          if (!serial) break;
          const meter = await prisma.meter.findFirst({ where: { serialNumber: serial } });
          if (!meter) break;
          const lastReading = await prisma.meterReading.findFirst({
            where: { meterId: meter.id },
            orderBy: { date: "desc" },
          });
          await prisma.meterReading.create({
            data: {
              meterId: meter.id,
              value: (d.currentIndex as number) ?? (d.index as number) ?? 0,
              previousValue: (d.previousIndex as number) ?? lastReading?.value ?? undefined,
              date: d.periodEnd ? new Date(d.periodEnd as string) : d.date ? new Date(d.date as string) : new Date(),
              mode: "MANUAL",
              photoUrl: payload.fileUrl ?? undefined,
            },
          });
          done.push("Relevé compteur enregistré");
          revalidatePath("/dashboard/readings");
          break;
        }

        case "CREATE_ALERT": {
          const d = action.data;
          await prisma.alert.create({
            data: {
              residenceId: residence.id,
              title: (d.title as string) ?? "Alerte document",
              message: (d.message as string) ?? payload.fileName,
              level: (d.level as "INFO" | "WARNING" | "CRITICAL") ?? "INFO",
            },
          });
          done.push("Alerte créée");
          break;
        }

        case "ADD_PRESTATAIRE_DOC": {
          const d = payload.data;
          const companyName = (d.company as string) ?? "";
          let prest = companyName
            ? await prisma.prestataire.findFirst({ where: { nomSociete: { contains: companyName } } })
            : null;
          if (!prest && companyName) {
            prest = await prisma.prestataire.create({
              data: {
                nomSociete: companyName,
                metier: "AUTRE" as never,
                statut: "EN_COURS" as never,
                montantMarche: (d.amountTTC as number) ?? (d.amountHT as number) ?? undefined,
              },
            });
            done.push(`Fiche prestataire "${companyName}" créée`);
          }
          if (prest) {
            await prisma.prestataireDocument.create({
              data: {
                prestataireId: prest.id,
                title: payload.fileName.replace(/\.[^.]+$/, ""),
                url: payload.fileUrl,
                type: payload.docType === "contractor_invoice" ? "facture" : "devis",
              },
            });
            done.push("Document ajouté au prestataire");
            revalidatePath("/dashboard/prestataires");
          }
          break;
        }

        case "SAVE_DOCUMENT": {
          // Find best entity to link to
          let interventionId: string | undefined;
          const expenseId: string | undefined = undefined;
          if (payload.linkedUnit) {
            const lastIntervention = await prisma.intervention.findFirst({
              where: { residenceId: residence.id },
              orderBy: { createdAt: "desc" },
            });
            if (lastIntervention) interventionId = lastIntervention.id;
          }
          await prisma.document.create({
            data: {
              title: payload.fileName.replace(/\.[^.]+$/, ""),
              url: payload.fileUrl,
              type: docTypeToDocumentType(payload.docType),
              date: new Date(),
              interventionId,
              expenseId,
            },
          });
          done.push("Document enregistré");
          revalidatePath("/dashboard/documents");
          break;
        }
      }
    } catch (e) {
      console.error(`[smart-intake] action ${action.type} failed:`, e);
      errors.push(`${action.type}: ${e instanceof Error ? e.message : "erreur"}`);
    }
  }

  // Save scan log
  await prisma.scanLog.create({
    data: {
      fileName: payload.fileName,
      fileUrl: payload.fileUrl,
      docType: payload.docType,
      confidence: payload.confidence,
      extractedData: JSON.stringify(payload.data),
      actionsExecuted: JSON.stringify(done),
      userId: (session.user as { id?: string }).id ?? user.email ?? "",
      userEmail: user.email ?? "",
    },
  }).catch(() => {});

  revalidatePath("/dashboard/scan");
  return { done, errors };
}

export async function getScanHistory() {
  const session = await auth();
  if (!session) return [];
  return prisma.scanLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

function docTypeToDocumentType(docType: string): "CONTRACT" | "INVOICE" | "REPORT" | "PERMIT" | "OTHER" {
  if (["rental_contract", "sale_contract", "work_contract", "notarial_act"].includes(docType)) return "CONTRACT";
  if (["electricity_bill", "water_bill", "internet_bill", "contractor_invoice", "payment_receipt"].includes(docType)) return "INVOICE";
  if (["control_report", "reception_pv"].includes(docType)) return "REPORT";
  if (["building_permit", "construction_permit"].includes(docType)) return "PERMIT";
  return "OTHER";
}
