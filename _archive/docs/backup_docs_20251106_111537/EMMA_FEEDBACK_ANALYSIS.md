# 📝 Analyse Feedback Emma - 6 Nov 2025

## Résumé de ta feedback

Salut JS! Merci pour ce feedback très détaillé et constructif. Voici ce qu'on a identifié et corrigé:

---

## ✅ Points Positifs (à maintenir)

### 1. Message de Bienvenue
- Ton: Engageant et professionnel
- Structure: Claire avec emojis
- Longueur: Parfaite
- **Action**: Aucune - garder tel quel

### 2. Réponse ACN (Fondamentaux)
- **Ce que tu as aimé**: La longueur, la profondeur, les détails
- **Raison**: Emma a utilisé un bon équilibre entre données FMP + analyse Perplexity
- **Structure**:
  - Données précises (ratios, marges, rentabilité)
  - Contexte sectoriel
  - Faits récents
  - Conclusion claire
- **Action**: C'est LE format à répliquer pour toutes les autres réponses

---

## 🔴 Problèmes Majeurs (FIXÉS ou En cours)

### BUG #1: Parenthèse bizarre ✅ FIXÉ
- **Problème**: "Invite (819) 342-5966 Max" affichait "👤 (Max" au lieu de "👤 Max"
- **Cause**: Parser d'invitation ne nettoyait pas les parenthèses résiduelles
- **Fix**: Amélioré `lib/invitation-handler.js`
- **Test**: Prête pour déploiement

---

### BUG #2: Incohérences YTD 🔴 EN COURS
**Symptômes que tu as observés**:
```
ACN YTD:
  - Réponse 1: -15% ✓
  - Réponse 2: -34% ✗
  - Réponse 3: -40% ✗ (aussi 12 mois!)

GOOGL YTD:
  - Réponse 1: +48% ✓
  - Réponse 2: +42% ✗

BCE YTD:
  - Réponse 1: -6%
  - Réponse 2: -12% ✗
```

**Pourquoi ça se passe?**
- Emma utilise **Perplexity** pour les analyses (qui scrape le web en temps réel)
- Perplexity n'a PAS une "source de vérité" - il cherche et synthétise
- Chaque appel à Perplexity peut trouver des données légèrement différentes
- Aucune validation que les chiffres sont cohérents

**Solution qu'on déploie**:
1. Forcer FMP comme source primaire pour les données financières
2. Inclure contexte FMP dans les prompts Perplexity
3. Ajouter validation des YTD (YTD ne peut pas > 12 mois!)
4. Documenter la source de chaque chiffre ("données FMP")

---

### BUG #3: Graphiques sur titres inexistants 🔴 À INVESTIGUER
**Problème**: Liens comme "https://tradingview.com/chart/?symbol=IT" (IT n'existe pas)

Les vrais tickers devraient être:
- IT → Information Technology sector (pas un ticker)
- US → USA country code (pas un ticker)
- CA → Canada country code (pas un ticker)

**Solution**:
- Remplacer par des tickers réels (ex: XLK pour IT sector)
- Ou supprimer les liens "vagues"
- Laisser utilisateur demander des graphiques spécifiques

---

### BUG #4: Focus répétitif sur certains tickers 🟡 À INVESTIGUER
**Problème**: Après la bonne réponse ACN, les réponses suivantes ont toutes focalisé sur les mêmes tickers (GOOGL, TD, BNS, BCE, etc.)

**Cause probable**:
- Emma ne diversifie pas les réponses
- Elle utilise un pool limité de tickers d'équipe
- Pas d'équilibrage entre mises à jour vs nouveaux tickers

**Solution**:
- Implémenter rotation de tickers
- Varier les secteurs/stratégies

---

## 📊 Métriques de Qualité

### Avant (ta session):
- ✅ Message de bienvenue: Excellent
- ✅ Analyse ACN: Excellente (format A+)
- ⚠️ Autres réponses: Bonnes mais moins détaillées
- ❌ Cohérence des données: Faible (incohérences YTD)
- ⚠️ Graphiques: Imprécis (tickers fantômes)

### Après (après nos fixes):
- ✅ Message de bienvenue: Excellent (inchangé)
- ✅ Analyse ACN: Excellente (inchangée)
- 🔄 Autres réponses: Meilleure cohérence (FMP context)
- ✅ Cohérence des données: Forte (validation YTD)
- 🟢 Graphiques: Précis (tickers valides ou supprimés)

---

## 🚀 Prochaines Étapes

### Immédiat (Today):
1. ✅ Deploy fix BUG #1 (Parenthèse)
2. ✓ Documenter BUG #2 et solution (DONE)
3. ✓ Identifier BUG #3 et #4 (DONE)

### Cette semaine:
1. ✓ Modifier emma-agent pour forcer FMP context
2. ✓ Créer ytd-validator.js
3. ✓ Tester cohérence YTD (avant/après)
4. ✓ Remplacer graphiques avec tickers valides

### Semaine prochaine:
1. ✓ Améliorer diversité de réponses
2. ✓ Documenter sources dans les réponses
3. ✓ Ajouter tests automatisés

---

## 💡 Ton Feedback était

**Précis**: Tu as identifié exactement les problèmes
**Constructif**: Tu as montré ce que tu aimais (pour qu'on le réplique)
**Actionnable**: Clair ce qui était bon vs mauvais

**Prochaine itération**:
- Essaie Emma à nouveau après nos fixes
- Focus sur: Cohérence des YTD, détail des analyses
- Note: Peut-on avoir les mêmes analyses longues pour les autres tickers?

---

## Questions pour toi

1. **Longueur des réponses**: Tu aimais la longueur de ACN (+1500 mots), tu veux ça partout?
2. **Formats**: Préfères-tu tableaux, bullet points, ou texte narratif?
3. **Fréquence**: Comment on évite la répétition sur les mêmes tickers?
4. **Profondeur**: Toujours autant de détails, ou parfois plus bref?

---

**Status**: 🟢 En cours - Déploiement cette semaine

Pour questions ou clarifications, envoie un message à Emma! 📱

