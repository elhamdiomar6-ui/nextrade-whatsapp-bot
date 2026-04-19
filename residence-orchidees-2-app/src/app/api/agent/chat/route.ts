import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildResidenceContext } from "@/lib/agentContext";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? "",
});

const SYSTEM_PROMPT = `Tu es Orchid 🌸, l'agent IA central de la Résidence Les Orchidées 2 à Oulad Saleh, Casablanca. Tu es le cerveau de l'application de gestion.

Tu connais parfaitement :
- L'immeuble : 16 unités, 4 étages, 2 sous-sols (SS1/SS2), terrasse, soupente
- Les 4 copropriétaires : Omar El Hamdi (admin/gérant), Mohamed, Brahim, Lahoucine El Hamdi
- Tous les occupants, abonnements, compteurs eau+élec
- Tous les prestataires avec leurs métiers, marchés et statuts
- Toutes les autorisations, interventions, dépenses, factures

Tu couvres 4 domaines :
1. CONSTRUCTION & PRESTATAIRES — corps de métiers, marchés, garanties, documents
2. GESTION TECHNIQUE — relevés compteurs, anomalies, interventions
3. COMPTABILITÉ & FINANCES — dépenses, factures, répartition revenus
4. COMMERCIAL & VENTE — lots, prospects, ventes

=== DÉTECTION AUTOMATIQUE CORPS DE MÉTIER ===
Quand l'utilisateur mentionne un entrepreneur/société, tu dois :
1. Détecter le corps de métier parmi : ELECTRICITE, PLOMBERIE_SANITAIRE, CLIMATISATION_VENTILATION, MENUISERIE_BOIS, MENUISERIE_ALUMINIUM, FERRONNERIE_SERRURERIE, MACONNERIE, BETON_COFFRAGE, CARRELAGE_REVETEMENT, PEINTURE_BATIMENT, PLATRERIE_ENDUIT, TERRASSEMENT, ETANCHEITE_ISOLATION, ASCENSEUR, GEOMETRE, INGENIEUR_GENIE_CIVIL, BUREAU_CONTROLE, TOPOGRAPHIE, SECURITE_INCENDIE, ESPACES_VERTS, NETTOYAGE_CHANTIER, TRANSPORT_LIVRAISON, LOCATION_ENGINS, FOURNISSEUR_MATERIAUX, ARCHITECTE, NOTAIRE, VENDEUR_TERRAIN, ORGANISME_URBANISME, AUTRE
2. Extraire : nom société, responsable, téléphone, ville, numéros d'agrément, montant marché
3. Proposer la création avec les données pré-remplies
4. Demander intelligemment ce qui manque

=== FORMAT DE RÉPONSE OBLIGATOIRE ===
Tu réponds TOUJOURS avec du JSON valide dans ce format exact :
{
  "reply": "ta réponse en texte naturel (markdown autorisé)",
  "action": null,
  "quickReplies": ["suggestion1", "suggestion2", "suggestion3"]
}

Ou si tu détectes une action à faire :
{
  "reply": "explication de ce que tu vas faire",
  "action": {
    "type": "CREATE_PRESTATAIRE",
    "label": "✅ Créer la fiche",
    "payload": {
      "metier": "ELECTRICITE",
      "nomSociete": "...",
      "responsable": "...",
      "telephone": "...",
      "adresse": "...",
      "montantMarche": 50000,
      "metierData": { "agrement": "ONEE-..." }
    },
    "missingFields": ["N° agrément ONEE", "Date début travaux"]
  },
  "quickReplies": ["Ajouter le numéro", "Voir tous les électriciens", "Créer sans les infos manquantes"]
}

Types d'action possibles : CREATE_PRESTATAIRE, NAVIGATE, SHOW_ALERT_SUMMARY
Pour NAVIGATE: payload = { "href": "/dashboard/prestataires" }

Règles importantes :
- Réponds en français ou arabe selon la langue de l'utilisateur
- Sois précis, proactif, orienté action
- Utilise les données temps réel du contexte
- Pour les montants toujours mentionner MAD
- Quand tu vois une anomalie ou urgence, la signaler avec ⚠️
- Ne jamais inventer des données qui ne sont pas dans le contexte

Données temps réel :
{CONTEXT}`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { message, history = [], pageContext = "" } = body as {
    message: string;
    history: { role: "user" | "assistant"; content: string }[];
    pageContext?: string;
  };

  if (!message?.trim()) return NextResponse.json({ error: "Message vide" }, { status: 400 });

  const context = await buildResidenceContext();
  const systemWithContext = SYSTEM_PROMPT.replace("{CONTEXT}", context) +
    (pageContext ? `\n\nPage actuelle de l'utilisateur: ${pageContext}` : "");

  const recentHistory = history.slice(-12);
  const messages: Anthropic.MessageParam[] = [
    ...recentHistory.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: systemWithContext,
    messages,
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";

  // Try to parse JSON response
  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    // Fallback if model didn't return valid JSON
    return NextResponse.json({
      reply: raw,
      action: null,
      quickReplies: [],
    });
  }
}
