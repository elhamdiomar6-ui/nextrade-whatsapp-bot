"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: {
  name: string;
  phone: string;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifié" };

  const id = (session.user as { id?: string }).id;
  if (!id) return { success: false, error: "ID utilisateur manquant" };

  const name = data.name.trim();
  if (!name) return { success: false, error: "Le nom est requis" };

  await prisma.user.update({
    where: { id },
    data: { name, phone: data.phone.trim() || null },
  });

  revalidatePath("/dashboard/profile");
  return { success: true };
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifié" };

  const id = (session.user as { id?: string }).id;
  if (!id) return { success: false, error: "ID utilisateur manquant" };

  if (data.newPassword.length < 8)
    return { success: false, error: "Le nouveau mot de passe doit contenir au moins 8 caractères" };

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { success: false, error: "Utilisateur introuvable" };

  const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!valid) return { success: false, error: "Mot de passe actuel incorrect" };

  const hash = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash: hash } });

  return { success: true };
}
