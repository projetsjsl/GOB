
# SACADOS — Briefings Marchés (FR‑CA) : Guide d’intégration global

Date de préparation: 2025-10-15T00:39:13.563530Z

Ce document unique regroupe **tout** ce que nous avons conçu : schéma de données, prompts Perplexity & GPT‑5, orchestrateur,
workflows n8n, endpoints API (manuel/cron + ad‑hoc), envoi Resend, archivage Supabase, déclencheurs Montréal, UI admin, sécurité,
et bonnes pratiques (icônes, Perspective stratégique Bêta).

---

## 1) Objectif & architecture

- Un **pipeline unique** : Perplexity (collecte JSON) → GPT‑5 (rédaction FR‑CA) → rendu HTML → Resend (email) → Supabase (archive).
- **Aucune duplication** : prompts et schéma centralisés dans `briefingCore/`.
- **Deux modes d’appel** : automatique (cron) & manuel (depuis votre site), plus **ad‑hoc** (prompt libre).
- **Zones cibles** : Canada / États‑Unis prioritairement, vue monde quand pertinent.
- **Langue** : français canadien (FR‑CA).
- **Fuseau** : America/Toronto (Montréal).

Schéma logique :

```
[ Cron n8n / Vercel / Supabase ] ─┐
                                  ├─> /api/briefing ── runBriefing() ── Resend ──> Email
[ Bouton manuel (fallback) ] ──────┘                         │
                                                            └── Supabase (archive)
[ Ad‑hoc (prompt libre) ] ─────────────> /api/briefing-ad-hoc ─ runBriefingAdhoc()
```

---

## 2) Modèle JSON standard SACADOS (contrat de données)

Ce modèle s’applique à **Morning / Noon / Close** — `meta.brief_type` précise le type.
Aucune valeur inventée : valeurs inconnues → `null` ou listes vides.

```json
{
  "meta": {
    "brief_type": "morning|noon|close",
    "as_of_utc": "",
    "as_of_tz": "America/Toronto",
    "sources": [],
    "warnings": []
  },
  "yield_curves": {
    "us": {
      "terms": {},
      "spreads": {},
      "source": {}
    },
    "ca": {
      "terms": {},
      "spreads": {},
      "source": {}
    }
  },
  "forex": {
    "vs_usd": {}, "vs_cad": {}, "changes_24h_pct": {}, "sources": []
  },
  "volatility": {}, "indices": {}, "sectors": {}, "movers": {}, "macro_calendar": {}, 
  "earnings_calendar": [], "ticker_news": [], "commodities": {}, "sentiment": {}, "beta_perspective": {}
}
```

---

## 3) Prompts Perplexity (FULL expert) — JSON only

### A) Morning — 07:00 Montréal
```
Tu es un agent de collecte de données de marchés pour un “Morning Market Briefing – Global (Canada / États-Unis)”. 
Réponds UNIQUEMENT en JSON conforme au modèle SACADOS (ci‑joint) ; AUCUN texte hors JSON.

Inclure : 
- Courbes de taux US (1m,3m,6m,1y,2y,5y,7y,10y,20y,30y) et Canada (1y,2y,5y,10y,30y) + spreads 2y–10y (sources + URLs).
- Forex (majeures vs USD & vs CAD) + variation 24 h (BoC, Investing.com, URLs).
- Volatilité : VIX & MOVE (niveau + variation 5 j, URLs).
- Indices (SPX, NDX, TSX, STOXX 600) pré‑ouverture ou en direct.
- Secteurs (leaders / laggards) US & CA (URL).
- Movers SPX/TSX : top 5 hausses/baisses avec % et “reason” + URL.
- Agenda macro (aujourd’hui/demain, heure ET, URLs).
- Earnings (7 j) pour tickers cibles (NVDA, AAPL, MSFT, JPM, TSLA, RY…) : EPS estimate, time (before/after), URL (NASDAQ/FMP).
- Ticker news : 3 par ticker (Reuters/Bloomberg/Globe and Mail avec URL + horodatage).
- Commodities : WTI, or, cuivre (URLs).
- Sentiment : étiquette + 1 phrase.
- beta_perspective : analyse/recommandations/scénarios/risques/indicateurs/confidence (si sources solides, sinon listes vides).

Exigences : 
- URLs fiables obligatoires par section. Valeur inconnue => null.
- Renseigne meta.brief_type="morning", meta.as_of_utc (ISO), meta.as_of_tz="America/Toronto".
```

### B) Noon — 12:00 Montréal
```
Mets à jour le “Noon Market Briefing – Canada / États-Unis” en JSON conforme SACADOS. 

Inclure :
- Indices live (SPX, NDX, TSX, SXXP) + %.
- Courbes : au minimum 2y/10y US & CA + spreads 2y–10y.
- FX intraday : USD/CAD, EUR/USD (+ var).
- Secteurs leaders/laggards US & CA.
- Top 3 movers SPX/TSX (raison + URL).
- Breaking macro (Fed, BoC, pétrole, inflation) dernières 4–6 h (URLs).
- Sentiment intraday (1 mot + 1 phrase).
meta.brief_type="noon".
```

### C) Close — 16:00 Montréal
```
Collecte les données de clôture pour “Market Close Briefing – Canada / États-Unis” en JSON conforme SACADOS.

Inclure :
- Clôtures: SPX, NDX, Dow, TSX, STOXX 600 (+ %).
- Courbes US/CA complètes + spreads (journée).
- FX clôture (USD/CAD, EUR/USD, GBP/USD, JPY/USD, CHF/USD).
- Commodities (WTI, or, cuivre).
- Secteurs finaux (US & CA).
- Top 5 gagnants/perdants SPX/TSX (raison + URL).
- VIX & MOVE (var vs veille).
- Nouvelles macro clés (Fed, BoC, CPI, BCE, géopolitique) avec liens.
- Earnings 48 h à venir.
- Sentiment (1 phrase).
meta.brief_type="close".
```

---

## 4) Prompt GPT‑5 (rédaction FR‑CA, Markdown propre)

À utiliser pour les 3 briefs (Morning/Noon/Close) selon `meta.brief_type`.

```
Tu es un analyste macro-financier (niveau CFA). Rédige en français canadien un “Market Briefing” à partir du JSON [DATA].
- Utilise uniquement les valeurs présentes (ne rien inventer).
- Inclure, si disponibles : 📉 Taux (US/CA + spreads), 💱 Devises, 📊 Volatilité & sentiment, 🏭 Secteurs, 📈 Movers, 
  🗓️ Agenda, 💼 Résultats, 📰 Nouvelles, 🧭 Perspective Bêta (analyse, critiques, recommandations, scénarios, indicateurs, confiance).
- Citer les sources (URLs) fournies. Icônes sobres dans les titres. 
- Afficher meta.as_of_utc. Ne pas afficher les sections vides. Format Markdown propre.
```

---

## 5) Code — Core partagé (TypeScript)

### 5.1 `briefingCore/schema.ts` (Zod)
```ts
// … (voir conversation — à copier dans votre repo)
```

### 5.2 `briefingCore/prompts.ts`
```ts
// … (perplexityPrompt() + gptSystem + gptUser)
```

### 5.3 `briefingCore/render.ts`
```ts
// … mdToHtml
```

### 5.4 `briefingCore/resend.ts`
```ts
// … sendEmail()
```

### 5.5 `briefingCore/supabase.ts`
```ts
// … archiveBriefing()
```

### 5.6 `briefingCore/runBriefing.ts`
```ts
// … orchestrateur standard
```

### 5.7 `briefingCore/runBriefingAdhoc.ts`
```ts
// … orchestrateur ad‑hoc (prompt override)
```

---

## 6) Endpoints HTTP (Next.js)

- `/api/briefing` — paramètres: type, mode, dryRun.  
- `/api/briefing-ad-hoc` — paramètres: perplexityPromptOverride, gptInstructionsOverride?, subject?, to?[], previewOnly?, validateAgainstSchema?.

---

## 7) UI admin (Next.js)

- **TriggerBriefing** : boutons Morning / Noon / Close (preview/send).
- **AdhocComposer** : textarea prompt Perplexity (+ instructions GPT‑5 optionnelles), sujet, destinataires, preview/send.

---

## 8) Déclencheurs (Montréal)

- n8n Cron (America/Toronto): 07:00 → `0 7 * * 1-5`, 12:00 → `0 12 * * 1-5`, 16:00 → `0 16 * * 1-5`
- Vercel Cron (UTC): 11:00, 16:00, 20:00
- Supabase Scheduled: idem TZ local

---

## 9) Variables d’environnement

PPLX_ENDPOINT, PPLX_API_KEY, OPENAI_ENDPOINT, OPENAI_API_KEY, RESEND_API_KEY, RESEND_FROM, RESEND_TO,
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_TOKEN, TZ=America/Toronto.

---

## 10) Sécurité, résilience et qualité

- Token admin (header `x-admin-token`), rate‑limit, audit.
- Idempotence (par tranche horaire et type), retry exponentiel.
- Validation Zod (strict sur standard, optionnelle en ad‑hoc).

---

## 11) Icônes & lisibilité

📉 💱 📊 🏭 📈 🗓️ 💼 📰 🧭 — ton professionnel, liens sources cliquables.

---

## 12) Perspective stratégique — Bêta (structure conseillée)

analysis[], recommendations[], scenarios[], risks[], indicators_watch[], confidence.

---

## 13) Workflows n8n (import)

- `n8n_workflow_morning.json`
- `n8n_workflow_noon.json`
- `n8n_workflow_close.json`

---

## 14) Tests & check‑list

- dryRun OK, JSON valide, URLs présentes, email envoyé, archive Supabase, crons actifs.
