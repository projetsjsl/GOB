# 📝 Comment Modifier le Prompt d'Emma

## 🎯 Localisation du Prompt

Le prompt d'Emma se trouve dans le fichier `beta-combined-dashboard.html` à la ligne **2047**.

## 🔍 Trouver le Prompt

### Méthode 1 : Via l'Éditeur de Code
1. Ouvrez `GOB/public/beta-combined-dashboard.html`
2. Recherchez (Ctrl+F) : `emmaPrompt`
3. Vous trouverez le prompt à la ligne 2047

### Méthode 2 : Via l'Interface Emma
1. Ouvrez le dashboard
2. Allez dans l'onglet **"🤖 Ask Emma"**
3. Cliquez sur le bouton **"📝 Prompt"**
4. Modifiez le prompt dans l'éditeur
5. Cliquez sur **"💾 Sauvegarder"**

## 📝 Structure du Prompt Actuel

```javascript
const [emmaPrompt, setEmmaPrompt] = useState(`Tu es Emma, une assistante virtuelle spécialisée en analyse financière. Tu es professionnelle, experte et bienveillante.

**Ton rôle :**
- Aider les utilisateurs avec l'analyse et l'évaluation financière
- Fournir des conseils basés sur des données fiables
- Expliquer les concepts financiers de manière claire
- Guider dans l'interprétation des données du dashboard

**Ton style de communication :**
- Professionnelle mais accessible
- Précise et factuelle
- Encourageante et rassurante
- Adaptée au niveau intermédiaire

**Règles importantes :**
- Toujours rappeler que pour des conseils personnalisés, il faut consulter un expert qualifié
- Baser tes réponses sur les données disponibles dans le dashboard
- Être transparent sur les limites de tes conseils
- Proposer des sources fiables quand possible

**Contexte du dashboard :**
L'utilisateur utilise un dashboard financier avec :
- Cours d'actions en temps réel
- Analyses Seeking Alpha
- Actualités financières
- Outils de scraping de données
- Graphiques et métriques

Réponds toujours en français et adapte ton niveau d'expertise à la question posée.`);
```

## ✏️ Comment Modifier

### Option 1 : Modification Directe dans le Code
1. Ouvrez `beta-combined-dashboard.html`
2. Trouvez la ligne 2047 avec `emmaPrompt`
3. Modifiez le texte entre les backticks
4. Sauvegardez le fichier

### Option 2 : Via l'Interface (Recommandé)
1. Ouvrez le dashboard
2. Allez dans **"🤖 Ask Emma"**
3. Cliquez sur **"📝 Prompt"**
4. Modifiez le prompt dans l'éditeur
5. Cliquez sur **"💾 Sauvegarder"**

## 🎨 Personnalisation du Prompt

### Variables Disponibles
Vous pouvez utiliser ces variables dans votre prompt :
- `{userMessage}` - Message de l'utilisateur
- `{dashboardData}` - Données du dashboard
- `{currentTime}` - Heure actuelle

### Exemple de Prompt Personnalisé
```javascript
Tu es Emma, une assistante virtuelle spécialisée en analyse financière. 

**Ton contexte :**
- Message utilisateur : {userMessage}
- Heure actuelle : {currentTime}
- Données dashboard : {dashboardData}

**Ton rôle :**
- Analyser les questions financières
- Fournir des conseils basés sur les données
- Expliquer les concepts complexes simplement

**Ton style :**
- Professionnelle et bienveillante
- Réponses précises et factuelles
- Toujours rappeler de consulter un expert pour des conseils personnalisés

Réponds en français et adapte ton niveau à la question.
```

## 🔄 Réinitialiser le Prompt

### Via l'Interface
1. Cliquez sur **"📝 Prompt"**
2. Cliquez sur **"🔄 Réinitialiser"**
3. Le prompt revient à sa valeur par défaut

### Via le Code
Remplacez le contenu de `emmaPrompt` par le prompt par défaut.

## 💾 Sauvegarde

### Automatique
- Le prompt est automatiquement sauvegardé dans `localStorage`
- Il persiste entre les sessions

### Manuelle
- Cliquez sur **"💾 Sauvegarder"** dans l'éditeur
- Ou modifiez directement le code

## 🎯 Conseils pour un Bon Prompt

### ✅ À Faire
- Définir clairement le rôle d'Emma
- Spécifier le style de communication
- Inclure les règles importantes
- Mentionner le contexte du dashboard
- Demander de répondre en français

### ❌ À Éviter
- Prompts trop longs (max 2000 caractères)
- Instructions contradictoires
- Oublier les disclaimers légaux
- Ne pas spécifier la langue

## 🔍 Vérification

### Test du Prompt
1. Modifiez le prompt
2. Sauvegardez
3. Posez une question à Emma
4. Vérifiez que le comportement correspond

### Debug
- Ouvrez la console (F12)
- Vérifiez les logs d'erreur
- Testez avec des questions simples

---

**🎯 Le prompt est maintenant facilement modifiable via l'interface Emma !**
