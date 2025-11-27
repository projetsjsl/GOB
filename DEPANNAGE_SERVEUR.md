# 🔧 Dépannage Serveur - ERR_CONNECTION_REFUSED

## ❌ Problème

Erreur: `ERR_CONNECTION_REFUSED` sur `http://localhost:10000`

## 🔍 Diagnostic

### 1. Vérifier si le serveur tourne

```bash
# Vérifier le processus
ps aux | grep "node server.js"

# Vérifier le port
lsof -ti:10000
```

### 2. Vérifier les logs

Si le serveur a été démarré, vérifier les logs:
```bash
cat /tmp/server.log
```

### 3. Démarrer le serveur manuellement

```bash
cd /Users/projetsjsl/Documents/GitHub/GOB
node server.js
```

**Attendez** de voir un message comme:
```
Serveur démarré sur le port 10000
```

## ✅ Solutions

### Solution 1: Démarrer le serveur dans un terminal séparé

1. Ouvrir un nouveau terminal
2. Exécuter:
   ```bash
   cd /Users/projetsjsl/Documents/GitHub/GOB
   node server.js
   ```
3. **Laisser ce terminal ouvert** (ne pas fermer)
4. Dans votre navigateur, ouvrir: `http://localhost:10000/login.html`

### Solution 2: Utiliser Vite (Alternative)

Si `server.js` ne fonctionne pas, utilisez Vite:

```bash
cd /Users/projetsjsl/Documents/GitHub/GOB
npm run dev
```

Puis ouvrir: `http://localhost:5173/login.html`

### Solution 3: Vérifier les erreurs

Si le serveur ne démarre pas, vérifier:

```bash
# Vérifier Node.js
node --version

# Vérifier les dépendances
npm list express

# Tester le serveur directement
node server.js
```

## 🐛 Erreurs Communes

### Port déjà utilisé

```bash
# Trouver le processus utilisant le port 10000
lsof -ti:10000

# Tuer le processus
kill -9 $(lsof -ti:10000)

# Redémarrer
node server.js
```

### Module non trouvé

```bash
# Installer les dépendances
npm install
```

### Erreur de syntaxe

Vérifier les logs du serveur pour les erreurs de syntaxe.

## 📝 Commandes Utiles

```bash
# Démarrer le serveur
cd /Users/projetsjsl/Documents/GitHub/GOB
node server.js

# Dans un autre terminal, tester
curl http://localhost:10000/login.html

# Vérifier le processus
ps aux | grep "node server.js"

# Arrêter le serveur
pkill -f "node server.js"
```

## ✅ Vérification

Une fois le serveur démarré, vous devriez pouvoir:

1. Accéder à: `http://localhost:10000/login.html`
2. Voir la page de login s'afficher
3. Voir dans les logs du serveur les requêtes HTTP

