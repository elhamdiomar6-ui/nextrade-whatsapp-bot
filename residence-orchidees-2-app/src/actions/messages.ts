"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

type SessionUser = { id?: string; role?: string; unitId?: string | null };

export async function sendMessage(data: {
  content: string;
  type?: string;
  subject?: string;
  unitId?: string;
  threadId?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");
  const user = session.user as SessionUser;

  if (data.threadId) {
    // Reply in existing thread
    await prisma.occupantMessage.create({
      data: {
        senderId: user.id!,
        unitId: data.unitId ?? null,
        type: data.type ?? "LIBRE",
        subject: data.subject,
        content: data.content,
        isAdmin: user.role === "ADMIN" || user.role === "MANAGER",
        threadId: data.threadId,
      },
    });
  } else {
    // New thread: create message then set threadId = its own id
    const msg = await prisma.occupantMessage.create({
      data: {
        senderId: user.id!,
        unitId: data.unitId ?? (user.unitId ?? null),
        type: data.type ?? "LIBRE",
        subject: data.subject,
        content: data.content,
        isAdmin: user.role === "ADMIN" || user.role === "MANAGER",
        threadId: "tmp",
      },
    });
    await prisma.occupantMessage.update({
      where: { id: msg.id },
      data: { threadId: msg.id },
    });

    // Notify admin when occupant sends first message
    if (user.role === "OCCUPANT") {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
      for (const admin of admins) {
        await prisma.occupantNotification.create({
          data: {
            userId: admin.id,
            title: "Nouveau message",
            body: `${session.user.name} a envoyé un message : ${data.subject ?? data.content.slice(0, 60)}`,
            type: "MESSAGE",
            link: "/dashboard/messagerie",
          },
        });
      }
    }
  }

  // Notify occupant when admin replies
  if ((user.role === "ADMIN" || user.role === "MANAGER") && data.threadId && data.unitId) {
    const unitUsers = await prisma.user.findMany({
      where: { unitId: data.unitId, role: "OCCUPANT" },
    });
    for (const u of unitUsers) {
      await prisma.occupantNotification.create({
        data: {
          userId: u.id,
          title: "Réponse de la gérance",
          body: data.content.slice(0, 80),
          type: "MESSAGE",
          link: "/dashboard/messagerie",
        },
      });
    }
  }

  revalidatePath("/dashboard/messagerie");
}

export async function getThreads(unitId?: string) {
  const session = await auth();
  if (!session?.user) return [];
  const user = session.user as SessionUser;

  const isAdmin = user.role === "ADMIN" || user.role === "MANAGER";

  if (isAdmin) {
    // Admin: all threads grouped (fetch root messages)
    const roots = await prisma.occupantMessage.findMany({
      where: unitId ? { unitId, threadId: { not: null } } : { threadId: { not: null } },
      orderBy: { createdAt: "desc" },
      include: { sender: { select: { name: true, role: true } }, unit: { select: { name: true } } },
      distinct: ["threadId"],
    });
    return roots;
  } else {
    // Occupant: their own threads
    const myUnitId = user.unitId;
    if (!myUnitId) return [];
    const roots = await prisma.occupantMessage.findMany({
      where: { unitId: myUnitId, threadId: { not: null } },
      orderBy: { createdAt: "desc" },
      include: { sender: { select: { name: true, role: true } } },
      distinct: ["threadId"],
    });
    return roots;
  }
}

export async function getThreadMessages(threadId: string) {
  const session = await auth();
  if (!session?.user) return [];
  const messages = await prisma.occupantMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { name: true, role: true } } },
  });
  // Mark unread messages as read for this user
  const user = session.user as SessionUser;
  const isAdmin = user.role === "ADMIN" || user.role === "MANAGER";
  await prisma.occupantMessage.updateMany({
    where: {
      threadId,
      isAdmin: !isAdmin, // mark opposite side as read
      read: false,
    },
    data: { read: true },
  });
  revalidatePath("/dashboard/messagerie");
  return messages;
}

export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user) return 0;
  const user = session.user as SessionUser;
  const isAdmin = user.role === "ADMIN" || user.role === "MANAGER";
  return prisma.occupantMessage.count({
    where: {
      isAdmin: !isAdmin,
      read: false,
      ...(isAdmin ? {} : { unitId: user.unitId ?? undefined }),
    },
  });
}
