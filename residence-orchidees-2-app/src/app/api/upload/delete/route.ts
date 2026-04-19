import { NextRequest, NextResponse } from "next/server";
import { cloudinaryDestroy } from "@/lib/cloudinary";

export async function DELETE(req: NextRequest) {
  const { url } = (await req.json()) as { url: string };
  if (!url) return NextResponse.json({ error: "URL manquante" }, { status: 400 });

  await cloudinaryDestroy(url);

  return NextResponse.json({ ok: true });
}
