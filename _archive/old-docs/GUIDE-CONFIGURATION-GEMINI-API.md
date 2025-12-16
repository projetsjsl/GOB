# 🔑 Guide de Configuration de l'API Gemini dans n8n

## ✅ Problème résolu

L'erreur **"access to env vars denied@GOB"** dans le nœud "Call Gemini API" a été corrigée.

Le workflow a été modifié pour :
- ✅ Utiliser `$json.gemini_api_key` au lieu de `$env.GEMINI_API_KEY`
- ✅ Ajouter un nœud "Get Gemini API Key" qui récupère la clé API
- ✅ Mettre à jour les connexions du workflow

## 📋 Configuration de la clé API Gemini

Vous avez **3 méthodes** pour configurer la clé API Gemini :

### 🔧 MÉTHODE 1 : Variable de workflow (RECOMMANDÉ - Plus simple)

1. Dans n8n, ouvrez votre workflow `03lgcA4e9uRTtli1`
2. Cliquez sur le nœud **"Get Gemini API Key"**
3. Dans le code JavaScript, trouvez la ligne :
   ```javascript
   geminiApiKey = $workflow.getStaticData('global').geminiApiKey || '';
   ```
4. Remplacez-la par :
   ```javascript
   geminiApiKey = 'VOTRE_CLE_API_GEMINI_ICI';
   ```
5. Remplacez `VOTRE_CLE_API_GEMINI_ICI` par votre vraie clé API Gemini
6. Sauvegardez le workflow

**⚠️ IMPORTANT** : Cette méthode stocke la clé dans le workflow. Pour plus de sécurité, utilisez la méthode 2.

---

### 🔧 MÉTHODE 2 : Credentials n8n (Plus sécurisé)

1. Dans n8n, allez dans **"Credentials"** (menu latéral)
2. Cliquez sur **"Add Credential"**
3. Cherchez et sélectionnez **"HTTP Header Auth"**
4. Configurez :
   - **Name** : `Google Gemini API`
   - **Header Name** : `Authorization` (ou laissez vide)
   - **Header Value** : Votre clé API Gemini
5. Sauvegardez les credentials
6. Dans le workflow, modifiez le nœud **"Get Gemini API Key"**
7. Remplacez le code pour utiliser les credentials :
   ```javascript
   // Récupérer depuis les credentials
   const credentials = await this.getCredentials('httpHeaderAuth');
   geminiApiKey = credentials.value || credentials.headerValue || '';
   ```

**Note** : La syntaxe exacte dépend de votre version de n8n. Consultez la documentation n8n pour les credentials.

---

### 🔧 MÉTHODE 3 : Variable d'environnement n8n (Si disponible)

Si votre instance n8n Cloud permet l'accès aux variables d'environnement :

1. Dans n8n Cloud, allez dans **Settings** → **Environment Variables**
2. Ajoutez une variable `GEMINI_API_KEY` avec votre clé API
3. Dans le nœud "Get Gemini API Key", utilisez :
   ```javascript
   geminiApiKey = process.env.GEMINI_API_KEY || '';
   ```

**Note** : Cette méthode peut ne pas fonctionner selon les restrictions de votre plan n8n Cloud.

---

## 🧪 Test de la configuration

1. Dans n8n, exécutez manuellement le workflow
2. Utilisez le trigger **"Manual Trigger (Custom Prompt)"**
3. Vérifiez que le nœud **"Get Gemini API Key"** s'exécute sans erreur
4. Vérifiez que le nœud **"Call Gemini API"** reçoit bien la clé API
5. Si tout fonctionne, vous devriez voir une réponse de Gemini dans **"Parse Gemini Response"**

---

## 🔍 Dépannage

### Erreur : "Clé API Gemini manquante"

**Solution** : Vérifiez que vous avez bien configuré la clé dans le nœud "Get Gemini API Key"

### Erreur : "401 Unauthorized"

**Solution** : Vérifiez que votre clé API Gemini est valide et active

### Erreur : "access to env vars denied"

**Solution** : Cette erreur devrait être résolue. Si elle persiste, vérifiez que le workflow utilise bien `$json.gemini_api_key` et non `$env.GEMINI_API_KEY`

---

## 📝 Notes importantes

- ⚠️ **Ne commitez jamais votre clé API dans le code source**
- 🔒 Utilisez les credentials n8n pour une meilleure sécurité
- 🔄 Si vous changez de clé API, mettez à jour uniquement le nœud "Get Gemini API Key"
- 📊 Vous pouvez tester avec le trigger manuel avant d'activer les triggers automatiques

---

## 🎯 Résumé des modifications

Le workflow a été modifié comme suit :

1. **Nouveau nœud** : "Get Gemini API Key" (entre "Choose AI Model (IF)" et "Call Gemini API")
2. **Nœud modifié** : "Call Gemini API" utilise maintenant `$json.gemini_api_key`
3. **Connexions mises à jour** : Le flux passe maintenant par "Get Gemini API Key"

Le workflow est maintenant prêt à être utilisé une fois la clé API configurée !

