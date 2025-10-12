# ⚡ DÉMARRAGE RAPIDE - Configuration Essentielle

## 🚨 **ACTION REQUISE IMMÉDIATEMENT**

Votre dashboard est déployé mais **2 clés API sont manquantes** pour un fonctionnement optimal.

---

## 🔑 **LES 2 CLÉS ESSENTIELLES (5 minutes)**

### 1. **GEMINI_API_KEY** → Pour Emma IA™
   
**Sans cette clé** : Emma affiche "Erreur API: 500"  
**Avec cette clé** : Emma génère des analyses financières automatiques

**Comment l'obtenir** :
1. ▶️ Allez sur https://ai.google.dev/
2. Cliquez sur "Get API Key" (gratuit)
3. Copiez votre clé

---

### 2. **FMP_API_KEY** → Pour les données financières

**Sans cette clé** : Score JSLAI™ incomplet, ratios manquants  
**Avec cette clé** : Toutes les données financières s'affichent

**Comment l'obtenir** :
1. ▶️ Allez sur https://site.financialmodelingprep.com/
2. Créez un compte (gratuit - 250 requêtes/jour)
3. Copiez votre clé dans "Dashboard"

---

## 📝 **CONFIGURATION SUR VERCEL (2 minutes)**

### **Méthode Simple** :

1. **Ouvrez ce lien direct** :  
   👉 https://vercel.com/projetsjsl/gob/settings/environment-variables

2. **Ajoutez les 2 variables** :

   **Variable 1** :
   ```
   Nom      : GEMINI_API_KEY
   Valeur   : [collez votre clé Gemini]
   Environnements : ✓ Production  ✓ Preview  ✓ Development
   ```
   *Cliquez "Save"*

   **Variable 2** :
   ```
   Nom      : FMP_API_KEY
   Valeur   : [collez votre clé FMP]
   Environnements : ✓ Production  ✓ Preview  ✓ Development
   ```
   *Cliquez "Save"*

3. **Redéployez** :
   - Sur Vercel, allez dans "Deployments"
   - Cliquez sur "..." du dernier déploiement
   - Cliquez "Redeploy"
   - ⏱️ Attendez 30-60 secondes

---

## ✅ **TEST RAPIDE**

### Après le redéploiement :

1. **Test Emma IA** :
   - Allez dans "💬 Emma IA™"
   - Tapez : "Analyse AAPL"
   - ✅ Devrait générer une analyse complète

2. **Test Score JSLAI™** :
   - Allez dans "📈 JStocks™"
   - ✅ Le score devrait être calculé (pas juste 50-60)
   - ✅ Les ratios P/E, ROE, D/E devraient s'afficher

---

## 📚 **DOCUMENTATION COMPLÈTE**

Pour plus de détails :
- 📄 **CONFIGURATION_CLES_API.md** → Guide détaillé avec dépannage
- 📄 **env.example** → Liste complète des variables disponibles

---

## 🆘 **PROBLÈME ?**

Si ça ne fonctionne toujours pas :

1. ✅ Vérifiez que vous avez bien cliqué "Save"
2. ✅ Vérifiez que vous avez bien "Redéployé"
3. ✅ Videz le cache (Ctrl+Shift+R)
4. ⏱️ Attendez 2-3 minutes (propagation)

---

**⏱️ Temps total estimé : 7 minutes**  
**💰 Coût : 0€ (tout gratuit)**  
**🎯 Résultat : Dashboard 100% fonctionnel**

---

*Créé le 12 octobre 2025 - Pour le projet GOB Apps*

