# 🛠️ Scripts GOB

Ce dossier contient des scripts utilitaires pour le projet GOB.

---

## ⏰ `change-cron-timezone.sh`

Script de changement automatique des crons Vercel pour gérer les changements d'heure saisonniers (EDT/EST).

### Usage

#### Via npm (Recommandé)

```bash
# Passer à l'heure d'été (mars)
npm run cron:edt

# Passer à l'heure d'hiver (novembre)
npm run cron:est
```

#### Via script direct

```bash
# Passer à l'heure d'été
./scripts/change-cron-timezone.sh edt

# Passer à l'heure d'hiver
./scripts/change-cron-timezone.sh est
```

### Ce que fait le script

1. ✅ Vérifie que vous êtes dans le bon répertoire
2. 🔧 Modifie automatiquement `vercel.json`
3. 📊 Affiche les changements effectués
4. 💬 Demande confirmation pour commit
5. 🚀 Demande confirmation pour push
6. ✅ Affiche les prochaines étapes

### Exemple d'exécution

```bash
$ npm run cron:edt

⏰ Changement de Timezone des Crons Vercel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌞 Configuration pour EDT (Heure d'Été)
Période: Mars à Novembre
Décalage: UTC-4

Briefings Montréal → UTC:
  • 7:20 EDT → 11:20 UTC
  • 11:50 EDT → 15:50 UTC
  • 16:20 EDT → 20:20 UTC

✅ Fichier vercel.json modifié avec succès

📝 Changements effectués:
-      "schedule": "20 12 * * 1-5"
+      "schedule": "20 11 * * 1-5"
-      "schedule": "50 16 * * 1-5"
+      "schedule": "50 15 * * 1-5"
-      "schedule": "20 21 * * 1-5"
+      "schedule": "20 20 * * 1-5"

Voulez-vous commit et push ces changements? (y/n)
```

### Quand utiliser

| Mois | Action | Commande |
|------|--------|----------|
| **Mars** | Changement d'heure (→ EDT) | `npm run cron:edt` |
| **Novembre** | Changement d'heure (→ EST) | `npm run cron:est` |

**Dates exactes**: Voir [docs/CRON_TIMEZONE_GUIDE.md](../docs/CRON_TIMEZONE_GUIDE.md)

### Annuler les changements

Si vous avez exécuté le script mais pas encore commit:

```bash
git checkout vercel.json
```

Si vous avez commit mais pas push:

```bash
git reset HEAD~1
git checkout vercel.json
```

---

## 📚 Documentation Connexe

- [CRON_TIMEZONE_GUIDE.md](../docs/CRON_TIMEZONE_GUIDE.md) - Guide complet sur les timezones
- [vercel-cron-configs.md](../docs/vercel-cron-configs.md) - Configurations EDT/EST détaillées

---

## 🐛 Dépannage

### Le script ne s'exécute pas

```bash
# Rendre le script exécutable
chmod +x scripts/change-cron-timezone.sh
```

### Erreur "vercel.json not found"

Assurez-vous d'exécuter le script depuis la racine du projet GOB:

```bash
cd /path/to/GOB
npm run cron:edt
```

### Les changements ne sont pas appliqués

Vérifiez que vous avez bien:
1. Commit les changements
2. Push vers GitHub
3. Vérifié dans Vercel Dashboard → Cron Jobs

---

**Dernière mise à jour**: 2025-01-16
