"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getMyNotifications() {
  const session = await auth();
  if (!session?.user) return [];
  const user = session.user as { id?: string };
  return prisma.occupantNotification.findMany({
    where: { userId: user.id! },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function markNotificationRead(id: string) {
  await prisma.occupantNotification.update({ where: { id }, data: { read: true } });
  revalidatePath("/dashboard/mon-espace");
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user) return;
  const user = session.user as { id?: string };
  await prisma.occupantNotification.updateMany({
    where: { userId: user.id!, read: false },
    data: { read: true },
  });
  revalidatePath("/dashboard/mon-espace");
}

export async function createNotification(data: {
  userId: string;
  title: string;
  body: string;
  type: string;
  link?: string;
}) {
  await prisma.occupantNotification.create({ data });
}
