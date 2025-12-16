# 📊 Guide de Monitoring et Surveillance

Guide complet pour surveiller les logs, erreurs et performances de GOB Apps en production.

## 📋 Table des matières

1. [Monitoring des Logs](#monitoring-des-logs)
2. [Surveillance des Endpoints](#surveillance-des-endpoints)
3. [Alertes et Notifications](#alertes-et-notifications)
4. [Analyse des Performances](#analyse-des-performances)
5. [Dépannage](#dépannage)

---

## 📡 Monitoring des Logs

### Vercel Logs

#### Accès aux logs

1. **Via Dashboard Vercel:**
   - Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
   - Sélectionnez votre projet
   - Cliquez sur **Deployments** → Sélectionnez un déploiement
   - Onglet **Functions** pour voir les logs des fonctions serverless

2. **Via CLI:**
   ```bash
   # Installer Vercel CLI
   npm i -g vercel
   
   # Se connecter
   vercel login
   
   # Voir les logs en temps réel
   vercel logs --follow
   
   # Voir les logs d'un déploiement spécifique
   vercel logs [deployment-url]
   ```

#### Script de monitoring automatique

```bash
# Analyser les logs sauvegardés
node scripts/monitor-logs.js

# Monitoring en temps réel
vercel logs --follow | node scripts/monitor-logs.js
```

Le script génère un rapport `monitoring-report.json` avec :
- Statistiques globales (requêtes, erreurs, taux d'erreur)
- Statistiques par endpoint
- Erreurs critiques détectées
- Recommandations automatiques

### Types d'erreurs surveillées

#### Erreurs Critiques
- `500 Internal Server Error`
- `TypeError: X is not a function`
- `Cannot read property`
- `ReferenceError`
- `Database connection errors`
- `Timeout errors`

#### Avertissements
- `404 Not Found`
- `401 Unauthorized`
- `403 Forbidden`
- `429 Too Many Requests`
- `Rate limit exceeded`
- `API key invalid`
- `Missing parameter`

---

## 🔍 Surveillance des Endpoints

### Test de production

```bash
# Tester tous les endpoints corrigés en production
node scripts/test-endpoints-production.js
```

Le script teste :
- ✅ Endpoints critiques corrigés (Gemini, Format Preview, etc.)
- ✅ Endpoints avec validation améliorée
- ✅ Endpoints adapters (webhooks)
- ✅ Performance (temps de réponse)

**Rapport généré:** `test-production-report.json`

### Surveillance continue

#### Option 1: Cron Job (recommandé)

Créez un cron job pour tester régulièrement :

```bash
# Tester toutes les heures
0 * * * * cd /path/to/GOB && node scripts/test-endpoints-production.js >> logs/production-tests.log 2>&1
```

#### Option 2: GitHub Actions

Créez `.github/workflows/monitor-endpoints.yml` :

```yaml
name: Monitor Endpoints
on:
  schedule:
    - cron: '0 * * * *' # Toutes les heures
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: node scripts/test-endpoints-production.js
      - uses: actions/upload-artifact@v3
        with:
          name: production-test-report
          path: test-production-report.json
```

---

## 🚨 Alertes et Notifications

### Configuration d'alertes

#### 1. Alertes Vercel

1. Allez sur [Vercel Dashboard → Settings → Notifications](https://vercel.com/dashboard)
2. Configurez les alertes pour :
   - Erreurs de déploiement
   - Erreurs de fonction
   - Quotas dépassés

#### 2. Alertes personnalisées

Créez `scripts/send-alert.js` :

```javascript
// Exemple d'envoi d'alerte par email
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendAlert(type, message, details) {
  await resend.emails.send({
    from: 'alerts@gobapps.com',
    to: 'admin@gobapps.com',
    subject: `[ALERTE ${type}] ${message}`,
    html: `
      <h2>${message}</h2>
      <pre>${JSON.stringify(details, null, 2)}</pre>
    `
  });
}
```

### Seuils d'alerte recommandés

- **Critique:** Taux d'erreur > 10%
- **Warning:** Taux d'erreur > 5%
- **Info:** Taux d'erreur > 1%

---

## ⚡ Analyse des Performances

### Métriques à surveiller

1. **Temps de réponse:**
   - Rapide: < 1 seconde
   - Normal: 1-3 secondes
   - Lent: > 3 secondes

2. **Taux d'erreur:**
   - Acceptable: < 1%
   - Attention: 1-5%
   - Critique: > 5%

3. **Utilisation des quotas:**
   - Resend: 100 emails/jour (gratuit)
   - Alpha Vantage: 5 req/min, 500/jour
   - Gemini: Selon votre plan

### Optimisations recommandées

1. **Cache:**
   - Utiliser Supabase cache pour données sectorielles
   - Implémenter cache Redis pour données fréquentes

2. **Rate Limiting:**
   - Implémenter rate limiting côté client
   - Utiliser retry avec backoff exponentiel

3. **Monitoring:**
   - Surveiller les endpoints lents
   - Optimiser les requêtes lourdes

---

## 🔧 Dépannage

### Problème: Taux d'erreur élevé

**Diagnostic:**
1. Consultez `monitoring-report.json`
2. Identifiez les endpoints problématiques
3. Vérifiez les logs détaillés

**Solutions:**
- Vérifier les clés API: `node scripts/check-api-keys.js`
- Vérifier la configuration: `node scripts/test-endpoints-production.js`
- Consulter les logs Vercel pour détails

### Problème: Endpoints lents

**Diagnostic:**
```bash
# Tester un endpoint spécifique
curl -w "@curl-format.txt" -o /dev/null -s https://gobapps.com/api/endpoint
```

**Solutions:**
- Optimiser les requêtes Supabase
- Implémenter cache
- Réduire la taille des réponses

### Problème: Quotas dépassés

**Diagnostic:**
- Vérifier les logs pour erreurs 429
- Consulter les dashboards des providers

**Solutions:**
- Augmenter les quotas
- Implémenter cache plus agressif
- Optimiser les requêtes

---

## 📚 Ressources

- [Vercel Logs Documentation](https://vercel.com/docs/concepts/functions/serverless-functions/logs)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Monitoring Best Practices](https://vercel.com/docs/concepts/monitoring)

---

**Dernière mise à jour:** 16 décembre 2025

