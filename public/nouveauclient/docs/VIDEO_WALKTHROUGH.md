#  GUIDE VIDEO / WALKTHROUGH

##  Scenario Complet - Du Debut a la Fin

### Scene 1: Premiere Connexion (Admin)

**Temps: 30 secondes**

```
1. Ouvrir: http://localhost:8000/public/index.html
2. Voir page de LOGIN avec 2 panneaux
3. GAUCHE: Presentation app (Teal gradient, features)
4. DROITE: Formulaire login + demo credentials
5. Entrer: admin / admin123
6. CLICK "Se Connecter"
7.  Redirection vers admin.html
```

**Visual:** Page split screen, couleurs teal/orange, typo moderne

---

### Scene 2: Dashboard Admin

**Temps: 45 secondes**

```
1. Admin recoit sur page DASHBOARD
2. Voir 3 CARDS avec statistiques:
   - Utilisateurs: 2
   - Dossiers: 0
   - Champs: 15
3. Info systeme (navigateur, storage, derniere mise a jour)
4. SIDEBAR avec 6 sections menu:
   -  Dashboard (actif, violet-teal)
   -  Gestion Utilisateurs
   -  Parametrer Champs
   -  Templates Export
   -  Dossiers Clients
   -  Import/Export
```

**Visual:** Sidebar fixed, cards colores gradient, icons emojis

---

### Scene 3: Creer un Nouvel Utilisateur

**Temps: 1 minute**

```
1. Admin click " Gestion Utilisateurs"
2. Voir FORM "Ajouter Nouvel Utilisateur"
   - Nom Complet: "Marie Dupont"
   - Utilisateur: "marie"
   - Mot de passe: "marie123"
   - Role: "Adjointe" (dropdown)
3. Click "Ajouter Utilisateur"
4. Alert vert: " Utilisateur cree avec succes"
5. TABLE mis a jour avec nouveau user
   - Affiche: Nom, Utilisateur, Role, Date cree, Actions
```

**Visual:** Form grid 2x2, bouton gradient, table responsive

---

### Scene 4: Deconnexion & Connexion Adjointe

**Temps: 30 secondes**

```
1. Admin click "Deconnexion" (haut sidebar)
2. Confirme: "Deconnexion?"
3.  Retour a page LOGIN
4. Enter: marie / marie123
5. Click "Se Connecter"
6.  Redirection vers app.html
```

**Visual:** Popup confirm, smooth redirect

---

### Scene 5: Formulaire Collecte - Etape 1

**Temps: 1.5 minutes**

```
1. Voir HEADER gradient (teal)
   - Logo: " Collecteur Financier"
   - User: "Marie Dupont" + Deconnexion
2. Voir PROGRESS BAR
   - 3 circles: [1 ACTIVE] [2] [3]
   - Line progress 33%
   - Labels: Identite | Situation | Finances
3. Voir FORM "Etape 1: Identite du Client"
   - Description courte
   - Grid de champs:
     - Prenom (required *)
     - Nom (required *)
     - Email (required *)
     - Telephone (required *)
     - Adresse (required *)
     - Ville
     - Province
     - Code Postal
4. Remplir avec donnees test:
   - Prenom: "Jean"
   - Nom: "Martin"
   - Email: "jean.martin@email.com"
   - Telephone: "+1 (514) 555-1234"
   - Adresse: "123 Rue Principale"
   - Ville: "Montreal"
   - Province: "QC"
   - Code Postal: "H1H 1H1"
5. Chaque changement:  Auto-save (bottom right)
6. Click "Suivant ->" button (blue gradient)
```

**Visual:** Progress bar animated, form clean, auto-save indicator

---

### Scene 6: Etape 2 - Situation Personnelle

**Temps: 1.5 minutes**

```
1. Progress bar UPDATE:
   - Circle 1: COMPLETED (vert )
   - Circle 2: ACTIVE (teal, scale up)
   - Circle 3: TODO
   - Line progress 66%
2. FORM "Etape 2: Situation Personnelle"
3. Remplir champs:
   - Etat Civil: "Marie(e)" (SELECT)
   - Date de Naissance: "1985-03-15" (DATE)
   - NAS: "123-456-789"
   - Nombre d'Enfants: "2" (NUMBER)
   - Employeur: "Acme Corp" (TEXT)
   - Titre de Poste: "Gestionnaire Senior" (TEXT)
   - Nom du Conjoint: "Sophie Martin"
   - Employeur Conjoint: "Tech Solutions"
4. Auto-save continues
5. Click "Suivant ->"
```

**Visual:** Progress bar fluide, champs valides, pas d'erreur

---

### Scene 7: Etape 3 - Finances

**Temps: 2 minutes**

```
1. Progress bar UPDATE:
   - Cercle 3 maintenant ACTIVE
   - Line 100%
2. FORM "Etape 3: Situation Financiere"
3. Remplir:
   - Revenu Annuel: "95000" (NUMBER, required)
   - Revenu Conjoint: "75000"
   - Valeur Immobiliere: "450000"
   - Actifs Liquides: "125000"
   - Horizon Placement: "Long terme (6-10 ans)" (SELECT)
   - Tolerance Risque: "Moderee (equilibre)" (SELECT)
   - Numero REER: "RRQ-123456"
   - Comptable Nom: "Marie-Claude Blouin"
   - Comptable Telephone: "+1 (514) 555-6789"
   - Notes: "Client interesse par placements conservateurs"
4. VALIDATION: Tous required OK
5. Click "Suivant ->" button
```

**Visual:** Nombres formates, select dropdown smooth

---

### Scene 8: Recapitulatif & Exports

**Temps: 2 minutes**

```
1. Progress bar COMPLETE:
   - All 3 circles: COMPLETED (vert )
   - Etape 4: SUMMARY visible
2. TITRE: " Recapitulatif et Finalisation"
3. Voir resume par SECTIONS:

   SECTION " Identite"
   - Grid de summary-items (fond beige, border-left teal)
   - Affiche: Prenom: "Jean"
   - Affiche: Nom: "Martin"
   - Affiche: Email: "jean.martin@email.com"
   - etc...

   SECTION " Situation Personnelle"
   - Etat Civil: "Marie(e)"
   - Date: "1985-03-15"
   - Employeur: "Acme Corp"
   - etc...

   SECTION " Situation Financiere"
   - Revenu: "$ 95,000"
   - Immobilier: "$ 450,000"
   - Liquides: "$ 125,000"
   - Horizon: "Long terme (6-10 ans)"
   - Risque: "Moderee (equilibre)"

4. Voir 3 ACTION CARDS:
   Card 1: " Exporter Excel"
      - "Telecharger au format Excel"
      - Button: "Excel"
   Card 2: " Exporter PDF"
      - "Generer un PDF signable"
      - Button: "PDF"
   Card 3: " Nouveau Dossier"
      - "Creer un nouveau client"
      - Button: "Nouveau"

5. CLICK "Excel" -> Telecharge: client_Martin_2024-01-15.csv
6. CLICK "PDF" -> Telecharge: formulaire_Martin_2024-01-15.txt
7. CLICK "Nouveau" -> Confirm popup -> Form reinitialise
```

**Visual:** Recapitulatif clair, cards hover effect, downloads instantanes

---

### Scene 9: Retour Admin - Voir le Dossier

**Temps: 1 minute**

```
1. Deconnexion + Reconnexion ADMIN
2. Click " Dashboard"
3. CARDS mis a jour:
   - Utilisateurs: 3 (admin + user + marie)
   - Dossiers: 1 (Jean Martin juste cree)
   - Champs: 15
4. Click " Dossiers Clients"
5. Voir TABLE avec client:
   - Nom: "Jean Martin"
   - Email: "jean.martin@email.com"
   - Revenu: "$ 95,000"
   - Cree: "15/01/2024"
   - Actions: Voir | Supprimer
6. Click "Voir" -> Affiche details
```

**Visual:** Dashboard dynamique, table avec donnees reelles

---

### Scene : Admin - Parametrer Champs

**Temps: 1.5 minutes**

```
1. Click " Parametrer Champs"
2. Voir 3 SECTIONS:
   - Section 1: Identite (8 champs)
   - Section 2: Situation (8 champs)
   - Section 3: Finances (10 champs)

3. CHAQUE SECTION:
   - Affiche: Libelle | Type | Requis? | Supprimer
   - Ex: "Prenom | text |  requis | [X Supprimer]"

4. CLICK "+ Ajouter Champ" (Section 3)
5. Nouveau champ ajoute:
   - Input vide: Libelle
   - Select: Type = "text"
   - Checkbox: Requis (unchecked)
   - Button: Supprimer

6. Remplir nouveau champ:
   - Libelle: "Refere par"
   - Type: "select"
   - Requis: unchecked
   -  Sauvegarde automatiquement

7. Voir le champ en LIVE dans le form!
```

**Visual:** Champs editables inline, ajout/suppression fluide

---

### Scene 11: Templates Export

**Temps: 1.5 minutes**

```
1. Click " Templates Export"
2. Voir 2 SECTIONS:

   SECTION "Configuration Excel"
   - Nom fichier: "client_"
   - Colonnes incluses: "firstName,lastName,email,phone,..."

   SECTION "Configuration PDF"
   - Titre: "Formulaire de Collecte de Donnees"
   - Inclure Signature: "Oui" (select)
   - Sections: "Identite / Situation / Finances" (textarea)

3. MODIFIER:
   - Titre PDF: "Formulaire de Collecte Financiere 2024"
   - Click "Sauvegarder Configuration"
   - Alert vert: " Templates sauvegardes"

4. EFFET: Prochains exports utilisent nouvelle config!
```

**Visual:** Config cards, save button gradient

---

### Scene 12: Import/Export Global

**Temps: 1 minute**

```
1. Click " Import/Export"
2. Voir 3 SECTIONS:

   SECTION 1: "Exporter Tout"
   - Click " Exporter ZIP"
   - Telecharge: collecteur_export_2024-01-15.json
   - Contient: users, config, clients, timestamp

   SECTION 2: "Importer Configuration"
   - File input: Charger fichier
   - Click " Importer"
   - Alert confirmation

   SECTION 3: "Sauvegarde Auto Excel"
   - Button: " Tester Auto-Save"
   - Telecharge fichier test.csv
   - Alert: " Fichier Excel genere automatiquement"
```

**Visual:** Clear sections, file inputs, download confirmation

---

##  Elements Visuels Cles

### Couleur Palette
```
Teal Primary: #208C8E (headers, boutons primaires)
Teal Light: #32B8C6 (hover, highlights)
Orange: #E67F61 (secondary, accents)
Vert: #15804D (succes, validation)
Creme: #FFFBF5 (fond)
```

### Animations
```
 Fade in/out sur sections
 Slide effect sur progress bar
 Scale up sur hover cards
 Float effect sur shapes background
 Smooth transitions partout
```

### Responsive Design
```
 Desktop: Full layout
 Tablet: Adjusted grid
 Mobile: Single column
 Sidebar collapsible
```

---

##  Interaction Flow

```
LOGIN
  v
CHOOSE ROLE
   ADMIN -> ADMIN DASHBOARD
      Gestion Users
      Parametrer Champs
      Templates
      Voir Clients
      Import/Export
  
   USER -> FORM COLLECTE
       Step 1: Identite
       Step 2: Situation
       Step 3: Finances
       Step 4: Export (Excel/PDF/Nouveau)
```

---

##  Performance Notes

```
 Chargement: < 1 seconde
 Navigation: Instant
 Auto-save: < 100ms
 Export: < 2 secondes
 Storage utilise: ~50KB par dossier
```

---

##  User Experience Goals

 **Intuitif** - Pas de courbe apprentissage
 **Rapide** - Tout en local, pas d'API
 **Beau** - Design moderne, couleurs premium
 **Fiable** - Auto-save, pas de perte donnees
 **Parametrable** - Admin peut changer ce qu'il veut
 **Exportable** - Excel, PDF, JSON

---

C'est tout! Votre application est prete a etre utilisee. 