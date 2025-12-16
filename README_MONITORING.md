# 🚀 Guide Rapide - Monitoring et Tests

## Tests Rapides

### 1. Tester les endpoints en production
```bash
node scripts/test-endpoints-production.js
```
Génère: `test-production-report.json`

### 2. Vérifier les clés API
```bash
node scripts/check-api-keys.js
```
Génère: `.env.example.required` (template de configuration)

### 3. Surveiller les logs
```bash
# Analyser les logs sauvegardés
node scripts/monitor-logs.js

# Monitoring en temps réel
vercel logs --follow | node scripts/monitor-logs.js
```
Génère: `monitoring-report.json`

## Configuration Webhooks

Voir: `docs/CONFIGURATION_WEBHOOKS.md`

- **Twilio SMS:** Configuration webhook pour `/api/adapters/sms`
- **n8n Email:** Configuration workflow pour `/api/adapters/email`

## Documentation Complète

- **Monitoring:** `docs/MONITORING_GUIDE.md`
- **Webhooks:** `docs/CONFIGURATION_WEBHOOKS.md`
- **Tests Endpoints:** `docs/RAPPORT_TEST_ENDPOINTS.md`

## Prochaines Étapes

1. ✅ Tester les endpoints corrigés → `scripts/test-endpoints-production.js`
2. ✅ Vérifier les clés API → `scripts/check-api-keys.js`
3. ✅ Configurer les webhooks → `docs/CONFIGURATION_WEBHOOKS.md`
4. ✅ Surveiller les logs → `scripts/monitor-logs.js`

