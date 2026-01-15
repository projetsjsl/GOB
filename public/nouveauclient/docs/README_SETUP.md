#  Collecteur de Donnees Financieres - Guide de Deploiement

##  Installation Ultra-Rapide

### Etape 1 : Structure de Dossiers
```
votre_projet/
 public/
    index.html (page d'accueil - creee)
    app.html (application principale)
    data/
       users.json (utilisateurs + mots de passe)
       clients.json (donnees collectees)
       config.json (configuration admin)
    assets/
        logo.svg (optionnel)
 README_SETUP.md (ce fichier)
```

### Etape 2 : Demarrer un Serveur Local
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
- Clic droit sur `index.html` -> "Open with Live Server"

### Etape 3 : Acceder a l'Application
- Ouvrez votre navigateur : `http://localhost:8000`
- Premiere connexion :
  - **Utilisateur** : `admin`
  - **Mot de passe** : `admin123`

---

##  Utilisation

###  Adjointe - Mode Collecte
1. Se connecter avec ses identifiants
2. Remplir les 3 etapes du formulaire
3. Les donnees sauvegardent automatiquement (localStorage)
4. Exporter en Excel ou PDF depuis la page recapulative

###  Admin - Mode Parametrage
1. Se connecter en tant qu'admin
2. Acceder a "Gestion Admin" depuis le menu
3. **Parametrer les champs** : ajouter/modifier/supprimer
4. **Gerer les utilisateurs** : creer des comptes, reinitialiser mots de passe
5. **Configurer les modeles Excel/PDF** : noms, ordre, visibilite
6. **Importer/Exporter** les configurations

---

##  Securite

-  **ATTENTION** : Les mots de passe sont stockes en clair (dev) - cryptez-les en production
- Les donnees restent en local (localStorage) - a integrer dans une vraie BDD
- HTTPS recommande pour deploiement production

---

##  Champs Collectes (Parametrable)

Le systeme collecte automatiquement :
- **Identite** : Nom, Prenom, Etat civil, Adresse, NAS, Date de naissance
- **Contact** : Telephone, Email, Adresse courriel
- **Emploi** : Poste, Employeur, Adresse employeur
- **Conjoint** : Nom, Prenom, Emploi, Employeur
- **Famille** : Nombre d'enfants a charge
- **Assurance** : Numeros REER/RRQ, dates de naissance
- **Finances** : Revenu annuel, Actifs (immobilier, liquide), Placement horizon, Tolerance au risque
- **Placements** : Modeles, Frais de gestion, Montant du transfert, Code representant
- **Comptabilite** : Nom comptable, Contact comptable

---

##  Fonctionnalites Principales

| Fonction | Description |
|----------|-------------|
| **3 Etapes Visual** | Navigation intuitive avec progress bar |
| **Sauvegarde Auto** | LocalStorage + option export immediat |
| **Export Excel** | Colonnes parametrables, format professionnel |
| **PDF Dynamique** | Template ultra-customizable par admin |
| **Import Donnees** | Importer fichiers Excel/JSON |
| **Gestion Admin** | Creer utilisateurs, modifier champs, tester exports |
| **Multi-langue** | Interface FR/EN (extensible) |

---

##  Couleurs Utilisees

Palette creative basee sur votre schema :
- **Primaire** : Teal/Vert (modernite)
- **Accent** : Teal clair (appels a l'action)
- **Fond** : Creme legere (convivialite)
- **Texte** : Charcoal (lisibilite)
- **Succes** : Vert emeraude
- **Alerte** : Orange/Rouge

---

##  Lien de Production

Une fois deploye sur serveur (Vercel, Netlify, etc.) :
```
https://votre-domaine.com/public/index.html
```

---

##  Support

Verifiez la console du navigateur (F12) pour les logs de debug.
Tous les fichiers JSON sont editable manuellement pour corrections rapides.
