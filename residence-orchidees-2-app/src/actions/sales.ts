"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { LotStatus, SaleStatus } from "@prisma/client";
import { notifyAllOwners } from "@/lib/whatsapp";

export async function createSale(data: {
  lotId: string;
  buyerName: string;
  buyerPhone?: string;
  totalAmount: number;
  depositAmount: number;
  notaryName?: string;
}) {
  const lot = await prisma.lot.findUnique({ where: { id: data.lotId } });

  await prisma.$transaction(async (tx) => {
    await tx.sale.create({
      data: {
        lotId: data.lotId,
        totalAmount: data.totalAmount,
        depositAmount: data.depositAmount,
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone ?? null,
        notaryName: data.notaryName ?? null,
        status: "RESERVE",
      },
    });
    await tx.lot.update({
      where: { id: data.lotId },
      data: { status: LotStatus.RESERVE },
    });
  });

  const lotName = lot?.name ?? data.lotId;
  await notifyAllOwners(
    `🏠 *Orchidées 2 — Nouvelle vente !*\nLot : ${lotName}\nAcheteur : ${data.buyerName}${data.buyerPhone ? ` (${data.buyerPhone})` : ""}\nMontant : ${data.totalAmount.toLocaleString("fr-MA")} MAD\nAcompte : ${data.depositAmount.toLocaleString("fr-MA")} MAD${data.notaryName ? `\nNotaire : ${data.notaryName}` : ""}\nDate : ${new Date().toLocaleDateString("fr-MA")}`
  );

  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/lots");
  revalidatePath("/dashboard");
}

export async function updateSale(
  id: string,
  data: {
    status: SaleStatus;
    buyerName?: string;
    buyerPhone?: string;
    totalAmount: number;
    depositAmount: number;
    notaryName?: string;
    notaryPhone?: string;
    signingDate?: string;
    deliveryDate?: string;
    notes?: string;
  }
) {
  const sale = await prisma.sale.findUnique({ where: { id }, select: { lotId: true } });

  // Sync lot status with sale status
  const lotStatus: Record<SaleStatus, LotStatus> = {
    RESERVE:    LotStatus.RESERVE,
    EN_COURS:   LotStatus.RESERVE,
    ACTE_SIGNE: LotStatus.VENDU,
    LIVRE:      LotStatus.VENDU,
  };

  await prisma.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id },
      data: {
        status: data.status,
        buyerName: data.buyerName ?? null,
        buyerPhone: data.buyerPhone ?? null,
        totalAmount: data.totalAmount,
        depositAmount: data.depositAmount,
        notaryName: data.notaryName ?? null,
        notaryPhone: data.notaryPhone ?? null,
        signingDate: data.signingDate ? new Date(data.signingDate) : null,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        notes: data.notes ?? null,
      },
    });
    if (sale) {
      await tx.lot.update({
        where: { id: sale.lotId },
        data: { status: lotStatus[data.status] },
      });
    }
  });

  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/lots");
  revalidatePath("/dashboard");
}

export async function deleteSale(id: string) {
  const sale = await prisma.sale.findUnique({ where: { id }, select: { lotId: true } });

  await prisma.$transaction(async (tx) => {
    await tx.sale.delete({ where: { id } });
    if (sale) {
      await tx.lot.update({
        where: { id: sale.lotId },
        data: { status: LotStatus.DISPONIBLE },
      });
    }
  });

  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/lots");
  revalidatePath("/dashboard");
}
