![Image](IMG_9800.jpeg)

# 📊 Collecteur Financier - Application Web Complète

## 🎯 Vue d'Ensemble

Application Web ultra-complète pour la **collecte de données d'onboarding client en finance** avec :

✅ **Page de Login** sécurisée avec 2 rôles (Admin/User)
✅ **Formulaire d'Onboarding** en 3 étapes avec sauvegarde automatique
✅ **Dashboard Admin** complet pour paramétrer tout
✅ **Export Excel et PDF** automatiques et paramétrables
✅ **Gestion des Utilisateurs** - créer/modifier/supprimer comptes
✅ **Gestion des Champs** - ajouter/modifier les champs du formulaire
✅ **Import/Export** de configurations et données
✅ **Palette de Couleurs Créative** (Teal, Orange, Crème)
✅ **100% Local** - Fonctionne en mode standalone sans build

---

## 🚀 Démarrage Ultra-Rapide

### Étape 1 : Créer la Structure

Créez un dossier `collecteur` et dedans :

```
collecteur/
├── public/
│   ├── index.html          (Page login)
│   ├── app.html            (Formulaire)
│   ├── admin.html          (Admin panel)
│   ├── app-logic.js        (Logique app)
│   ├── admin-logic.js      (Logique admin)
│   └── data/
│       ├── users.json      (Utilisateurs)
│       ├── clients.json    (Données collectées)
│       └── config.json     (Configuration)
```

### Étape 2 : Lancer le Serveur Local

**Option A - Python 3 (recommandé):**
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

### Étape 3 : Accéder à l'Application

Ouvrez votre navigateur et allez à :
```
http://localhost:8000/public/index.html
```

---

## 🔐 Identifiants de Test

### Administrateur
```
👤 Utilisateur: admin
🔑 Mot de passe: admin123
```

### Adjointe (Collectrice de Données)
```
👤 Utilisateur: user
🔑 Mot de passe: user123
```

---

## 📱 Workflow Utilisateur

### 👤 Mode Adjointe (Collectrice)

1. **Connexion**
   - Entrez `user` / `user123`
   - Accès direct au formulaire

2. **Remplir les 3 Étapes**
   - **Étape 1: Identité** - Nom, email, adresse
   - **Étape 2: Situation** - État civil, emploi, famille
   - **Étape 3: Finances** - Revenu, actifs, placements

3. **Sauvegarde Automatique**
   - Chaque modification est sauvegardée (💾 indicateur visible)
   - Données stockées localement (localStorage)

4. **Récapitulatif & Export**
   - Voir tous les champs collectés
   - Exporter en **Excel** (téléchargement CSV)
   - Exporter en **PDF** (format texte signable)
   - Créer un nouveau dossier client

### 🔧 Mode Admin (Paramétrage)

1. **Connexion**
   - Entrez `admin` / `admin123`
   - Redirection vers panneau d'administration

2. **Sections Admin Disponibles:**

   **📊 Dashboard**
   - Vue d'ensemble : nombre users, clients, champs
   - Info système, stockage utilisé, navigateur

   **👥 Gestion Utilisateurs**
   - Créer de nouveaux utilisateurs
   - Attribuer rôles (Admin/Adjointe)
   - Supprimer utilisateurs
   - Table complète avec dates de création

   **📝 Paramétrer Champs**
   - Modifier les 3 sections du formulaire
   - Ajouter/supprimer/modifier champs
   - Configurer: libellé, type (text/number/date/select/textarea), requis/optionnel
   - Changer l'ordre des champs

   **📋 Configuration Templates**
   - **Excel**: nom fichier, colonnes incluses
   - **PDF**: titre formulaire, inclure signature, sections
   - Sauvegarder configurations

   **📁 Dossiers Clients**
   - Liste tous les clients collectés
   - Voir/supprimer dossiers
   - Informations financières
   - Dates de création

   **📤 Import/Export Global**
   - Exporter tout en ZIP (users, config, clients)
   - Importer configurations JSON
   - Tester sauvegarde auto Excel
   - Gestion des fichiers

---

## 🎨 Palette de Couleurs

| Couleur | Hexadecimal | Usage |
|---------|------------|-------|
| Teal (Primaire) | #208C8E | Headers, boutons, accents |
| Teal Clair | #32B8C6 | Hover, highlights |
| Orange (Accent) | #E67F61 | Boutons secondaires, alerte |
| Vert (Succès) | #15804D | Validation, confirmation |
| Crème (Fond) | #FFFBF5 | Background principal |
| Charcoal (Texte) | #1F2121 | Texte principal |

---

## 📋 Champs Collectés par Défaut

### Section 1 : Identité
- Prénom (requis)
- Nom (requis)
- Email (requis)
- Téléphone (requis)
- Adresse (requis)
- Ville
- Province
- Code Postal

### Section 2 : Situation Personnelle
- État Civil (requis) - Sélect
- Date de Naissance (requis)
- NAS (Numéro Assurance Sociale)
- Nombre d'Enfants à Charge
- Employeur (requis)
- Titre de Poste (requis)
- Nom du Conjoint
- Employeur du Conjoint

### Section 3 : Situation Financière
- Revenu Annuel (requis)
- Revenu Conjoint
- Valeur Immobilière
- Actifs Liquides
- Horizon de Placement (requis) - Sélect
- Tolérance au Risque (requis) - Sélect
- Numéro REER
- Comptable (Nom)
- Comptable (Téléphone)
- Notes Additionnelles

---

## 💾 Données et Stockage

### LocalStorage (Navigateur)
- **users.json** : Comptes utilisateurs + mots de passe
- **config.json** : Configuration champs, templates
- **clients.json** : Données collectées
- **currentUser** : Session active
- **currentFormData** : Formulaire en cours

### Limitations Actuelles
⚠️ Les données restent LOCAL au navigateur
⚠️ Pas de synchronisation multi-appareil
⚠️ Mots de passe en CLAIR (à crypter en prod)

### Pour Production
- Intégrer une vraie BDD (PostgreSQL, MongoDB, etc.)
- Chiffrer les mots de passe (bcrypt)
- Ajouter authentification JWT
- HTTPS obligatoire
- Backup réguliers

---

## 📊 Exports

### Format Excel (CSV)
Télécharge un fichier `.csv` avec :
- En-têtes des colonnes
- Données du client
- Format compatible Excel

**Nom fichier:** `client_[NOM]_[DATE].csv`

### Format PDF (Texte)
Génère un fichier texte formaté prêt à imprimer/signer :
- Titre du formulaire
- Toutes les sections
- Espace signature
- Date de génération

**Nom fichier:** `formulaire_[NOM]_[DATE].txt`

### Sauvegarde Auto Excel
À chaque création de nouveau client, un Excel est généré automatiquement depuis l'admin.

---

## 🔄 Import/Export Configuration

### Exporter Configuration (Admin)
1. Allez à "📤 Import/Export"
2. Cliquez "📥 Exporter ZIP"
3. Télécharge JSON avec tous les settings

### Importer Configuration
1. Depuis admin, "📤 Import/Export"
2. Sélectionnez fichier JSON
3. Cliquez "📤 Importer"
4. Configuration remplacée

---

## 🔧 Customisation

### Modifier la Palette de Couleurs

Éditez le bloc CSS `:root` dans `index.html`, `app.html`, `admin.html` :

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
1. Allez à "📝 Paramétrer Champs"
2. Sélectionnez une section
3. Cliquez "+ Ajouter Champ"
4. Configurez libellé, type, requis

**Manuellement (config.json):**
```json
{
  "id": "nouveauChamp",
  "label": "Libellé Affichage",
  "type": "text|number|email|date|select|textarea",
  "required": true|false,
  "visible": true|false
}
```

### Renommer l'Application

Éditez dans `index.html` :
```html
<h1>💼 Collecteur Financier</h1>
```

Et dans `app.html` header :
```html
<h1>📊 Collecteur Financier</h1>
```

---

## 🐛 Troubleshooting

### Problème: "Impossible de se connecter"
- Vérifiez localStorage n'est pas désactivé
- Ouvrez Console (F12) pour voir les erreurs
- Réinitialisez : Supprimer localStorage + rafraîchir

### Problème: Les données ne se sauvegardent pas
- Vérifiez que localStorage est activé
- Vérifiez permissions navigateur
- Essayez une fenêtre privée/incognito

### Problème: Export Excel ne fonctionne pas
- Vérifiez permissions téléchargement
- Essayez un autre navigateur
- Vérifiez la console pour erreurs

### Problème: Oubli de mot de passe
- Admin: Modifier directement dans localStorage
- Ouvrir Console (F12), exécuter:
```javascript
let users = JSON.parse(localStorage.getItem('users'));
users[0].password = 'newpassword';
localStorage.setItem('users', JSON.stringify(users));
```

---

## 🌐 Déploiement Production

### Sur Vercel (Gratuit, Recommandé)

1. Poussez code sur GitHub
2. Allez sur vercel.com
3. Connectez repo
4. Déploiement automatique
5. URL publique disponible

⚠️ **Important**: Ne pas expose localStorage en prod, utilisez API backend!

### Sur Netlify

1. Créez un compte netlify.com
2. Connectez repo GitHub
3. Paramètres build: Command = `echo`, Directory = `public`
4. Déploiement automatique

### Sur votre serveur (Node.js)

```bash
npm install -g serve
serve -s public -l 3000
```

Accédez à `http://votreserveur.com:3000`

---

## 📞 Support et Maintenance

### Logs de Debug
Ouvrez la Console du navigateur (F12) :
```javascript
// Voir toutes les données
console.log(JSON.parse(localStorage.getItem('users')));
console.log(JSON.parse(localStorage.getItem('clients')));
console.log(JSON.parse(localStorage.getItem('config')));
```

### Réinitialiser Complètement
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

## ✨ Fonctionnalités Futures

- [ ] Intégration BDD (Firebase, Supabase)
- [ ] Authentification multi-factor
- [ ] Chiffrement des données
- [ ] Synchronisation temps réel
- [ ] Mobile app native
- [ ] Rapports automatiques
- [ ] Webhooks/API
- [ ] Intégration CRM
- [ ] Notifications par email
- [ ] Audit trail complet

---

## 📄 Licence

Utilisation interne - Tous droits réservés

---

## 🎉 Vous êtes Prêt!

Lancez votre serveur et commencez à collecter des données. Bonne chance! 🚀

**Pour toute question ou amélioration, consultez l'admin panel.**