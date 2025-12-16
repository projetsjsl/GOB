# 🔧 Correction : Mémoire Conversationnelle SMS

**Date**: 18 Novembre 2025  
**Problème**: Emma SMS ne se souvient pas des messages précédents

---

## 🐛 Problème Identifié

L'historique conversationnel était bien récupéré depuis Supabase mais **pas correctement formaté** pour Emma Agent.

### Format Attendu vs Format Reçu

**Format depuis `formatHistoryForEmma`**:
```javascript
{
  role: 'user',
  parts: [{ text: 'Message utilisateur' }]
}
```

**Format utilisé dans le prompt**:
```javascript
{
  role: 'user',
  content: 'Message utilisateur'
}
```

**Résultat**: L'historique était chargé mais le contenu n'était pas accessible car il cherchait `msg.content` alors que le format était `msg.parts[0].text`.

---

## ✅ Corrections Appliquées

### 1. Normalisation du Format d'Historique

**Fichier**: `api/emma-agent.js` (lignes 60-83)

**Avant**:
```javascript
if (context.conversationHistory && Array.isArray(context.conversationHistory)) {
    this.conversationHistory = context.conversationHistory;
    console.log(`💬 Loaded conversation history: ${this.conversationHistory.length} messages`);
}
```

**Après**:
```javascript
if (context.conversationHistory && Array.isArray(context.conversationHistory)) {
    // ✅ FIX: Normaliser le format de l'historique
    this.conversationHistory = context.conversationHistory.map(msg => {
        // Si format parts: [{ text }], extraire le texte
        if (msg.parts && Array.isArray(msg.parts) && msg.parts[0]?.text) {
            return {
                role: msg.role,
                content: msg.parts[0].text,
                timestamp: msg.timestamp || new Date().toISOString()
            };
        }
        // Si format content direct, utiliser tel quel
        if (msg.content) {
            return {
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp || new Date().toISOString()
            };
        }
        return null;
    }).filter(msg => msg !== null);
    console.log(`💬 Loaded conversation history: ${this.conversationHistory.length} messages`);
}
```

**Bénéfice**: 
- ✅ Supporte les deux formats (`parts` et `content`)
- ✅ Normalise toujours vers `content` pour usage interne
- ✅ Filtre les messages invalides

### 2. Augmentation du Contexte Conversationnel

**Fichier**: `api/emma-agent.js` (ligne 1717)

**Avant**:
```javascript
const conversationContext = this.conversationHistory.slice(-5); // 5 derniers échanges
```

**Après**:
```javascript
// ✅ FIX: Utiliser les 10 derniers messages pour meilleur contexte
const conversationContext = this.conversationHistory.slice(-10); // 10 derniers échanges
console.log(`💬 Conversation context: ${conversationContext.length} messages`);
```

**Bénéfice**:
- ✅ Plus de contexte pour Emma (10 messages au lieu de 5)
- ✅ Meilleure continuité conversationnelle
- ✅ Log pour debugging

---

## 🔍 Vérification du Flux

### Flux Complet SMS → Emma

1. **SMS reçu** → `api/adapters/sms.js`
2. **Appel `/api/chat`** avec `channel: 'sms'`
3. **Récupération conversation** → `getOrCreateConversation()`
4. **Récupération historique** → `getConversationHistory(conversation.id, 10)`
5. **Formatage historique** → `formatHistoryForEmma(conversationHistory)`
6. **Passage à Emma** → `emmaContext.conversationHistory`
7. **Normalisation** → Conversion `parts` → `content` ✅ **NOUVEAU**
8. **Utilisation dans prompt** → `conversationContext.map(c => c.content)`

---

## 🧪 Tests à Effectuer

### Test 1: Conversation Simple
```
Utilisateur: "Analyse AAPL"
Emma: [Réponse avec analyse AAPL]

Utilisateur: "Et son P/E ratio ?"
Emma: [Doit se souvenir qu'on parle d'AAPL]
```

### Test 2: Changement de Sujet
```
Utilisateur: "Analyse AAPL"
Emma: [Réponse]

Utilisateur: "Compare avec MSFT"
Emma: [Doit comparer AAPL vs MSFT]
```

### Test 3: Références Implicites
```
Utilisateur: "Prix de Telus"
Emma: [Réponse T.TO]

Utilisateur: "Et son dividende ?"
Emma: [Doit savoir qu'on parle de T.TO]
```

---

## 📊 Logs à Surveiller

### Logs Attendus

```
[Chat API] Historique: 5 messages
💬 Loaded conversation history: 5 messages
💬 Conversation context: 5 messages
```

### Si Problème Persiste

Vérifier:
1. ✅ L'historique est bien récupéré (`[Chat API] Historique: X messages`)
2. ✅ L'historique est bien formaté (`💬 Loaded conversation history: X messages`)
3. ✅ Le contexte est utilisé (`💬 Conversation context: X messages`)
4. ✅ Le prompt contient l'historique (vérifier dans les logs Perplexity)

---

## 🎯 Résultat Attendu

**Avant**:
- ❌ Emma oublie les messages précédents
- ❌ Chaque message est traité isolément
- ❌ Pas de continuité conversationnelle

**Après**:
- ✅ Emma se souvient des 10 derniers messages
- ✅ Continuité conversationnelle
- ✅ Références implicites fonctionnent
- ✅ "Et son P/E ?" fonctionne après "Analyse AAPL"

---

## ⚠️ Notes Importantes

1. **Format Flexible**: Le code supporte maintenant les deux formats (`parts` et `content`) pour compatibilité
2. **Performance**: 10 messages = ~2000 tokens max, acceptable pour Perplexity
3. **Limite**: Si besoin de plus de contexte, augmenter `slice(-10)` mais attention aux limites de tokens

---

## ✅ Statut

- ✅ Format d'historique normalisé
- ✅ Contexte augmenté (5 → 10 messages)
- ✅ Logs ajoutés pour debugging
- 🔄 **À TESTER** en production

