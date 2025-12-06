# Système de Barres d'Annonces Dynamiques

## Vue d'ensemble

Système de barres d'annonces dynamiques alimenté par **Gemini avec Google Search**, basé sur les exemples de l'article [Elfsight - Website Announcement Bar Examples](https://elfsight.com/blog/website-announcement-bar-examples/).

## Types de Barres Disponibles

### 1. 📰 Actualités Financières (`news`)
- **Description**: Actualités importantes de l'heure
- **Source**: Gemini + Google Search
- **Utilisation**: Informer les utilisateurs des dernières actualités financières

### 2. 🆕 Mises à Jour Système (`update`)
- **Description**: Nouvelles fonctionnalités et améliorations
- **Source**: Gemini (sans Google Search)
- **Utilisation**: Annoncer les nouvelles fonctionnalités du dashboard

### 3. 📅 Événements Économiques (`event`)
- **Description**: Fed, GDP, emploi, etc.
- **Source**: Gemini + Google Search
- **Utilisation**: Rappeler les événements économiques importants

### 4. ⚠️ Alertes de Marché (`market-alert`)
- **Description**: Volatilité, crash, rally
- **Source**: Gemini + Google Search
- **Utilisation**: Alerter sur les mouvements de marché importants

### 5. 🎁 Promotions (`promotion`)
- **Description**: Offres sur services premium
- **Source**: Gemini (sans Google Search)
- **Utilisation**: Promouvoir les offres spéciales

## Architecture

### Composants

1. **`AnnouncementBar.js`**: Composant individuel de barre
   - Gère l'affichage et la fermeture (X)
   - Charge le contenu depuis l'API
   - Sauvegarde l'état de fermeture dans localStorage

2. **`AnnouncementBarManager.js`**: Gestionnaire global
   - Gère toutes les barres actives
   - Configuration via localStorage
   - Permet d'activer/désactiver les barres

3. **`api/announcement-bars.js`**: API backend
   - Génère le contenu via Gemini
   - Active Google Search pour données à jour
   - Supporte tous les types de barres

### Intégration

Les barres sont intégrées dans `app-inline.js` juste après le header et avant le NewsTicker :

```javascript
{/* Announcement Bars - Barres d'annonces dynamiques (Gemini-powered) */}
{window.AnnouncementBarManager && React.createElement(window.AnnouncementBarManager, { isDarkMode: isDarkMode })}
```

## Configuration

### Interface Admin

L'onglet **Admin-JSLAI** contient une section "Gestion des Barres d'Annonces" qui permet de :
- ✅ Activer/désactiver chaque type de barre
- 👁️ Voir la description de chaque barre
- 💾 Sauvegarder automatiquement la configuration

### localStorage

La configuration est sauvegardée dans `announcement-bars-config` :
```json
{
  "news-top": { "enabled": true, "type": "news", "section": "top", "design": "default" },
  "update-top": { "enabled": false, "type": "update", "section": "top", "design": "default" }
}
```

L'état de fermeture de chaque barre est sauvegardé dans `announcement-{type}-{section}-dismissed`.

## Fonctionnalités

### ✅ Fermeture par l'utilisateur
- Bouton X sur chaque barre
- État sauvegardé dans localStorage
- La barre ne réapparaît pas jusqu'à réinitialisation

### 🔄 Rafraîchissement automatique
- Contenu rafraîchi toutes les 30 minutes
- Données à jour via Google Search (pour types concernés)

### 🎨 Design adaptatif
- Styles différents selon le type de barre
- Support du mode sombre/clair
- Animations de transition

### 🔍 Google Search intégré
- Types `news`, `event`, `market-alert` utilisent Google Search
- Données hyper à jour de la journée
- Pas de sur-sollicitation (contrairement à Perplexity)

## API

### Endpoint: `/api/announcement-bars`

**Méthode**: POST

**Body**:
```json
{
  "type": "news",
  "section": "top"
}
```

**Réponse**:
```json
{
  "success": true,
  "type": "news",
  "section": "top",
  "content": "📰 Tech rally lifts US stocks as traders eye earnings",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## Exemples d'utilisation

### Activer une barre programmatiquement
```javascript
const config = window.getAnnouncementBarsConfig();
config['news-top'].enabled = true;
window.setAnnouncementBarsConfig(config);
```

### Réinitialiser une barre fermée
```javascript
localStorage.removeItem('announcement-news-top-dismissed');
window.location.reload();
```

## Avantages vs Perplexity

- ✅ **Gratuit**: Quota généreux de Gemini
- ✅ **Moins sur-sollicité**: Pas de rate limiting strict
- ✅ **Données à jour**: Google Search intégré
- ✅ **Flexible**: 5 types de barres différents
- ✅ **Gérable**: Interface admin intégrée

## Références

- [Article Elfsight - Website Announcement Bar Examples](https://elfsight.com/blog/website-announcement-bar-examples/)
- Documentation Gemini: https://ai.google.dev/
- Google Search Retrieval: https://ai.google.dev/gemini-api/docs/google-search-retrieval







