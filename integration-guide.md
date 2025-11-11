# Emma SMS Test Server – Guide d'intégration

Ce guide explique comment brancher le serveur `test-sms-server.js` sur l'écosystème Emma (n8n → `/api/adapters/sms`) pour tester gratuitement en local et déployer en mode production.

## 1. Architecture

```
[Dashboard test] --(POST /simulate-incoming)--> test-sms-server
       │
       ├── Mode TEST: POST form-urlencoded → n8n `/webhook/gob-sms-webhook-test`
       │             → n8n → `/api/adapters/sms` → `/api/chat`
       │             → TwiML renvoyé au serveur test → Dashboard
       │
       └── Mode PROD (local/cloud): Twilio → `/webhook/sms`
                       ↳ test-sms-server → `/api/adapters/sms`
                       ↳ Twilio (TwiML) + option d'envoi sortant via API Twilio
```

## 2. Variables d'environnement

Ajoutez les variables suivantes (cf. `.env.example`):

| Variable | Description |
| --- | --- |
| `MODE` | `test`, `prod_local`, `prod_cloud` |
| `EMMA_WEBHOOK_URL` | URL n8n (`http(s)://<n8n>/webhook/gob-sms-webhook`) ou Vercel |
| `TEST_SMS_PORT` / `PORT` | Port local du dashboard |
| `PUBLIC_URL` | URL publique (ngrok ou domaine) pour Twilio |
| `TEST_MODE` | Force l'envoi gratuit (true en test) |
| `DEBUG_EMMA` | Active les logs détaillés |
| `TWILIO_*` | Requis si envoi/SMS réels |
| `SIMULATED_LATENCY_MS` | Latence artificielle pour scénarios |
| `EMMA_TIMEOUT_MS` | Timeout webhook Emma |

## 3. Configuration n8n

1. Importez/actualisez `n8n-workflows/sms-workflow.json`.
2. Deux webhooks existent maintenant :
   - `gob-sms-webhook` (Twilio production, inchangé)
   - `gob-sms-webhook-test` (Simulations gratuites)
3. Les deux convergent vers `Extract SMS Data` puis `Call SMS Adapter` → `/api/adapters/sms`.

## 4. Lancement (CLI ou Panneau Admin)

```bash
# Mode test (par défaut)
npm run sms:test-server

# Mode prod local (Twilio + ngrok)
MODE=prod_local PUBLIC_URL=https://<ngrok>.ngrok.io npm run sms:test-server

# Lancer les scénarios automatisés
npm run sms:scenarios
```

> 💡 **Depuis le dashboard** : onglet **Admin JSLAI → Emma SMS**. Ce panneau permet de modifier `MODE`, `EMMA_WEBHOOK_URL`, `PUBLIC_URL`, les clés Twilio, puis de démarrer/arrêter le serveur local et lancer les scénarios sans quitter l’interface. Toutes les modifications sont persistées dans `.env.local`.

## 5. Brancher Twilio en prod_local/prod_cloud

1. Démarrez le serveur en mode prod (`MODE=prod_local`).
2. Exposez avec ngrok: `ngrok http 3000`.
3. Dans Twilio Console → Phone Numbers → Messaging:
   - **A MESSAGE COMES IN** → `POST https://<ngrok>/webhook/sms`
4. Envoyez un SMS réel à votre numéro Twilio :
   - Le serveur relaie la requête vers `/api/adapters/sms`.
   - Emma répond, le serveur renvoie la TwiML à Twilio (et log dans le dashboard).

## 6. Déploiement Render/Railway (optionnel)

Pour éviter d’avoir à lancer le serveur en local, vous pouvez déployer `test-sms-server.js` sur une plateforme Node (Render, Railway, Fly.io, VM, etc.).

1. **Repo** : `npm start` lance maintenant `node test-sms-server.js` (Render l’utilise par défaut).
2. **Deploy Render** :
   - Type : *Web Service* (Node, branch `main`).
   - Build command : `npm install`
   - Start command : `npm start`
   - Health check path : `/health`
   - Variables : `MODE`, `TEST_MODE`, `EMMA_WEBHOOK_URL`, `PUBLIC_URL`, `TWILIO_*`, `N8N_WEBHOOK_BASE_URL`, etc.
3. Une fois l’URL Render obtenue (ex: `https://gob-xxxx.onrender.com`), mettez-la dans le panneau Admin (champ `PUBLIC_URL`) et, si besoin, adaptez `EMMA_WEBHOOK_URL`/les webhooks Twilio.

`render.yaml` dans le repo donne un exemple de configuration “Blueprint”.

## 7. Tests automatisés

`test-scenarios.js` couvre les commandes réelles (MARCHE, ANALYSE, NEWS, WATCHLIST, SKILLS, etc.) et vérifie la présence de mots clés. Résultats directement dans le terminal.

## 8. Migration / Compatibilité

- Les workflows n8n et `/api/adapters/sms` restent inchangés : aucun duplicat de logique.
- Le serveur test envoie exactement le même payload Twilio (`application/x-www-form-urlencoded`).
- Les nouvelles commandes Emma sont automatiquement disponibles (le dashboard ne fait que relayer).

## 9. Prochaines étapes suggérées

- Ajouter des scénarios personnalisés (fichier `test-scenarios.js`).
- Activer `VALIDATE_TWILIO_SIGNATURE=true` une fois déployé derrière HTTPS.
- Connecter ce serveur à un pipeline CI (GitHub Action) si vous voulez lancer les scénarios après chaque déploiement.
