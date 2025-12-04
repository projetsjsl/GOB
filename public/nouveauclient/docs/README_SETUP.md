# 📊 Collecteur de Données Financières - Guide de Déploiement

## 🚀 Installation Ultra-Rapide

### Étape 1 : Structure de Dossiers
```
votre_projet/
├── public/
│   ├── index.html (page d'accueil - créée)
│   ├── app.html (application principale)
│   ├── data/
│   │   ├── users.json (utilisateurs + mots de passe)
│   │   ├── clients.json (données collectées)
│   │   └── config.json (configuration admin)
│   └── assets/
│       └── logo.svg (optionnel)
└── README_SETUP.md (ce fichier)
```

### Étape 2 : Démarrer un Serveur Local
Ouvrez terminal dans le dossier du projet et lancez :

**Option A - Python 3:**
```bash
python -m http.server 8000
```

**Option B - Node.js:**
```bash
npx http-server
```

**Option C - Live Server (VS Code):**
- Installez l'extension "Live Server"
- Clic droit sur `index.html` → "Open with Live Server"

### Étape 3 : Accéder à l'Application
- Ouvrez votre navigateur : `http://localhost:8000`
- Première connexion :
  - **Utilisateur** : `admin`
  - **Mot de passe** : `admin123`

---

## 📱 Utilisation

### 👤 Adjointe - Mode Collecte
1. Se connecter avec ses identifiants
2. Remplir les 3 étapes du formulaire
3. Les données sauvegardent automatiquement (localStorage)
4. Exporter en Excel ou PDF depuis la page récapulative

### 🔧 Admin - Mode Paramétrage
1. Se connecter en tant qu'admin
2. Accéder à "Gestion Admin" depuis le menu
3. **Paramétrer les champs** : ajouter/modifier/supprimer
4. **Gérer les utilisateurs** : créer des comptes, réinitialiser mots de passe
5. **Configurer les modèles Excel/PDF** : noms, ordre, visibilité
6. **Importer/Exporter** les configurations

---

## 🔐 Sécurité

- ⚠️ **ATTENTION** : Les mots de passe sont stockés en clair (dev) - cryptez-les en production
- Les données restent en local (localStorage) - à intégrer dans une vraie BDD
- HTTPS recommandé pour déploiement production

---

## 📋 Champs Collectés (Paramétrable)

Le système collecte automatiquement :
- **Identité** : Nom, Prénom, État civil, Adresse, NAS, Date de naissance
- **Contact** : Téléphone, Email, Adresse courriel
- **Emploi** : Poste, Employeur, Adresse employeur
- **Conjoint** : Nom, Prénom, Emploi, Employeur
- **Famille** : Nombre d'enfants à charge
- **Assurance** : Numéros REER/RRQ, dates de naissance
- **Finances** : Revenu annuel, Actifs (immobilier, liquide), Placement horizon, Tolérance au risque
- **Placements** : Modèles, Frais de gestion, Montant du transfert, Code représentant
- **Comptabilité** : Nom comptable, Contact comptable

---

## 🎯 Fonctionnalités Principales

| Fonction | Description |
|----------|-------------|
| **3 Étapes Visual** | Navigation intuitive avec progress bar |
| **Sauvegarde Auto** | LocalStorage + option export immédiat |
| **Export Excel** | Colonnes paramétrables, format professionnel |
| **PDF Dynamique** | Template ultra-customizable par admin |
| **Import Données** | Importer fichiers Excel/JSON |
| **Gestion Admin** | Créer utilisateurs, modifier champs, tester exports |
| **Multi-langue** | Interface FR/EN (extensible) |

---

## 🎨 Couleurs Utilisées

Palette créative basée sur votre schéma :
- **Primaire** : Teal/Vert (modernité)
- **Accent** : Teal clair (appels à l'action)
- **Fond** : Crème légère (convivialité)
- **Texte** : Charcoal (lisibilité)
- **Succès** : Vert émeraude
- **Alerte** : Orange/Rouge

---

## 🔗 Lien de Production

Une fois déployé sur serveur (Vercel, Netlify, etc.) :
```
https://votre-domaine.com/public/index.html
```

---

## 📞 Support

Vérifiez la console du navigateur (F12) pour les logs de debug.
Tous les fichiers JSON sont editable manuellement pour corrections rapides.
