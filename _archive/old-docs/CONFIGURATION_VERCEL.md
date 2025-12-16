# 🔧 Configuration Vercel - Emma AI Platform

## ❌ PROBLÈME DÉTECTÉ

Emma retourne du JSON bizarre ou des messages d'erreur car **les clés API ne sont pas configurées dans Vercel**.

---

## ✅ SOLUTION : Configurer les Variables d'Environnement

### Étape 1 : Accéder aux Variables d'Environnement Vercel

```bash
# Option A : Via CLI Vercel
vercel env ls

# Option B : Via Dashboard Vercel
# 1. Aller sur https://vercel.com/dashboard
# 2. Sélectionner votre projet "GOB"
# 3. Aller dans Settings → Environment Variables
```

---

## 🔑 CLÉS API REQUISES (CRITIQUES)

### 1️⃣ PERPLEXITY_API_KEY (⚠️ MANQUANTE - CRITIQUE)

**Pourquoi critique** : Emma utilise Perplexity pour 80% des réponses (données factuelles avec sources)

**Obtenir la clé** :
1. Aller sur https://www.perplexity.ai/settings/api
2. Créer une clé API
3. Copier la clé

**Ajouter dans Vercel** :
```bash
# Via CLI
vercel env add PERPLEXITY_API_KEY
# Coller la clé quand demandé
# Sélectionner: Production, Preview, Development

# Via Dashboard
# Name: PERPLEXITY_API_KEY
# Value: pplx-xxxxxxxxxxxxxxxxxxxxx
# Environment: Production, Preview, Development
```

---

### 2️⃣ GEMINI_API_KEY (Recommandé - Gratuit)

**Pourquoi important** : Emma utilise Gemini pour 15% des réponses (questions conceptuelles, gratuit)

**Obtenir la clé** :
1. Aller sur https://makersuite.google.com/app/apikey
2. Créer une clé API
3. Copier la clé

**Ajouter dans Vercel** :
```bash
vercel env add GEMINI_API_KEY
# Value: AIzaSy...
```

---

### 3️⃣ FMP_API_KEY (Données financières)

**Pourquoi important** : Données de marché, earnings, ratios financiers

**Obtenir la clé** :
1. Aller sur https://financialmodelingprep.com/developer
2. S'inscrire (plan gratuit: 250 req/jour)
3. Copier la clé

**Ajouter dans Vercel** :
```bash
vercel env add FMP_API_KEY
# Value: votre_cle_fmp
```

---

### 4️⃣ SUPABASE (Base de données)

**Variables requises** :
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (ou `SUPABASE_KEY`)

**Obtenir les clés** :
1. Aller sur https://supabase.com/dashboard/project/[votre-projet]/settings/api
2. Copier "Project URL" → `SUPABASE_URL`
3. Copier "service_role secret" → `SUPABASE_SERVICE_ROLE_KEY`

**Ajouter dans Vercel** :
```bash
vercel env add SUPABASE_URL
# Value: https://xxxxx.supabase.co

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Value: eyJhbGciOiJI...
```

---

## 🔑 CLÉS API OPTIONNELLES (Fallbacks)

### 5️⃣ ANTHROPIC_API_KEY (Claude - Premium)

**Utilisation** : Briefings premium (5% des requêtes)

**Obtenir la clé** :
1. Aller sur https://console.anthropic.com/settings/keys
2. Créer une clé API
3. Copier la clé

**Ajouter dans Vercel** :
```bash
vercel env add ANTHROPIC_API_KEY
# Value: sk-ant-...
```

---

### 6️⃣ FINNHUB_API_KEY (Fallback news)

**Utilisation** : Fallback pour actualités si FMP échoue

**Obtenir la clé** :
1. Aller sur https://finnhub.io/register
2. S'inscrire (gratuit)
3. Copier la clé dans le dashboard

**Ajouter dans Vercel** :
```bash
vercel env add FINNHUB_API_KEY
# Value: votre_cle_finnhub
```

---

### 7️⃣ N8N_API_KEY (Pour automation n8n)

**Utilisation** : Sécuriser l'endpoint `/api/emma-n8n` pour automation

**Générer une clé sécurisée** :
```bash
openssl rand -base64 32
# Copier le résultat
```

**Ajouter dans Vercel** :
```bash
vercel env add N8N_API_KEY
# Value: <clé générée>
```

---

## 📋 COMMANDES RAPIDES

### Vérifier variables configurées

```bash
vercel env ls
```

### Ajouter toutes les variables en une fois (interactif)

```bash
# PERPLEXITY (CRITIQUE)
vercel env add PERPLEXITY_API_KEY

# GEMINI (Recommandé)
vercel env add GEMINI_API_KEY

# FMP (Données financières)
vercel env add FMP_API_KEY

# SUPABASE (Base de données)
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY

# CLAUDE (Optionnel - Premium)
vercel env add ANTHROPIC_API_KEY

# FINNHUB (Optionnel - Fallback)
vercel env add FINNHUB_API_KEY

# N8N (Pour automation)
vercel env add N8N_API_KEY
```

### Après ajout des variables : REDÉPLOYER

```bash
vercel --prod
```

Ou via Dashboard : Settings → Deployments → Redeploy

---

## ✅ VÉRIFICATION POST-CONFIGURATION

### Test 1 : Vérifier que Emma répond

```bash
curl -X POST "https://[votre-app].vercel.app/api/emma-agent" \
  -H "Content-Type: application/json" \
  -d '{"message":"Bonjour Emma","context":{"output_mode":"chat"}}'
```

**Attendu** : Emma doit répondre avec du texte conversationnel (pas d'erreur de configuration)

### Test 2 : Vérifier SmartRouter

```bash
# Test avec question factuelle (doit utiliser Perplexity)
curl -X POST "https://[votre-app].vercel.app/api/emma-agent" \
  -H "Content-Type: application/json" \
  -d '{"message":"Quel est le prix d Apple ?","context":{"output_mode":"chat","tickers":["AAPL"]}}'
```

**Attendu** : Réponse avec données réelles + sources citées

### Test 3 : Vérifier mode briefing (doit utiliser Claude si configuré)

```bash
curl -X POST "https://[votre-app].vercel.app/api/emma-agent" \
  -H "Content-Type: application/json" \
  -d '{"message":"Briefing marché","context":{"output_mode":"briefing"}}'
```

**Attendu** : Briefing détaillé en markdown

---

## 🚀 APRÈS CONFIGURATION

Une fois toutes les clés configurées :

1. ✅ **Redéployer** : `vercel --prod`
2. ✅ **Tester Emma** dans le dashboard
3. ✅ **Vérifier logs** : `vercel logs` si problèmes
4. ✅ **Configurer n8n** workflows (si automation désirée)

---

## 📊 PRIORITÉS DE CONFIGURATION

| Priorité | Clé | Raison | Coût |
|----------|-----|--------|------|
| 🔴 **CRITIQUE** | `PERPLEXITY_API_KEY` | 80% des réponses Emma | $5-20/mois |
| 🟡 **Important** | `GEMINI_API_KEY` | 15% des réponses (gratuit) | Gratuit |
| 🟡 **Important** | `FMP_API_KEY` | Données financières | Gratuit (250/j) |
| 🟡 **Important** | `SUPABASE_URL` + `_KEY` | Base de données | Gratuit |
| 🟢 **Optionnel** | `ANTHROPIC_API_KEY` | Briefings premium (5%) | $0.25-1/briefing |
| 🟢 **Optionnel** | `FINNHUB_API_KEY` | Fallback news | Gratuit |
| 🟢 **Optionnel** | `N8N_API_KEY` | Automation workflows | Gratuit |

---

## ❓ FAQ

### Emma retourne toujours des erreurs de configuration ?
→ Vérifiez que vous avez bien **redéployé** après ajout des variables : `vercel --prod`

### Comment savoir si les clés sont bien configurées ?
→ `vercel env ls` doit lister toutes les variables

### Emma est lente ?
→ Normal pour premières requêtes. Si >10s systématiquement, vérifier logs : `vercel logs`

### Emma retourne du JSON au lieu de texte ?
→ Vérifier que `PERPLEXITY_API_KEY` est bien configurée et valide

### Coût mensuel estimé ?
→ **$5-30/mois** selon utilisation (Perplexity ~$10-20, Claude ~$5-10 si utilisé)

---

## 📞 SUPPORT

Si problèmes persistent après configuration :

1. **Vérifier logs Vercel** : `vercel logs --follow`
2. **Tester endpoints** directement avec curl
3. **Vérifier browser console** : F12 → Console
4. **Vérifier Network tab** : F12 → Network pour voir requêtes API

---

**🚀 Generated by Claude Code**
