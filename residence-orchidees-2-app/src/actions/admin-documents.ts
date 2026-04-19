"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cloudinaryDestroy } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") throw new Error("Unauthorized");
}

export async function renameDocument(id: string, title: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await prisma.document.update({ where: { id }, data: { title } });
    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard/admin/documents");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function toggleOfficialDocument(id: string, isOfficial: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await prisma.document.update({ where: { id }, data: { isOfficial } });
    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard/admin/documents");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteDocumentAdmin(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return { success: false, error: "Introuvable" };

    await cloudinaryDestroy(doc.url);
    await prisma.document.delete({ where: { id } });
    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard/admin/documents");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function moveDocument(
  id: string,
  target: { subscriptionId?: string; interventionId?: string; expenseId?: string; invoiceId?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await prisma.document.update({
      where: { id },
      data: {
        subscriptionId: target.subscriptionId ?? null,
        interventionId: target.interventionId ?? null,
        expenseId: target.expenseId ?? null,
        invoiceId: target.invoiceId ?? null,
      },
    });
    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard/admin/documents");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
