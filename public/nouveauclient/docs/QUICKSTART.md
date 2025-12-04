# ⚡ DÉMARRAGE RAPIDE - 3 ÉTAPES

## 🎯 En 5 Minutes, Vous Avez une App Complète!

### ÉTAPE 1️⃣ : Télécharger les Fichiers

Créez cette structure exacte:

```
collecteur/
└── public/
    ├── index.html
    ├── app.html
    ├── admin.html
    ├── app-logic.js
    ├── admin-logic.js
    └── data/
        ├── users.json (vide: [])
        ├── config.json (vide: {})
        └── clients.json (vide: [])
```

**Copier-coller chaque fichier .html et .js fourni dans le dossier `public/`**

### ÉTAPE 2️⃣ : Lancer le Serveur

Ouvrez un terminal dans le dossier `collecteur/` et exécutez:

**✅ Recommandé - Python 3:**
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

### ÉTAPE 3️⃣ : Accédez à l'App

Ouvrez le navigateur:
```
http://localhost:8000/public/index.html
```

---

## 🔓 Se Connecter

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

## 📋 Checklist de Vérification

- [ ] ✅ Python/Node installé sur l'ordi
- [ ] ✅ Fichiers HTML/JS dans le dossier `public/`
- [ ] ✅ Serveur local lancé (port 8000)
- [ ] ✅ Navigateur ouvert sur `http://localhost:8000/public/index.html`
- [ ] ✅ Connexion avec admin/admin123
- [ ] ✅ Formulaire remplissable
- [ ] ✅ Export Excel fonctionne

---

## 🎨 La Magie: 3 Étapes Visuelles

### Étape 1: Identité
```
Nom, Prénom, Email, Téléphone, Adresse
```

### Étape 2: Situation
```
État Civil, Date, Emploi, Conjoint
```

### Étape 3: Finances
```
Revenu, Actifs, Horizon, Tolérance Risque
```

### Étape 4: Récapitulatif
```
Voir tout + Exporter Excel/PDF + Nouveau Client
```

---

## 💾 Où Sont Stockées les Données?

**Navigateur > localStorage** (données restent sur l'ordi)
```
- users.json → Comptes utilisateurs
- config.json → Configuration
- clients.json → Dossiers collectés
```

⚠️ Données stockées LOCALEMENT au navigateur
✅ Parfait pour usage solo ou adjointe

---

## 🔧 Admin - Les 6 Sections

1. **📊 Dashboard** - Vue d'ensemble
2. **👥 Utilisateurs** - Créer comptes
3. **📝 Champs** - Ajouter/modifier
4. **📋 Templates** - Excel/PDF config
5. **📁 Clients** - Liste dossiers
6. **📤 Import/Export** - Backup/Restauration

---

## 🎨 Couleurs (Ultra-Créatives!)

| Élément | Couleur | Usage |
|---------|---------|-------|
| Header & Boutons | Teal #208C8E | Primaire |
| Hover | Teal Clair #32B8C6 | Surbrillance |
| Accents | Orange #E67F61 | Secondary |
| Succès | Vert #15804D | Validation |
| Fond | Crème #FFFBF5 | Arrière-plan |
| Texte | Charcoal #1F2121 | Principal |

---

## 📊 Export & Import

✅ **Export Excel** - Télécharge CSV avec toutes données
✅ **Export PDF** - Format texte signable avec champs
✅ **Import Config** - Charger fichier JSON
✅ **Export Global** - Sauvegarde complète ZIP

---

## 🚀 Pour Votre Adjointe

Donnez-lui ces instructions simples:

1. Ouvrez `http://localhost:8000/public/index.html`
2. Connectez-vous avec son compte
3. Remplissez les 3 étapes (auto-sauvegarde ✓)
4. Cliquez sur "Exporter Excel"
5. Fichier téléchargé!

**C'est tout!** Pas de technique requise.

---

## 🔐 Première Fois: Admin

1. Connectez-vous `admin` / `admin123`
2. Allez à "👥 Gestion Utilisateurs"
3. Créez un compte pour votre adjointe
4. Elle peut se connecter et utiliser!

---

## 🐛 Ça Ne Marche Pas?

### Erreur: "Impossible de se connecter"
```javascript
// Dans la console (F12)
localStorage.clear();
location.reload();
```

### Export ne fonctionne pas
- Vérifiez permissions téléchargement navigateur
- Essayez Chrome au lieu de Safari

### Données ne se sauvegardent pas
- F12 > Console > Vérifiez localStorage activé
- Essayez mode privé/incognito

---

## 📞 Qui Peut Utiliser?

✅ **Admin** - Paramétrage, gestion utilisateurs
✅ **Adjointe** - Remplissage formulaires, export
✅ **Portable** - Oui, sur WiFi local!
✅ **Sans Internet** - Oui, 100% local!

---

## 🎉 Vous Êtes Prêt!

La plupart des utilisateurs commencent directement sans formation.

**L'interface est intuitive.**

Bonne collecte de données! 🚀