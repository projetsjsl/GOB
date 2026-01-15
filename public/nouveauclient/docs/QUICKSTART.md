#  DEMARRAGE RAPIDE - 3 ETAPES

##  En 5 Minutes, Vous Avez une App Complete!

### ETAPE 1 : Telecharger les Fichiers

Creez cette structure exacte:

```
collecteur/
 public/
     index.html
     app.html
     admin.html
     app-logic.js
     admin-logic.js
     data/
         users.json (vide: [])
         config.json (vide: {})
         clients.json (vide: [])
```

**Copier-coller chaque fichier .html et .js fourni dans le dossier `public/`**

### ETAPE 2 : Lancer le Serveur

Ouvrez un terminal dans le dossier `collecteur/` et executez:

** Recommande - Python 3:**
```bash
python -m http.server 8000
```

**Ou - Node.js:**
```bash
npx http-server public -p 8000
```

**Ou - VS Code:**
- Installez extension "Live Server"
- Clic droit sur `public/index.html`
- "Open with Live Server"

### ETAPE 3 : Accedez a l'App

Ouvrez le navigateur:
```
http://localhost:8000/public/index.html
```

---

##  Se Connecter

### Admin (Configuration)
```
Utilisateur: admin
Mot de passe: admin123
```

### Adjointe (Collecte)
```
Utilisateur: user
Mot de passe: user123
```

---

##  Checklist de Verification

- [ ]  Python/Node installe sur l'ordi
- [ ]  Fichiers HTML/JS dans le dossier `public/`
- [ ]  Serveur local lance (port 8000)
- [ ]  Navigateur ouvert sur `http://localhost:8000/public/index.html`
- [ ]  Connexion avec admin/admin123
- [ ]  Formulaire remplissable
- [ ]  Export Excel fonctionne

---

##  La Magie: 3 Etapes Visuelles

### Etape 1: Identite
```
Nom, Prenom, Email, Telephone, Adresse
```

### Etape 2: Situation
```
Etat Civil, Date, Emploi, Conjoint
```

### Etape 3: Finances
```
Revenu, Actifs, Horizon, Tolerance Risque
```

### Etape 4: Recapitulatif
```
Voir tout + Exporter Excel/PDF + Nouveau Client
```

---

##  Ou Sont Stockees les Donnees?

**Navigateur > localStorage** (donnees restent sur l'ordi)
```
- users.json -> Comptes utilisateurs
- config.json -> Configuration
- clients.json -> Dossiers collectes
```

 Donnees stockees LOCALEMENT au navigateur
 Parfait pour usage solo ou adjointe

---

##  Admin - Les 6 Sections

1. ** Dashboard** - Vue d'ensemble
2. ** Utilisateurs** - Creer comptes
3. ** Champs** - Ajouter/modifier
4. ** Templates** - Excel/PDF config
5. ** Clients** - Liste dossiers
6. ** Import/Export** - Backup/Restauration

---

##  Couleurs (Ultra-Creatives!)

| Element | Couleur | Usage |
|---------|---------|-------|
| Header & Boutons | Teal #208C8E | Primaire |
| Hover | Teal Clair #32B8C6 | Surbrillance |
| Accents | Orange #E67F61 | Secondary |
| Succes | Vert #15804D | Validation |
| Fond | Creme #FFFBF5 | Arriere-plan |
| Texte | Charcoal #1F2121 | Principal |

---

##  Export & Import

 **Export Excel** - Telecharge CSV avec toutes donnees
 **Export PDF** - Format texte signable avec champs
 **Import Config** - Charger fichier JSON
 **Export Global** - Sauvegarde complete ZIP

---

##  Pour Votre Adjointe

Donnez-lui ces instructions simples:

1. Ouvrez `http://localhost:8000/public/index.html`
2. Connectez-vous avec son compte
3. Remplissez les 3 etapes (auto-sauvegarde )
4. Cliquez sur "Exporter Excel"
5. Fichier telecharge!

**C'est tout!** Pas de technique requise.

---

##  Premiere Fois: Admin

1. Connectez-vous `admin` / `admin123`
2. Allez a " Gestion Utilisateurs"
3. Creez un compte pour votre adjointe
4. Elle peut se connecter et utiliser!

---

##  Ca Ne Marche Pas?

### Erreur: "Impossible de se connecter"
```javascript
// Dans la console (F12)
localStorage.clear();
location.reload();
```

### Export ne fonctionne pas
- Verifiez permissions telechargement navigateur
- Essayez Chrome au lieu de Safari

### Donnees ne se sauvegardent pas
- F12 > Console > Verifiez localStorage active
- Essayez mode prive/incognito

---

##  Qui Peut Utiliser?

 **Admin** - Parametrage, gestion utilisateurs
 **Adjointe** - Remplissage formulaires, export
 **Portable** - Oui, sur WiFi local!
 **Sans Internet** - Oui, 100% local!

---

##  Vous Etes Pret!

La plupart des utilisateurs commencent directement sans formation.

**L'interface est intuitive.**

Bonne collecte de donnees! 