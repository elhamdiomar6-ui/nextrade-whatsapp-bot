# NexTrade Groupe — Chatbot WhatsApp Automatique

Ce chatbot répond automatiquement aux messages WhatsApp reçus sur le numéro NexTrade Groupe (+212 662 425 007) via l'API UltraMsg.

---

## Fonctionnalités

Le bot propose un menu interactif avec les options suivantes :

| Commande | Action |
|----------|--------|
| **0** ou **menu** | Affiche le menu principal |
| **1** ou **catalogue** | Envoie le lien du catalogue produits |
| **2** ou **tarifs** | Affiche les 3 plans avec prix et détails |
| **3** ou **inscription** | Envoie le lien d'inscription gratuite |
| **4** ou **conseiller** | Notifie l'admin et promet un rappel |
| **5** ou **apropos** | Présente NexTrade Groupe |
| **6** ou **devis** | Demande les infos pour un devis personnalisé |

Le bot comprend également les mots-clés courants en français, anglais, arabe et turc (bonjour, hello, salam, merhaba).

---

## Prérequis

Le chatbot nécessite Node.js version 16 ou supérieure, ainsi qu'un compte UltraMsg actif avec une instance WhatsApp connectée. Un serveur accessible publiquement (VPS, Heroku, Railway, ou Render) est également nécessaire pour recevoir les webhooks.

---

## Installation

### Étape 1 : Installer les dépendances

```bash
cd whatsapp_bot
npm install
```

### Étape 2 : Configurer les variables d'environnement (optionnel)

Les identifiants UltraMsg sont déjà codés en dur dans le fichier, mais il est recommandé d'utiliser des variables d'environnement en production :

```bash
export ULTRAMSG_INSTANCE=instance166605
export ULTRAMSG_TOKEN=0eclbimjzljliff9
export ADMIN_PHONE=+212662425007
export PORT=3000
```

### Étape 3 : Lancer le bot

```bash
npm start
```

Le serveur démarre sur le port 3000 par défaut.

---

## Configuration du Webhook UltraMsg

Cette étape est indispensable pour que le bot reçoive les messages entrants.

1. Connectez-vous à votre tableau de bord UltraMsg : https://user.ultramsg.com
2. Sélectionnez l'instance **instance166605**
3. Allez dans l'onglet **Webhook**
4. Dans le champ **Webhook URL**, entrez : `https://votre-domaine.com/webhook`
5. Activez les événements : **messages** (messages reçus)
6. Cliquez sur **Save**

Le bot commencera immédiatement à répondre aux messages entrants.

---

## Déploiement en Production

### Option A : VPS (recommandé)

Pour un déploiement sur un VPS Linux (Ubuntu), installez PM2 pour maintenir le processus actif en permanence :

```bash
npm install -g pm2
pm2 start whatsapp_bot.js --name nextradebot
pm2 save
pm2 startup
```

Configurez ensuite un reverse proxy Nginx pour exposer le port 3000 sur le domaine :

```nginx
server {
    listen 80;
    server_name bot.nextradegroupe.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option B : Railway / Render (gratuit)

1. Créez un compte sur https://railway.app ou https://render.com
2. Connectez votre dépôt GitHub contenant le dossier `whatsapp_bot`
3. La plateforme détectera automatiquement le `package.json` et lancera `npm start`
4. Copiez l'URL publique générée et configurez-la comme Webhook dans UltraMsg

---

## Vérification

Pour vérifier que le bot fonctionne, accédez à l'endpoint de santé :

```
GET https://votre-domaine.com/health
```

Réponse attendue :
```json
{
  "status": "running",
  "bot": "NexTrade Groupe",
  "instance": "instance166605",
  "uptime": 123.456,
  "timestamp": "2026-03-21T12:00:00.000Z"
}
```

---

## Architecture

```
whatsapp_bot/
├── whatsapp_bot.js      # Serveur Express + logique du chatbot
├── package.json         # Dépendances Node.js
└── README_BOT.md        # Ce fichier
```

Le bot utilise un serveur Express qui expose un endpoint `/webhook` pour recevoir les messages entrants depuis UltraMsg, les traiter, et envoyer les réponses appropriées via l'API UltraMsg.
