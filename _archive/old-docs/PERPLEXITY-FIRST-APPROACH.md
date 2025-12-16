# 🧠 Approche "Perplexity First" - Source d'Intelligence Universelle

**Date**: 18 Novembre 2025  
**Philosophie**: Perplexity comme première option pour toutes les questions

---

## 🎯 Principe Fondamental

**Perplexity devrait être la première option** pour la plupart des questions car:
- ✅ Accès en temps réel au web (données météo, actualités, etc.)
- ✅ Recherche intelligente avec sources
- ✅ Pas besoin d'APIs spécialisées pour chaque domaine
- ✅ Plus flexible et extensible
- ✅ Citations automatiques

---

## 📊 Architecture Actuelle

### Détection des Questions Générales

Les questions météo et autres questions générales sont détectées via `generalNonFinancialKeywords` dans `api/emma-agent.js`:

```javascript
const generalNonFinancialKeywords = [
    // ...
    'météo', 'meteo', 'climat', 'environnement', 'écologie', 'ecologie',
    // ...
];
```

### Routage Automatique

1. **Question générale détectée** → `_shouldUsePerplexityOnly()` retourne `true`
2. **Pas d'outils sélectionnés** → `_plan_with_scoring()` retourne `[]`
3. **Perplexity seul** → `_call_perplexity()` avec prompt adapté

---

## ✅ Corrections Appliquées

### 1. Suppression de l'Outil Météo

**Avant**: Outil météo dédié avec OpenWeatherMap API
- ❌ Dépendance API supplémentaire
- ❌ Maintenance d'un outil spécifique
- ❌ Moins flexible

**Après**: Perplexity pour toutes les questions météo
- ✅ Recherche en temps réel
- ✅ Données à jour automatiquement
- ✅ Sources citées

### 2. Prompt Amélioré pour Questions Générales

**Fichier**: `api/emma-agent.js` (lignes 2396-2407)

**Instructions ajoutées**:
```
🎯 INSTRUCTIONS POUR QUESTION GÉNÉRALE:
- ⚠️ CRITIQUE: Tu DOIS chercher des informations RÉELLES et RÉCENTES sur le web via Perplexity
- Pour questions météo: Cherche les données météo actuelles de la ville mentionnée (température, conditions, prévisions)
- Pour questions générales: Utilise Perplexity pour rechercher des informations factuelles et à jour
- Réponds avec des données RÉELLES, pas des généralités
- Cite tes sources quand possible
```

---

## 🔄 Flux Complet

### Exemple: "Météo d'aujourd'hui à Rimouski ?"

1. **Intent Analysis** → `general_conversation` (météo détectée)
2. **Should Use Perplexity Only?** → `YES` (keyword "météo" + pas de ticker)
3. **Tool Selection** → `[]` (aucun outil)
4. **Perplexity Call** → Recherche web active pour "météo Rimouski aujourd'hui"
5. **Response** → Données météo réelles avec sources

---

## 🎯 Avantages de l'Approche Perplexity First

### ✅ Flexibilité
- Pas besoin d'outil spécifique pour chaque domaine
- Perplexity s'adapte automatiquement

### ✅ Données Récentes
- Recherche en temps réel
- Toujours à jour

### ✅ Sources
- Citations automatiques
- Transparence

### ✅ Simplicité
- Moins de code à maintenir
- Moins de dépendances API

---

## 📋 Cas d'Usage

### Questions Générales (Perplexity)
- ✅ Météo
- ✅ Actualités générales
- ✅ Questions de connaissance
- ✅ Sciences, culture, etc.

### Questions Financières (APIs + Perplexity)
- ✅ Prix actions → FMP/Polygon (précision)
- ✅ Ratios financiers → FMP (données structurées)
- ✅ Actualités financières → Finnhub + Perplexity
- ✅ Analyses complètes → FMP + Perplexity (synthèse)

---

## ⚠️ Quand Utiliser des APIs au lieu de Perplexity

### APIs Nécessaires pour:
1. **Prix en temps réel précis** → FMP/Polygon (exactitude critique)
2. **Ratios financiers structurés** → FMP (format standardisé)
3. **Indicateurs techniques** → Twelve Data (calculs précis)
4. **Données utilisateur** → Supabase (watchlist, historique)

### Perplexity Suffisant pour:
1. **Questions générales** → Météo, actualités, connaissances
2. **Contexte et explications** → Concepts, analyses qualitatives
3. **Recherche d'informations** → Entreprises, fonds, etc.

---

## ✅ Statut

- ✅ Outil météo supprimé
- ✅ Intent weather retiré
- ✅ Code d'extraction ville retiré
- ✅ Prompt amélioré pour Perplexity
- ✅ Système utilise Perplexity pour questions générales

**Résultat**: Emma utilise maintenant Perplexity comme source d'intelligence principale pour les questions générales, incluant la météo.

