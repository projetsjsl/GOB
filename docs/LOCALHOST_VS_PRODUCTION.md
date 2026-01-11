# Localhost vs Production - Configuration des APIs

## 📋 Résumé

Explication des différences entre localhost et production concernant la récupération des données.

## 🔍 Problème Identifié

En **localhost**, l'application ne peut pas récupérer les données car :

1. **APIs Backend non disponibles** : Les endpoints `/api/admin/tickers`, `/api/team-tickers`, etc. nécessitent un serveur backend qui tourne sur le port 3000
2. **Proxy Vite** : Le `vite.config.ts` configure un proxy vers `http://localhost:3000`, mais si le serveur backend n'est pas démarré, les appels échouent
3. **Supabase** : Même si Supabase est configuré, les APIs backend sont nécessaires pour charger la liste des tickers

## ✅ En Production (Vercel)

En production, tout fonctionne car :
- Les APIs backend sont déployées sur Vercel
- Les endpoints `/api/*` sont disponibles
- Supabase est accessible
- Les données se chargent correctement

## 🔧 Configuration Actuelle

### Vite Config (public/3p1/vite.config.ts)
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
  }
}
```

### APIs Tentées (dans l'ordre)
1. `/api/admin/tickers` (priorité)
2. `/api/team-tickers` (fallback 1)
3. `/api/tickers-config` (fallback 2)

Toutes échouent en localhost si le serveur backend n'est pas démarré.

## 💡 Solution Implémentée

### ✅ Fallback Supabase Direct (Implémenté)

Un fallback a été ajouté dans `tickersApi.ts` pour utiliser Supabase directement depuis le client si :
1. On est en localhost
2. Toutes les APIs backend ont échoué

**Ordre de tentative :**
1. `/api/admin/tickers` (priorité)
2. `/api/team-tickers` (fallback 1)
3. `/api/tickers-config` (fallback 2)
4. **Supabase direct depuis le client** (fallback 3 - localhost uniquement)

Cela permet de charger les tickers même sans serveur backend en localhost.

## 🔧 Autres Solutions Possibles

### Option 1: Démarrer le serveur backend (Recommandé pour développement complet)
```bash
# Démarrer le serveur backend sur le port 3000
# (selon votre configuration de serveur)
```

### Option 2: Mode développement avec données mockées
Créer un mode développement qui utilise des données mockées si les APIs ne sont pas disponibles.

## 📝 Note

**C'est normal que les données ne se chargent pas en localhost** si le serveur backend n'est pas démarré. En production, tout fonctionne car les APIs sont déployées.

## ✅ Vérification

Pour vérifier si c'est normal :
1. Vérifier que le serveur backend tourne sur le port 3000
2. Tester les endpoints directement : `http://localhost:3000/api/admin/tickers`
3. Si les endpoints répondent, l'application devrait fonctionner
4. Sinon, c'est normal que les données ne se chargent pas en localhost
