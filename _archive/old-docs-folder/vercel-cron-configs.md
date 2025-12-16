# ⏰ Configurations Cron Vercel - EDT vs EST

## 📋 Configuration Actuelle

**Actuellement configuré pour**: **EDT (Heure d'Été)** - Mars à Novembre

Briefings Montréal: 7h20 / 11h50 / 16h20 EDT

---

## 🌞 Configuration EDT (Heure d'Été)

**Période**: 2e dimanche mars → 1er dimanche novembre

**À utiliser dans `vercel.json`**:

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

**Correspondance horaire**:
- 11:20 UTC = **7:20 EDT** (Montréal Matin)
- 15:50 UTC = **11:50 EDT** (Montréal Midi)
- 20:20 UTC = **16:20 EDT** (Montréal Soir)

---

## ❄️ Configuration EST (Heure d'Hiver)

**Période**: 1er dimanche novembre → 2e dimanche mars

**À utiliser dans `vercel.json`**:

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

**Correspondance horaire**:
- 12:20 UTC = **7:20 EST** (Montréal Matin)
- 16:50 UTC = **11:50 EST** (Montréal Midi)
- 21:20 UTC = **16:20 EST** (Montréal Soir)

---

## 🔄 Comment Changer

### Méthode 1: Script Automatique (Recommandé)

```bash
# Pour passer à l'heure d'été (EDT) - Mars
npm run cron:edt

# Pour passer à l'heure d'hiver (EST) - Novembre
npm run cron:est
```

### Méthode 2: Modification Manuelle

1. Ouvrir `vercel.json`
2. Trouver la section `"crons"`
3. Remplacer les 3 schedules
4. Commit et push

---

## 📅 Dates Clés 2025-2030

| Année | Passage à EDT (Été) | Passage à EST (Hiver) |
|-------|--------------------|-----------------------|
| 2025 | 9 mars | 2 novembre |
| 2026 | 8 mars | 1 novembre |
| 2027 | 14 mars | 7 novembre |
| 2028 | 12 mars | 5 novembre |
| 2029 | 11 mars | 4 novembre |
| 2030 | 10 mars | 3 novembre |

**Règle**:
- EDT: 2e dimanche de mars à 2h00
- EST: 1er dimanche de novembre à 2h00

---

## ✅ Checklist de Changement

- [ ] Vérifier la date du changement d'heure
- [ ] Exécuter le script ou modifier `vercel.json`
- [ ] Commit avec message clair: `⏰ Cron: EDT→EST` ou `⏰ Cron: EST→EDT`
- [ ] Push vers GitHub
- [ ] Vérifier Vercel Dashboard → Cron Jobs
- [ ] Attendre le premier cron du lendemain
- [ ] Vérifier l'heure de réception de l'email

---

**Voir aussi**: [CRON_TIMEZONE_GUIDE.md](./CRON_TIMEZONE_GUIDE.md) pour le guide complet
