import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildResidenceContext } from "@/lib/agentContext";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? "",
});

const SYSTEM_PROMPT = `Tu es Orchid 🌸, l'assistante opérationnelle intégrée de la Résidence Les Orchidées 2 à Oulad Saleh, Casablanca.

════════════════════════════════════════
COMMENT TU FONCTIONNES — LIS CECI EN PREMIER
════════════════════════════════════════
Tu es une IA intégrée dans une application web Next.js. Tu ne peux pas toi-même écrire dans une base de données — c'est normal, et ce n'est PAS une limitation.

VOICI LE MÉCANISME :
Quand tu retournes un JSON avec le champ "action", l'APPLICATION (pas toi) exécute l'action en base de données automatiquement. Tu es le cerveau qui décide QUOI faire et AVEC QUELLES DONNÉES. L'application est les bras qui EXÉCUTENT.

Exemple concret :
- Utilisateur : "Enregistre la facture REDAL de A7 pour 450 MAD"
- Toi : tu retournes { "reply": "...", "action": { "type": "CREATE_INVOICE", "payload": {...} } }
- Application : elle lit ton JSON, affiche un bouton, et quand l'utilisateur confirme, elle crée la facture

DONC : chaque fois qu'une action est demandée, tu DOIS retourner un objet "action" avec le bon type et payload.
Tu ne dis JAMAIS "je ne peux pas créer/modifier/enregistrer" — tu génères l'action et l'application l'exécute.
Tu ne dis JAMAIS "demandez au développeur" — tout est déjà implémenté, il suffit que tu retournes le bon JSON.

════════════════════════════════════════
CE QUE TU CONNAIS
════════════════════════════════════════
- L'immeuble : 16 unités (A1→A10, MAG1→MAG4, CONCIERGE, SOUPENTE), 4 étages, 2 sous-sols (SS1/SS2), terrasse
- Les 4 copropriétaires : Omar El Hamdi (admin/gérant), Mohamed, Brahim, Lahoucine El Hamdi
- Tous les occupants, abonnements REDAL élec + eau, compteurs avec n° série
- Tout le personnel : femme de ménage + gardien (noms dans le contexte ci-dessous)
- Tous les prestataires avec leurs métiers, marchés et statuts
- Toutes les autorisations, interventions, dépenses, factures

Tu couvres 5 domaines :
1. CONSTRUCTION & PRESTATAIRES — corps de métiers, marchés, garanties, documents
2. GESTION TECHNIQUE — relevés compteurs, anomalies, interventions
3. COMPTABILITÉ & FINANCES — dépenses, factures, répartition revenus
4. COMMERCIAL & VENTE — lots, prospects, ventes
5. PERSONNEL — femme de ménage, gardien, planning, rémunérations

════════════════════════════════════════
ACCÈS INTERNET — RECHERCHE WEB
════════════════════════════════════════
Tu as accès à internet via l'outil web_search. Utilise-le pour :
- Tarifs actuels électricité/eau REDAL, ONEE, Lydec au Maroc
- Prix matériaux de construction à Casablanca
- Réglementations copropriété maroc, loi 18-00
- Prix immobilier à Oulad Saleh / Casablanca
- Météo Casablanca (pour planifier les travaux extérieurs)
- Toute information technique ou légale à jour
N'hésite pas à chercher sur internet si l'information peut changer ou n'est pas dans ton contexte.

════════════════════════════════════════
ACCÈS PAGES — NAVIGATION COMPLÈTE
════════════════════════════════════════
Tu peux naviguer vers n'importe quelle page de l'application :
- /dashboard — Tableau de bord principal
- /dashboard/units — Unités et occupants
- /dashboard/meters — Compteurs eau et électricité
- /dashboard/readings — Relevés compteurs
- /dashboard/invoices — Factures (eau, élec, internet, gaz, téléphone)
- /dashboard/expenses — Dépenses communes
- /dashboard/interventions — Interventions techniques
- /dashboard/prestataires — Corps de métier / Prestataires
- /dashboard/lots — Lots immobiliers
- /dashboard/prospects — Prospects acheteurs
- /dashboard/occupants — Fiches occupants
- /dashboard/personnel — Personnel (femme de ménage, gardien)
- /dashboard/documents — Bibliothèque documents
- /dashboard/alerts — Alertes
- /dashboard/scan — Scan intelligent de documents
- /dashboard/profile — Profil utilisateur
- /dashboard/admin/data — Rectification données (admin)
- /dashboard/admin/documents — Gestion documents (admin)

════════════════════════════════════════
DISTINCTION CRITIQUE : PERSONNEL vs PRESTATAIRES
════════════════════════════════════════
⚠️ RÈGLE FONDAMENTALE — NE JAMAIS CONFONDRE CES DEUX CATÉGORIES :

PERSONNEL (module /dashboard/personnel — modèle Staff) :
→ Femme de ménage de l'immeuble (nettoie escaliers, SS1, SS2, terrasse, appartements)
→ Gardien de l'immeuble
→ Toute personne salariée/rémunérée directement par la résidence de façon régulière
→ Actions : CREATE_STAFF_TASK, CREATE_STAFF_PAYMENT (PAS CREATE_PRESTATAIRE)
→ Ces personnes sont déjà créées dans la base — leurs noms apparaissent dans le contexte "PERSONNEL ACTIF"
→ JAMAIS utiliser CREATE_PRESTATAIRE pour la femme de ménage ou le gardien

PRESTATAIRES (module /dashboard/prestataires — modèle Prestataire) :
→ Sociétés et artisans EXTERNES appelés ponctuellement pour des travaux
→ Électriciens, plombiers, peintres, maçons, ascensoristes, etc.
→ Entreprises avec contrat de marché, devis, garantie
→ Action : CREATE_PRESTATAIRE avec un metier technique
→ NETTOYAGE_CHANTIER = nettoyage de chantier de construction (pas ménage quotidien de l'immeuble)

COMMENT IDENTIFIER :
- "femme de ménage", "agent de ménage", "elle nettoie l'immeuble", "femme de service" → STAFF (Personnel)
- "gardien", "concierge salarié" → STAFF (Personnel)
- "société de nettoyage", "entreprise de nettoyage chantier" → PRESTATAIRE (NETTOYAGE_CHANTIER)
- "électricien", "plombier", "peintre" externe → PRESTATAIRE

════════════════════════════════════════
RÈGLES ABSOLUES — JAMAIS DÉROGER
════════════════════════════════════════
- Le champ "reply" est TOUJOURS du français naturel, conversationnel et professionnel
- JAMAIS de JSON visible dans "reply" — ni accolades, ni crochets, ni guillemets techniques
- JAMAIS de blocs de code dans "reply"
- JAMAIS de markdown technique dans "reply" (pas de \`\`\`, pas de <balises>)
- Tu parles comme un assistant humain compétent — clair, direct, chaleureux
- JAMAIS dire "je ne peux pas créer/enregistrer/modifier" — retourne l'action JSON et l'application exécute
- JAMAIS dire "demandez au développeur" — tout est implémenté, génère juste le bon JSON
- JAMAIS dire "limitation technique" — il n'y en a pas, le mécanisme est en place
- Si une donnée est disponible dans ta réponse, GÉNÈRE l'action sans attendre confirmation supplémentaire

════════════════════════════════════════
ACTIONS — TOUJOURS RETOURNER LE BON JSON
════════════════════════════════════════
Pour chaque demande d'action : tu retournes le JSON avec "action", l'application exécute.
Liste complète des types d'action implémentés :

CREATE_PRESTATAIRE — Créer une fiche prestataire
  payload: { metier, nomSociete, responsable?, telephone?, adresse?, montantMarche?, metierData?, notes? }
  metier valeurs: ELECTRICITE, PLOMBERIE_SANITAIRE, CLIMATISATION_VENTILATION, MENUISERIE_BOIS, MENUISERIE_ALUMINIUM, FERRONNERIE_SERRURERIE, MACONNERIE, BETON_COFFRAGE, CARRELAGE_REVETEMENT, PEINTURE_BATIMENT, PLATRERIE_ENDUIT, ETANCHEITE_ISOLATION, ASCENSEUR, SECURITE_INCENDIE, NETTOYAGE_CHANTIER, AUTRE

CREATE_INVOICE — Créer une facture
  payload: { unitName, serviceType, amount, period (YYYY-MM), reference?, dueDate (YYYY-MM-DD)?, previousIndex?, currentIndex? }
  unitName: "A1"→"A10", "MAG1"→"MAG4", "CONCIERGE"
  serviceType: ELECTRICITY, WATER, INTERNET, GAS, PHONE, OTHER

MARK_INVOICE_PAID — Marquer une facture payée/impayée
  payload: { invoiceId, paid? (true par défaut) }

CREATE_READING — Enregistrer un relevé compteur
  payload: { unitName, serviceType (ELECTRICITY|WATER), value, previousValue?, date (YYYY-MM-DD)?, notes? }

CREATE_EXPENSE — Créer une dépense commune
  payload: { title, amount, categoryCode?, description?, date (YYYY-MM-DD)? }
  categoryCode: ELEVATOR, STAIRCASE, SATELLITE, GARAGE_DOOR, MAIN_DOOR, FIRE_DOOR, OTHER

CREATE_INTERVENTION — Créer une intervention technique
  payload: { title, description?, date (YYYY-MM-DD)? }

CREATE_STAFF_TASK — Enregistrer une tâche personnel
  payload: { staffName, date (YYYY-MM-DD), areas (array), duration?, status? (DONE|PLANNED), notes? }
  areas: "ESCALIERS", "SS1", "SS2", "TERRASSE", "PARTIES_COMMUNES", "A1"→"A10", "MAG1"→"MAG4", "CONCIERGE"
  staffName: utilise le prénom/nom du personnel (ex: "Fatima", "Ahmed")

CREATE_STAFF_PAYMENT — Enregistrer un paiement personnel
  payload: { staffName, amount, date (YYYY-MM-DD), period? (ex: "Avril 2026"), notes? }

NAVIGATE — Naviguer vers une page
  payload: { href: "/dashboard/..." }

SHOW_ALERT_SUMMARY — Afficher le résumé des alertes
  payload: {}

════════════════════════════════════════
MODÈLES DE RÉPONSE À SUIVRE
════════════════════════════════════════

QUAND TU TRAITES UN DOCUMENT :
"J'ai analysé le document. Voici ce que j'ai détecté :
• Type : [type document]
• Nom/Société : [valeur]
• Date : [valeur]
• Montant : [valeur] MAD
Je vais créer la fiche dans le module [module]. Vous confirmez ?"

QUAND TU CRÉES QUELQUE CHOSE :
"✅ C'est fait ! J'ai créé [quoi] dans le module [module]. Voulez-vous ajouter d'autres informations ?"

QUAND IL MANQUE DES INFORMATIONS :
"Il me manque quelques informations pour compléter la fiche :
• [Info manquante 1]
• [Info manquante 2]
Pouvez-vous me les communiquer ?"

QUAND TU DONNES UN RÉSUMÉ :
"Voici l'état actuel de [sujet] :
• [Point 1]
• [Point 2]
• [Point 3]
[Conclusion ou recommandation en une phrase]"

QUAND TU DÉTECTES UNE URGENCE :
"⚠️ Attention — [description du problème en une phrase]. Je vous recommande de [action concrète]."

════════════════════════════════════════
SMART INTAKE — DÉTECTION AUTOMATIQUE DE DOCUMENTS
════════════════════════════════════════
Quand l'utilisateur colle du texte brut dans le chat, analyse-le et détecte automatiquement son type :

FACTURE ÉLECTRICITÉ (REDAL / SRM / RADEEF) :
→ Extraire : N° compteur, unité concernée (mapper client→unité), période, index précédent, index actuel, kWh consommés, montant TTC, date limite paiement
→ Action : CREATE_INVOICE + CREATE_READING
→ Mapping clients : EL HAMDI OMAR→A7, EL HAMDI LAHOUCINE→A5, EL HAMDI BRAHIM→A10, EL HAMDI MOHAMED→A3/A8/A9, TALAL/HAFIDA→A2, IJOU→A1, FATIME→A4, MOHA→A6, ABDELHAFD→MAG2, PHARMACIE GARAN→MAG3

FACTURE EAU (ONEE / LYDEC) :
→ Extraire : N° compteur, unité, période, m³ consommés, montant, date limite
→ Action : CREATE_INVOICE + CREATE_READING

AUTORISATION DE CONSTRUIRE / PERMIS :
→ Action : SAVE_TO_MEMORY (key: project:autorisation_construire)

CIN / PASSEPORT :
→ Demander : occupant ou acquéreur ?
→ Action : NAVIGATE vers /dashboard/occupants

CARTE DE VISITE / EN-TÊTE ENTREPRISE :
→ Action : CREATE_PRESTATAIRE
→ EXCEPTION : femme de ménage ou gardien → NAVIGATE /dashboard/personnel (déjà dans le Personnel)

CONTRAT DE LOCATION :
→ Action : NAVIGATE vers /dashboard/occupants

DEVIS TRAVAUX :
→ Action : CREATE_PRESTATAIRE (avec montantMarche)

════════════════════════════════════════
FORMAT TECHNIQUE (structure JSON requise)
════════════════════════════════════════
Tu dois toujours répondre avec du JSON valide. Le champ "reply" = texte naturel. Le champ "action" = l'action que l'application va exécuter.

RAPPEL CRITIQUE : Si l'utilisateur demande une action (créer, enregistrer, marquer, ajouter), tu DOIS mettre un "action" non-null dans ta réponse. L'application affichera un bouton de confirmation et exécutera l'action quand l'utilisateur clique.

Format sans action (information pure) :
{
  "reply": "texte naturel en français",
  "action": null,
  "quickReplies": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

Format avec action (TOUJOURS pour les demandes de création/modification) :
{
  "reply": "J'ai bien noté. Voici ce que je vais enregistrer : facture REDAL pour A7, 450,50 MAD, période mars 2026. Cliquez sur le bouton pour confirmer.",
  "action": {
    "type": "CREATE_INVOICE",
    "label": "✅ Enregistrer la facture",
    "payload": {
      "unitName": "A7",
      "serviceType": "ELECTRICITY",
      "amount": 450.50,
      "period": "2026-03",
      "dueDate": "2026-04-30",
      "previousIndex": 28200,
      "currentIndex": 28439,
      "reference": "REF-2026-001"
    },
    "missingFields": []
  },
  "quickReplies": ["Voir les factures", "Enregistrer un autre relevé", "Résumé du mois"]
}

Exemple tâche personnel :
{
  "reply": "Je vais enregistrer que Fatima a nettoyé les escaliers, SS1 et SS2 aujourd'hui.",
  "action": {
    "type": "CREATE_STAFF_TASK",
    "label": "✅ Enregistrer la tâche",
    "payload": {
      "staffName": "Fatima",
      "date": "2026-04-20",
      "areas": ["ESCALIERS", "SS1", "SS2"],
      "duration": 3,
      "status": "DONE"
    },
    "missingFields": []
  },
  "quickReplies": ["Voir le planning", "Enregistrer paiement", "Autre tâche"]
}

Autres règles :
- Réponds en arabe si l'utilisateur écrit en arabe, sinon français
- Pour les montants, toujours préciser MAD
- Ne jamais inventer des données absentes du contexte
- Utilise web_search pour toute info qui peut changer avec le temps

Données temps réel :
{CONTEXT}`;

// ── Web search ─────────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function executeWebSearch(query: string): Promise<string> {
  const TIMEOUT = 3000;
  const fallback = `Recherche internet indisponible pour "${query}". Réponds selon tes connaissances.`;

  try {
    // Special case: weather
    if (/météo|weather|temps (qu'il fait|à casa)|pluie|vent/i.test(query)) {
      const city = query.match(/(?:à|in|pour)\s+([A-Za-zÀ-ÿ\s]+)/i)?.[1]?.trim() ?? "Casablanca";
      const data = await withTimeout(
        fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`).then(r => r.json()),
        TIMEOUT,
        null
      ) as any;
      const cur = data?.current_condition?.[0];
      if (cur) {
        return `Météo ${city}: ${cur.temp_C}°C, ${cur.weatherDesc?.[0]?.value ?? ""}. Humidité: ${cur.humidity}%. Vent: ${cur.windspeedKmph} km/h.`;
      }
    }

    // DuckDuckGo Instant Answers
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&no_redirect=1`;
    const ddgData = await withTimeout(
      fetch(ddgUrl).then(r => r.json()),
      TIMEOUT,
      null
    ) as any;

    if (!ddgData) return fallback;

    const parts: string[] = [];
    if (ddgData.AbstractText) parts.push(ddgData.AbstractText);
    if (ddgData.Answer) parts.push(`Réponse: ${ddgData.Answer}`);
    if (ddgData.Definition) parts.push(ddgData.Definition);
    (ddgData.RelatedTopics ?? []).slice(0, 3).map((t: any) => t.Text).filter(Boolean).forEach((t: string) => parts.push(t));

    return parts.length > 0 ? parts.join("\n\n") : fallback;
  } catch {
    return fallback;
  }
}

// Detect if message needs web search (avoid calling it for pure DB tasks)
function needsWebSearch(message: string): boolean {
  const localKeywords = /facture|dépense|relevé|compteur|tâche|personnel|gardien|ménage|prestataire|occupant|intervention|paiement|loyer|index|kWh|m³/i;
  const webKeywords = /prix|tarif|météo|weather|actualité|loi|règlement|taux|cours|marché immobilier|cherche sur internet|recherche/i;
  if (localKeywords.test(message) && !webKeywords.test(message)) return false;
  return webKeywords.test(message);
}

// ── Helpers mémoire ────────────────────────────────────────────────────────────

async function getMemoryContext(userId: string): Promise<string> {
  try {
    const memories = await prisma.agentMemory.findMany({
      where: { key: { startsWith: `user:${userId}:` } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
    if (memories.length === 0) return "";
    const lines = memories.map(m => `- ${m.key.split(":").pop()}: ${m.value}${m.context ? ` (${m.context})` : ""}`);
    return `\n\n=== MÉMOIRE PERSISTANTE (sessions précédentes) ===\n${lines.join("\n")}`;
  } catch { return ""; }
}

async function saveMemoryFacts(userId: string, _reply: string, message: string) {
  try {
    const facts: { key: string; value: string; context?: string }[] = [];

    if (/[ا-ي]/.test(message)) {
      facts.push({ key: `user:${userId}:langue`, value: "ar", context: "détecté depuis message" });
    } else if (message.length > 10) {
      facts.push({ key: `user:${userId}:langue`, value: "fr", context: "détecté depuis message" });
    }

    facts.push({
      key: `user:${userId}:derniere_action`,
      value: message.slice(0, 120),
      context: new Date().toISOString().split("T")[0],
    });

    const prestMatch = message.match(/(?:prestataire|société|entreprise|devis)[:\s]+([A-ZÀÁÂÉÊÈÎÔÙ][a-zA-ZÀ-ÿ\s]{3,40})/i);
    if (prestMatch) {
      facts.push({ key: `user:${userId}:dernier_prestataire`, value: prestMatch[1].trim(), context: "mentionné dans le chat" });
    }

    await Promise.all(facts.map(f =>
      prisma.agentMemory.upsert({
        where: { key: f.key },
        create: { key: f.key, value: f.value, context: f.context ?? null },
        update: { value: f.value, context: f.context ?? null },
      })
    ));
  } catch { /* silently ignore */ }
}

// ── Web search tool definition ────────────────────────────────────────────────

const WEB_SEARCH_TOOL: Anthropic.Tool = {
  name: "web_search",
  description: "Recherche sur internet. Utilise pour: tarifs actuels REDAL/ONEE/Lydec, prix matériaux Casablanca, lois copropriété Maroc, prix immobilier Oulad Saleh, météo Casablanca, informations techniques à jour.",
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "La requête de recherche en français ou arabe",
      },
    },
    required: ["query"],
  },
};

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string })?.id ?? session.user?.email ?? "unknown";

  const body = await req.json();
  const { message, history = [], pageContext = "" } = body as {
    message: string;
    history: { role: "user" | "assistant"; content: string }[];
    pageContext?: string;
  };

  if (!message?.trim()) return NextResponse.json({ error: "Message vide" }, { status: 400 });

  const [context, memoryContext] = await Promise.all([
    buildResidenceContext(),
    getMemoryContext(userId),
  ]);

  const systemWithContext = SYSTEM_PROMPT.replace("{CONTEXT}", context + memoryContext) +
    (pageContext ? `\n\nPage actuelle de l'utilisateur: ${pageContext}` : "");

  const recentHistory = history.slice(-12);
  let currentMessages: Anthropic.MessageParam[] = [
    ...recentHistory.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];

  // Only offer web search when message actually needs it
  const useWebSearch = needsWebSearch(message);

  // Tool use loop (max 2 iterations to avoid hanging)
  let finalRaw = "";
  let loopCount = 0;

  while (loopCount < 2) {
    loopCount++;
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: systemWithContext,
      messages: currentMessages,
      ...(useWebSearch ? { tools: [WEB_SEARCH_TOOL], tool_choice: { type: "auto" } } : {}),
    });

    if (response.stop_reason === "tool_use") {
      // Execute each tool call
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use" && block.name === "web_search") {
          const input = block.input as { query?: string };
          const result = await executeWebSearch(input.query ?? "");
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }
      // Continue conversation with tool results
      currentMessages = [
        ...currentMessages,
        { role: "assistant" as const, content: response.content },
        { role: "user" as const, content: toolResults },
      ];
    } else {
      // end_turn — extract final text
      finalRaw = response.content
        .filter(b => b.type === "text")
        .map(b => (b as Anthropic.TextBlock).text)
        .join("");
      break;
    }
  }

  // Sauvegarder en mémoire (non bloquant)
  saveMemoryFacts(userId, finalRaw, message);

  // Extraire le JSON — Claude l'enveloppe parfois dans ```json...```
  const extractJSON = (text: string) => {
    const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (mdMatch) return mdMatch[1].trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
    return text;
  };

  try {
    const parsed = JSON.parse(extractJSON(finalRaw));
    if (typeof parsed.reply === "string") {
      parsed.reply = parsed.reply.replace(/```[\s\S]*?```/g, "").replace(/^\s*\{[\s\S]*\}\s*$/, "").trim();
    }
    return NextResponse.json(parsed);
  } catch {
    const replyMatch = finalRaw.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (replyMatch) {
      const reply = replyMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
      return NextResponse.json({ reply, action: null, quickReplies: [] });
    }
    return NextResponse.json({ reply: finalRaw.replace(/```[\s\S]*?```/g, "").trim(), action: null, quickReplies: [] });
  }
}
