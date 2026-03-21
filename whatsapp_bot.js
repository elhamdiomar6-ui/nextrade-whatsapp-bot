/**
 * NexTrade Groupe — Chatbot WhatsApp Automatique
 * Utilise l'API UltraMsg pour recevoir et répondre aux messages
 * 
 * Instance: instance166605
 * Token: 0eclbimjzljliff9
 * 
 * Déploiement: voir README_BOT.md
 */

const express = require('express');
const fetch = require('node-fetch');

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
  INSTANCE_ID: process.env.ULTRAMSG_INSTANCE || 'instance166605',
  TOKEN: process.env.ULTRAMSG_TOKEN || '0eclbimjzljliff9',
  PORT: process.env.PORT || 3000,
  ADMIN_PHONE: process.env.ADMIN_PHONE || '+212662425007',
  SITE_URL: 'https://nextradegroupe.com',
  BOT_NAME: 'NexTrade Groupe'
};

CONFIG.API_URL = `https://api.ultramsg.com/${CONFIG.INSTANCE_ID}/messages/chat`;

// ============================================================
// MESSAGES DU BOT
// ============================================================
const MESSAGES = {
  menu: [
    `\u{1F44B} *Bonjour ! Je suis l'assistant NexTrade Groupe.*`,
    ``,
    `La 1\u00e8re marketplace B2B d\u00e9di\u00e9e aux produits agroalimentaires entre le Maroc, la Turquie et le monde.`,
    ``,
    `Comment puis-je vous aider ? R\u00e9pondez avec le num\u00e9ro de votre choix :`,
    ``,
    `1\uFE0F\u20E3  Voir le catalogue produits`,
    `2\uFE0F\u20E3  D\u00e9couvrir nos tarifs`,
    `3\uFE0F\u20E3  S'inscrire gratuitement`,
    `4\uFE0F\u20E3  Parler \u00e0 un conseiller`,
    `5\uFE0F\u20E3  En savoir plus sur NexTrade`,
    ``,
    `\u2328\uFE0F Tapez un num\u00e9ro (1-5) pour continuer.`
  ].join('\n'),

  catalogue: [
    `\u{1F4E6} *Catalogue NexTrade Groupe*`,
    ``,
    `D\u00e9couvrez nos produits agroalimentaires certifi\u00e9s :`,
    ``,
    `\u{1F1F2}\u{1F1E6} *Maroc* : Huile d'Argan, Safran, Huile d'Olive, \u00C9pices Bio`,
    `\u{1F1F9}\u{1F1F7} *Turquie* : Figues S\u00e8ches, Abricots Secs, Noisettes, Raisins Secs`,
    `\u{1F1E8}\u{1F1F3} *Chine* : Th\u00e9, Gingembre, Champignons, Produits industriels`,
    ``,
    `\u{1F449} Consultez le catalogue complet :`,
    `${CONFIG.SITE_URL}/catalogue.php`,
    ``,
    `\u{1F50D} Vous cherchez un produit sp\u00e9cifique ? Tapez *6* pour demander un devis personnalis\u00e9.`,
    ``,
    `\u2B05\uFE0F Tapez *0* pour revenir au menu principal.`
  ].join('\n'),

  tarifs: [
    `\u{1F4B0} *Nos Tarifs NexTrade Groupe*`,
    ``,
    `Tous les plans incluent un essai gratuit de 7 jours :`,
    ``,
    `\u{1F680} *Starter* \u2014 39$/mois`,
    `   \u2022 10 produits list\u00e9s`,
    `   \u2022 Messagerie limit\u00e9e`,
    `   \u2022 Statistiques basiques`,
    `   \u2022 Badge V\u00e9rifi\u00e9`,
    ``,
    `\u{1F4BC} *Business* \u2014 89$/mois \u2B50 Le plus populaire`,
    `   \u2022 50 produits list\u00e9s`,
    `   \u2022 Messagerie illimit\u00e9e`,
    `   \u2022 Statistiques avanc\u00e9es`,
    `   \u2022 5 rapports IA / mois`,
    ``,
    `\u{1F451} *Premium* \u2014 199$/mois`,
    `   \u2022 Produits illimit\u00e9s`,
    `   \u2022 Support d\u00e9di\u00e9 24/7`,
    `   \u2022 Rapports IA illimit\u00e9s`,
    `   \u2022 Account Manager d\u00e9di\u00e9`,
    ``,
    `\u{1F449} Voir tous les d\u00e9tails et s'abonner :`,
    `${CONFIG.SITE_URL}/tarifs.html`,
    ``,
    `\u2B05\uFE0F Tapez *0* pour revenir au menu principal.`
  ].join('\n'),

  inscription: [
    `\u{270D}\uFE0F *Inscription Gratuite*`,
    ``,
    `Rejoignez NexTrade Groupe en 2 minutes :`,
    ``,
    `\u2705 Inscription 100% gratuite`,
    `\u2705 Essai gratuit de 7 jours`,
    `\u2705 Aucune carte bancaire requise`,
    `\u2705 V\u00e9rification sous 48h`,
    ``,
    `\u{1F449} Inscrivez-vous maintenant :`,
    `${CONFIG.SITE_URL}/inscription.html`,
    ``,
    `\u{1F4AC} Besoin d'aide pour l'inscription ? Tapez *4* pour parler \u00e0 un conseiller.`,
    ``,
    `\u2B05\uFE0F Tapez *0* pour revenir au menu principal.`
  ].join('\n'),

  conseiller: [
    `\u{1F464} *Demande de contact*`,
    ``,
    `Merci de votre int\u00e9r\u00eat pour NexTrade Groupe !`,
    ``,
    `\u{1F4DE} Un conseiller vous contactera dans les plus brefs d\u00e9lais.`,
    ``,
    `En attendant, vous pouvez :`,
    `\u2022 Nous \u00e9crire par email : contact@nextradegroupe.com`,
    `\u2022 Visiter notre site : ${CONFIG.SITE_URL}`,
    `\u2022 Nous appeler : +212 662 425 007`,
    ``,
    `\u{1F552} Horaires : Lun-Ven, 9h-18h (GMT+1)`,
    ``,
    `\u2B05\uFE0F Tapez *0* pour revenir au menu principal.`
  ].join('\n'),

  apropos: [
    `\u{1F30D} *\u00C0 propos de NexTrade Groupe*`,
    ``,
    `NexTrade Groupe est la premi\u00e8re plateforme B2B d\u00e9di\u00e9e aux producteurs et acheteurs de produits agroalimentaires biologiques.`,
    ``,
    `\u{1F3E2} *Si\u00e8ges* : Casablanca (Maroc) & Istanbul (Turquie)`,
    `\u{1F30D} *Pr\u00e9sence* : 50+ pays`,
    `\u{1F465} *Membres* : 200+ entreprises v\u00e9rifi\u00e9es`,
    `\u{1F4E6} *Produits* : 500+ r\u00e9f\u00e9rences`,
    `\u{1F4AC} *Langues* : Fran\u00e7ais, Anglais, Arabe, Turc`,
    ``,
    `\u{1F449} En savoir plus :`,
    `${CONFIG.SITE_URL}/apropos.html`,
    ``,
    `\u2B05\uFE0F Tapez *0* pour revenir au menu principal.`
  ].join('\n'),

  devis: [
    `\u{1F4CB} *Demande de devis personnalis\u00e9*`,
    ``,
    `Pour recevoir un devis, envoyez-nous les informations suivantes :`,
    ``,
    `1. Votre nom et entreprise`,
    `2. Le(s) produit(s) recherch\u00e9(s)`,
    `3. La quantit\u00e9 souhait\u00e9e`,
    `4. Le pays de destination`,
    ``,
    `Notre \u00e9quipe sourcing vous r\u00e9pondra sous 24h avec une offre personnalis\u00e9e.`,
    ``,
    `\u2B05\uFE0F Tapez *0* pour revenir au menu principal.`
  ].join('\n'),

  unknown: [
    `\u{1F914} Je n'ai pas compris votre message.`,
    ``,
    `Tapez un num\u00e9ro de *0* \u00e0 *6* pour naviguer dans le menu, ou tapez *menu* pour afficher les options.`
  ].join('\n')
};

// ============================================================
// FONCTIONS API ULTRAMSG
// ============================================================

/**
 * Envoie un message WhatsApp via UltraMsg
 */
async function sendMessage(to, body) {
  try {
    const params = new URLSearchParams();
    params.append('token', CONFIG.TOKEN);
    params.append('to', to);
    params.append('body', body);

    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await response.json();
    console.log(`[BOT] Message envoyé à ${to}:`, data.sent ? 'OK' : 'ERREUR', data);
    return data;
  } catch (error) {
    console.error(`[BOT] Erreur envoi à ${to}:`, error.message);
    return null;
  }
}

/**
 * Notifie l'admin d'une demande de contact
 */
async function notifyAdminContact(from) {
  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' });
  const message = [
    `\u{1F514} *Demande de conseiller*`,
    ``,
    `Un utilisateur souhaite parler \u00e0 un conseiller.`,
    `\u{1F4DE} Num\u00e9ro : ${from}`,
    `\u{1F4C5} Date : ${now}`,
    ``,
    `Merci de le contacter rapidement.`
  ].join('\n');

  return sendMessage(CONFIG.ADMIN_PHONE, message);
}

// ============================================================
// TRAITEMENT DES MESSAGES
// ============================================================

/**
 * Traite un message entrant et retourne la réponse appropriée
 */
function processMessage(text) {
  const cleaned = text.trim().toLowerCase();

  // Commandes numériques
  switch (cleaned) {
    case '0':
    case 'menu':
    case 'bonjour':
    case 'hello':
    case 'hi':
    case 'salut':
    case 'salam':
    case 'merhaba':
      return { response: MESSAGES.menu, action: null };

    case '1':
    case 'catalogue':
    case 'produits':
      return { response: MESSAGES.catalogue, action: null };

    case '2':
    case 'tarifs':
    case 'prix':
    case 'plans':
      return { response: MESSAGES.tarifs, action: null };

    case '3':
    case 'inscription':
    case 'inscrire':
    case 'register':
      return { response: MESSAGES.inscription, action: null };

    case '4':
    case 'conseiller':
    case 'contact':
    case 'humain':
      return { response: MESSAGES.conseiller, action: 'notify_admin' };

    case '5':
    case 'apropos':
    case 'info':
    case 'about':
      return { response: MESSAGES.apropos, action: null };

    case '6':
    case 'devis':
    case 'quote':
    case 'rfq':
      return { response: MESSAGES.devis, action: null };

    default:
      return { response: MESSAGES.unknown, action: null };
  }
}

// ============================================================
// SERVEUR EXPRESS (Webhook)
// ============================================================

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Anti-boucle : ne pas répondre aux messages envoyés par le bot
const processedMessages = new Set();
const BOT_PHONE = CONFIG.ADMIN_PHONE.replace('+', '');

/**
 * Webhook UltraMsg — reçoit les messages entrants
 * URL à configurer dans UltraMsg: https://votre-serveur.com/webhook
 */
app.post('/webhook', async (req, res) => {
  try {
    const data = req.body;

    // Vérifier que c'est un message entrant valide
    if (!data || !data.data || !data.data.from || !data.data.body) {
      return res.status(200).json({ status: 'ignored', reason: 'invalid_data' });
    }

    const from = data.data.from;
    const body = data.data.body;
    const msgId = data.data.id || Date.now().toString();

    // Anti-boucle : ignorer les messages du bot lui-même
    if (from.includes(BOT_PHONE)) {
      return res.status(200).json({ status: 'ignored', reason: 'self_message' });
    }

    // Anti-doublon
    if (processedMessages.has(msgId)) {
      return res.status(200).json({ status: 'ignored', reason: 'duplicate' });
    }
    processedMessages.add(msgId);

    // Nettoyer le cache après 1000 messages
    if (processedMessages.size > 1000) {
      const arr = Array.from(processedMessages);
      arr.slice(0, 500).forEach(id => processedMessages.delete(id));
    }

    console.log(`[BOT] Message reçu de ${from}: "${body}"`);

    // Traiter le message
    const result = processMessage(body);

    // Envoyer la réponse
    await sendMessage(from, result.response);

    // Actions spéciales
    if (result.action === 'notify_admin') {
      await notifyAdminContact(from);
    }

    res.status(200).json({ status: 'ok', from, processed: true });

  } catch (error) {
    console.error('[BOT] Erreur webhook:', error);
    res.status(200).json({ status: 'error', message: error.message });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'running',
    bot: CONFIG.BOT_NAME,
    instance: CONFIG.INSTANCE_ID,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * Page d'accueil
 */
app.get('/', (req, res) => {
  res.send(`
    <html>
    <head><title>NexTrade WhatsApp Bot</title></head>
    <body style="font-family:sans-serif;text-align:center;padding:40px;">
      <h1>NexTrade Groupe — WhatsApp Bot</h1>
      <p>Le chatbot WhatsApp est actif et opérationnel.</p>
      <p>Instance: ${CONFIG.INSTANCE_ID}</p>
      <p><a href="/health">Vérifier le statut</a></p>
    </body>
    </html>
  `);
});

// ============================================================
// DÉMARRAGE
// ============================================================
app.listen(CONFIG.PORT, () => {
  console.log(`\n========================================`);
  console.log(`  NexTrade WhatsApp Bot`);
  console.log(`  Instance: ${CONFIG.INSTANCE_ID}`);
  console.log(`  Port: ${CONFIG.PORT}`);
  console.log(`  Webhook: http://localhost:${CONFIG.PORT}/webhook`);
  console.log(`========================================\n`);
});

module.exports = app;
