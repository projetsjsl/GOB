![Image](IMG_9800.jpeg)

#  Collecteur Financier - Application Web Complete

##  Vue d'Ensemble

Application Web ultra-complete pour la **collecte de donnees d'onboarding client en finance** avec :

 **Page de Login** securisee avec 2 roles (Admin/User)
 **Formulaire d'Onboarding** en 3 etapes avec sauvegarde automatique
 **Dashboard Admin** complet pour parametrer tout
 **Export Excel et PDF** automatiques et parametrables
 **Gestion des Utilisateurs** - creer/modifier/supprimer comptes
 **Gestion des Champs** - ajouter/modifier les champs du formulaire
 **Import/Export** de configurations et donnees
 **Palette de Couleurs Creative** (Teal, Orange, Creme)
 **100% Local** - Fonctionne en mode standalone sans build

---

##  Demarrage Ultra-Rapide

### Etape 1 : Creer la Structure

Creez un dossier `collecteur` et dedans :

```
collecteur/
 public/
    index.html          (Page login)
    app.html            (Formulaire)
    admin.html          (Admin panel)
    app-logic.js        (Logique app)
    admin-logic.js      (Logique admin)
    data/
        users.json      (Utilisateurs)
        clients.json    (Donnees collectees)
        config.json     (Configuration)
```

### Etape 2 : Lancer le Serveur Local

**Option A - Python 3 (recommande):**
```bash
cd collecteur
python -m http.server 8000
```

**Option B - Node.js:**
```bash
cd collecteur
npx http-server
```

**Option C - VS Code + Live Server:**
- Installez l'extension "Live Server"
- Clic droit sur `index.html`
- "Open with Live Server"

### Etape 3 : Acceder a l'Application

Ouvrez votre navigateur et allez a :
```
http://localhost:8000/public/index.html
```

---

##  Identifiants de Test

### Administrateur
```
 Utilisateur: admin
 Mot de passe: admin123
```

### Adjointe (Collectrice de Donnees)
```
 Utilisateur: user
 Mot de passe: user123
```

---

##  Workflow Utilisateur

###  Mode Adjointe (Collectrice)

1. **Connexion**
   - Entrez `user` / `user123`
   - Acces direct au formulaire

2. **Remplir les 3 Etapes**
   - **Etape 1: Identite** - Nom, email, adresse
   - **Etape 2: Situation** - Etat civil, emploi, famille
   - **Etape 3: Finances** - Revenu, actifs, placements

3. **Sauvegarde Automatique**
   - Chaque modification est sauvegardee ( indicateur visible)
   - Donnees stockees localement (localStorage)

4. **Recapitulatif & Export**
   - Voir tous les champs collectes
   - Exporter en **Excel** (telechargement CSV)
   - Exporter en **PDF** (format texte signable)
   - Creer un nouveau dossier client

###  Mode Admin (Parametrage)

1. **Connexion**
   - Entrez `admin` / `admin123`
   - Redirection vers panneau d'administration

2. **Sections Admin Disponibles:**

   ** Dashboard**
   - Vue d'ensemble : nombre users, clients, champs
   - Info systeme, stockage utilise, navigateur

   ** Gestion Utilisateurs**
   - Creer de nouveaux utilisateurs
   - Attribuer roles (Admin/Adjointe)
   - Supprimer utilisateurs
   - Table complete avec dates de creation

   ** Parametrer Champs**
   - Modifier les 3 sections du formulaire
   - Ajouter/supprimer/modifier champs
   - Configurer: libelle, type (text/number/date/select/textarea), requis/optionnel
   - Changer l'ordre des champs

   ** Configuration Templates**
   - **Excel**: nom fichier, colonnes incluses
   - **PDF**: titre formulaire, inclure signature, sections
   - Sauvegarder configurations

   ** Dossiers Clients**
   - Liste tous les clients collectes
   - Voir/supprimer dossiers
   - Informations financieres
   - Dates de creation

   ** Import/Export Global**
   - Exporter tout en ZIP (users, config, clients)
   - Importer configurations JSON
   - Tester sauvegarde auto Excel
   - Gestion des fichiers

---

##  Palette de Couleurs

| Couleur | Hexadecimal | Usage |
|---------|------------|-------|
| Teal (Primaire) | #208C8E | Headers, boutons, accents |
| Teal Clair | #32B8C6 | Hover, highlights |
| Orange (Accent) | #E67F61 | Boutons secondaires, alerte |
| Vert (Succes) | #15804D | Validation, confirmation |
| Creme (Fond) | #FFFBF5 | Background principal |
| Charcoal (Texte) | #1F2121 | Texte principal |

---

##  Champs Collectes par Defaut

### Section 1 : Identite
- Prenom (requis)
- Nom (requis)
- Email (requis)
- Telephone (requis)
- Adresse (requis)
- Ville
- Province
- Code Postal

### Section 2 : Situation Personnelle
- Etat Civil (requis) - Select
- Date de Naissance (requis)
- NAS (Numero Assurance Sociale)
- Nombre d'Enfants a Charge
- Employeur (requis)
- Titre de Poste (requis)
- Nom du Conjoint
- Employeur du Conjoint

### Section 3 : Situation Financiere
- Revenu Annuel (requis)
- Revenu Conjoint
- Valeur Immobiliere
- Actifs Liquides
- Horizon de Placement (requis) - Select
- Tolerance au Risque (requis) - Select
- Numero REER
- Comptable (Nom)
- Comptable (Telephone)
- Notes Additionnelles

---

##  Donnees et Stockage

### LocalStorage (Navigateur)
- **users.json** : Comptes utilisateurs + mots de passe
- **config.json** : Configuration champs, templates
- **clients.json** : Donnees collectees
- **currentUser** : Session active
- **currentFormData** : Formulaire en cours

### Limitations Actuelles
 Les donnees restent LOCAL au navigateur
 Pas de synchronisation multi-appareil
 Mots de passe en CLAIR (a crypter en prod)

### Pour Production
- Integrer une vraie BDD (PostgreSQL, MongoDB, etc.)
- Chiffrer les mots de passe (bcrypt)
- Ajouter authentification JWT
- HTTPS obligatoire
- Backup reguliers

---

##  Exports

### Format Excel (CSV)
Telecharge un fichier `.csv` avec :
- En-tetes des colonnes
- Donnees du client
- Format compatible Excel

**Nom fichier:** `client_[NOM]_[DATE].csv`

### Format PDF (Texte)
Genere un fichier texte formate pret a imprimer/signer :
- Titre du formulaire
- Toutes les sections
- Espace signature
- Date de generation

**Nom fichier:** `formulaire_[NOM]_[DATE].txt`

### Sauvegarde Auto Excel
A chaque creation de nouveau client, un Excel est genere automatiquement depuis l'admin.

---

##  Import/Export Configuration

### Exporter Configuration (Admin)
1. Allez a " Import/Export"
2. Cliquez " Exporter ZIP"
3. Telecharge JSON avec tous les settings

### Importer Configuration
1. Depuis admin, " Import/Export"
2. Selectionnez fichier JSON
3. Cliquez " Importer"
4. Configuration remplacee

---

##  Customisation

### Modifier la Palette de Couleurs

Editez le bloc CSS `:root` dans `index.html`, `app.html`, `admin.html` :

```css
:root {
    --primary: #208C8E;        /* Changez cette couleur */
    --primary-light: #32B8C6;
    --accent-warm: #E67F61;
    --success: #15804D;
    --danger: #C0152F;
    /* ... */
}
```

### Ajouter un Nouveau Champ

**Via Admin:**
1. Allez a " Parametrer Champs"
2. Selectionnez une section
3. Cliquez "+ Ajouter Champ"
4. Configurez libelle, type, requis

**Manuellement (config.json):**
```json
{
  "id": "nouveauChamp",
  "label": "Libelle Affichage",
  "type": "text|number|email|date|select|textarea",
  "required": true|false,
  "visible": true|false
}
```

### Renommer l'Application

Editez dans `index.html` :
```html
<h1> Collecteur Financier</h1>
```

Et dans `app.html` header :
```html
<h1> Collecteur Financier</h1>
```

---

##  Troubleshooting

### Probleme: "Impossible de se connecter"
- Verifiez localStorage n'est pas desactive
- Ouvrez Console (F12) pour voir les erreurs
- Reinitialisez : Supprimer localStorage + rafraichir

### Probleme: Les donnees ne se sauvegardent pas
- Verifiez que localStorage est active
- Verifiez permissions navigateur
- Essayez une fenetre privee/incognito

### Probleme: Export Excel ne fonctionne pas
- Verifiez permissions telechargement
- Essayez un autre navigateur
- Verifiez la console pour erreurs

### Probleme: Oubli de mot de passe
- Admin: Modifier directement dans localStorage
- Ouvrir Console (F12), executer:
```javascript
let users = JSON.parse(localStorage.getItem('users'));
users[0].password = 'newpassword';
localStorage.setItem('users', JSON.stringify(users));
```

---

##  Deploiement Production

### Sur Vercel (Gratuit, Recommande)

1. Poussez code sur GitHub
2. Allez sur vercel.com
3. Connectez repo
4. Deploiement automatique
5. URL publique disponible

 **Important**: Ne pas expose localStorage en prod, utilisez API backend!

### Sur Netlify

1. Creez un compte netlify.com
2. Connectez repo GitHub
3. Parametres build: Command = `echo`, Directory = `public`
4. Deploiement automatique

### Sur votre serveur (Node.js)

```bash
npm install -g serve
serve -s public -l 3000
```

Accedez a `http://votreserveur.com:3000`

---

##  Support et Maintenance

### Logs de Debug
Ouvrez la Console du navigateur (F12) :
```javascript
// Voir toutes les donnees
console.log(JSON.parse(localStorage.getItem('users')));
console.log(JSON.parse(localStorage.getItem('clients')));
console.log(JSON.parse(localStorage.getItem('config')));
```

### Reinitialiser Completement
```javascript
localStorage.clear();
location.reload();
```

### Export Rapide des Clients
```javascript
const clients = JSON.parse(localStorage.getItem('clients'));
console.table(clients);
```

---

##  Fonctionnalites Futures

- [ ] Integration BDD (Firebase, Supabase)
- [ ] Authentification multi-factor
- [ ] Chiffrement des donnees
- [ ] Synchronisation temps reel
- [ ] Mobile app native
- [ ] Rapports automatiques
- [ ] Webhooks/API
- [ ] Integration CRM
- [ ] Notifications par email
- [ ] Audit trail complet

---

##  Licence

Utilisation interne - Tous droits reserves

---

##  Vous etes Pret!

Lancez votre serveur et commencez a collecter des donnees. Bonne chance! 

**Pour toute question ou amelioration, consultez l'admin panel.**