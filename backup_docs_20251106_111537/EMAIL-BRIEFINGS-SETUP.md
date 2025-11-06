# 📧 Système de Briefings Email Automatisés

## Vue d'ensemble

Le système de briefings email automatisés permet de générer et envoyer des rapports financiers personnalisés à différents moments de la journée :
- **Briefing Matin** : Marchés asiatiques + Futures US
- **Update Midi** : Marchés US + Top Movers
- **Rapport Soir** : Performance finale + Analyse approfondie

## 🚀 Installation et Configuration

### 1. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` et sur Vercel :

```bash
# APIs externes
PERPLEXITY_API_KEY=your_perplexity_api_key
OPENAI_API_KEY=your_openai_api_key
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=briefing@your-domain.com

# Supabase (déjà configuré)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Configuration Supabase

Exécutez le script SQL pour créer la table des briefings :

```sql
-- Exécuter le contenu de supabase-briefings.sql
-- Ou via l'interface Supabase SQL Editor
```

### 3. Déploiement

Les endpoints API sont automatiquement déployés avec Vercel :
- `/api/perplexity-search.js`
- `/api/openai-analysis.js`
- `/api/briefing-data.js`
- `/api/resend-email.js`
- `/api/supabase-briefings.js`

## 📊 Fonctionnalités

### Interface Utilisateur

1. **Onglet "📧 Briefings Email"** dans le dashboard
2. **3 boutons de génération** pour chaque type de briefing
3. **Prévisualisation en temps réel** dans un iframe
4. **Formulaire d'envoi email** avec destinataires multiples
5. **Historique des briefings** sauvegardés

### Types de Briefings

#### 🌅 Briefing Matin
- **Données** : Marchés asiatiques (Nikkei, Hang Seng, SSE, ASX) + Futures US
- **Actualités** : Recherche des dernières 12h via Perplexity
- **Analyse** : Synthèse exécutive, performance marchés, catalyseurs, focus du jour
- **Style** : Professionnel, 800 mots max

#### ☀️ Update Midi
- **Données** : Marchés US (S&P, Dow, NASDAQ) + Top Movers
- **Actualités** : Breaking news des dernières 4h
- **Analyse** : Flash exécutif, analyse marché, deep dive top movers
- **Style** : Concis, 600 mots max

#### 🌙 Rapport Soir
- **Données** : Performance finale US + Secteurs + Top Movers
- **Actualités** : Synthèse complète de la journée
- **Analyse** : Synthèse exécutive, analyse approfondie, perspectives
- **Style** : Institutionnel, 1200-1500 mots

## 🔧 Utilisation

### Génération d'un Briefing

1. Cliquez sur l'onglet "📧 Briefings Email"
2. Choisissez le type de briefing (Matin/Midi/Soir)
3. Cliquez sur le bouton correspondant
4. Attendez la génération (collecte données + IA)
5. Prévisualisez le résultat dans l'iframe

### Sauvegarde

1. Après génération, cliquez sur "💾 Sauvegarder"
2. Le briefing est stocké dans Supabase
3. Il apparaît dans l'historique

### Envoi Email

1. Saisissez les destinataires (séparés par des virgules)
2. Cliquez sur "📧 Envoyer"
3. L'email est envoyé via Resend API

### Consultation Historique

1. Section "📚 Historique des Briefings"
2. Liste des briefings sauvegardés
3. Bouton "👁️ Voir" pour recharger un briefing

## 🛠️ Architecture Technique

### Endpoints API

#### `/api/briefing-data`
- **Méthode** : GET
- **Paramètres** : `?type=morning|noon|evening`
- **Fonction** : Collecte des données marché via Yahoo Finance
- **Fallback** : Données simulées si erreur

#### `/api/perplexity-search`
- **Méthode** : POST
- **Body** : `{ prompt, recency }`
- **Fonction** : Recherche d'actualités via Perplexity API
- **Fallback** : Actualités simulées si clé manquante

#### `/api/openai-analysis`
- **Méthode** : POST
- **Body** : `{ prompt, marketData, news }`
- **Fonction** : Génération d'analyse via GPT-4
- **Fallback** : Analyse simulée si clé manquante

#### `/api/resend-email`
- **Méthode** : POST
- **Body** : `{ recipients, subject, html }`
- **Fonction** : Envoi d'emails via Resend API
- **Fallback** : Simulation d'envoi si clé manquante

#### `/api/supabase-briefings`
- **Méthodes** : GET, POST, DELETE
- **Fonction** : Gestion CRUD des briefings
- **Pagination** : Support limit/offset

### Templates HTML

3 templates responsives avec :
- **Design professionnel** avec gradients
- **Métriques visuelles** (cartes, couleurs)
- **Responsive design** pour mobile
- **Branding cohérent** avec le dashboard

### Base de Données

Table `briefings` :
```sql
- id (UUID, PK)
- type (morning|noon|evening)
- subject (TEXT)
- html_content (TEXT)
- market_data (JSONB)
- analysis (TEXT)
- recipients (TEXT[])
- sent_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

## 🧪 Tests

### Test Automatique

```bash
node test-email-briefings.js
```

### Test Manuel

1. Ouvrez le dashboard
2. Onglet "📧 Briefings Email"
3. Testez chaque type de briefing
4. Vérifiez la prévisualisation
5. Testez la sauvegarde
6. Testez l'envoi email

## 🔒 Sécurité

- **Clés API protégées** côté serveur uniquement
- **Validation des entrées** sur tous les endpoints
- **CORS configuré** pour les requêtes cross-origin
- **Gestion d'erreurs** avec fallbacks gracieux

## 📈 Monitoring

### Logs

- Console logs pour chaque étape
- Erreurs détaillées avec stack traces
- Métriques de performance (tokens utilisés)

### Métriques

- Nombre de briefings générés
- Taux de succès des envois
- Utilisation des APIs externes

## 🚨 Dépannage

### Problèmes Courants

1. **"Clé API non configurée"**
   - Vérifiez les variables d'environnement
   - Redéployez sur Vercel si nécessaire

2. **"Erreur lors de la collecte des données"**
   - Yahoo Finance peut être temporairement indisponible
   - Le système utilise des données fallback

3. **"Erreur lors de l'envoi"**
   - Vérifiez la clé Resend
   - Vérifiez l'email expéditeur configuré

4. **"Erreur Supabase"**
   - Vérifiez la connexion Supabase
   - Vérifiez que la table `briefings` existe

### Mode Démo

Le système fonctionne en mode démo même sans clés API :
- Données marché simulées
- Actualités simulées
- Analyse simulée
- Envoi email simulé

## 🔄 Évolutions Futures

### Fonctionnalités Prévues

1. **Planification automatique** (cron jobs)
2. **Templates personnalisables**
3. **Analytics détaillées**
4. **Intégration calendrier économique**
5. **Alertes personnalisées**

### Optimisations

1. **Cache des données marché**
2. **Compression des emails**
3. **CDN pour les assets**
4. **Rate limiting des APIs**

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs de la console
2. Testez avec le script de test
3. Consultez la documentation des APIs externes
4. Vérifiez la configuration Supabase

---

**Note** : Ce système est conçu pour fonctionner en mode démo même sans configuration complète, permettant de tester toutes les fonctionnalités avec des données simulées.
