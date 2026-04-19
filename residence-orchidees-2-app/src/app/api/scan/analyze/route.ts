import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? "",
});

const MAX_SIZE = 4 * 1024 * 1024;

const SYSTEM_PROMPT = `Tu es Orchid, expert IA en analyse de documents marocains pour la Résidence Les Orchidées 2, Oulad Saleh, Casablanca.

RÉSIDENCE — RÉFÉRENTIEL COMPLET:
Unités: A1(Ijou) A2(Talal Hafida) A3(El Hamdi Mohamed) A4(Fatime) A5(El Hamdi Lahoucine) A6(Moha) A7(El Hamdi Omar) A8(El Hamdi Mohamed) A9(El Hamdi Mohamed) A10(El Hamdi Brahim) CONCIERGE MAG1 MAG2(Abdelhafd) MAG3(Pharmacie GARAN) MAG4(Cartons)

COMPTEURS ÉLECTRICITÉ:
A1:3116997915 | A2:5117001351 | A3:3116997913 | A4:3116997933 | A5:3116997998
A6:3116997911 | A7:3116997955 | A8:3116997934 | A9:3116997968 | A10:3116998004
CONCIERGE:3116997994 | MAG1:3116998003 | MAG2:3213019226 | MAG3:3116998000 | MAG4:3116997943

COMPTEURS EAU:
MAG3:225119159 | CONCIERGE:226153050 | A1:226153041 | A2:226149402 | A4:226153044 | A5:226153045 | A7:226153047

TYPES DE DOCUMENTS RECONNUS:
electricity_bill | water_bill | internet_bill | meter_reading
contractor_quote | contractor_invoice | rental_contract | sale_contract | work_contract
notarial_act | building_permit | construction_permit | architectural_plan
cin | passport | land_title | delivery_note | payment_receipt
control_report | reception_pv | warranty_certificate | admin_document
site_photo | meter_photo | apartment_photo | other

RETOURNE UNIQUEMENT DU JSON VALIDE (pas de texte avant/après):
{
  "docType": "type_ici",
  "confidence": 0-100,
  "title": "titre court et descriptif en français (max 60 chars)",
  "linkedUnit": null ou "A1"|"A2"|"A3"|"A4"|"A5"|"A6"|"A7"|"A8"|"A9"|"A10"|"MAG1"|"MAG2"|"MAG3"|"MAG4"|"CONCIERGE",
  "linkedMeter": null ou numéro de série exactement comme dans le référentiel,
  "data": {
    // electricity_bill → clientName, clientNumber, contractNumber, meterNumber, periodStart(YYYY-MM-DD), periodEnd(YYYY-MM-DD), previousIndex, currentIndex, consumption, amountHT, tva, amountTTC, dueDate(YYYY-MM-DD)
    // water_bill → meterNumber, clientName, consumption, amountTTC, periodStart(YYYY-MM-DD), periodEnd(YYYY-MM-DD), dueDate(YYYY-MM-DD)
    // meter_reading → meterNumber, index, date(YYYY-MM-DD), serviceType("ELECTRICITY"|"WATER")
    // contractor_quote|contractor_invoice → company, workType, amountHT, tva, amountTTC, date(YYYY-MM-DD), reference
    // rental_contract|work_contract|sale_contract → parties, object, amount, signDate(YYYY-MM-DD), startDate(YYYY-MM-DD), endDate(YYYY-MM-DD)
    // cin|passport → lastName, firstName, idNumber, birthDate(YYYY-MM-DD), expiryDate(YYYY-MM-DD), nationality
    // delivery_note → supplier, items, amount, date(YYYY-MM-DD)
    // building_permit|construction_permit → reference, authority, issueDate(YYYY-MM-DD), expiryDate(YYYY-MM-DD), description
    // Tous types: ajoute les champs visibles pertinents
  },
  "suggestedActions": [
    {
      "id": "action_unique_id",
      "type": "CREATE_INVOICE"|"CREATE_READING"|"ADD_PRESTATAIRE_DOC"|"CREATE_OCCUPANT_DOC"|"CREATE_ALERT"|"SAVE_DOCUMENT",
      "label": "description courte de ce que fait l'action",
      "priority": 1|2|3,
      "data": { ... données nécessaires à l'exécution }
    }
  ]
}

Si c'est une photo de chantier/compteur/appartement: retourne docType approprié, confidence élevée, data vide, suggestedActions avec SAVE_DOCUMENT uniquement.
Si tu n'es pas sûr, utilise confidence < 50 et type "other".`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  if (file.size > MAX_SIZE) {
    return NextResponse.json({
      docType: "other", confidence: 10, title: file.name.replace(/\.[^.]+$/, ""),
      linkedUnit: null, linkedMeter: null, data: {},
      suggestedActions: [{ id: "save_doc", type: "SAVE_DOCUMENT", label: "Enregistrer le document", priority: 3, data: {} }],
      tooLarge: true,
    });
  }

  const mimeType = file.type || "application/octet-stream";
  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  if (!isImage && !isPdf) {
    return NextResponse.json({
      docType: "other", confidence: 10, title: file.name.replace(/\.[^.]+$/, ""),
      linkedUnit: null, linkedMeter: null, data: {},
      suggestedActions: [{ id: "save_doc", type: "SAVE_DOCUMENT", label: "Enregistrer le document", priority: 3, data: {} }],
    });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const contentBlock: Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam = isImage
    ? { type: "image", source: { type: "base64", media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: base64 } }
    : { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } };

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: [contentBlock, { type: "text", text: `Analyse ce document. Nom du fichier: "${file.name}". Retourne UNIQUEMENT le JSON structuré.` }] },
      ],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return NextResponse.json(JSON.parse(match[0]));

    return NextResponse.json({ docType: "other", confidence: 0, title: file.name, linkedUnit: null, linkedMeter: null, data: {}, suggestedActions: [] });
  } catch (err) {
    console.error("[scan/analyze]", err);
    return NextResponse.json({ error: "Échec analyse IA" }, { status: 500 });
  }
}
