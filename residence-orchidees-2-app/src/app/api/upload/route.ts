import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

const MAX_SIZE = 50 * 1024 * 1024; // 50 Mo

export async function POST(req: NextRequest) {
  const formData  = await req.formData();
  const file      = formData.get("file") as File | null;
  const entityType = (formData.get("entityType") as string | null) ?? "";
  const entityId   = (formData.get("entityId")   as string | null) ?? "";

  if (!file)
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "Fichier trop grand (max 50 Mo)" }, { status: 400 });

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const folder = entityType && entityId
    ? `orchidees2/${entityType}/${entityId}`
    : "orchidees2/general";

  try {
    const result = await new Promise<{
      secure_url: string;
      resource_type: string;
      bytes: number;
    }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
          use_filename:   true,
          unique_filename: true,
        },
        (error, res) => {
          if (error || !res) reject(error ?? new Error("Cloudinary upload failed"));
          else resolve(res as { secure_url: string; resource_type: string; bytes: number });
        }
      ).end(buffer);
    });

    return NextResponse.json({
      url:      result.secure_url,
      name:     file.name,
      mimeType: file.type || "application/octet-stream",
      size:     result.bytes,
    });
  } catch (e) {
    console.error("Cloudinary upload error:", e);
    return NextResponse.json({ error: "Échec upload Cloudinary" }, { status: 500 });
  }
}
