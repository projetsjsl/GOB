# 🔍 Instructions: Validation FMP et Suppression des Tickers Invalides

**Date:** 2026-01-11

---

## 📋 Objectif

Valider que tous les tickers actifs dans Supabase sont disponibles dans l'API FMP et supprimer ceux qui ne le sont pas.

---

## 🚀 Exécution

### Option 1: Script Batch (Recommandé)

Le script traite par batch et peut reprendre après interruption:

```bash
cd /Users/projetsjsl/Documents/GitHub/GOB
node scripts/validate-fmp-availability-batch.js
```

**Caractéristiques:**
- Traite par batch de 20 tickers
- Sauvegarde l'état après chaque ticker
- Peut être interrompu et relancé (reprend où il s'est arrêté)
- Pause de 200ms entre chaque ticker
- Pause de 1 seconde entre chaque batch

**Temps estimé:** ~10-15 minutes pour 1028 tickers

### Option 2: Script Simple (Plus lent)

```bash
cd /Users/projetsjsl/Documents/GitHub/GOB
node scripts/validate-fmp-availability.js
```

**Caractéristiques:**
- Traite un ticker à la fois
- Pause de 300ms entre chaque ticker
- Pas de reprise après interruption

**Temps estimé:** ~5-6 minutes pour 1028 tickers

---

## 📊 Fichiers Générés

### Pendant l'exécution:
- `docs/FMP_VALIDATION_STATE.json` - État de progression (peut être supprimé après)

### Après l'exécution:
- `docs/VALIDATION_FMP_DISPONIBILITE.json` - Rapport détaillé JSON
- `docs/VALIDATION_FMP_DISPONIBILITE.md` - Rapport Markdown

---

## 🔄 Reprise après Interruption

Si le script est interrompu, relancez simplement:

```bash
node scripts/validate-fmp-availability-batch.js
```

Le script reprendra automatiquement où il s'est arrêté en utilisant `docs/FMP_VALIDATION_STATE.json`.

---

## ✅ Résultat Attendu

1. **Validation:** Tous les tickers actifs sont vérifiés avec FMP
2. **Rapport:** Liste des tickers non disponibles
3. **Suppression:** Les tickers non disponibles sont supprimés de Supabase
4. **Vérification:** Le nombre final de tickers actifs est vérifié

---

## ⚠️ Notes

- Le script utilise l'API FMP avec votre clé API
- Respecte les limites de rate limiting (200ms entre requêtes)
- Les tickers supprimés ne peuvent pas être récupérés depuis FMP
- Le fichier d'état est automatiquement supprimé après succès

---

## 📋 Exemple de Sortie

```
🔍 Validation de la disponibilité FMP pour tous les tickers actifs...

📊 1028 tickers actifs au total
   0 déjà traités
   1028 à traiter

📦 Batch 1/52 (20 tickers)...
   ✅ AAPL ✅ MSFT ✅ GOOGL ...
   Progression: 20/1028 (1.9%)

📦 Batch 2/52 (20 tickers)...
   ...

📊 Résultats finaux:
   ✅ Disponibles dans FMP: 1026
   ❌ Non disponibles dans FMP: 2

⚠️  2 tickers non disponibles dans FMP détectés.
   Tickers à supprimer: Q, TCPA

🗑️  Suppression de 2 tickers non disponibles dans FMP...

✅ Suppression terminée:
   - Supprimés: 2/2

📊 Total tickers actifs restants: 1026
   (Devrait être: 1026)

✅ Validation terminée!
```
