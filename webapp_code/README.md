# 📊 Solution Complète - Analyse des Performances Sectorielles

Cette solution permet de récupérer et d'analyser les performances sectorielles des indices S&P 500, MSCI World et S&P/TSX en utilisant l'API Alpha Vantage SECTOR, via une application web intermédiaire pour contourner les restrictions réseau.

## 🏗️ Architecture

```
Excel (Desktop/Online)
    ↓
Application Web Intermédiaire (Node.js/Express)
    ↓
API Alpha Vantage SECTOR
```

## 📁 Structure des Fichiers

```
webapp_code/
├── server.js                 # Application web Express
├── package.json              # Dépendances Node.js
├── .env.example              # Exemple de configuration
├── UpdateIndices.bas         # Macro VBA pour Excel Desktop
├── UpdateIndicesScript.ts    # Script TypeScript pour Excel Online
├── README.md                 # Cette documentation
└── docs/
    ├── EXCEL_SETUP.md        # Guide de configuration Excel
    └── DEPLOYMENT.md         # Guide de déploiement
```

## 🚀 Installation et Configuration

### 1. Application Web Intermédiaire

#### Prérequis
- Node.js 18+ installé
- Accès réseau à l'API Alpha Vantage (via l'application web)

#### Installation

```bash
cd webapp_code
npm install
```

#### Configuration

1. Copier `.env.example` vers `.env`:
```bash
cp .env.example .env
```

2. Modifier `.env` si nécessaire:
```env
ALPHA_VANTAGE_API_KEY=QGSG95SDH5SE52XS
PORT=5000
```

#### Démarrage

```bash
npm start
```

Le serveur démarre sur `http://localhost:5000` (ou le port configuré).

#### Endpoints Disponibles

- **GET `/api/sector`** : Récupère le JSON brut de l'API SECTOR
  ```bash
  curl http://localhost:5000/api/sector
  ```

- **GET `/api/index`** : Calcule la performance pondérée d'un indice
  ```bash
  curl "http://localhost:5000/api/index?name=msci_world&horizon=B"
  ```

- **GET `/api/health`** : Vérifie l'état du serveur
  ```bash
  curl http://localhost:5000/api/health
  ```

### 2. Classeur Excel

#### Structure des Onglets

1. **Parameters**
   - B1 : URL du serveur (ex: `http://localhost:5000`)
   - B2 : Date de dernière mise à jour (automatique)
   - B3 : Horizon sélectionné (liste déroulante: A, B, C, D, E, F, G, H, I, J)
   - Instructions et liens vers la macro/script

2. **RawData_SP500**
   - Colonne A : Timeframe (Rank A, Rank B, etc.)
   - Colonne B : Sector
   - Colonne C : Performance (format pourcentage)

3. **Current_SP500**
   - Ligne 1 : En-têtes des horizons (Rank A à Rank J)
   - Colonne A : Liste des secteurs
   - Matrice : Performances par secteur et horizon

4. **MSCI_World**
   - Pondérations sectorielles (juillet 2025)
   - Formules de calcul de performance pondérée

5. **SPTSX**
   - Pondérations sectorielles (31 décembre 2024)
   - Formules de calcul de performance pondérée

6. **Weighted_Performance**
   - Calculs de performance pondérée pour chaque indice
   - Utilise INDEX/MATCH pour récupérer les données de Current_SP500

7. **Dashboard**
   - Vue d'ensemble des performances des indices
   - Mise à jour automatique selon l'horizon sélectionné

#### Création du Classeur

Voir `docs/EXCEL_SETUP.md` pour les instructions détaillées de création du classeur.

### 3. Macro VBA (Excel Desktop)

#### Installation

1. Ouvrir Excel
2. Appuyer sur `Alt+F11` pour ouvrir l'éditeur VBA
3. Dans le menu : `Insert > Module`
4. Coller le contenu de `UpdateIndices.bas`
5. Télécharger et importer `JsonConverter.bas` depuis [VBA-JSON](https://github.com/VBA-tools/VBA-JSON)
6. Ajouter la référence : `Tools > References > Microsoft XML, v6.0`

#### Utilisation

1. Ouvrir le classeur Excel
2. Aller dans l'onglet `Parameters`
3. Cliquer sur le bouton "Mettre à jour" (ou exécuter la macro via `Alt+F8`)
4. Les données sont automatiquement mises à jour

### 4. Script TypeScript (Excel Online)

#### Installation

1. Ouvrir Excel Online
2. Aller dans `Automatisation > Nouveau script`
3. Coller le contenu de `UpdateIndicesScript.ts`
4. Enregistrer le script

#### Utilisation

1. Ouvrir le classeur dans Excel Online
2. Aller dans `Automatisation > Scripts`
3. Sélectionner `UpdateIndicesScript`
4. Cliquer sur `Exécuter`

## 📊 Pondérations Sectorielles

### MSCI World (juillet 2025)

| Secteur | Pondération |
|---------|-------------|
| Technologie de l'information | 26,9% |
| Financiers | 16,7% |
| Industriels | 11,4% |
| Consommation discrétionnaire | 10,1% |
| Santé | 9,12% |
| Services de communication | 8,48% |
| Consommation courante | 5,75% |
| Énergie | 3,52% |
| Matériaux | 3,15% |
| Services publics | 2,65% |
| Immobilier | 1,97% |

### S&P/TSX (31 décembre 2024)

| Secteur | Pondération |
|---------|-------------|
| Financiers | 33,0% |
| Énergie | 17,1% |
| Industriels | 12,6% |
| Technologie de l'information | 10,1% |
| Matériaux | 11,4% |
| Consommation courante | 4,0% |
| Consommation discrétionnaire | 3,3% |
| Services de communication | 2,4% |
| Immobilier | 2,0% |
| Services publics | 3,8% |
| Santé | 0,3% |

## 🔧 Configuration Réseau

### Pour un Déploiement en Réseau d'Entreprise

1. **Modifier l'URL du serveur dans Excel** :
   - Dans l'onglet `Parameters`, cellule B1
   - Remplacer `http://localhost:5000` par l'URL de votre serveur
   - Exemple : `http://monserveur:5000` ou `http://192.168.1.100:5000`

2. **Configurer le serveur pour accepter les connexions externes** :
   ```javascript
   // Dans server.js, modifier la ligne app.listen:
   app.listen(PORT, '0.0.0.0', () => {
     // Le serveur écoute sur toutes les interfaces réseau
   });
   ```

3. **Configurer le pare-feu** :
   - Autoriser le port 5000 (ou le port configuré) dans le pare-feu
   - Vérifier que le serveur est accessible depuis les machines Excel

## 📝 Utilisation avec Power Query / WEBSERVICE

### Exemple de Formule Excel

Pour récupérer la performance de l'indice MSCI World avec l'horizon B :

```excel
=WEBSERVICE("http://monserveur:5000/api/index?name=msci_world&horizon=" & ENCODEURL(Parameters!B3))
```

Pour parser le JSON et extraire la performance totale :

```excel
=VALUE(MID(WEBSERVICE("http://monserveur:5000/api/index?name=msci_world&horizon=B"), 
  FIND(""""totalPerformance"":", WEBSERVICE("http://monserveur:5000/api/index?name=msci_world&horizon=B")) + 19, 
  10))
```

## ⚠️ Limitations et Bonnes Pratiques

### Limitations de l'API Alpha Vantage

- **Quota gratuit** : 5 appels par minute, 500 par jour
- **Cache** : L'application web met en cache les données pendant 60 secondes
- **Rate limiting** : En cas de dépassement, l'API retourne une erreur

### Bonnes Pratiques

1. **Ne pas appeler l'API trop fréquemment** : Utiliser le cache de l'application web
2. **Gérer les erreurs** : Vérifier les messages d'erreur dans Excel
3. **Sauvegarder les données** : Les données sont stockées dans les onglets Excel
4. **Vérifier la connectivité** : Utiliser `/api/health` pour tester la connexion

## 🐛 Dépannage

### Le serveur ne démarre pas

- Vérifier que Node.js est installé : `node --version`
- Vérifier que le port n'est pas déjà utilisé
- Vérifier les variables d'environnement dans `.env`

### Excel ne peut pas se connecter au serveur

- Vérifier que le serveur est démarré : `curl http://localhost:5000/api/health`
- Vérifier l'URL dans l'onglet Parameters
- Vérifier les paramètres de pare-feu
- Tester la connexion depuis un navigateur

### Les données ne se mettent pas à jour

- Vérifier les logs du serveur
- Vérifier que l'API Alpha Vantage fonctionne : `curl http://localhost:5000/api/sector`
- Vérifier les erreurs dans la console Excel (F12 dans Excel Online)

### Erreur "Quota dépassé"

- Attendre quelques minutes avant de réessayer
- Vérifier le nombre d'appels dans les logs
- Utiliser une clé API différente si disponible

## 📚 Documentation Complémentaire

- `docs/EXCEL_SETUP.md` : Guide détaillé de configuration Excel
- `docs/DEPLOYMENT.md` : Guide de déploiement en production

## 📄 Licence

Ce projet est fourni tel quel, sans garantie.















