# GARANTIES - REFACTOR SMS CHATBOT
## Protection des Fonctionnalités Existantes

**Date**: 2025-01-15
**Objectif**: Garantir que le refactor SMS n'affecte AUCUNE fonctionnalité web/email existante

---

## 🛡️ GARANTIES ABSOLUES

### 1. SÉPARATION TOTALE SMS vs WEB/EMAIL

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                    /api/chat.js (Router)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
        ┌───────────▼──────────┐  ┌────▼──────────────────┐
        │   SMS Channel        │  │  WEB/EMAIL Channels   │
        │   (Nouveau Système)  │  │  (Système Actuel)     │
        └───────────┬──────────┘  └────┬──────────────────┘
                    │                   │
        ┌───────────▼──────────┐  ┌────▼──────────────────┐
        │ lib/sms/             │  │  api/emma-agent.js    │
        │ sms-orchestrator.js  │  │  (INTACT - 0% change) │
        │ (Nouveau)            │  │                       │
        └──────────────────────┘  └───────────────────────┘
```

**Code de Séparation (dans `/api/chat.js`):**
```javascript
// LIGNE ~890-950 de /api/chat.js
// 7. APPELER EMMA-AGENT (Function Calling Router existant)
let emmaResponse;
try {
    console.log('[Chat API] Appel emma-agent...');

    // 🚨 NOUVEAU: ROUTING CONDITIONNEL BASÉ SUR CANAL
    if (channel === 'sms' && process.env.USE_SMS_ORCHESTRATOR_V2 === 'true') {
        // ✅ SMS → Nouveau système (SMS Orchestrator V2)
        console.log('[Chat API] 📱 SMS detected → Using SMS Orchestrator V2');
        const smsOrchestratorModule = await import('../lib/sms/sms-orchestrator.js');
        emmaResponse = await smsOrchestratorModule.default.process(message, emmaContext);
    } else {
        // ✅ WEB/EMAIL/MESSENGER → Système actuel (Emma Agent - INTACT)
        console.log('[Chat API] 🌐 Web/Email/Messenger → Using Emma Agent (unchanged)');
        const emmaAgentModule = await import('./emma-agent.js');

        // ... CODE EXISTANT INCHANGÉ (lignes 897-947) ...
    }

    // Reste du code identique pour tous les canaux
}
```

### 2. FICHIERS MODIFIÉS vs INTACTS

#### ✅ FICHIERS CRÉÉS (Nouveaux - 0% impact)
- `lib/sms/intent-detector-sms.js` ⭐ NOUVEAU
- `lib/sms/data-fetchers/stock-data-fetcher.js` ⭐ NOUVEAU
- `lib/sms/data-fetchers/perplexity-fetcher.js` ⭐ NOUVEAU
- `lib/sms/data-fetchers/financial-calculator.js` ⭐ NOUVEAU
- `lib/sms/llm-formatter.js` ⭐ NOUVEAU
- `lib/sms/sms-validator.js` ⭐ NOUVEAU
- `lib/sms/sms-orchestrator.js` ⭐ NOUVEAU

#### ⚠️ FICHIER MODIFIÉ (Modification minimale, non-destructive)
- `/api/chat.js` - **1 SEULE MODIFICATION** (ligne ~890-950)
  - **Avant**: Appelle toujours `emma-agent.js`
  - **Après**: Appelle `sms-orchestrator.js` SI `channel === 'sms'` ET flag activé
  - **Sinon**: Appelle `emma-agent.js` (comportement actuel)
  - **Impact Web/Email**: **0%** (aucun changement de comportement)

#### ✅ FICHIERS 100% INTACTS (0% modification)
- `api/emma-agent.js` - ✅ **AUCUNE MODIFICATION**
- `lib/intent-analyzer.js` - ✅ **AUCUNE MODIFICATION**
- `lib/perplexity-client.js` - ✅ **AUCUNE MODIFICATION**
- `lib/conversation-manager.js` - ✅ **AUCUNE MODIFICATION**
- `api/adapters/email.js` - ✅ **AUCUNE MODIFICATION**
- `api/adapters/messenger.js` - ✅ **AUCUNE MODIFICATION**
- Tous les autres fichiers - ✅ **AUCUNE MODIFICATION**

### 3. FEATURE FLAG POUR SÉCURITÉ MAXIMALE

**Variable d'Environnement:**
```bash
# Vercel Environment Variables
USE_SMS_ORCHESTRATOR_V2=false  # Par défaut: ancien système (sécurité)
```

**Comportement:**
- `false` (défaut) → **Tout fonctionne comme avant** (0% changement)
- `true` → SMS utilise nouveau système, Web/Email inchangés

**Migration Progressive:**
1. Phase 1-4: Flag = `false` → Tests en local uniquement
2. Phase 5: Flag = `true` pour 10% utilisateurs SMS (A/B test)
3. Si succès: Flag = `true` pour 100% SMS
4. Si échec: Flag = `false` → Rollback instantané

### 4. PERPLEXITY API - UTILISATION IDENTIQUE

**SMS Formatter:**
```javascript
// lib/sms/llm-formatter.js
import { PerplexityClient } from '../perplexity-client.js';

class LLMFormatter {
    constructor() {
        // ✅ MÊME CLIENT que emma-agent.js
        this.perplexity = new PerplexityClient(process.env.PERPLEXITY_API_KEY);
    }

    async formatForSMS(data, intent, options = {}) {
        const prompt = this._buildFormatterPrompt(data, intent);

        // ✅ MÊME APPEL que emma-agent.js (ligne ~500-600)
        const response = await this.perplexity.generate(prompt, {
            model: 'sonar-pro', // Même modèle
            temperature: 0.3,   // Même température (déterministe)
            max_tokens: 500,    // Réduit pour SMS (vs 6000 pour web)
            systemPrompt: this._getSystemPrompt(),
            userMessage: prompt
        });

        return this._postProcess(response.content, data);
    }
}
```

**Avantages:**
- ✅ Même API key (`PERPLEXITY_API_KEY`)
- ✅ Même client (`PerplexityClient`)
- ✅ Même modèle (`sonar-pro`)
- ✅ Coût identique ou réduit (max_tokens plus bas pour SMS)

### 5. TESTS DE NON-RÉGRESSION OBLIGATOIRES

**Avant activation du flag, exécuter:**

```javascript
// tests/non-regression/web-email-unchanged.test.js

describe('Non-Regression: Web/Email Unchanged', () => {

    test('Web chat analysis AAPL - Same behavior', async () => {
        const response = await fetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                message: 'Analyse AAPL',
                userId: 'test-web-user',
                channel: 'web'
            })
        });

        const data = await response.json();

        // ✅ DOIT utiliser emma-agent.js (pas sms-orchestrator)
        expect(data.metadata.model).toContain('perplexity');
        expect(data.metadata.tools_used.length).toBeGreaterThan(2);
        expect(data.response.length).toBeGreaterThan(500); // Analyse complète
    });

    test('Email ticker note - Same behavior', async () => {
        const response = await fetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                message: 'Analyse Tesla',
                userId: 'test@example.com',
                channel: 'email'
            })
        });

        const data = await response.json();

        // ✅ DOIT utiliser emma-agent.js (pas sms-orchestrator)
        expect(data.metadata.model).toContain('perplexity');
        expect(data.response).toContain('Source:');
        expect(data.response.length).toBeGreaterThan(1000); // Note détaillée
    });

    test('Messenger conversation - Same behavior', async () => {
        const response = await fetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                message: 'Bonjour',
                userId: 'messenger-123',
                channel: 'messenger'
            })
        });

        const data = await response.json();

        // ✅ DOIT utiliser emma-agent.js
        expect(data.success).toBe(true);
        expect(data.response).toBeTruthy();
    });
});
```

**Exigences:**
- ✅ 100% des tests Web doivent passer
- ✅ 100% des tests Email doivent passer
- ✅ 100% des tests Messenger doivent passer
- ✅ Latence identique (±10%)
- ✅ Qualité réponse identique

### 6. MONITORING POST-DÉPLOIEMENT

**Métriques à surveiller (par canal):**

```javascript
{
    "web": {
        "total_requests": 5420,
        "avg_latency_ms": 3240,    // ✅ Doit rester stable
        "tools_used_avg": 4.2,     // ✅ Doit rester stable
        "response_length_avg": 1850, // ✅ Doit rester stable
        "error_rate": 0.02         // ✅ Doit rester bas
    },
    "email": {
        "total_requests": 320,
        "avg_latency_ms": 4100,    // ✅ Doit rester stable
        "response_length_avg": 2400, // ✅ Doit rester stable
        "error_rate": 0.01         // ✅ Doit rester bas
    },
    "messenger": {
        "total_requests": 180,
        "avg_latency_ms": 3500,    // ✅ Doit rester stable
        "error_rate": 0.03         // ✅ Doit rester bas
    },
    "sms": {
        "total_requests": 850,
        "avg_latency_ms": 3800,    // 📊 Nouveau système
        "response_length_avg": 245, // 📊 Nouveau système
        "error_rate": 0.05         // 📊 Nouveau système
    }
}
```

**Alertes automatiques:**
- 🚨 Si latence Web/Email augmente >20% → Investigation immédiate
- 🚨 Si error_rate Web/Email augmente >5% → Rollback automatique
- 🚨 Si response_length_avg Web/Email diminue >30% → Investigation

### 7. ROLLBACK PLAN INSTANTANÉ

**En cas de problème détecté:**

```bash
# Option 1: Rollback via Vercel Dashboard
# Aller dans Settings → Environment Variables
# Changer USE_SMS_ORCHESTRATOR_V2=true → false
# Redéployer (automatique)

# Option 2: Rollback via CLI
vercel env rm USE_SMS_ORCHESTRATOR_V2 production
vercel --prod  # Redéploiement

# Option 3: Rollback Git (si modification /api/chat.js problématique)
git revert <commit-hash>
git push origin main
```

**Temps de rollback:** <2 minutes

---

## 📊 MATRICE DE COMPATIBILITÉ

| Fonctionnalité | Web | Email | Messenger | SMS |
|----------------|-----|-------|-----------|-----|
| **Analyse complète ticker** | ✅ Identique | ✅ Identique | ✅ Identique | ⭐ Amélioré (format SMS) |
| **Prix actions** | ✅ Identique | ✅ Identique | ✅ Identique | ⭐ Amélioré |
| **Actualités** | ✅ Identique | ✅ Identique | ✅ Identique | ⭐ Amélioré |
| **Indicateurs techniques** | ✅ Identique | ✅ Identique | ✅ Identique | ⭐ Amélioré |
| **Comparaisons** | ✅ Identique | ✅ Identique | ✅ Identique | ⭐ Amélioré |
| **Briefings quotidiens** | ✅ Identique | ✅ Identique | ❌ N/A | ❌ N/A |
| **Conversation contextuelle** | ✅ Identique | ✅ Identique | ✅ Identique | ✅ Identique |
| **Watchlist** | ✅ Identique | ✅ Identique | ✅ Identique | ✅ Identique |
| **Calendriers** | ✅ Identique | ✅ Identique | ✅ Identique | ⭐ Amélioré |
| **Sources/Citations** | ✅ Identique | ✅ Identique | ✅ Identique | ⭐ Amélioré (obligatoires) |

**Légende:**
- ✅ Identique: Aucun changement, fonctionnalité préservée à 100%
- ⭐ Amélioré: Fonctionnalité préservée + optimisations SMS
- ❌ N/A: Fonctionnalité non applicable à ce canal

---

## 🎯 CHECKLIST PRÉ-DÉPLOIEMENT

**Avant d'activer `USE_SMS_ORCHESTRATOR_V2=true` en production:**

### Phase 1-4 (Développement)
- [ ] Tous les nouveaux modules créés dans `lib/sms/`
- [ ] Tests unitaires passent (>90% coverage)
- [ ] Tests end-to-end SMS passent
- [ ] Flag `USE_SMS_ORCHESTRATOR_V2=false` en production

### Phase 5 (Migration)
- [ ] Tests de non-régression Web/Email passent à 100%
- [ ] Monitoring métriques Web/Email stable
- [ ] A/B test SMS (10% utilisateurs) réussi
- [ ] Aucune régression détectée sur autres canaux
- [ ] Rollback plan testé et documenté

### Post-Migration
- [ ] Monitoring continu 7 jours
- [ ] Aucune alerte Web/Email déclenchée
- [ ] Métriques SMS atteintes (>95% accuracy, <5s latency)
- [ ] Documentation complète publiée
- [ ] Formation équipe technique complétée

---

## 📝 CONTRAT DE GARANTIE

**Je m'engage à:**

1. ✅ **0% de réduction** des fonctionnalités Web/Email/Messenger
2. ✅ **Séparation totale** du code SMS vs autres canaux
3. ✅ **Utilisation Perplexity API** (identique à l'actuel)
4. ✅ **Tests de non-régression** obligatoires avant déploiement
5. ✅ **Feature flag** pour activation progressive sécurisée
6. ✅ **Rollback instantané** (<2 min) si problème détecté
7. ✅ **Monitoring continu** des métriques par canal
8. ✅ **Documentation complète** de tous les changements

**Signature du plan:** Claude AI Agent
**Date:** 2025-01-15

---

## ❓ VALIDATION REQUISE

**Confirmes-tu ces garanties ?**
- [ ] Oui, je valide la séparation totale SMS vs Web/Email
- [ ] Oui, je valide l'utilisation Perplexity API
- [ ] Oui, je valide les tests de non-régression obligatoires
- [ ] Oui, je valide le feature flag pour migration progressive

**Si toutes les garanties sont validées, je commence la Phase 1 immédiatement ! 🚀**
