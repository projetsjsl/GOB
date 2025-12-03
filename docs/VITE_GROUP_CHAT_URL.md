# Configuration VITE_GROUP_CHAT_URL

## Description

Variable d'environnement pour l'URL du chat de groupe ChatGPT utilisé dans RobotWeb (GroupChatTab).

## Valeur

```
VITE_GROUP_CHAT_URL=https://chatgpt.com/gg/v/692f1bec2e888196aa1036510bcecf81?token=aTookhJozWkSBy40JOR02w
```

## Configuration Vercel

### Via Dashboard Vercel

1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet "GOB"
3. Aller dans **Settings** → **Environment Variables**
4. Ajouter la variable :
   - **Name**: `VITE_GROUP_CHAT_URL`
   - **Value**: `https://chatgpt.com/gg/v/692f1bec2e888196aa1036510bcecf81?token=aTookhJozWkSBy40JOR02w`
   - **Environment**: Production, Preview, Development (cocher les trois)

### Via CLI Vercel

```bash
vercel env add VITE_GROUP_CHAT_URL
# Coller la valeur quand demandé
# Sélectionner: Production, Preview, Development
```

## Utilisation dans le code

### Accès côté client (Vite)

Les variables préfixées par `VITE_` sont accessibles côté client via `import.meta.env` :

```javascript
// Dans un composant React/Vite
const groupChatUrl = import.meta.env.VITE_GROUP_CHAT_URL;

// Exemple d'utilisation dans un iframe
<iframe 
    src={import.meta.env.VITE_GROUP_CHAT_URL}
    className="w-full h-full border-0"
    title="Group Chat"
/>
```

### Accès côté serveur (API routes)

Pour les routes API Vercel, utiliser `process.env` :

```javascript
// Dans api/groupchat/config.js
const groupChatUrl = process.env.VITE_GROUP_CHAT_URL;
```

## Notes importantes

- ⚠️ Les variables `VITE_*` sont exposées côté client (dans le bundle JavaScript)
- ✅ Sécurisé pour les URLs publiques comme ChatGPT
- ❌ Ne pas utiliser pour des clés API secrètes
- 🔄 Redéployer après ajout/modification de la variable dans Vercel

## Vérification

Pour vérifier que la variable est bien chargée :

```javascript
console.log('Group Chat URL:', import.meta.env.VITE_GROUP_CHAT_URL);
```

