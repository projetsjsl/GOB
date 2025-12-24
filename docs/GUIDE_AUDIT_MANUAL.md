# 📋 GUIDE D'AUDIT MANUEL - DASHBOARD GOB

## 🚀 Démarrage Rapide

1. **Ouvrir le dashboard déployé:**
   ```
   https://gobapps.com/beta-combined-dashboard.html
   ```

2. **Ouvrir la console du navigateur:**
   - Chrome/Edge: F12 ou Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows)
   - Firefox: F12 ou Cmd+Option+K (Mac) / Ctrl+Shift+K (Windows)

3. **Copier-coller le script d'audit:**
   - Ouvrir le fichier `docs/AUDIT_AUTOMATED_SCRIPT.js`
   - Copier tout le contenu
   - Coller dans la console
   - Appuyer sur Entrée

4. **Exécuter l'audit complet:**
   ```javascript
   runFullAudit()
   ```

5. **Attendre la fin de l'audit** (environ 2-3 minutes)

6. **Récupérer le rapport:**
   - Le rapport sera automatiquement copié dans le clipboard
   - Ou copier manuellement: `JSON.stringify(window.fullAuditReport, null, 2)`

---

## 🔍 AUDIT MANUEL SECTION PAR SECTION

### Section 1: Admin

1. **Cliquer sur le bouton "Admin"**
2. **Vérifier:**
   - [ ] La page se charge sans erreur
   - [ ] Aucun message "Module non chargé"
   - [ ] Tous les widgets s'affichent
   - [ ] Pas d'erreurs dans la console

3. **Screenshots à prendre:**
   - Screenshot de la page complète
   - Screenshot de chaque widget
   - Screenshot des erreurs console (si présentes)

4. **Tester les interactions:**
   - [ ] Cliquer sur tous les boutons
   - [ ] Vérifier les formulaires
   - [ ] Tester les modals

### Section 2: Marchés

1. **Cliquer sur le bouton "Marchés"**
2. **Tester tous les sous-onglets:**
   - Vue Globale
   - Calendrier Économique
   - Courbe des Taux
   - Autres sous-onglets

3. **Vérifier les widgets TradingView:**
   - [ ] Market Overview se charge
   - [ ] Stock Heatmap se charge
   - [ ] Economic Calendar se charge
   - [ ] Aucune erreur iframe

4. **Screenshots:**
   - Screenshot de chaque sous-onglet
   - Screenshot de chaque widget TradingView
   - Screenshot des erreurs console

### Section 3: Titres

1. **Cliquer sur le bouton "Titres"**
2. **Tester tous les sous-onglets:**
   - Terminal
   - Analyse Pro
   - Screener
   - Ratios

3. **Vérifier les widgets TradingView:**
   - [ ] Symbol Overview se charge
   - [ ] Advanced Chart se charge
   - [ ] Mini Chart se charge
   - [ ] Timeline se charge

4. **Tester les calculs financiers:**
   - [ ] Vérifier les ratios (P/E, P/B, etc.)
   - [ ] Vérifier les calculs DCF
   - [ ] Vérifier les comparaisons de pairs

### Section 4: JLab™

1. **Cliquer sur le bouton "JLab™"**
2. **Vérifier:**
   - [ ] Le terminal se charge
   - [ ] Les scripts s'exécutent
   - [ ] Pas d'erreurs de syntaxe

### Section 5: Emma IA

1. **Cliquer sur le bouton "Emma"**
2. **Tester tous les sous-onglets:**
   - Chat
   - Vocal (VoiceAssistantTab)
   - Terminal
   - Group Chat

3. **Vérifier VoiceAssistantTab:**
   - [ ] Le module se charge (devrait être corrigé maintenant)
   - [ ] L'interface s'affiche
   - [ ] Les fonctionnalités fonctionnent

### Section 6: Tests

1. **Cliquer sur le bouton "Tests"**
2. **Vérifier:**
   - [ ] Tous les tests passent
   - [ ] Aucune erreur

---

## 📊 CHECKLIST DE VÉRIFICATION

### Erreurs Console
- [ ] Aucune erreur "Module non chargé"
- [ ] Aucune erreur "LazyWidgetWrapper has already been declared"
- [ ] Aucune erreur TradingView iframe
- [ ] Aucune erreur React/ReactDOM

### Widgets TradingView
- [ ] Market Overview: ✅ / ❌
- [ ] Stock Heatmap: ✅ / ❌
- [ ] Ticker Tape: ✅ / ❌
- [ ] Symbol Overview: ✅ / ❌
- [ ] Advanced Chart: ✅ / ❌
- [ ] Economic Calendar: ✅ / ❌
- [ ] Screener: ✅ / ❌
- [ ] Earnings Calendar: ✅ / ❌

### Performance
- [ ] Temps de chargement < 5 secondes
- [ ] Pas de freezes
- [ ] Pas de lags lors de la navigation
- [ ] Memory usage acceptable

### UI/UX
- [ ] Navigation fluide
- [ ] Tous les boutons fonctionnent
- [ ] Les modals s'ouvrent/ferment correctement
- [ ] Les formulaires fonctionnent
- [ ] Le dark mode fonctionne

---

## 📸 GUIDE DE CAPTURE D'ÉCRAN

### Outils Recommandés
- **Chrome DevTools:** Cmd+Shift+P > "Capture full size screenshot"
- **Extension:** Awesome Screenshot, Nimbus Screenshot
- **Mac:** Cmd+Shift+4 (sélection), Cmd+Shift+3 (écran complet)

### Screenshots à Prendre

1. **Pour chaque section:**
   - Screenshot de la page complète
   - Screenshot de chaque widget
   - Screenshot des erreurs console

2. **Pour chaque bug:**
   - Screenshot avant l'action
   - Screenshot après l'action
   - Screenshot de l'erreur

3. **Nommage des fichiers:**
   ```
   screenshot-[section]-[widget/error]-[timestamp].png
   Exemple: screenshot-marches-market-overview-2024-12-24-15-30.png
   ```

---

## 📝 TEMPLATE DE RAPPORT

Pour chaque bug trouvé, documenter:

```markdown
### Bug #[NUMERO]

**Type:** [Code Error / Visual Bug / UI/UX Issue / Calculation Error / Performance]

**Section:** [Admin / Marchés / Titres / JLab / Emma / Tests]

**Description:** 
[Description détaillée du problème]

**Étapes de Reproduction:**
1. [Étape 1]
2. [Étape 2]
3. [Étape 3]

**Comportement Attendu:**
[Ce qui devrait se passer]

**Comportement Actuel:**
[Ce qui se passe réellement]

**Screenshot:**
[Lien vers le screenshot]

**Console Errors:**
[Erreurs de la console]

**Impact:**
[🔴 CRITIQUE / 🟠 HAUTE / 🟡 MOYENNE / 🟢 FAIBLE]

**Solution Proposée:**
[Solution suggérée]
```

---

## ⏱️ TIMING

- **Audit complet:** ~3 heures
- **Par section:** ~30 minutes
- **Script automatisé:** ~2-3 minutes (mais nécessite vérification manuelle)

---

*Guide créé le 24 décembre 2024*

