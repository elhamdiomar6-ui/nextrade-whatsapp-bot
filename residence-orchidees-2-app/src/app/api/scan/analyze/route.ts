import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

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

═══ MODÈLE FACTURE ÉLECTRICITÉ REDAL/SRM/RADEEF (format exact Maroc) ═══
Champs à extraire OBLIGATOIREMENT — cherche dans tout le document y compris la partie arabe:

IDENTIFICATION:
- invoiceNumber    → N° facture (ex: 636138198) — grand titre central
- tournee          → Tournée (ex: D1A3B215 / 042_221207-APPARTEMENT)
- clientNumber     → N° Client (ex: 2041868)
- clientName       → Nom client (ex: M EL HAMDI OMAR)
- address          → Adresse complète
- contractNumber   → N° Contrat (ex: 0005834566 / 2321376)
- agence           → Agence (ex: BE-AS BOUSKOURA)
- usage            → Usage (ex: BT DOMESTIQUE)
- invoiceDate      → Date facture (YYYY-MM-DD)
- dueDate          → Date limite de paiement (YYYY-MM-DD)

COMPTEUR & PÉRIODE (tableau "Détails de votre consommation"):
- meterNumber      → Compteur N° exact (ex: 3116997955)
- puissance        → Puissance (ex: 2.3 KW)
- periodStart      → Début période consommation (YYYY-MM-DD)
- periodEnd        → Fin période consommation (YYYY-MM-DD)
- consumptionDays  → Nombre de jours (ex: 159)
- dateAncienne     → Date relevé ancien (YYYY-MM-DD)
- dateActuelle     → Date relevé actuel (YYYY-MM-DD)
- previousIndex    → Index ancien kWh (ex: 26666)
- currentIndex     → Nouvel index kWh (ex: 28331)
- consumption      → Consommation brute kWh = currentIndex - previousIndex
- deductionKwh     → Déduction kWh si présente (ex: 122)

DÉTAIL FACTURE (tableau "Détails de votre facture"):
- tranche5Qty         → Qté tranche 5 (ex: 302)
- tranche5PrixHT      → Prix unitaire HT tranche 5 (ex: 1.15142)
- tranche5MontantHT   → Montant HT tranche 5 (ex: 347.73)
- tranche5TTC         → Montant TTC tranche 5 (ex: 417.28)
- consoAnterieureQty  → Qté conso antérieure (ex: 1363)
- consoAnterieureHT   → Montant HT conso antérieure (ex: 1595.99)
- consoAnterieureTTC  → Montant TTC conso antérieure (ex: 1883.27)
- deductionForfaitQty → Qté déduction forfait (ex: -1284)
- deductionForfaitHT  → Montant HT déduction (ex: -1503.11)
- deductionForfaitTTC → Montant TTC déduction (ex: -1774.12)
- totalConsoQty       → Total consommation qty (ex: 381)
- totalConsoHT        → Total consommation HT (ex: 440.61)
- totalConsoTTC       → Total consommation TTC (ex: 526.43)
- locationCompteurHT  → Location compteur HT (ex: 9.56)
- locationCompteurTTC → Location compteur TTC (ex: 11.47)
- entretienHT         → Entretien branchement HT (ex: 7.86)
- entretienTTC        → Entretien branchement TTC (ex: 9.43)
- tppanHT             → Taxe TPPAN HT (ex: 47.45)
- tppanTTC            → Taxe TPPAN TTC (ex: 56.73)

TOTAUX:
- amountHT         → Total général HT (ex: 505.48)
- tva              → Total TVA (ex: 98.58)
- amountTTC        → Total général TTC (ex: 604.06)
- amountToPay      → Montant à payer (peut différer du TTC)

RÈGLE CRITIQUE pour linkedUnit et linkedMeter:
→ Compare meterNumber avec le référentiel, déduis l'unité.
→ EL HAMDI OMAR → linkedUnit="A7", linkedMeter="3116997955"
→ EL HAMDI LAHOUCINE → linkedUnit="A5", linkedMeter="3116997998"
→ EL HAMDI BRAHIM → linkedUnit="A10", linkedMeter="3116998004"
→ EL HAMDI MOHAMED → distinguer par N° compteur (A3:3116997913 / A8:3116997934 / A9:3116997968)
→ IJOU → linkedUnit="A7" (si compteur 3116997955)
→ TALAL HAFIDA → linkedUnit="A2", linkedMeter="5117001351"
→ FATIME → linkedUnit="A4", linkedMeter="3116997933"
→ PHARMACIE GARAN → linkedUnit="MAG3", linkedMeter="3116998000"

═══ MODÈLE FACTURE EAU ONEE/LYDEC ═══
Champs: invoiceNumber, meterNumber, clientName, consumption(m³), amountTTC, periodStart, periodEnd, dueDate, invoiceDate

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
    // electricity_bill → invoiceNumber, clientName, clientNumber, contractNumber, pdlNumber, titleNumber, meterNumber, puissance, periodStart(YYYY-MM-DD), periodEnd(YYYY-MM-DD), dateAncienne(YYYY-MM-DD), dateActuelle(YYYY-MM-DD), previousIndex, currentIndex, consumption, consumptionElec, deductionForfait, amountHT, tva, amountTTC, amountToPay, amountByDirectDebit, dueDate(YYYY-MM-DD), invoiceDate(YYYY-MM-DD), agence, address
    // water_bill → invoiceNumber, meterNumber, clientName, consumption, amountTTC, periodStart(YYYY-MM-DD), periodEnd(YYYY-MM-DD), dueDate(YYYY-MM-DD)
    // meter_reading → meterNumber, index, date(YYYY-MM-DD), serviceType("ELECTRICITY"|"WATER")
    // contractor_quote|contractor_invoice → company, workType, amountHT, tva, amountTTC, date(YYYY-MM-DD), reference
    // rental_contract|work_contract|sale_contract → parties, object, amount, signDate(YYYY-MM-DD), startDate(YYYY-MM-DD), endDate(YYYY-MM-DD)
    // cin|passport → lastName, firstName, idNumber, birthDate(YYYY-MM-DD), expiryDate(YYYY-MM-DD), nationality
    // delivery_note → supplier, items, amount, date(YYYY-MM-DD)
    // building_permit|construction_permit → reference, authority, issueDate(YYYY-MM-DD), expiryDate(YYYY-MM-DD), description
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

Pour electricity_bill: toujours proposer CREATE_INVOICE (priority 1) ET CREATE_READING (priority 1).
Si dueDate est dépassée: ajouter CREATE_ALERT (priority 1) avec message d'avertissement.
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
      max_tokens: 2500,
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
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[scan/analyze]", msg);
    return NextResponse.json({ error: `Échec analyse IA: ${msg}` }, { status: 500 });
  }
}
