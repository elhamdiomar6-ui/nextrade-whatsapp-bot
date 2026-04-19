import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ReadingMode } from "@prisma/client";

export async function GET() {
  const readings = await prisma.meterReading.findMany({
    include: {
      meter: {
        include: {
          subscription: {
            include: { unit: true },
          },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  const enriched = readings.map((r) => ({
    ...r,
    consumption:
      r.previousValue !== null && r.previousValue !== undefined
        ? r.value - r.previousValue
        : null,
    anomaly:
      r.previousValue !== null && r.previousValue !== undefined
        ? r.value < r.previousValue
        : false,
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: Request) {
  const body = await req.json();

  const last = await prisma.meterReading.findFirst({
    where: { meterId: body.meterId },
    orderBy: { date: "desc" },
  });

  const reading = await prisma.meterReading.create({
    data: {
      value: body.value,
      previousValue: last?.value ?? null,
      meterId: body.meterId,
      mode: ReadingMode.MANUAL,
    },
    include: {
      meter: {
        include: {
          subscription: {
            include: { unit: true },
          },
        },
      },
    },
  });

  return NextResponse.json({
    ...reading,
    consumption:
      reading.previousValue !== null && reading.previousValue !== undefined
        ? reading.value - reading.previousValue
        : null,
    anomaly:
      reading.previousValue !== null && reading.previousValue !== undefined
        ? reading.value < reading.previousValue
        : false,
  });
}
