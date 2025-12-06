# 🚀 Démarrage Rapide - Solution Complète

## ⚡ Installation en 3 Minutes

### Étape 1 : Installer l'Application Web (1 minute)

```bash
cd webapp_code
npm install
cp env.example .env
npm start
```

✅ Le serveur démarre sur `http://localhost:5000`

### Étape 2 : Tester l'API (30 secondes)

Ouvrir un nouveau terminal et tester :

```bash
# Vérifier que le serveur fonctionne
curl http://localhost:5000/api/health

# Récupérer les données sectorielles
curl http://localhost:5000/api/sector

# Calculer la performance MSCI World (horizon B)
curl "http://localhost:5000/api/index?name=msci_world&horizon=B"
```

### Étape 3 : Configurer Excel (1 minute)

#### Option A : Excel Desktop (Macro VBA)

1. Ouvrir Excel
2. `Alt+F11` → `Insert > Module`
3. Coller le contenu de `UpdateIndices.bas`
4. Télécharger `JsonConverter.bas` depuis [VBA-JSON](https://github.com/VBA-tools/VBA-JSON)
5. `Insert > Module` → Coller `JsonConverter.bas`
6. `Tools > References` → Cocher "Microsoft XML, v6.0"

#### Option B : Excel Online (Script TypeScript)

1. Ouvrir Excel Online
2. `Automatisation > Nouveau script`
3. Coller le contenu de `UpdateIndicesScript.ts`
4. Enregistrer

### Étape 4 : Créer le Classeur Excel

#### Option A : Générer un Template

```bash
npm install exceljs  # Si pas déjà installé
npm run generate-excel
```

Cela crée `Index_Sector_Dashboard_Template.xlsx` avec la structure de base.

#### Option B : Utiliser votre Classeur Existant

Suivre les instructions dans `INTEGRATION_EXCEL_EXISTANT.md`

### Étape 5 : Configurer le Classeur

1. Ouvrir le classeur Excel
2. Aller dans l'onglet `Parameters`
3. Cellule **B1** : `http://localhost:5000` (ou l'URL de votre serveur)
4. Cellule **B3** : Sélectionner un horizon (A, B, C, D, E, F, G, H, I, ou J)

### Étape 6 : Mettre à Jour les Données

#### Excel Desktop
- `Alt+F8` → Sélectionner `UpdateIndices` → Exécuter
- OU cliquer sur le bouton "Mettre à jour" (si configuré)

#### Excel Online
- `Automatisation > Scripts` → `UpdateIndicesScript` → `Exécuter`

✅ Les données sont maintenant à jour !

## 📊 Structure des Données

### Endpoints Disponibles

| Endpoint | Description | Exemple |
|----------|-------------|---------|
| `GET /api/health` | Vérifier l'état du serveur | `curl http://localhost:5000/api/health` |
| `GET /api/sector` | Données sectorielles brutes | `curl http://localhost:5000/api/sector` |
| `GET /api/index?name=msci_world&horizon=B` | Performance pondérée | `curl "http://localhost:5000/api/index?name=msci_world&horizon=B"` |

### Horizons Temporels

| Horizon | Description |
|---------|-------------|
| A | Real-Time Performance |
| B | 1 Day Performance |
| C | 5 Day Performance |
| D | 1 Month Performance |
| E | 3 Month Performance |
| F | Year-to-Date (YTD) Performance |
| G | 1 Year Performance |
| H | 3 Year Performance |
| I | 5 Year Performance |
| J | 10 Year Performance |

## 🔧 Configuration Avancée

### Changer le Port du Serveur

Modifier `.env` :
```env
PORT=8080
```

### Changer la Clé API Alpha Vantage

Modifier `.env` :
```env
ALPHA_VANTAGE_API_KEY=VOTRE_CLE_API
```

### Déployer sur un Réseau d'Entreprise

1. Modifier `server.js` ligne 330 :
   ```javascript
   app.listen(PORT, '0.0.0.0', () => {
   ```

2. Configurer le pare-feu pour autoriser le port

3. Mettre à jour l'URL dans Excel : `http://IP_SERVEUR:5000`

Voir `docs/DEPLOYMENT.md` pour plus de détails.

## 🐛 Problèmes Courants

### Le serveur ne démarre pas

**Erreur :** `Port already in use`

**Solution :**
```bash
# Trouver le processus utilisant le port
lsof -i :5000
# Tuer le processus
kill -9 <PID>
# OU changer le port dans .env
```

### Excel ne peut pas se connecter

**Vérifications :**
1. Le serveur est démarré ? `curl http://localhost:5000/api/health`
2. L'URL dans Parameters!B1 est correcte ?
3. Le pare-feu bloque la connexion ?

### Erreur VBA "User-defined type not defined"

**Solution :**
1. Vérifier que "Microsoft XML, v6.0" est ajouté dans References
2. Vérifier que JsonConverter.bas est importé

### Les données ne se mettent pas à jour

**Vérifications :**
1. Vérifier les logs du serveur
2. Tester l'API directement : `curl http://localhost:5000/api/sector`
3. Vérifier les messages d'erreur dans Excel

## 📚 Documentation Complète

- `README.md` : Vue d'ensemble complète
- `INSTALLATION.md` : Guide d'installation détaillé
- `docs/EXCEL_SETUP.md` : Configuration Excel complète
- `docs/DEPLOYMENT.md` : Déploiement en production
- `INTEGRATION_EXCEL_EXISTANT.md` : Intégration avec classeur existant
- `RESUME_SOLUTION.md` : Résumé de tous les livrables

## ✅ Checklist de Vérification

- [ ] Node.js 18+ installé
- [ ] Dépendances installées (`npm install`)
- [ ] Serveur démarré (`npm start`)
- [ ] API testée (`curl http://localhost:5000/api/health`)
- [ ] Classeur Excel créé ou existant configuré
- [ ] Macro VBA ou script TypeScript importé
- [ ] URL du serveur configurée dans Excel
- [ ] Données mises à jour avec succès

## 🎉 C'est Prêt !

Votre solution est maintenant opérationnelle. Vous pouvez :

1. ✅ Récupérer les données sectorielles depuis Alpha Vantage
2. ✅ Calculer les performances pondérées pour MSCI World et S&P/TSX
3. ✅ Mettre à jour automatiquement votre classeur Excel
4. ✅ Visualiser les performances dans le Dashboard

**Prochaine étape :** Consulter `README.md` pour les fonctionnalités avancées !





