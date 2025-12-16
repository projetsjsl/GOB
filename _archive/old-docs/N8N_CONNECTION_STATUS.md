# 🔗 Statut de Connexion n8n

## ✅ Serveur Accessible

**URL de base**: `https://projetsjsl.app.n8n.cloud`  
**Workflow ID**: `03lgcA4e9uRTtli1`  
**URL complète**: `https://projetsjsl.app.n8n.cloud/workflow/03lgcA4e9uRTtli1`

### Tests Effectués

✅ **Serveur accessible** - Le serveur répond correctement  
✅ **Health check** - `/healthz` et `/health` fonctionnent  
⚠️ **API REST** - Nécessite une authentification (API key)  
⚠️ **Webhooks** - Aucun webhook public trouvé pour les workflows GOB

## 🔐 Authentification Requise

Pour accéder aux workflows via l'API, vous devez :

1. **Obtenir votre API Key**:
   - Connectez-vous à https://projetsjsl.app.n8n.cloud
   - Allez dans **Settings** → **API**
   - Créez une nouvelle API key
   - Copiez la clé générée

2. **Configurer la clé**:
   ```bash
   export N8N_API_KEY=votre_cle_ici
   ```

3. **Tester la connexion**:
   ```bash
   node connect-n8n-specific.js --api-key votre_cle
   # ou
   node test-n8n-workflow.js
   ```

## 📋 Scripts Disponibles

### 1. `connect-n8n-specific.js`
Script principal pour se connecter et récupérer les informations du workflow.

**Usage**:
```bash
# Avec API key en variable d'environnement
export N8N_API_KEY=votre_cle
node connect-n8n-specific.js

# Avec API key en argument
node connect-n8n-specific.js --api-key votre_cle
```

**Fonctionnalités**:
- Test de connexion au serveur
- Récupération du workflow spécifique (ID: 03lgcA4e9uRTtli1)
- Liste de tous les workflows disponibles
- Affichage des informations détaillées (nodes, webhooks, etc.)
- Sauvegarde du workflow en JSON

### 2. `test-n8n-workflow.js`
Script de test pour vérifier différents endpoints.

**Usage**:
```bash
node test-n8n-workflow.js
```

**Fonctionnalités**:
- Test de l'URL directe du workflow
- Test de l'API REST (si API key fournie)
- Recherche de webhooks publics
- Vérification de santé du serveur

### 3. `test-n8n-connection.js`
Script générique pour tester n'importe quelle instance n8n.

**Usage**:
```bash
export N8N_URL=https://projetsjsl.app.n8n.cloud
export N8N_API_KEY=votre_cle
node test-n8n-connection.js
```

## 🔗 Intégration avec le Projet GOB

### Workflows n8n du Projet

Le projet GOB contient des workflows n8n dans `/n8n-workflows/`:

1. **sms-workflow.json** - Workflow pour SMS via Twilio
2. **email-workflow.json** - Workflow pour Email (IMAP → Resend)
3. **messenger-workflow.json** - Workflow pour Facebook Messenger

### API Emma n8n

Le projet expose une API pour n8n via `/api/emma-n8n.js`:

**Endpoint**: `https://gob-beta.vercel.app/api/emma-n8n`

**Actions disponibles**:
- `briefing` - Générer briefing quotidien
- `question` - Poser une question à Emma
- `portfolio` - Analyser portefeuille
- `initialize_earnings_calendar` - Initialiser calendrier annuel
- `daily_earnings_check` - Vérification quotidienne earnings
- `pre_earnings_analysis` - Analyse pré-earnings
- `poll_earnings_results` - Polling résultats (15min)
- `analyze_earnings_results` - Analyser résultats spécifiques
- `monitor_news` - Surveiller actualités (15min)
- `weekly_news_digest` - Digest hebdomadaire

**Exemple d'utilisation depuis n8n**:
```json
{
  "method": "POST",
  "url": "https://gob-beta.vercel.app/api/emma-n8n?action=question",
  "headers": {
    "Authorization": "Bearer {{ $env.N8N_API_KEY }}",
    "Content-Type": "application/json"
  },
  "body": {
    "question": "Analyse AAPL"
  }
}
```

## 📝 Prochaines Étapes

1. **Obtenir l'API key** depuis l'interface n8n
2. **Tester la connexion** avec les scripts fournis
3. **Récupérer les informations** du workflow 03lgcA4e9uRTtli1
4. **Identifier les webhooks** disponibles dans ce workflow
5. **Configurer l'intégration** avec les APIs GOB si nécessaire

## 🔍 Dépannage

### Erreur 401 (Unauthorized)
- Vérifiez que votre API key est correcte
- Assurez-vous que l'API key a les bonnes permissions

### Erreur 404 (Not Found)
- Vérifiez que le workflow ID est correct
- Vérifiez que vous avez accès au workflow

### Timeout
- Vérifiez votre connexion internet
- Vérifiez que le serveur n8n est accessible
- Vérifiez les paramètres de firewall/proxy

## 📚 Documentation

- [Documentation n8n API](https://docs.n8n.io/api/)
- [Documentation n8n Workflows](https://docs.n8n.io/workflows/)
- [Documentation GOB Multichannel](./docs/MULTICANAL-SETUP.md)

