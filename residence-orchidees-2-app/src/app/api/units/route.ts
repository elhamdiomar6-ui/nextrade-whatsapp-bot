import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const units = await prisma.unit.findMany({
    include: {
      subscriptions: true,
    },
  });

  return NextResponse.json(units);
}
