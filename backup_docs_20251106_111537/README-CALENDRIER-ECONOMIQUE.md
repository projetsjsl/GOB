# 📅 Calendrier Économique - Guide d'Utilisation

## 🎯 Vue d'ensemble

Le calendrier économique a été intégré avec succès dans votre dashboard GOB Apps. Il comprend :

- **Backend API Flask** qui scrape les données de Finviz
- **Composant React amélioré** avec sous-onglets (Économique, Earnings, Dividendes)
- **Design moderne** inspiré du composant React fourni
- **Intégration complète** dans votre dashboard existant

## 🚀 Démarrage Rapide

### 1. Démarrer le Backend API

```bash
cd /Users/projetsjsl/Documents/GitHub/GOB/backend
source venv/bin/activate
python app.py
```

Le serveur démarrera sur `http://localhost:5001`

### 2. Ouvrir le Dashboard

Ouvrez votre fichier `public/beta-combined-dashboard.html` dans le navigateur et cliquez sur l'onglet **"📅 Calendrier Économique"**.

### 3. Tester l'API (Optionnel)

Ouvrez `test-calendar-integration.html` pour tester les endpoints API individuellement.

## 📡 Endpoints API Disponibles

| Endpoint | Description | Exemple |
|----------|-------------|---------|
| `GET /api/calendar/economic` | Calendrier économique Finviz | `http://localhost:5001/api/calendar/economic` |
| `GET /api/calendar/earnings` | Calendrier des earnings (demo) | `http://localhost:5001/api/calendar/earnings` |
| `GET /api/calendar/dividends` | Calendrier des dividendes (demo) | `http://localhost:5001/api/calendar/dividends` |
| `GET /api/health` | Vérification de santé | `http://localhost:5001/api/health` |

## 🎨 Fonctionnalités du Composant

### Sous-onglets
- **Économique** : Données en temps réel de Finviz
- **Earnings** : Calendrier des résultats d'entreprises
- **Dividendes** : Calendrier des paiements de dividendes

### Design
- **Mode sombre/clair** : S'adapte automatiquement au thème du dashboard
- **Tableau responsive** : Colonnes optimisées pour mobile et desktop
- **Indicateurs d'impact** : Barres colorées (1-3) pour l'importance des événements
- **Codes couleur** : Vert (positif), Rouge (négatif), Gris (neutre)
- **Drapeaux de devises** : 🇺🇸 🇪🇺 🇬🇧 etc.

### Interactions
- **Bouton Actualiser** : Recharge les données depuis l'API
- **États de chargement** : Spinner et messages informatifs
- **Gestion d'erreurs** : Données de fallback en cas de problème
- **Notifications** : Icône cloche pour les alertes

## 🔧 Configuration

### Variables d'Environnement
Le backend utilise les ports suivants :
- **Port 5001** : API Flask (évite le conflit avec AirPlay sur macOS)

### CORS
L'API accepte les requêtes depuis :
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:5173`
- `http://localhost:8080`
- `https://gob-apps.vercel.app`
- `https://*.vercel.app`

## 📊 Structure des Données

### Format de Réponse API
```json
{
  "success": true,
  "data": [
    {
      "date": "Mon Oct 13",
      "events": [
        {
          "time": "08:30 AM",
          "currency": "USD",
          "impact": 3,
          "event": "NY Empire State Manufacturing Index",
          "actual": "10.70",
          "forecast": "-1.00",
          "previous": "-8.70"
        }
      ]
    }
  ],
  "source": "finviz.com",
  "timestamp": "2025-10-15T17:43:15.538761"
}
```

### Niveaux d'Impact
- **1** : Impact faible (vert)
- **2** : Impact moyen (orange)
- **3** : Impact élevé (rouge)

## 🛠️ Dépannage

### Problème : Port 5000 occupé
**Solution** : Le backend utilise maintenant le port 5001 pour éviter les conflits avec AirPlay.

### Problème : Aucune donnée affichée
**Causes possibles** :
1. Backend non démarré
2. Finviz bloque les requêtes automatisées
3. Problème de réseau

**Solutions** :
1. Vérifier que le backend fonctionne : `curl http://localhost:5001/api/health`
2. Les données de fallback s'affichent automatiquement
3. Vérifier la console du navigateur pour les erreurs

### Problème : Erreur CORS
**Solution** : Vérifier que l'URL du frontend est dans la liste CORS du backend.

## 📈 Améliorations Futures

### Backend
- [ ] Cache Redis pour les données Finviz
- [ ] Scraping des données Earnings et Dividendes réelles
- [ ] Authentification API
- [ ] Rate limiting

### Frontend
- [ ] Filtres par devise/importance
- [ ] Recherche d'événements
- [ ] Notifications push
- [ ] Export des données
- [ ] Graphiques d'impact

## 🎉 Résultat Final

✅ **Backend API Flask** fonctionnel sur le port 5001  
✅ **Composant React amélioré** avec sous-onglets  
✅ **Design moderne** inspiré du composant fourni  
✅ **Intégration complète** dans le dashboard existant  
✅ **Gestion d'erreurs** et données de fallback  
✅ **Responsive design** pour mobile et desktop  

Le calendrier économique est maintenant pleinement intégré et fonctionnel dans votre dashboard GOB Apps ! 🚀
