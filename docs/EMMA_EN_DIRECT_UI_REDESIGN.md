# 🎨 Emma En Direct - Redesign UI

## 📋 Problèmes Actuels

### ❌ UX Confus
1. **Pas de séparation claire** entre génération et envoi
2. **3 boutons** (Matin/Midi/Soir) → Confusion sur ce qui va se passer
3. **Boutons "Envoyer Email" et "Sauvegarder"** mélangés avec preview
4. **Pas d'interface** pour configurer les crons automatiques
5. **Pas de mode "Email Personnalisé"** clair avec prompt modifiable

### 🔍 Flux Utilisateur Actuel (Confus)
```
[Bouton Matin] → ??? (Génère? Envoie? Les deux?)
    ↓
[Preview apparaît]
    ↓
[Bouton "Envoyer Email"] ← Ah ok, faut cliquer ici pour envoyer
[Bouton "Sauvegarder"] ← Et ça fait quoi?
    ↓
[Section email destinataires en bas] ← C'est quoi la différence?
```

---

## ✅ Nouvelle Structure Proposée

### 🎯 3 Modes Séparés par TABS

```
┌─────────────────────────────────────────────────────────────┐
│  📡 Emma En Direct - BÊTA v2.0                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🧠 Système actif • Architecture cognitive • v2.0    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────┬────────────────┬──────────────────┐          │
│  │ 📋 GÉNÉ- │ ⚙️ AUTOMATION │ ✉️ PERSONNALISÉ  │          │
│  │   RER    │                │                  │          │
│  └──────────┴────────────────┴──────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 TAB 1: GÉNÉRER (Mode Preview Manuel)

**Objectif**: Générer un briefing pour **voir l'aperçu** (PAS d'envoi automatique)

```
┌─────────────────────────────────────────────────────┐
│ 📋 Générer un Briefing                             │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Sélectionnez le type de briefing:                  │
│                                                      │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│ │ 🌅 MATIN │  │ ☀️ MIDI  │  │ 🌆 SOIR  │          │
│ │          │  │          │  │          │          │
│ │ Asie     │  │ Wall St  │  │ Clôture  │          │
│ │ Futures  │  │ Europe   │  │ Asie     │          │
│ │          │  │          │  │          │          │
│ └──────────┘  └──────────┘  └──────────┘          │
│                                                      │
│ [🔄 Générer Preview]                                │
│                                                      │
├─────────────────────────────────────────────────────┤
│ 👁️ Aperçu du Briefing                             │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌─────────────────────────────────────────────┐   │
│ │ [Iframe Preview]                            │   │
│ │                                              │   │
│ │                                              │   │
│ └─────────────────────────────────────────────┘   │
│                                                      │
│ ┌─────────────────────────────────────────────┐   │
│ │ ✏️ Éditer HTML  |  💾 Sauvegarder  |  📧 Envoyer│
│ └─────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Workflow**:
1. Utilisateur clique type (Matin/Midi/Soir)
2. Clique "Générer Preview"
3. Voit l'aperçu dans iframe
4. Peut éditer, sauvegarder OU envoyer manuellement

---

## ⚙️ TAB 2: AUTOMATION (Crons Automatiques)

**Objectif**: Activer/désactiver les **envois automatiques** quotidiens

```
┌─────────────────────────────────────────────────────┐
│ ⚙️ Briefings Automatiques (Cron Jobs)             │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📅 Envois Automatiques Quotidiens (Lun-Ven)        │
│                                                      │
│ ┌──────────────────────────────────────────────┐  │
│ │ 🌅 Briefing Matin - 7h20 ET                 │  │
│ │ Asie • Futures • Préouverture               │  │
│ │                                  [🟢 ACTIF]  │  │
│ │ ────────────────────────────────────────────  │  │
│ │ Destinataire: projetsjsl@gmail.com          │  │
│ │ Dernière exécution: Aujourd'hui 7:20        │  │
│ │ Prochain envoi: Demain 7:20                 │  │
│ │                                              │  │
│ │ [Désactiver] [Tester Maintenant]            │  │
│ └──────────────────────────────────────────────┘  │
│                                                      │
│ ┌──────────────────────────────────────────────┐  │
│ │ ☀️ Briefing Midi - 11h50 ET                 │  │
│ │ Wall Street • Clôture Europe                │  │
│ │                                  [🔴 INACTIF]│  │
│ │ ────────────────────────────────────────────  │  │
│ │ Destinataire: [Ajouter email]               │  │
│ │                                              │  │
│ │ [Activer] [Configurer]                      │  │
│ └──────────────────────────────────────────────┘  │
│                                                      │
│ ┌──────────────────────────────────────────────┐  │
│ │ 🌆 Briefing Soir - 16h20 ET                 │  │
│ │ Clôture US • Asie Next                      │  │
│ │                                  [🟢 ACTIF]  │  │
│ │ ────────────────────────────────────────────  │  │
│ │ Destinataire: projetsjsl@gmail.com          │  │
│ │ Dernière exécution: Aujourd'hui 16:20       │  │
│ │ Prochain envoi: Demain 16:20                │  │
│ │                                              │  │
│ │ [Désactiver] [Tester Maintenant]            │  │
│ └──────────────────────────────────────────────┘  │
│                                                      │
│ ⚙️ Configuration Globale                            │
│ ┌──────────────────────────────────────────────┐  │
│ │ Timezone: Eastern Time (ET)                 │  │
│ │ Jours actifs: Lundi-Vendredi                │  │
│ │ Statut Vercel Crons: ✅ Configuré            │  │
│ └──────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Features**:
- Toggle ON/OFF pour chaque cron
- Statut en temps réel (Actif/Inactif)
- Dernière exécution + Prochain envoi
- Bouton "Tester Maintenant" (envoi immédiat)
- Configuration destinataire par cron

---

## ✉️ TAB 3: EMAIL PERSONNALISÉ (Prompt Custom)

**Objectif**: Créer un **email ponctuel** avec **prompt modifiable** sur sujet spécifique

```
┌─────────────────────────────────────────────────────┐
│ ✉️ Email Personnalisé Ponctuel                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📝 Prompt Personnalisé                              │
│ ┌──────────────────────────────────────────────┐  │
│ │ Décris le briefing que tu veux:             │  │
│ │ ┌──────────────────────────────────────────┐│  │
│ │ │ Exemple:                                 ││  │
│ │ │ "Analyse détaillée de Tesla suite à la  ││  │
│ │ │  publication des Q4 earnings. Focus sur  ││  │
│ │ │  les marges et le guidance 2025."        ││  │
│ │ │                                          ││  │
│ │ │ [Textarea - 10 lignes]                   ││  │
│ │ │                                          ││  │
│ │ └──────────────────────────────────────────┘│  │
│ └──────────────────────────────────────────────┘  │
│                                                      │
│ 🎯 Paramètres                                       │
│ ┌──────────────────────────────────────────────┐  │
│ │ Tickers à analyser (optionnel):             │  │
│ │ [TSLA, AAPL, GOOGL...]                      │  │
│ │                                              │  │
│ │ Sources prioritaires:                       │  │
│ │ ☑️ Earnings Calendar                         │  │
│ │ ☑️ News (Finnhub)                            │  │
│ │ ☑️ Prix & Volumes                            │  │
│ │ ☑️ Indicateurs Techniques                    │  │
│ └──────────────────────────────────────────────┘  │
│                                                      │
│ 📧 Destinataire(s)                                  │
│ ┌──────────────────────────────────────────────┐  │
│ │ [projetsjsl@gmail.com]                      │  │
│ │ [+ Ajouter destinataire]                    │  │
│ └──────────────────────────────────────────────┘  │
│                                                      │
│ [🔄 Générer Aperçu] [📧 Générer & Envoyer Direct]  │
│                                                      │
├─────────────────────────────────────────────────────┤
│ 👁️ Aperçu                                          │
├─────────────────────────────────────────────────────┤
│ [Iframe Preview si généré]                         │
└─────────────────────────────────────────────────────┘
```

**Features**:
- Textarea pour prompt libre
- Sélection tickers optionnels
- Checkboxes pour sources de données
- Multi-destinataires
- Bouton "Aperçu" (preview sans envoi)
- Bouton "Générer & Envoyer Direct" (one-shot)

---

## 🎨 Avantages du Redesign

### ✅ User-Friendly
1. **Séparation claire** des 3 cas d'usage
2. **Tabs** = Organisation visuelle immédiate
3. **Workflow évident** pour chaque mode
4. **Pas de confusion** entre génération et envoi

### ✅ Flexibilité
1. **Mode Manuel** = Preview sans engagement
2. **Mode Auto** = Set & Forget
3. **Mode Custom** = Contrôle total

### ✅ Feedback Utilisateur
1. **Statuts clairs** (Actif/Inactif, Dernière exec, etc.)
2. **Progress bars** pendant génération
3. **Messages de succès/erreur** contextuels

---

## 🚀 Implémentation

### Phase 1: Structure Tabs
- Créer composant TabSystem React
- 3 tabs: Générer, Automation, Personnalisé

### Phase 2: Tab Générer
- Radio buttons pour type
- Bouton "Générer Preview"
- Iframe preview
- Actions: Éditer, Sauvegarder, Envoyer

### Phase 3: Tab Automation
- 3 Cards (Matin/Midi/Soir)
- Toggle switches ON/OFF
- Statuts temps réel
- Bouton "Tester Maintenant"

### Phase 4: Tab Personnalisé
- Textarea prompt
- Input tickers
- Checkboxes sources
- Multi-destinataires
- Dual buttons (Preview vs Direct)

---

## 📊 Wireframe Visuel

```
┌─────────────────────────────────────────────────────────────┐
│  📡 Emma En Direct - BÊTA v2.0                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Header avec status: Système actif]                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┏━━━━━━━━━━┓ ┌────────────┐ ┌──────────────┐             │
│  ┃ GÉNÉRER  ┃ │ AUTOMATION │ │ PERSONNALISÉ │             │
│  ┗━━━━━━━━━━┛ └────────────┘ └──────────────┘             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  [Contenu du tab actif]                            │   │
│  │                                                      │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

**Validation Requise**: Approuver ce design avant implémentation?
