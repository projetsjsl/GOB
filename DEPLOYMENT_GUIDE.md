# 🚀 Guide de Déploiement - Support Images & Perplexity Labs

## ✅ Tout est prêt pour le déploiement !

Tous les changements ont été commités et pushés sur la branche :
`claude/chatbot-image-display-011CUeWgT2j8kkepj8s917ER`

---

## 📋 Étape 1 : Créer la Pull Request

Cliquez sur ce lien pour créer la PR sur GitHub :

**🔗 https://github.com/projetsjsl/GOB/pull/new/claude/chatbot-image-display-011CUeWgT2j8kkepj8s917ER**

Ou visitez GitHub → votre repo → vous verrez un banner jaune "Compare & pull request"

### Titre suggéré :
```
feat: Support d'affichage d'images et suite de tests Perplexity Labs
```

### Description de la PR :

```markdown
## 🎨 Résumé

Cette PR ajoute :
1. ✅ Support complet d'affichage d'images/graphiques dans Emma
2. 🔬 Suite de tests pour explorer Perplexity Labs

---

## 📊 Changements

### 1. Parser d'images dans Emma

**Fichier modifié:**
- `public/beta-combined-dashboard.html`

**Tags supportés:**
- `[CHART:TRADINGVIEW:NASDAQ:AAPL]` → Widget TradingView interactif
- `[CHART:FINVIZ:AAPL]` → Graphique Finviz statique
- `[CHART:FINVIZ:SECTORS]` → Heatmap sectorielle
- `[LOGO:AAPL]` → Logo de compagnie
- `[SCREENSHOT:AAPL:1D]` → Lien TradingView

**Features:**
- Conversion automatique tags → HTML/iframes
- Support dark mode
- Lazy loading
- Fallback gracieux
- Responsive

### 2. Suite de tests Perplexity Labs

**Nouveaux fichiers:**
- `api/test-perplexity-labs.js` - API de tests
- `public/test-perplexity-labs.html` - Interface web
- `test-perplexity-labs.js` - Script référence

**4 tests disponibles:**
1. Disponibilité des modèles (sonar, sonar-pro, sonar-reasoning)
2. Requêtes financières (données + citations)
3. Génération de tags d'images
4. Comparaison de modèles (qualité/vitesse/tokens)

---

## ✅ Prêt à merger !

Pas de breaking changes. Compatible avec l'existant.
```

---

## 📋 Étape 2 : Merger la Pull Request

1. Une fois la PR créée, vérifiez les changements sur GitHub
2. Cliquez sur "Merge pull request"
3. Confirmez le merge

**Vercel déploiera automatiquement** après le merge !

---

## 📋 Étape 3 : Accéder aux nouvelles fonctionnalités

### 🎨 Tester l'affichage d'images dans Emma

Une fois déployé sur Vercel :

1. Ouvrez votre app : `https://votre-app.vercel.app`
2. Allez dans **beta-combined-dashboard.html**
3. Ouvrez l'onglet **Emma IA**
4. Testez avec ces questions :

```
"Analyse AAPL avec graphiques"
"Montre-moi le graphique de MSFT"
"Performance des secteurs aujourd'hui"
```

**Note :** Emma utilise déjà Perplexity pour 80% des requêtes financières.
Le système demande DÉJÀ des tags d'images dans les prompts (voir `api/emma-agent.js` lignes 1074-1089).

**Résultat attendu :**
- Emma retournera des tags `[CHART:FINVIZ:AAPL]` dans sa réponse
- Le parser convertira automatiquement en images/graphiques
- Affichage dans la conversation avec styling adapté

---

### 🔬 Tester la suite Perplexity Labs

1. Ouvrez : `https://votre-app.vercel.app/test-perplexity-labs.html`

2. **Interface de test disponible** avec 4 tests :

   **Test 1 : Disponibilité** ✅
   - Cliquez sur "Test de disponibilité"
   - Vérifie quels modèles sont accessibles
   - Résultat : liste des modèles avec statut OK/Échec

   **Test 2 : Requête financière** 📈
   - Entrez un ticker (ex: AAPL)
   - Sélectionnez un modèle (sonar-pro recommandé)
   - Cliquez sur "Requête financière"
   - Résultat : données de marché + citations + temps de réponse

   **Test 3 : Tags d'images** 🎨
   - Entrez un ticker (ex: MSFT)
   - Cliquez sur "Tags d'images"
   - Résultat : réponse avec tags `[CHART:...]` détectés automatiquement

   **Test 4 : Comparaison** ⚖️
   - Entrez un ticker
   - Cliquez sur "Comparaison modèles"
   - Résultat : sonar vs sonar-pro (qualité, vitesse, tokens)

3. **Ou via API directe :**

   ```bash
   # Disponibilité
   curl https://votre-app.vercel.app/api/test-perplexity-labs?test=availability

   # Financier
   curl "https://votre-app.vercel.app/api/test-perplexity-labs?test=financial&ticker=AAPL&model=sonar-pro"

   # Images
   curl "https://votre-app.vercel.app/api/test-perplexity-labs?test=images&ticker=AAPL"

   # Comparaison
   curl "https://votre-app.vercel.app/api/test-perplexity-labs?test=compare&ticker=MSFT"
   ```

---

## 🎯 Architecture mise en place

### Flux d'affichage d'images dans Emma :

```
1. User → "Analyse AAPL avec graphiques"
2. Frontend → Emma Agent (api/emma-agent.js)
3. Emma Agent → Perplexity API (Smart Router)
4. Perplexity → Retourne texte + "[CHART:FINVIZ:AAPL]"
5. Frontend → Parse tags → Convertit en HTML
6. User voit → Graphique affiché dans la conversation
```

### Parser d'images (frontend) :

```javascript
// Dans formatMessageText() :

1. Extraction des tags avant formatage Markdown
   "[CHART:FINVIZ:AAPL]" → @@IMAGE_TAG_0@@

2. Formatage Markdown normal (code, listes, liens, etc.)

3. Réinsertion des tags convertis en HTML
   @@IMAGE_TAG_0@@ → <img src="https://finviz.com/chart.ashx?t=AAPL&..." />
```

**Avantages :**
- Pas de conflit avec le formatage Markdown
- Support dark mode automatique
- Fallback si image non disponible
- Responsive et lazy-loaded

---

## 📦 Ce qui a été fait

### Commits sur la branche :

1. **`18dfa2a`** - feat: Ajouter le support d'affichage d'images et graphiques dans le chatbot Emma
   - Parser complet pour 5 types de tags
   - Conversion en HTML avec styling
   - Support dark mode

2. **`1b71612`** - feat: Ajouter suite de tests pour Perplexity Labs
   - Endpoint API `/api/test-perplexity-labs`
   - Interface web `/test-perplexity-labs.html`
   - 4 tests : disponibilité, financier, images, comparaison

### Fichiers modifiés/créés :

```
Modifié:
  public/beta-combined-dashboard.html     (+168 lignes)

Créés:
  api/test-perplexity-labs.js             (endpoint API)
  public/test-perplexity-labs.html        (interface web)
  test-perplexity-labs.js                 (script référence)
  DEPLOYMENT_GUIDE.md                     (ce fichier)
```

---

## 🔮 Prochaines étapes suggérées

Après avoir testé avec la suite Perplexity Labs :

1. **Si sonar-pro est disponible :**
   - Upgrade Emma pour l'utiliser par défaut
   - Meilleure qualité de réponses
   - Plus de citations

2. **Si tags d'images fonctionnent bien :**
   - Optimiser les prompts Emma pour plus de graphiques
   - Ajouter plus de types de visualisations
   - Tableaux interactifs, graphiques custom

3. **Si citations structurées disponibles :**
   - Afficher les sources de manière plus riche
   - Créer des cartes de sources avec preview

4. **Nouveaux composants visuels :**
   - Intégrer Chart.js ou Recharts
   - Graphiques générés côté client avec les données retournées
   - Tableaux de données interactifs (tri, filtres)

---

## ✅ Checklist de déploiement

- [x] Code commité et pushé
- [x] Branch prête : `claude/chatbot-image-display-011CUeWgT2j8kkepj8s917ER`
- [ ] **TODO: Créer la PR sur GitHub** (lien ci-dessus)
- [ ] **TODO: Merger la PR**
- [ ] **TODO: Vérifier le déploiement Vercel**
- [ ] **TODO: Tester Emma avec images**
- [ ] **TODO: Tester la suite Perplexity Labs**

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. **Images ne s'affichent pas dans Emma :**
   - Vérifiez que Perplexity retourne bien des tags dans sa réponse
   - Ouvrez la console (F12) pour voir les erreurs
   - Vérifiez que les URLs des images sont accessibles

2. **Tests Perplexity Labs échouent :**
   - Vérifiez que `PERPLEXITY_API_KEY` est configurée dans Vercel
   - Vérifiez les quotas de votre clé API
   - Consultez les logs Vercel pour voir les erreurs détaillées

3. **Erreur 503 ou 500 :**
   - Vérifiez les variables d'environnement Vercel
   - Consultez les logs de déploiement
   - Vérifiez que les endpoints API sont bien déployés

---

**Tout est prêt ! Il ne reste plus qu'à créer et merger la PR.** 🚀

---

*Guide créé automatiquement - Janvier 2025*
