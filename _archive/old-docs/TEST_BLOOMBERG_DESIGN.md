# 🧪 Guide de Test - Design Bloomberg Emma IA

## 🎯 Test Rapide (5 minutes)

### **1. Ouvrir le Workflow n8n**
URL: https://projetsjsl.app.n8n.cloud/workflow/03lgcA4e9uRTtli1

### **2. Ouvrir le Chat Test**
- Cliquer sur le node "When chat message received"
- Ouvrir le panneau de test (chat bubble icon)

### **3. Envoyer ce Message Test**

```markdown
# Les Actions Technologiques Dominent les Marchés

Le secteur technologique affiche des gains impressionnants aujourd'hui,
portés par l'engouement pour l'intelligence artificielle et les résultats
exceptionnels des entreprises de semi-conducteurs comme NVIDIA et AMD.

## Points Clés du Marché

Les investisseurs se tournent vers les opportunités dans la santé et
l'énergie, tout en surveillant attentivement les risques d'inflation
et les décisions de la Fed concernant les taux d'intérêt.

Les actions sont en hausse de 2.5% en moyenne, avec des gains notables
dans le secteur technologie. Les analystes recommandent une attention
particulière aux résultats des entreprises cette semaine.

## Perspectives

Aujourd'hui, les dividendes des obligations demeurent attractifs malgré
la baisse du PIB. Les investisseurs maintiennent leur prudence face
aux annonces de la Federal Reserve.
```

### **4. Vérifier l'Email Reçu**

Destinataire: `projetsjsl@gmail.com`

---

## ✅ Checklist de Vérification

### **📧 Email Basics**
- [ ] Reçu de: `Emma IA - Finance <emma@gobapps.com>`
- [ ] Sujet: `📊 Les Actions Technologiques Dominent les Marchés`

### **🎨 Masthead (Header)**
- [ ] Avatar Emma visible (42px, rond)
- [ ] Texte "EMMA IA FINANCE" visible
- [ ] Badge heure EST affiché (ex: "14:30 EST")
- [ ] Background gradient bleu navy

### **📰 Hero Section**
- [ ] Greeting contextuel affiché:
  - Matin (5h-12h): "Bonjour"
  - Midi (12h-18h): "Bon après-midi"
  - Soir (18h-22h): "Bonsoir"
- [ ] Titre extrait: "Les Actions Technologiques Dominent les Marchés"
- [ ] Sous-titre: "Le secteur technologique affiche des gains..."
- [ ] Byline: "Par Emma IA • [date complète]"
- [ ] Background gradient navy → slate

### **📝 Contenu Article**
- [ ] Typography serif (Georgia) visible
- [ ] Titres H2 avec border bottom slate
- [ ] Emojis contextuels insérés:
  - 📊 actions
  - 💻 technologie
  - 🏥 santé
  - ⚡ énergie
  - ⚠️ risques
  - 📊 inflation
  - 🏛️ Fed/Federal Reserve
  - 📈 hausse
  - 📉 baisse
  - 💰 dividendes
  - 📜 obligations
  - 📈 PIB
  - 📋 résultats
  - 👨‍💼 analystes
  - 📅 aujourd'hui
  - 🔔 attention/prudence
  - 📢 annonces
- [ ] Line height généreux (1.8)
- [ ] Paragraphes bien espacés

### **🖼️ Footer**
- [ ] Avatar Emma (60px) visible à gauche
- [ ] Logo JSLAI visible à droite
- [ ] Logos alignés côte à côte (flex)
- [ ] Texte: "Généré par **Emma IA** | Propulsé par **JSLAI™**"
- [ ] Tagline: "Newsletter automatisée d'analyse financière"

### **📊 Détails Techniques (Footer)**
- [ ] Encadré blanc avec border grise
- [ ] 4 lignes d'information:
  - ⚡ Déclencheur: Test Chat
  - 🤖 Modèle Emma: GEMINI-LANGCHAIN
  - 🔧 Outils utilisés: langchain, chat
  - ⏱️ Temps d'exécution: ~2.5s

### **🎨 Palette Couleurs**
- [ ] Headers: Navy blue (#2c5f8d)
- [ ] Titres: Slate (#2c3e50, #34495e)
- [ ] Texte: Charcoal gray (#4a5568)
- [ ] Borders: Slate/Gray (#34495e, #bdc3c7)

### **📱 Responsive (Test sur Mobile)**
- [ ] Affichage correct sur écran < 600px
- [ ] Titre réduit à 26px
- [ ] Padding réduit à 20px
- [ ] Lisibilité maintenue

---

## 🎯 Tests Avancés

### **Test A: Morning Briefing**
Envoyer message entre **5h-12h EST**
- Vérifier greeting: "Bonjour" (ou "Bonjour et bienvenue..." si trigger=morning)

### **Test B: Evening Briefing**
Envoyer message entre **18h-22h EST**
- Vérifier greeting: "Bonsoir" (ou "Bonsoir, découvrez..." si trigger=evening)

### **Test C: Sans Titre Markdown**
Message sans `#` headers:
```
Le marché est en forte hausse aujourd'hui avec des gains
significatifs dans le secteur technologie. Les investisseurs
restent optimistes malgré les risques d'inflation.
```
- Vérifier: Titre extrait de la première phrase
- Vérifier: Sous-titre = phrase suivante

### **Test D: Contenu Long**
Message avec 5+ paragraphes et plusieurs H2
- Vérifier: Extraction correcte du premier H2
- Vérifier: Sous-titre = premier paragraphe
- Vérifier: Tous les emojis ajoutés correctement

---

## 📊 Exemple de Résultat Attendu

### **Structure Visuelle:**

```
┌─────────────────────────────────────────────────────┐
│ [Avatar] EMMA IA FINANCE          14:30 EST         │ ← Masthead Navy
├─────────────────────────────────────────────────────┤
│ Bon après-midi                                      │ ← Hero Gradient
│                                                     │   Navy → Slate
│ LES ACTIONS TECHNOLOGIQUES                         │
│ DOMINENT LES MARCHÉS                               │
│                                                     │
│ Le secteur technologique affiche des gains         │
│ impressionnants...                                  │
│                                                     │
│ Par Emma IA • samedi 9 novembre 2025, 14:30        │
├─────────────────────────────────────────────────────┤
│ Le secteur 💻 technologie affiche des gains        │ ← Article Content
│ impressionnants 📅 aujourd'hui, portés par          │   Background White
│ l'engouement pour l'intelligence artificielle...   │   Georgia Serif
│                                                     │
│ ## 📋 Points Clés du Marché                        │
│                                                     │
│ Les 👤 investisseurs se tournent vers les          │
│ ✨ opportunités dans la 🏥 santé et l'⚡ énergie,   │
│ tout en surveillant les ⚠️ risques...              │
├─────────────────────────────────────────────────────┤
│              [Avatar]  [Logo JSLAI]                 │ ← Footer Gray
│                                                     │
│ Généré par Emma IA | Propulsé par JSLAI™           │
│ Newsletter automatisée d'analyse financière         │
│                                                     │
│ ┌───────── Détails Techniques ──────────┐         │
│ │ ⚡ Déclencheur: Test Chat              │         │
│ │ 🤖 Modèle: GEMINI-LANGCHAIN            │         │
│ │ 🔧 Outils: langchain, chat             │         │
│ │ ⏱️ Temps: 2.5s                         │         │
│ └─────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### **Problème: Pas d'emojis visibles**
- ✅ Vérifier que le message contient des mots-clés (hausse, baisse, technologie, etc.)
- ✅ Fonction `enrichWithEmojis()` présente dans le code
- ✅ Tester avec message exemple ci-dessus

### **Problème: Titre = "Newsletter Financière Emma"**
- ✅ Vérifier que le message contient un `#` ou `##`
- ✅ Ou vérifier que la première phrase fait > 20 caractères
- ✅ Fonction `extractTitleAndSubtitle()` s'exécute correctement

### **Problème: Greeting toujours "Bonjour"**
- ✅ Vérifier l'heure du serveur (timezone EST)
- ✅ Fonction `getContextualGreeting()` utilise `new Date()`
- ✅ Trigger type passé correctement à la fonction

### **Problème: Design pas Bloomberg (pas de gradient)**
- ✅ Vérifier que le workflow a été uploadé (Updated at: 2025-11-09T19:47:16.000Z)
- ✅ Clear cache email client
- ✅ Télécharger workflow et vérifier présence de `.masthead` et `.hero` styles

### **Problème: Avatar ou Logo manquant**
- ✅ Vérifier URLs accessibles:
  - https://gob-projetsjsls-projects.vercel.app/emma-avatar-gob-dark.jpg
  - https://gob-projetsjsls-projects.vercel.app/logojslaidark.jpg
- ✅ Vérifier class CSS `.footer-logos`, `.footer-avatar`, `.footer-logo`

### **Problème: Email de onboarding@resend.dev**
- ✅ Vérifier node "Send Email via Resend"
- ✅ From: "Emma IA - Finance <emma@gobapps.com>"
- ✅ Variable ENV RESEND_API_KEY configurée sur Vercel

---

## 📈 Métriques de Succès

### **Design Bloomberg ✅**
- [ ] Ressemble à un article Bloomberg/Financial Times
- [ ] Palette navy/slate professionnelle
- [ ] Typography serif authentique presse
- [ ] Structure claire et hiérarchisée

### **Extraction Intelligente ✅**
- [ ] Titre pertinent extrait du contenu
- [ ] Sous-titre contextuel et informatif
- [ ] Pas de "Newsletter Financière Emma" générique

### **Personnalisation ✅**
- [ ] Greeting adapté au moment
- [ ] Date/heure formatées en français
- [ ] Byline "Par Emma IA" professionnelle

### **Branding ✅**
- [ ] Avatar Emma visible 2x (header + footer)
- [ ] Logo JSLAI prominent
- [ ] Texte "Propulsé par JSLAI™"
- [ ] Détails techniques présents

---

## 🎉 Validation Finale

Si **tous les éléments** de la checklist sont ✅, alors:

**🏆 DESIGN BLOOMBERG OPÉRATIONNEL À 100%!**

Vos newsletters Emma IA sont maintenant des articles de presse
financière professionnels dignes de Bloomberg, Wall Street Journal
et Financial Times!

---

## 📞 Support

**En cas de problème:**
1. Consulter `N8N_BLOOMBERG_DESIGN_COMPLETE.md`
2. Vérifier logs n8n du workflow
3. Télécharger workflow et chercher fonctions clés:
   - `extractTitleAndSubtitle`
   - `getContextualGreeting`
   - `generateBloombergHTML`

**Workflow ID:** `03lgcA4e9uRTtli1`
**Last Update:** 2025-11-09T19:47:16.000Z

---

**Document créé:** 9 Novembre 2025
**Par:** Claude Code
**Status:** ✅ Ready to Test
