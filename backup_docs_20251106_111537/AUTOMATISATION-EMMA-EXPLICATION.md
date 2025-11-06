# 🤖 AUTOMATISATION EMMA EN DIRECT - GUIDE COMPLET

## 📋 **Vue d'Ensemble du Système**

Votre système d'automatisation Emma En Direct fonctionne sur **3 niveaux** :

### 🎯 **Niveau 1 : Déclenchement Automatique (pg_cron)**
### 🎯 **Niveau 2 : Génération de Contenu (Vercel APIs)**  
### 🎯 **Niveau 3 : Envoi d'Emails (Resend)**

---

## 🕐 **HORAIRES AUTOMATIQUES**

| Briefing | Heure EST | Heure UTC | Cron Expression |
|----------|-----------|-----------|-----------------|
| **🌅 Morning** | 8h00 | 13h00 | `0 13 * * 1-5` |
| **☀️ Noon** | 12h00 | 17h00 | `0 17 * * 1-5` |
| **🌇 Close** | 16h30 | 21h30 | `30 21 * * 1-5` |

**Note :** Lundi à Vendredi uniquement (jours ouvrés)

---

## 🔄 **FLUX COMPLET D'AUTOMATISATION**

### **ÉTAPE 1 : DÉCLENCHEMENT (Supabase pg_cron)**
```
🕐 8h00 EST → pg_cron déclenche → send_morning_briefing_direct()
🕐 12h00 EST → pg_cron déclenche → send_noon_briefing_direct()  
🕐 16h30 EST → pg_cron déclenche → send_close_briefing_direct()
```

### **ÉTAPE 2 : GÉNÉRATION (Vercel APIs)**
Chaque fonction Supabase appelle votre API Vercel :

```javascript
// Dans Supabase
SELECT send_morning_briefing_direct();

// Cette fonction fait :
1. Récupère la config (clés API, email destinataire)
2. Appelle https://gobapps.com/api/ai-services
3. Génère le briefing complet
4. Envoie l'email via Resend
5. Sauvegarde dans Supabase
```

### **ÉTAPE 3 : COLLECTE DE DONNÉES (Sources par défaut)**
Votre API Vercel collecte les données depuis :

#### 📊 **Données de Marché (Yahoo Finance par défaut)**
- **Source :** `yahoo` (Yahoo Finance)
- **Alternative :** `apis` (FMP, Alpha Vantage, etc.)
- **Données :** Prix, volumes, indices, devises, commodities

#### 📰 **Actualités (Perplexity par défaut)**
- **Source :** `perplexity` 
- **Alternative :** `marketaux`, `twelve-data`
- **Données :** Nouvelles financières, analyses, événements

#### 🤖 **Analyse IA (OpenAI par défaut)**
- **Source :** `openai` (GPT-4)
- **Alternative :** `anthropic` (Claude-3-Sonnet)
- **Données :** Analyse complète, recommandations, insights

### **ÉTAPE 4 : ENRICHISSEMENT EXPERT EMMA**
Votre système enrichit automatiquement avec :

#### 🏛️ **Modules Expert Emma**
- **Yield Curves** : Courbes de taux US/CA
- **Forex Detailed** : Devises vs USD/CAD
- **Volatility Advanced** : VIX, MOVE Index
- **Commodities** : WTI, Or, Cuivre, Argent
- **Tickers News** : Nouvelles des 26 tickers + Watchlist Dan

#### 📈 **Données Watchlist**
- **26 Tickers principaux** (GOOGL, T, BNS, TD, etc.)
- **Watchlist Dan** (tickers personnalisés)
- **Earnings Calendar** : Résultats à venir
- **Dividends** : Dividendes à venir

### **ÉTAPE 5 : GÉNÉRATION DU BRIEFING**
L'IA génère un briefing complet avec :

#### 📝 **Structure du Briefing**
1. **En-tête Emma En Direct** avec logo et date
2. **Résumé exécutif** des marchés
3. **Données de marché** (indices, devises, commodities)
4. **Top nouvelles** par ticker
5. **Analyse sectorielle** et recommandations
6. **Agenda économique** du jour/suivant
7. **Disclaimer Beta** et informations légales

### **ÉTAPE 6 : ENVOI EMAIL (Resend)**
- **Expéditeur :** Emma En Direct <nonboarding@resend.dev>
- **Destinataire :** projetsjsl@gmail.com
- **Format :** HTML responsive
- **Tags :** Type de briefing, ID, timestamp

### **ÉTAPE 7 : SAUVEGARDE (Supabase)**
- **Table :** `briefings`
- **Statut :** `sent`, `failed`, `generated`
- **Métadonnées :** Timestamp, email response, erreurs

---

## 🛠️ **CONFIGURATION ACTUELLE**

### **✅ Supabase (Base de données)**
```sql
-- Tables créées
briefings (stockage des briefings)
briefing_config (configuration)
briefing_subscribers (abonnés)

-- Fonctions créées
send_morning_briefing_direct()
send_noon_briefing_direct() 
send_close_briefing_direct()

-- Cron jobs actifs
emma-morning-direct (8h00 EST)
emma-noon-direct (12h00 EST)
emma-close-direct (16h30 EST)
```

### **✅ Vercel (APIs)**
```javascript
// Endpoints utilisés
/api/ai-services (génération briefings)
/api/marketdata (données marché)
/api/health-check-simple (diagnostic)

// Configuration
URL: https://gobapps.com
Sources par défaut: Yahoo Finance, Perplexity, OpenAI
```

### **✅ Resend (Emails)**
```javascript
// Configuration
API Key: re_XeAhe3ju_PAnnuMx3kmhgPKnDff8PatR6
From: Emma En Direct <nonboarding@resend.dev>
To: projetsjsl@gmail.com
```

---

## 📊 **MONITORING ET LOGS**

### **🔍 Logs Complets**
- **Localisation :** Dashboard → Onglet Email Briefings → "Voir Log Complet"
- **Contenu :** Chaque étape, prompts utilisés, réponses API, erreurs
- **Temps réel :** Mise à jour automatique pendant la génération

### **📈 Diagnostic APIs**
- **Localisation :** Dashboard → "🔍 Vérifier APIs"
- **Contenu :** Statut de tous les endpoints, temps de réponse, erreurs
- **Détails :** Sous-APIs, dépendances, clés API requises

### **📋 Historique Briefings**
- **Localisation :** Dashboard → Section "Historique"
- **Contenu :** Tous les briefings générés, statuts, timestamps
- **Actions :** Prévisualisation, renvoi, suppression

---

## 🚨 **GESTION D'ERREURS**

### **🔄 Retry Automatique**
- **Échec API :** Retry avec fallback
- **Échec email :** Retry avec délai
- **Échec complet :** Log d'erreur détaillé

### **📧 Notifications d'Erreur**
- **Logs Supabase :** Erreurs enregistrées
- **Dashboard :** Affichage en temps réel
- **Email :** Pas de notification automatique (à configurer)

### **🛠️ Dépannage**
```sql
-- Vérifier les cron jobs
SELECT * FROM cron.job WHERE jobname LIKE 'emma-%';

-- Voir les briefings échoués
SELECT * FROM briefings WHERE status = 'failed' ORDER BY generated_at DESC;

-- Tester manuellement
SELECT send_morning_briefing_direct();
```

---

## 🎛️ **PERSONNALISATION**

### **📅 Modifier les Horaires**
```sql
-- Changer l'heure du briefing matinal (ex: 7h30 EST = 12h30 UTC)
SELECT cron.unschedule('emma-morning-direct');
SELECT cron.schedule('emma-morning-direct', '30 12 * * 1-5', 'SELECT send_morning_briefing_direct();');
```

### **📧 Ajouter des Destinataires**
```sql
-- Ajouter un abonné
INSERT INTO briefing_subscribers (email, name, preferences) 
VALUES ('nouveau@email.com', 'Nom', '{"morning": true, "noon": false, "close": true}');
```

### **🔧 Changer les Sources API**
Dans le dashboard, section "Sélection des Sources API" :
- **Données de Marché :** Yahoo Finance ↔ APIs professionnelles
- **Actualités :** Perplexity ↔ Marketaux ↔ Twelve Data  
- **Analyse IA :** OpenAI ↔ Anthropic

---

## 🚀 **PROCHAINES ÉTAPES RECOMMANDÉES**

### **1. Test Complet**
```sql
-- Tester tous les briefings
SELECT send_morning_briefing_direct();
SELECT send_noon_briefing_direct();
SELECT send_close_briefing_direct();
```

### **2. Monitoring**
- Vérifier les logs Supabase
- Surveiller les emails reçus
- Contrôler les performances APIs

### **3. Optimisation**
- Ajuster les horaires selon vos besoins
- Ajouter des destinataires
- Personnaliser les prompts

### **4. Extension (Optionnel)**
- Intégration n8n pour workflows avancés
- Notifications Slack/Discord
- Dashboard de monitoring externe

---

## ❓ **QUESTIONS FRÉQUENTES**

### **Q: Comment savoir si l'automatisation fonctionne ?**
**R:** Vérifiez les emails reçus aux heures programmées + logs Supabase

### **Q: Que se passe-t-il si une API est en panne ?**
**R:** Le système utilise des fallbacks automatiques + logs d'erreur détaillés

### **Q: Puis-je modifier les prompts ?**
**R:** Oui, dans le code des prompts (section `prompts` du dashboard)

### **Q: Comment arrêter l'automatisation ?**
**R:** Désactivez les cron jobs dans Supabase ou supprimez-les

### **Q: Puis-je ajouter d'autres types de briefings ?**
**R:** Oui, créez de nouvelles fonctions et cron jobs

---

## 🎯 **RÉSUMÉ SIMPLE**

**Votre système fonctionne comme ceci :**

1. **🕐 Horloge Supabase** déclenche automatiquement 3x/jour
2. **📡 API Vercel** collecte les données (Yahoo, Perplexity, OpenAI)  
3. **🤖 IA** génère le briefing complet avec analyse
4. **📧 Resend** envoie l'email à votre adresse
5. **💾 Supabase** sauvegarde tout pour l'historique

**C'est tout ! Votre briefing Emma En Direct arrive automatiquement dans votre boîte email 3 fois par jour.** 🎉

---

*Dernière mise à jour : 15 octobre 2025*
