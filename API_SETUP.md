# Configuration API de Données de Marché

## 🚀 Solution Permanente pour Données Boursières Temps Réel

### 📊 API Alpha Vantage (Recommandée)

**Avantages :**
- ✅ Gratuite (500 requêtes/jour)
- ✅ Données en temps réel
- ✅ Très fiable
- ✅ Pas de limite de débit stricte

**Configuration :**

1. **Obtenir une clé API gratuite :**
   - Aller sur : https://www.alphavantage.co/support/#api-key
   - S'inscrire gratuitement
   - Copier votre clé API

2. **Configurer dans Vercel :**
   ```bash
   # Dans les variables d'environnement Vercel
   ALPHA_VANTAGE_API_KEY=votre_cle_api_ici
   ```

3. **Test de l'API :**
   ```bash
   curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=VOTRE_CLE"
   ```

### 🔄 Fallback Intelligent

Si l'API n'est pas configurée ou échoue :
- ✅ Données réalistes générées automatiquement
- ✅ Basées sur les vraies valeurs actuelles
- ✅ Variations cohérentes avec la volatilité réelle
- ✅ Mise à jour toutes les 30 secondes

### 📈 Symboles Supportés

| Symbole | Description | API Alpha Vantage |
|---------|-------------|-------------------|
| SPX | S&P 500 | SPY |
| IXIC | NASDAQ | QQQ |
| DJI | Dow Jones | DIA |
| TSX | TSX Canada | EWC |
| EURUSD | EUR/USD | EURUSD |
| GOLD | Or | GLD |
| OIL | Pétrole | USO |
| BTCUSD | Bitcoin | BTC-USD |

### 🛠️ Déploiement

1. **Ajouter la clé API dans Vercel :**
   - Dashboard Vercel → Settings → Environment Variables
   - Nom : `ALPHA_VANTAGE_API_KEY`
   - Valeur : votre clé API

2. **Redéployer :**
   ```bash
   git push origin main
   ```

### 🔍 Debugging

Les logs dans la console du navigateur indiquent :
- `✅ Données réelles Alpha Vantage` = API fonctionne
- `📋 Données réalistes` = Fallback utilisé
- `❌ Erreur` = Problème de connexion

### 📞 Support

Si vous avez des problèmes :
1. Vérifiez que la clé API est correcte
2. Vérifiez les logs dans la console
3. Testez l'API directement avec curl
4. Les données de fallback sont toujours disponibles
