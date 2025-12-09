# 📦 Guide d'Installation Rapide

## 🚀 Installation en 5 Étapes

### 1. Application Web (2 minutes)

```bash
cd webapp_code
npm install
cp .env.example .env  # Modifier si nécessaire
npm start
```

✅ Le serveur est maintenant accessible sur `http://localhost:5000`

### 2. Classeur Excel - Structure de Base

1. Créer un nouveau classeur Excel
2. Créer les onglets suivants :
   - `Parameters`
   - `RawData_SP500`
   - `Current_SP500`
   - `MSCI_World`
   - `SPTSX`
   - `Weighted_Performance`
   - `Dashboard`

3. Suivre les instructions détaillées dans `docs/EXCEL_SETUP.md`

### 3. Macro VBA (Excel Desktop)

1. Ouvrir Excel
2. `Alt+F11` pour ouvrir l'éditeur VBA
3. `Insert > Module`
4. Coller le contenu de `UpdateIndices.bas`
5. Télécharger `JsonConverter.bas` depuis [VBA-JSON](https://github.com/VBA-tools/VBA-JSON)
6. `Insert > Module` et coller `JsonConverter.bas`
7. `Tools > References > Microsoft XML, v6.0` (cocher)

✅ La macro est prête à être utilisée

### 4. Script TypeScript (Excel Online)

1. Ouvrir Excel Online
2. `Automatisation > Nouveau script`
3. Coller le contenu de `UpdateIndicesScript.ts`
4. Enregistrer

✅ Le script est prêt à être utilisé

### 5. Test de Connexion

1. Vérifier que le serveur fonctionne :
   ```bash
   curl http://localhost:5000/api/health
   ```

2. Dans Excel, mettre l'URL du serveur dans `Parameters!B1`

3. Exécuter la macro ou le script

✅ Les données devraient se mettre à jour automatiquement

## 🔧 Configuration Minimale

### Variables d'Environnement (.env)

```env
ALPHA_VANTAGE_API_KEY=QGSG95SDH5SE52XS
PORT=5000
```

### Excel - Onglet Parameters

| Cellule | Valeur |
|---------|--------|
| B1 | `http://localhost:5000` |
| B3 | `B` (ou autre horizon A-J) |

## ⚡ Démarrage Rapide

```bash
# Terminal 1: Démarrer le serveur
cd webapp_code && npm start

# Terminal 2: Tester l'API
curl http://localhost:5000/api/health
curl http://localhost:5000/api/sector
```

## 📚 Documentation Complète

- `README.md` : Vue d'ensemble
- `docs/EXCEL_SETUP.md` : Configuration Excel détaillée
- `docs/DEPLOYMENT.md` : Déploiement en production

## 🆘 Problèmes Courants

### Le serveur ne démarre pas
- Vérifier Node.js : `node --version` (doit être 18+)
- Vérifier le port : `netstat -an | grep 5000`

### Excel ne peut pas se connecter
- Vérifier que le serveur est démarré
- Vérifier l'URL dans Parameters!B1
- Tester depuis un navigateur : `http://localhost:5000/api/health`

### Erreur VBA "User-defined type not defined"
- Vérifier que la référence "Microsoft XML, v6.0" est ajoutée
- Vérifier que JsonConverter.bas est importé








