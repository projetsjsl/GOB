# 🎨 Centralisation des Couleurs du Thème GOB

## ✅ Implémentation Complète

Toutes les couleurs utilisées dans le site web et les emails sont maintenant centralisées dans un seul fichier de configuration.

## 📁 Structure

### **Fichier de Configuration Principal**
- **`config/theme-colors.json`** : Configuration centralisée de toutes les couleurs, gradients, et styles

### **Module JavaScript**
- **`lib/theme-colors.js`** : Module qui charge et expose les couleurs pour utilisation dans le code

### **API Endpoint**
- **`api/theme-colors.js`** : Endpoint HTTP pour accéder aux couleurs depuis n8n ou autres services externes

## 🎯 Utilisation

### **Dans le Code JavaScript (Node.js)**

```javascript
import { colors, gradients, briefingTypes, emailConfig } from './lib/theme-colors.js';

// Utiliser les couleurs
const primaryColor = colors.primary; // #6366f1
const primaryGradient = gradients.primary; // linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)

// Utiliser la config email
const containerWidth = emailConfig.spacing.containerMaxWidth; // 700px
```

### **Dans n8n (Workflow)**

Le workflow n8n a été mis à jour pour utiliser les couleurs centralisées. Les couleurs sont intégrées directement dans le code JavaScript du nœud "Generate HTML Newsletter".

**Alternative** : Vous pouvez aussi appeler l'API `/api/theme-colors` pour récupérer les couleurs dynamiquement.

### **Dans les Templates Email**

Tous les templates email utilisent maintenant les couleurs centralisées :

- ✅ `lib/email-templates.js` - Templates pour briefings (morning/midday/evening)
- ✅ `lib/briefing-confirmation.js` - Emails de confirmation
- ✅ Workflow n8n - Newsletter automatisée

## 📋 Couleurs Disponibles

### **Couleurs Principales**
- `primary` : #6366f1 (Indigo-500)
- `primaryDark` : #4f46e5 (Indigo-600)
- `primaryLight` : #8b5cf6 (Violet-500)
- `secondary` : #7c3aed (Violet-600)
- `success` : #10b981 (Emerald-500)
- `warning` : #f59e0b (Amber-500)
- `error` : #ef4444 (Red-500)

### **Couleurs de Texte**
- `text.dark` : #1f2937 (Gray-800)
- `text.medium` : #4b5563 (Gray-600)
- `text.light` : #6b7280 (Gray-500)
- `text.muted` : #9ca3af (Gray-400)

### **Couleurs de Fond**
- `background.white` : #ffffff
- `background.light` : #f8fafc (Gray-50)
- `background.medium` : #f1f5f9 (Slate-100)
- `background.dark` : #e2e8f0 (Slate-200)

### **Gradients**
- `gradients.primary` : linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)
- `gradients.primaryAlt` : linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)
- `gradients.secondary` : linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)
- `gradients.success` : linear-gradient(135deg, #059669 0%, #10b981 100%)
- `gradients.warning` : linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)
- `gradients.info` : linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)

### **Briefings par Type**
Chaque type de briefing a ses propres couleurs :
- **Morning** : Gradient orange/jaune (#f59e0b → #fbbf24)
- **Midday** : Gradient bleu (#3b82f6 → #2563eb)
- **Evening** : Gradient violet (#8b5cf6 → #7c3aed)

## 🔄 Modification des Couleurs

Pour modifier les couleurs du thème :

1. **Éditer `config/theme-colors.json`**
   - Modifier les valeurs hexadécimales
   - Ajouter de nouvelles couleurs si nécessaire

2. **Redéployer**
   - Les changements seront automatiquement pris en compte dans :
     - Les templates email (`lib/email-templates.js`)
     - Les confirmations (`lib/briefing-confirmation.js`)
     - Le workflow n8n (nécessite une mise à jour via script)

3. **Mettre à jour n8n (si nécessaire)**
   ```bash
   node update-n8n-workflow-with-theme.js
   ```

## 📧 Emails Concernés

Tous les emails suivants utilisent maintenant les couleurs centralisées :

1. ✅ **Newsletter automatisée (n8n)** - Workflow "Emma Newsletter"
2. ✅ **Briefings matin** - Template avec gradient orange/jaune
3. ✅ **Briefings midi** - Template avec gradient bleu
4. ✅ **Briefings soir** - Template avec gradient violet
5. ✅ **Confirmations d'envoi** - Emails de confirmation après envoi de briefing

## 🎨 Cohérence Visuelle

Tous les emails partagent maintenant :
- ✅ Même palette de couleurs (purple/indigo)
- ✅ Même typographie (Inter/Roboto)
- ✅ Même espacement et bordures arrondies
- ✅ Même style de gradients
- ✅ Même niveau de professionnalisme

## 📝 Notes

- Les couleurs sont chargées une seule fois au démarrage du module
- En cas d'erreur de chargement, des couleurs par défaut sont utilisées
- L'API `/api/theme-colors` permet d'accéder aux couleurs depuis n8n ou d'autres services
- Le workflow n8n contient les couleurs intégrées (pas besoin d'appel API)

## 🔗 Fichiers Modifiés

- ✅ `config/theme-colors.json` - **NOUVEAU** : Configuration centralisée
- ✅ `lib/theme-colors.js` - **NOUVEAU** : Module JavaScript
- ✅ `api/theme-colors.js` - **NOUVEAU** : Endpoint API
- ✅ `lib/email-templates.js` - **MODIFIÉ** : Utilise les couleurs centralisées
- ✅ `lib/briefing-confirmation.js` - **MODIFIÉ** : Utilise les couleurs centralisées
- ✅ `n8n-workflow-03lgcA4e9uRTtli1.json` - **MODIFIÉ** : Couleurs intégrées dans le code
- ✅ `vercel.json` - **MODIFIÉ** : Ajout de l'endpoint `api/theme-colors.js`

