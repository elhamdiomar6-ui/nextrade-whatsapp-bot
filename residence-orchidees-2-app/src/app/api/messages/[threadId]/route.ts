import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type SessionUser = { id?: string; role?: string; unitId?: string | null };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });
  const user = session.user as SessionUser;
  const { threadId } = await params;

  const messages = await prisma.occupantMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });

  // Mark messages as read
  const isAdmin = user.role === "ADMIN" || user.role === "MANAGER";
  await prisma.occupantMessage.updateMany({
    where: { threadId, isAdmin: !isAdmin, read: false },
    data: { read: true },
  });

  return NextResponse.json(messages);
}
