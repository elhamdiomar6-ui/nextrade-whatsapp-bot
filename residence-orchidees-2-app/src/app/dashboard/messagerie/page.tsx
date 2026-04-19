import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MessagerieClient } from "./MessagerieClient";

type SessionUser = { id?: string; name?: string | null; role?: string; unitId?: string | null };

export default async function MessageriePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as SessionUser;

  const isAdmin = user.role === "ADMIN" || user.role === "MANAGER";

  // Fetch all threads (root messages)
  let threads: any[] = [];

  if (isAdmin) {
    // Admin: all threads with unit info
    const rootMessages = await prisma.occupantMessage.findMany({
      where: { threadId: { not: null } },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        unit: { select: { id: true, name: true } },
      },
    });
    // Deduplicate by threadId (keep most recent per thread)
    const seen = new Set<string>();
    threads = rootMessages.filter(m => {
      if (seen.has(m.threadId!)) return false;
      seen.add(m.threadId!);
      return true;
    });
  } else {
    // Occupant: their unit's threads
    const unitId = user.unitId;
    if (unitId) {
      const rootMessages = await prisma.occupantMessage.findMany({
        where: { unitId, threadId: { not: null } },
        orderBy: { createdAt: "desc" },
        include: { sender: { select: { id: true, name: true, role: true } } },
      });
      const seen = new Set<string>();
      threads = rootMessages.filter(m => {
        if (seen.has(m.threadId!)) return false;
        seen.add(m.threadId!);
        return true;
      });
    }
  }

  // Units list (for admin: to filter; for occupant: their unit)
  const units = isAdmin
    ? await prisma.unit.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
    : user.unitId
      ? await prisma.unit.findMany({ where: { id: user.unitId }, select: { id: true, name: true } })
      : [];

  return (
    <MessagerieClient
      threads={threads as any}
      units={units as any}
      currentUserId={user.id!}
      currentUserName={user.name ?? ""}
      isAdmin={isAdmin}
      myUnitId={user.unitId ?? null}
    />
  );
}
