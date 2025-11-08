# 📋 Guide : Configuration Séparée par Trigger

## 🎯 Objectif

Chaque type de trigger a maintenant son propre node de configuration, permettant de contrôler indépendamment l'envoi des emails pour chaque type.

## 🔧 Nodes de Configuration

### 1. **Schedule Config** (Briefings Automatiques)

**Trigger** : Schedule Trigger (7h/12h/16h30 EST)

**Valeurs par défaut** :
- `preview_mode = false` → Envoi direct
- `approved = true` → Approuvé

**Usage** : Pour les briefings automatiques quotidiens (matin, midi, soir)

**Pour désactiver l'envoi automatique** :
1. Ouvrez le node "Schedule Config"
2. Changez `preview_mode` à `true` OU `approved` à `false`

---

### 2. **Webhook Config** (Webhooks Externes)

**Trigger** : Webhook Trigger

**Valeurs par défaut** :
- `preview_mode = false` → Envoi direct
- `approved = true` → Approuvé

**Usage** : Pour les webhooks externes qui déclenchent des briefings

**Pour désactiver l'envoi** :
1. Ouvrez le node "Webhook Config"
2. Changez `preview_mode` à `true` OU `approved` à `false`

---

### 3. **Manual Config** (Triggers Manuels)

**Trigger** : Manual Trigger (Custom Prompt)

**Valeurs par défaut** :
- `preview_mode = true` → Mode preview (pas d'envoi)
- `approved = false` → Non approuvé

**Usage** : Pour les tests manuels avec prompts personnalisés

**Pour activer l'envoi** :
1. Ouvrez le node "Manual Config"
2. Changez `preview_mode` à `false` ET `approved` à `true`

---

### 4. **Chat Config** (Previews)

**Trigger** : Chat Trigger (Preview)

**Valeurs par défaut** :
- `preview_mode = true` → Toujours en preview
- `approved = false` → Non approuvé

**Usage** : Pour les previews interactives (toujours en mode preview)

**Note** : Ce trigger est conçu pour les previews uniquement, ne pas modifier pour l'envoi.

---

## 📊 Tableau Récapitulatif

| Trigger | Node Config | Preview Mode | Approved | Comportement |
|---------|-------------|--------------|----------|-------------|
| Schedule (7h/12h/16h30) | Schedule Config | `false` | `true` | ✅ Envoi automatique |
| Webhook | Webhook Config | `false` | `true` | ✅ Envoi direct |
| Manual (Custom Prompt) | Manual Config | `true` | `false` | 👁️ Preview uniquement |
| Chat (Preview) | Chat Config | `true` | `false` | 👁️ Preview uniquement |

---

## 🚀 Scénarios d'Utilisation

### Scénario 1 : Activer les Briefings Automatiques

**Configuration** :
- Schedule Config : `preview_mode = false`, `approved = true`
- ✅ Les briefings seront envoyés automatiquement aux horaires configurés

---

### Scénario 2 : Désactiver Temporairement les Briefings Automatiques

**Configuration** :
- Schedule Config : `preview_mode = true` OU `approved = false`
- ❌ Les briefings automatiques ne seront pas envoyés (mode preview)

---

### Scénario 3 : Tester un Prompt Personnalisé

**Configuration** :
- Manual Config : `preview_mode = true`, `approved = false`
- 👁️ Le briefing sera généré mais pas envoyé (preview)

**Pour envoyer après test** :
- Manual Config : `preview_mode = false`, `approved = true`
- ✅ Le briefing sera envoyé

---

### Scénario 4 : Activer l'Envoi pour les Webhooks

**Configuration** :
- Webhook Config : `preview_mode = false`, `approved = true`
- ✅ Les briefings déclenchés par webhook seront envoyés

---

## ⚙️ Comment Modifier une Configuration

1. **Ouvrez le workflow n8n**
2. **Trouvez le node de configuration approprié** :
   - Schedule Config (pour les briefings automatiques)
   - Webhook Config (pour les webhooks)
   - Manual Config (pour les tests manuels)
   - Chat Config (pour les previews)
3. **Cliquez sur le node pour l'éditer**
4. **Modifiez les valeurs** :
   - `preview_mode` : `true` = preview, `false` = envoi
   - `approved` : `true` = approuvé, `false` = non approuvé
5. **Sauvegardez** le node
6. **Réexécutez** le workflow si nécessaire

---

## 🛡️ Sécurité

Chaque node de configuration est indépendant :
- ✅ Vous pouvez désactiver les briefings automatiques sans affecter les tests manuels
- ✅ Vous pouvez activer l'envoi pour les webhooks sans affecter les previews
- ✅ Les previews (Chat Config) restent toujours en mode preview

---

## 📝 Notes Importantes

1. **Schedule Config** : Modifier ce node affecte tous les briefings automatiques (matin, midi, soir)
2. **Manual Config** : Par défaut en preview pour éviter les envois accidentels lors des tests
3. **Chat Config** : Conçu uniquement pour les previews, ne pas modifier pour l'envoi
4. **Webhook Config** : Pour les intégrations externes, configurer selon vos besoins

---

**Dernière mise à jour :** Décembre 2024

