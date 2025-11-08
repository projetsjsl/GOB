# ⏰ Gestion des Horaires et Automatisations des Briefings

## 📍 Où modifier les horaires ?

### **Option 1 : Interface Web (Recommandé)**

1. **Ouvrez le dashboard** : `https://gob-projetsjsls-projects.vercel.app`
2. **Allez dans l'onglet** : **"Emma En Direct"**
3. **Faites défiler jusqu'à** : **"⏰ Gestion des Horaires et Automatisations"**

### **Option 2 : Fichier de Configuration**

Fichier : `config/briefing-schedule.json`

```json
{
  "morning": {
    "enabled": true,
    "hour": 7,
    "minute": 20,
    "timezone": "America/Montreal",
    "cron_utc": "20 11 * * 1-5"
  },
  "midday": {
    "enabled": true,
    "hour": 11,
    "minute": 50,
    "timezone": "America/Montreal",
    "cron_utc": "50 15 * * 1-5"
  },
  "evening": {
    "enabled": true,
    "hour": 16,
    "minute": 20,
    "timezone": "America/Montreal",
    "cron_utc": "20 20 * * 1-5"
  }
}
```

### **Option 3 : Workflow n8n (Direct)**

1. **Ouvrez n8n** : https://projetsjsl.app.n8n.cloud
2. **Allez dans le workflow** : "Emma Newsletter - Automated Multi-API Financial News Distribution"
3. **Cliquez sur le nœud** : "Schedule Trigger (7h/12h/16h30 EST)"
4. **Modifiez les expressions cron** dans les paramètres

## 🎛️ Interface de Gestion

### **Fonctionnalités**

1. **Activer/Désactiver chaque briefing**
   - Case à cocher pour chaque type (🌅 Matin, ☀️ Midi, 🌙 Soir)
   - Désactiver = le briefing ne sera pas envoyé automatiquement

2. **Modifier les horaires**
   - **Heure** : 0-23 (format 24h)
   - **Minute** : 0-59
   - **Affichage** : Heure locale formatée (ex: 07h20)

3. **Sauvegarder**
   - Cliquez sur **"💾 Sauvegarder"**
   - Les modifications sont enregistrées dans `config/briefing-schedule.json`

## ⚠️ Important : Mise à jour n8n

**Après avoir modifié les horaires dans l'interface, vous devez mettre à jour le workflow n8n manuellement :**

### **Étapes pour mettre à jour n8n :**

1. **Récupérez les expressions cron** depuis `config/briefing-schedule.json`
   - `morning.cron_utc` : Expression pour le briefing matin
   - `midday.cron_utc` : Expression pour le briefing midi
   - `evening.cron_utc` : Expression pour le briefing soir

2. **Ouvrez n8n** : https://projetsjsl.app.n8n.cloud/workflow/03lgcA4e9uRTtli1

3. **Cliquez sur** : "Schedule Trigger (7h/12h/16h30 EST)"

4. **Modifiez les expressions cron** :
   - Remplacez `"0 7 * * *"` par l'expression du matin
   - Remplacez `"0 12 * * *"` par l'expression du midi
   - Remplacez `"30 16 * * *"` par l'expression du soir

5. **Sauvegardez** le workflow dans n8n

6. **Activez le workflow** si nécessaire

## 📋 Exemples d'Expressions Cron

### **Format** : `minute heure * * jours-semaine`

- `* * * * *` : Toutes les minutes
- `0 7 * * 1-5` : 7h00 du lundi au vendredi
- `20 11 * * 1-5` : 11h20 du lundi au vendredi
- `30 16 * * 1-5` : 16h30 du lundi au vendredi
- `0 9 * * *` : 9h00 tous les jours
- `0 12 * * 0` : 12h00 le dimanche uniquement

### **Conversion Heure Montréal → UTC**

- **Montréal (EST)** : UTC-5 (hiver) ou UTC-4 (été)
- **Exemple** : 7h20 Montréal = 12h20 UTC (hiver) ou 11h20 UTC (été)

Pour simplifier, le système utilise UTC-5 (hiver) par défaut.

## 🔄 Activation/Désactivation

### **Désactiver un briefing**

1. Dans l'interface, **décochez** la case du briefing
2. **Sauvegardez**
3. Le briefing ne sera plus envoyé automatiquement

### **Réactiver un briefing**

1. Dans l'interface, **cochez** la case du briefing
2. **Sauvegardez**
3. Le briefing sera envoyé automatiquement selon l'horaire configuré

## 📡 API Endpoints

### **GET `/api/briefing-schedule`**

Récupère la configuration des horaires.

**Réponse** :
```json
{
  "success": true,
  "schedule": {
    "morning": {
      "enabled": true,
      "hour": 7,
      "minute": 20,
      "timezone": "America/Montreal",
      "cron_utc": "20 11 * * 1-5"
    },
    "midday": { ... },
    "evening": { ... }
  }
}
```

### **PUT `/api/briefing-schedule`**

Met à jour la configuration des horaires.

**Body** :
```json
{
  "morning": {
    "enabled": true,
    "hour": 8,
    "minute": 0
  },
  "midday": {
    "enabled": false
  },
  "evening": {
    "enabled": true,
    "hour": 17,
    "minute": 30
  }
}
```

## 🐛 Dépannage

### **Les briefings ne se déclenchent pas**

1. Vérifiez que le workflow n8n est **activé**
2. Vérifiez que les expressions cron dans n8n correspondent à `config/briefing-schedule.json`
3. Vérifiez les logs n8n pour voir si le Schedule Trigger se déclenche

### **Les horaires ne se sauvegardent pas**

1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez que l'API `/api/briefing-schedule` est accessible
3. Vérifiez les permissions du fichier `config/briefing-schedule.json`

### **Les modifications n'apparaissent pas dans n8n**

- **Normal** : Les modifications dans l'interface ne mettent pas à jour n8n automatiquement
- **Solution** : Mettez à jour manuellement le nœud "Schedule Trigger" dans n8n avec les nouvelles expressions cron

