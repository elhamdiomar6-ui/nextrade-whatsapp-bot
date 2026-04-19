import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? "",
});

const DOC_TYPES = [
  "contrat", "facture", "devis", "bon_livraison",
  "photo_avant", "photo_apres", "photo_produit", "photo_chantier",
  "plan", "attestation", "rapport", "PV", "acte", "permis", "autre",
];

const MAX_ANALYZE_SIZE = 4 * 1024 * 1024; // 4 Mo

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const context = (formData.get("context") as string | null) ?? "";

  if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });

  // Si trop grand, retomber sur heuristique nom de fichier
  if (file.size > MAX_ANALYZE_SIZE) {
    return NextResponse.json({ ...fromFilename(file.name), confidence: "low", tooLarge: true });
  }

  const mimeType = file.type || "application/octet-stream";
  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  if (!isImage && !isPdf) {
    return NextResponse.json({ ...fromFilename(file.name), confidence: "low" });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const contentPart: Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam =
    isImage
      ? {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: base64,
          },
        }
      : {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        };

  const prompt = `Analyse ce document et extrais les informations. Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après.

Types disponibles: ${DOC_TYPES.join(", ")}

Format JSON requis:
{
  "title": "titre court et descriptif (max 60 caractères, en français)",
  "type": "un des types de la liste ci-dessus",
  "amount": null ou nombre décimal (montant principal en MAD/DH si visible),
  "date": null ou "YYYY-MM-DD" (date principale du document),
  "parties": null ou "noms des sociétés/parties impliquées",
  "notes": null ou "info importante en 1 phrase courte",
  "confidence": "high" ou "medium" ou "low"
}

Contexte: Résidence Les Orchidées 2, Casablanca. ${context}
Nom fichier: ${file.name}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: [contentPart, { type: "text", text: prompt }],
        },
      ],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }
    return NextResponse.json({ ...fromFilename(file.name), confidence: "low" });
  } catch (err) {
    console.error("[analyze] error:", err);
    return NextResponse.json({ ...fromFilename(file.name), confidence: "low" });
  }
}

function fromFilename(filename: string) {
  const name = (filename ?? "").toLowerCase();
  let type = "autre";
  if (name.includes("facture") || name.includes("invoice")) type = "facture";
  else if (name.includes("contrat") || name.includes("contract")) type = "contrat";
  else if (name.includes("devis")) type = "devis";
  else if (name.includes("plan")) type = "plan";
  else if (name.includes("rapport")) type = "rapport";
  else if (name.includes("bl") || name.includes("livraison")) type = "bon_livraison";
  else if (name.includes("pv") || name.includes("proces")) type = "PV";
  else if (name.includes("permis") || name.includes("autorisation")) type = "permis";
  else if (name.includes("attestation") || name.includes("agrement")) type = "attestation";

  return {
    title: filename?.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") ?? "",
    type,
    amount: null,
    date: null,
    parties: null,
    notes: null,
  };
}
