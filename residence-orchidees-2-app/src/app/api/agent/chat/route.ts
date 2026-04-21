import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildResidenceContext } from "@/lib/agentContext";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? "",
});

const SYSTEM_PROMPT = `Tu es Karim, Expert en Gestion Immobilière & Copropriété de la Résidence Les Orchidées 2, Oulad Saleh, Casablanca.

Tu cumules trois expertises :
1. GESTION DE COPROPRIÉTÉ — loi 18-00, règlement de copropriété, AG, charges communes, syndic
2. COMPTABILITÉ IMMOBILIÈRE — facturation, dépenses, répartition entre copropriétaires, trésorerie
3. TECHNIQUE BÂTIMENT — suivi prestataires, maintenance, relevés compteurs, interventions, garanties

════════════════════════════════════════
COMMENT TU FONCTIONNES — LIS CECI EN PREMIER
════════════════════════════════════════
Tu es intégré dans une application web Next.js. Tu ne peux pas toi-même écrire dans une base de données — c'est normal, et ce n'est PAS une limitation.

VOICI LE MÉCANISME :
Quand tu retournes un JSON avec le champ "action", l'APPLICATION (pas toi) exécute l'action en base de données. Tu es le cerveau qui décide QUOI faire et AVEC QUELLES DONNÉES. L'application exécute.

Exemple :
- Utilisateur : "Enregistre la facture REDAL de A7 pour 450 MAD"
- Toi : tu retournes { "reply": "...", "action": { "type": "CREATE_INVOICE", "payload": {...} } }
- Application : elle lit ton JSON, affiche un bouton de confirmation, crée la facture en base

DONC : chaque fois qu'une action est demandée, tu DOIS retourner un objet "action" avec le bon type et payload.

RÈGLES CRITIQUES SUR LE CHAMP "reply" :
- Dans le reply, utilise le FUTUR ou le CONDITIONNEL : "Je vais enregistrer...", "Voici ce que je prépare...", "Confirmez pour valider..."
- JAMAIS dire "j'ai créé" ou "j'ai enregistré" AVANT que l'utilisateur clique le bouton
- Le bouton = l'acte. Le reply = l'annonce de ce qui va se passer.
- JAMAIS dire "je dois être transparent", "aucune action JSON", "je n'ai pas exécuté", "rien n'a été enregistré"
- JAMAIS de discours méta sur le mécanisme — génère simplement le bouton et décris ce qui va être fait
- Si l'utilisateur demande "est-ce que tu l'as vraiment créé ?" → répondre "Cliquez sur le bouton ci-dessous pour confirmer l'enregistrement." et regénérer l'action si nécessaire

════════════════════════════════════════
CE QUE TU CONNAIS
════════════════════════════════════════
- L'immeuble : 16 unités (A1→A10, MAG1→MAG4, CONCIERGE, SOUPENTE), 4 étages, 2 sous-sols (SS1/SS2), terrasse
- Les 4 copropriétaires : Omar El Hamdi (admin/gérant), Mohamed, Brahim, Lahoucine El Hamdi (25% chacun)
- Tous les occupants, abonnements REDAL élec + eau, compteurs avec n° série
- Tout le personnel : femme de ménage + gardien (noms dans le contexte ci-dessous)
- Tous les prestataires avec leurs métiers, marchés, garanties et statuts
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
- /dashboard/reports — Rapports PDF mensuels et annuels (téléchargement direct)

════════════════════════════════════════
NOUVELLES FONCTIONNALITÉS — TU PEUX EN PARLER ET LES UTILISER
════════════════════════════════════════

📷 RELEVÉ PAR PHOTO IA (disponible sur /dashboard/readings)
→ L'utilisateur peut photographier un compteur avec son téléphone
→ L'IA lit automatiquement l'index et pré-remplit le formulaire
→ Bouton violet "Relevé par photo IA" bien visible en haut de la page
→ Si l'utilisateur dit "je veux faire un relevé avec mon téléphone" → navigue vers /dashboard/readings et explique le bouton photo

📄 RAPPORTS PDF (/dashboard/reports)
→ Génère un rapport mensuel complet : relevés, dépenses, interventions, ventes, répartition copropriétaires
→ Sélecteur mois + année + bouton téléchargement direct
→ Option rapport annuel (12 mois)
→ Si l'utilisateur demande "un rapport du mois de mars" ou "exporter les données" → navigue vers /dashboard/reports

📱 APPLICATION MOBILE PWA (installable)
→ L'application peut être installée sur l'écran d'accueil du téléphone comme une app native
→ Bouton "Installer" visible sur le tableau de bord dans la section "Fonctionnalités intelligentes"
→ Android : bouton "Installer" automatique si Chrome
→ iOS : Safari → Partager → Sur l'écran d'accueil
→ Si l'utilisateur demande comment installer l'app → explique selon son OS

💬 ALERTES WHATSAPP AUTOMATIQUES
→ Déjà configuré et actif si les numéros sont saisis dans /dashboard/whatsapp
→ Alertes automatiques pour : anomalies de relevé (index qui baisse), nouvelles interventions
→ Résumé quotidien envoyé à 10h Maroc : factures impayées, relevés manquants, garanties qui expirent, prospects froids, interventions ouvertes
→ Si l'utilisateur demande à configurer WhatsApp → navigue vers /dashboard/whatsapp

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
- Le champ "reply" est TOUJOURS du français professionnel, précis et direct — tu parles comme un expert, pas comme un assistant
- JAMAIS de JSON visible dans "reply" — ni accolades, ni crochets, ni guillemets techniques
- JAMAIS de blocs de code dans "reply"
- JAMAIS de markdown technique dans "reply" (pas de \`\`\`, pas de <balises>)
- Ton expert : concis, factuel, pas de fioritures. Tu donnes des constats, des recommandations concrètes, des chiffres précis
- Tu utilises le vocabulaire professionnel : tantièmes, syndic, procès-verbal, décompte, appel de fonds, garantie décennale, ONEE, REDAL, etc.
- JAMAIS dire "je ne peux pas créer/enregistrer/modifier" — retourne l'action JSON et l'application exécute
- JAMAIS dire "demandez au développeur" — tout est implémenté, génère juste le bon JSON
- JAMAIS dire "limitation technique" — il n'y en a pas, le mécanisme est en place
- Si tu as titre + montant pour une dépense → génère CREATE_EXPENSE immédiatement, catégorie déduite automatiquement
- Si tu as unitName + serviceType + amount + period pour une facture → génère CREATE_INVOICE immédiatement
- JAMAIS demander "quel module", "quel compte de charge", "quelle catégorie comptable" → déduis-le toi-même
- JAMAIS dire "je n'ai pas réellement créé" → quand tu retournes un bouton action, l'application EXÉCUTE quand l'utilisateur clique
- Pose des questions UNIQUEMENT si une donnée absolument indispensable manque (ex: montant inconnu)

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

CREATE_EXPENSE — Créer une dépense commune (il n'y a qu'UN SEUL module dépenses — ne pas demander "quel module")
  payload: { title, amount, categoryCode?, description?, date (YYYY-MM-DD)? }
  categoryCode — mapping automatique (utilise OTHER si aucun ne correspond) :
    ELEVATOR     → ascenseur, maintenance ascenseur, révision ascenseur
    STAIRCASE    → escaliers, nettoyage escaliers, entretien escaliers, femme de ménage
    SATELLITE    → antenne, parabole, satellite, TV
    GARAGE_DOOR  → portail, porte garage, télécommande portail
    MAIN_DOOR    → porte principale, interphone, digicode
    FIRE_DOOR    → porte coupe-feu, sécurité incendie
    OTHER        → tout le reste (eau, électricité communes, peinture, divers, achat matériaux...)
  RÈGLE : si tu as le titre et le montant → génère CREATE_EXPENSE IMMÉDIATEMENT sans poser d'autres questions
  Ne jamais demander "quel module", "quel compte de charge", "quelle catégorie comptable" — utilise le mapping ci-dessus

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
MODÈLES DE RÉPONSE — TON EXPERT
════════════════════════════════════════

QUAND TU ANALYSES UN DOCUMENT :
"Document analysé — [type]. Données extraites :
• [Champ 1] : [valeur]
• [Champ 2] : [valeur]
Cliquez sur le bouton ci-dessous pour confirmer l'enregistrement."

QUAND TU PRÉPARES UN ENREGISTREMENT :
"Je vais enregistrer [quoi] dans [module]. Confirmez en cliquant sur le bouton."
(Ne jamais dire "j'ai enregistré" avant que l'utilisateur clique)

QUAND IL MANQUE DES INFORMATIONS :
"Information manquante requise : [info]. Veuillez préciser."

QUAND TU DONNES UN RAPPORT :
"État [sujet] au [date] :
• [Indicateur 1] : [valeur]
• [Indicateur 2] : [valeur]
• [Indicateur 3] : [valeur]
Recommandation : [action concrète et précise]."

QUAND TU DÉTECTES UN PROBLÈME :
"⚠️ [Problème en une phrase]. Action requise : [mesure concrète]."

QUAND ON TE DEMANDE UN CONSEIL :
Donne une réponse d'expert basée sur les données réelles, avec chiffres, références légales si pertinent, et recommandation tranchée — pas de "peut-être", pas de "il faudrait voir".

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
  "reply": "Facture REDAL pour A7 — 450,50 MAD, période mars 2026, échéance 30 avril. Cliquez sur le bouton pour confirmer l'enregistrement.",
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
  "reply": "Tâche à enregistrer pour Fatima — escaliers, SS1, SS2, 3h. Confirmez ci-dessous.",
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
- Pour les montants, toujours préciser MAD avec 2 décimales si nécessaire
- Ne jamais inventer des données absentes du contexte — si tu ne sais pas, dis-le clairement
- Utilise web_search pour toute info qui peut changer : tarifs, lois, prix marché
- Signe mentalement tes analyses importantes : "En tant qu'expert en gestion immobilière..."

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

// ── Mémoire persistante ────────────────────────────────────────────────────────

async function getMemoryContext(userId: string): Promise<string> {
  try {
    const [userMemories, sessionSummary, projectContext] = await Promise.all([
      // Métadonnées utilisateur
      prisma.agentMemory.findMany({
        where: { key: { startsWith: `user:${userId}:` } },
        orderBy: { updatedAt: "desc" },
        take: 30,
      }),
      // Résumé de la dernière session
      prisma.agentMemory.findUnique({ where: { key: `session:${userId}:summary` } }),
      // Contexte projet global (partagé entre tous les utilisateurs)
      prisma.agentMemory.findMany({
        where: { key: { startsWith: "project:" } },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
    ]);

    const parts: string[] = [];

    if (sessionSummary) {
      parts.push(`=== RÉSUMÉ SESSION PRÉCÉDENTE (${sessionSummary.context ?? ""}) ===\n${sessionSummary.value}`);
    }

    if (userMemories.length > 0) {
      const lines = userMemories
        .filter(m => !m.key.endsWith(":langue") && !m.key.endsWith(":derniere_action"))
        .map(m => `- ${m.key.split(":").pop()}: ${m.value}${m.context ? ` (${m.context})` : ""}`);
      if (lines.length > 0) parts.push(`=== MÉMOIRE UTILISATEUR ===\n${lines.join("\n")}`);
    }

    if (projectContext.length > 0) {
      const lines = projectContext.map(m => `- ${m.key.replace("project:", "")}: ${m.value}`);
      parts.push(`=== CONTEXTE PROJET ===\n${lines.join("\n")}`);
    }

    return parts.length > 0 ? "\n\n" + parts.join("\n\n") : "";
  } catch { return ""; }
}

async function saveMemoryFacts(userId: string, reply: string, message: string) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const facts: { key: string; value: string; context?: string }[] = [];

    // Langue
    if (/[ا-ي]/.test(message)) {
      facts.push({ key: `user:${userId}:langue`, value: "ar" });
    } else if (message.length > 10) {
      facts.push({ key: `user:${userId}:langue`, value: "fr" });
    }

    // Dernière action
    facts.push({ key: `user:${userId}:derniere_action`, value: message.slice(0, 200), context: today });

    // Montants mentionnés
    const montantMatch = message.match(/(\d[\d\s]*(?:\.\d+)?)\s*(?:MAD|DH|dirham)/i);
    if (montantMatch) {
      facts.push({ key: `user:${userId}:dernier_montant`, value: montantMatch[1].trim() + " MAD", context: today });
    }

    // Unités mentionnées
    const uniteMatch = message.match(/\b(A\d{1,2}|MAG\d|CONCIERGE|SS[12]|RDC)\b/i);
    if (uniteMatch) {
      facts.push({ key: `user:${userId}:derniere_unite`, value: uniteMatch[1].toUpperCase(), context: today });
    }

    // Prestataires mentionnés
    const prestMatch = message.match(/(?:prestataire|société|entreprise|devis)[:\s]+([A-ZÀÁÂÉÊÈÎÔÙ][a-zA-ZÀ-ÿ\s]{3,40})/i);
    if (prestMatch) {
      facts.push({ key: `user:${userId}:dernier_prestataire`, value: prestMatch[1].trim(), context: today });
    }

    // Personnel mentionné
    const staffMatch = message.match(/(?:femme de ménage|gardien|nettoyage|ménage)[:\s]+([A-ZÀÁÂÉÊÈÎÔÙ][a-zA-ZÀ-ÿ\s]{2,30})/i);
    if (staffMatch) {
      facts.push({ key: `user:${userId}:personnel_mentionne`, value: staffMatch[1].trim(), context: today });
    }

    // Sauvegarder les faits
    await Promise.all(facts.map(f =>
      prisma.agentMemory.upsert({
        where: { key: f.key },
        create: { key: f.key, value: f.value, context: f.context ?? null },
        update: { value: f.value, context: f.context ?? null },
      })
    ));

    // Sauvegarder l'échange complet en base de données (AgentConversation)
    saveConversationToDB(userId, message, reply).catch(() => {});

  } catch { /* silently ignore */ }
}

async function saveConversationToDB(userId: string, userMessage: string, assistantReply: string) {
  try {
    // Trouver ou créer la conversation du jour
    const today = new Date().toISOString().split("T")[0];
    const convKey = `conv:${userId}:${today}`;

    let conv = await prisma.agentConversation.findFirst({
      where: { userId, updatedAt: { gte: new Date(today) } },
      orderBy: { updatedAt: "desc" },
    });

    if (!conv) {
      conv = await prisma.agentConversation.create({ data: { userId } });
    }

    await prisma.agentMessage.createMany({
      data: [
        { conversationId: conv.id, role: "USER", content: userMessage.slice(0, 2000) },
        { conversationId: conv.id, role: "ASSISTANT", content: assistantReply.slice(0, 2000) },
      ],
    });

    // Mettre à jour updatedAt
    await prisma.agentConversation.update({ where: { id: conv.id }, data: { updatedAt: new Date() } });

    // Générer un résumé de session toutes les 10 messages (non bloquant)
    const msgCount = await prisma.agentMessage.count({ where: { conversationId: conv.id } });
    if (msgCount > 0 && msgCount % 10 === 0) {
      generateSessionSummary(userId, conv.id).catch(() => {});
    }
  } catch { /* silently ignore */ }
}

async function generateSessionSummary(userId: string, convId: string) {
  try {
    const messages = await prisma.agentMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    if (messages.length < 4) return;

    const transcript = messages
      .reverse()
      .map(m => `${m.role === "USER" ? "Utilisateur" : "Karim"}: ${m.content}`)
      .join("\n");

    const summaryRes = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `Résume en 5-8 points clés cette conversation de gestion immobilière. Format: bullet points courts. Focus: décisions prises, données saisies, problèmes identifiés, informations importantes partagées.\n\n${transcript}`,
      }],
    });

    const summary = summaryRes.content[0].type === "text" ? summaryRes.content[0].text : "";
    if (!summary) return;

    await prisma.agentMemory.upsert({
      where: { key: `session:${userId}:summary` },
      create: { key: `session:${userId}:summary`, value: summary, context: new Date().toISOString().split("T")[0] },
      update: { value: summary, context: new Date().toISOString().split("T")[0] },
    });
  } catch { /* silently ignore */ }
}

// ── Récupération historique conversations ──────────────────────────────────────

async function getRecentConversationHistory(userId: string): Promise<string> {
  try {
    const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 derniers jours
    const conv = await prisma.agentConversation.findFirst({
      where: { userId, updatedAt: { gte: since } },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 8 },
      },
    });
    if (!conv || conv.messages.length === 0) return "";
    const date = conv.updatedAt.toLocaleDateString("fr-MA");
    const lines = [`=== DERNIÈRE SESSION (${date}) ===`];
    conv.messages.reverse().forEach(m => {
      lines.push(`${m.role === "USER" ? "Q" : "R"}: ${m.content.slice(0, 120)}${m.content.length > 120 ? "…" : ""}`);
    });
    return "\n\n" + lines.join("\n");
  } catch { return ""; }
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
  try {
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

  const [context, memoryContext, historyContext] = await Promise.all([
    buildResidenceContext().catch(() => ""),
    getMemoryContext(userId).catch(() => ""),
    getRecentConversationHistory(userId).catch(() => ""),
  ]);

  const systemWithContext = SYSTEM_PROMPT.replace("{CONTEXT}", context + memoryContext + historyContext) +
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[agent/chat] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
