# 🕐 Guide de Configuration Cron - Fuseaux Horaires Montréal

## Problème

Les crons Vercel utilisent **l'heure UTC** (temps universel), mais Montréal utilise:
- **EDT (Eastern Daylight Time)** = UTC-4 (heure d'été)
- **EST (Eastern Standard Time)** = UTC-5 (heure d'hiver)

## Dates de Changement

| Période | Fuseau | Décalage UTC | Dates Approximatives |
|---------|--------|--------------|----------------------|
| **Été** | EDT | UTC-4 | 2e dimanche mars → 1er dimanche novembre |
| **Hiver** | EST | UTC-5 | 1er dimanche novembre → 2e dimanche mars |

**📅 En 2025**:
- Passage à l'EDT: **9 mars 2025 à 2h00**
- Passage à l'EST: **2 novembre 2025 à 2h00**

---

## Configuration des Crons

### Objectif: Briefings à Montréal
- 🌅 **7h20** - Briefing Matin
- ☀️ **11h50** - Briefing Midi
- 🌆 **16h20** - Briefing Soir

### Configuration Heure d'Été (EDT = UTC-4)

**Active de mars à novembre**

```json
{
  "crons": [
    {
      "path": "/api/cron-briefings",
      "schedule": "20 11 * * 1-5"
    },
    {
      "path": "/api/cron-briefings",
      "schedule": "50 15 * * 1-5"
    },
    {
      "path": "/api/cron-briefings",
      "schedule": "20 20 * * 1-5"
    }
  ]
}
```

| Heure Montréal EDT | Heure UTC | Schedule Cron |
|-------------------|-----------|---------------|
| 7:20 | 11:20 | `20 11 * * 1-5` |
| 11:50 | 15:50 | `50 15 * * 1-5` |
| 16:20 | 20:20 | `20 20 * * 1-5` |

---

### Configuration Heure d'Hiver (EST = UTC-5)

**Active de novembre à mars**

```json
{
  "crons": [
    {
      "path": "/api/cron-briefings",
      "schedule": "20 12 * * 1-5"
    },
    {
      "path": "/api/cron-briefings",
      "schedule": "50 16 * * 1-5"
    },
    {
      "path": "/api/cron-briefings",
      "schedule": "20 21 * * 1-5"
    }
  ]
}
```

| Heure Montréal EST | Heure UTC | Schedule Cron |
|-------------------|-----------|---------------|
| 7:20 | 12:20 | `20 12 * * 1-5` |
| 11:50 | 16:50 | `50 16 * * 1-5` |
| 16:20 | 21:20 | `20 21 * * 1-5` |

---

## 📝 Procédure de Changement (2x par an)

### 1. Début Mars (Passage à l'EDT)

**Date**: Weekend du 2e dimanche de mars

```bash
# 1. Ouvrir vercel.json
# 2. Remplacer les schedules:
"20 12" → "20 11"  # Matin: 12:20 UTC → 11:20 UTC
"50 16" → "50 15"  # Midi: 16:50 UTC → 15:50 UTC
"20 21" → "20 20"  # Soir: 21:20 UTC → 20:20 UTC

# 3. Commit et push
git add vercel.json
git commit -m "⏰ Changement cron: EST → EDT (heure d'été)"
git push

# 4. Vérifier dans Vercel Dashboard
# Settings → Cron Jobs → Vérifier les nouveaux schedules
```

---

### 2. Début Novembre (Passage à l'EST)

**Date**: Weekend du 1er dimanche de novembre

```bash
# 1. Ouvrir vercel.json
# 2. Remplacer les schedules:
"20 11" → "20 12"  # Matin: 11:20 UTC → 12:20 UTC
"50 15" → "50 16"  # Midi: 15:50 UTC → 16:50 UTC
"20 20" → "20 21"  # Soir: 20:20 UTC → 21:20 UTC

# 3. Commit et push
git add vercel.json
git commit -m "⏰ Changement cron: EDT → EST (heure d'hiver)"
git push

# 4. Vérifier dans Vercel Dashboard
# Settings → Cron Jobs → Vérifier les nouveaux schedules
```

---

## 🔔 Rappels Automatiques

### Créer des rappels calendrier

**Mars (vers EDT)**:
- Date: 1er weekend de mars
- Tâche: "Changer crons Vercel EDT (11/15/20 UTC)"
- Récurrence: Annuelle

**Novembre (vers EST)**:
- Date: Dernier weekend d'octobre
- Tâche: "Changer crons Vercel EST (12/16/21 UTC)"
- Récurrence: Annuelle

---

## ✅ Vérification Post-Changement

Après chaque modification:

1. **Vérifier Vercel Dashboard**
   - Aller sur https://vercel.com/dashboard
   - Projet GOB → Settings → Cron Jobs
   - Confirmer les 3 schedules sont corrects

2. **Tester manuellement** (optionnel)
   ```bash
   curl -X GET "https://gobapps.com/api/cron-briefings" \
     -H "Authorization: Bearer a80206f68062fceeaa07ca72a7f5c50e"
   ```

3. **Vérifier les logs le lendemain**
   - Vercel Dashboard → Deployments → Functions
   - Vérifier `/api/cron-briefings` s'est exécuté aux bonnes heures

---

## 🚨 Que faire si vous oubliez?

Pas de panique! Les briefings arriveront simplement **1 heure plus tôt ou plus tard**.

**Si vous êtes en retard**:
- Les briefings arrivent à 6:20/10:50/15:20 (au lieu de 7:20/11:50/16:20)
- Changez dès que possible selon la procédure ci-dessus
- Le changement prend effet immédiatement après le push

---

## 📊 Référence Rapide

| Mois | Fuseau | Heure Matin | Heure Midi | Heure Soir | Schedule UTC |
|------|--------|-------------|------------|------------|--------------|
| Janvier | EST | 7:20 | 11:50 | 16:20 | 12/16/21 |
| Février | EST | 7:20 | 11:50 | 16:20 | 12/16/21 |
| Mars | EST → EDT | 7:20 | 11:50 | 16:20 | **12/16/21 → 11/15/20** |
| Avril | EDT | 7:20 | 11:50 | 16:20 | 11/15/20 |
| Mai | EDT | 7:20 | 11:50 | 16:20 | 11/15/20 |
| Juin | EDT | 7:20 | 11:50 | 16:20 | 11/15/20 |
| Juillet | EDT | 7:20 | 11:50 | 16:20 | 11/15/20 |
| Août | EDT | 7:20 | 11:50 | 16:20 | 11/15/20 |
| Septembre | EDT | 7:20 | 11:50 | 16:20 | 11/15/20 |
| Octobre | EDT | 7:20 | 11:50 | 16:20 | 11/15/20 |
| Novembre | EDT → EST | 7:20 | 11:50 | 16:20 | **11/15/20 → 12/16/21** |
| Décembre | EST | 7:20 | 11:50 | 16:20 | 12/16/21 |

---

## 🛠️ Alternative: Script Automatique (Futur)

Pour automatiser complètement, on pourrait:

1. Créer un cron qui détecte le fuseau horaire actuel
2. Vérifier si on est dans la bonne heure locale
3. Ne générer le briefing que si approprié

Cette approche nécessiterait plus de logique mais éliminerait les changements manuels.

---

**Dernière mise à jour**: 2025-01-16
**Configuration actuelle**: EDT (Été) - `20 11`, `50 15`, `20 20` UTC
