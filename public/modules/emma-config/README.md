# Emma Config - Modules JavaScript

Ce dossier contient les modules JavaScript pour l'interface de configuration Emma.

## Architecture

```
emma-config/
 api-client.js          - Appels API centralises (158 lignes)
 ui-helpers.js          - Utilitaires UI (128 lignes)
 preview-manager.js     - Gestion previews Web/SMS/Email (361 lignes)
 design-manager.js      - Gestion design emails (186 lignes)
 sms-manager.js         - Gestion SMS (19 lignes)
 delivery-manager.js    - Gestion destinataires/planification (287 lignes)
 prompts-manager.js     - Logique principale prompts (322 lignes)
 main.js                - Initialisation et coordination (134 lignes)
```

## Dependances entre modules

```
main.js
 ui-helpers.js (switchMainTab, clearFilters)
 preview-manager.js (updatePreview, updateChannelBadges)
 design-manager.js (loadDesignConfig, saveDesign, etc.)
 sms-manager.js (saveSms, cancelSmsChanges)
 delivery-manager.js (showAddRecipientForm, addRecipient, etc.)
 prompts-manager.js (loadConfigs, saveConfig, deleteConfig, etc.)

prompts-manager.js
 api-client.js (loadAllConfigs, saveCurrentConfig, deleteCurrentConfig)
 ui-helpers.js (showStatus, getSectionEmoji, getChannelBadge, getChannelEmoji)
 preview-manager.js (updatePreview, updateChannelBadges)
 delivery-manager.js (loadDeliveryConfig)

preview-manager.js
 api-client.js (fetchFormattedPreview)

design-manager.js
 api-client.js (loadDesignConfig, saveDesignConfig)
 ui-helpers.js (showStatus)

delivery-manager.js
 api-client.js (loadDeliveryConfig, saveDeliveryConfig, sendBriefingNow)
 ui-helpers.js (showStatus)

sms-manager.js
 design-manager.js (saveDesign, cancelDesignChanges)
```

## Utilisation

### Dans le HTML

```html
<script type="module">
    import { init } from './modules/emma-config/main.js';
    window.addEventListener('DOMContentLoaded', init);
</script>
```

### Fonctions globales (exposees via window)

Ces fonctions sont accessibles dans les `onclick` HTML:

- `window.switchMainTab(tab)`
- `window.updatePreview()`
- `window.saveDesignConfig()`
- `window.cancelDesignChanges()`
- `window.resetDesignToDefaults()`
- `window.saveSmsConfig()`
- `window.cancelSmsChanges()`
- `window.showAddRecipientForm()`
- `window.hideAddRecipientForm()`
- `window.addRecipient()`
- `window.removeRecipient(email)`
- `window.toggleRecipientActive(email)`
- `window.saveDeliveryConfig()`
- `window.sendBriefingNow()`

## Ajout d'une nouvelle fonctionnalite

### 1. Determiner le module approprie

- **API**: `api-client.js`
- **Interface utilisateur**: `ui-helpers.js`
- **Preview**: `preview-manager.js`
- **Design email**: `design-manager.js`
- **SMS**: `sms-manager.js`
- **Delivery**: `delivery-manager.js`
- **Prompts**: `prompts-manager.js`
- **Initialisation**: `main.js`

### 2. Ajouter la fonction au module

```javascript
// Dans le module approprie
export function maNouvelleFonction() {
    // Votre code ici
}
```

### 3. Importer dans main.js (si necessaire)

```javascript
import { maNouvelleFonction } from './module.js';

// Si besoin d'exposer globalement pour onclick HTML:
window.maNouvelleFonction = maNouvelleFonction;

// Ou attacher un event listener:
document.getElementById('monBouton').addEventListener('click', maNouvelleFonction);
```

## Bonnes pratiques

###  A FAIRE

- Exporter uniquement ce qui est utilise ailleurs
- Garder les fonctions pures quand c'est possible
- Documenter les fonctions complexes avec JSDoc
- Utiliser des noms de fonctions descriptifs
- Regrouper les fonctions par responsabilite

###  A EVITER

- Variables globales non necessaires
- Dependances circulaires entre modules
- Fonctions trop longues (>50 lignes)
- Code duplique entre modules
- Mutation de state partage

## Tests

Pour tester un module isolement:

```javascript
// test.js
import { functionName } from './modules/emma-config/module.js';

// Votre test ici
console.assert(functionName() === expectedResult);
```

## Performance

-  Modules charges en parallele (HTTP/2)
-  Cache navigateur par module
-  Tree-shaking automatique (modules ES6)
-  Pas de bundling necessaire

## Compatibilite

- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

## Taille totale

- **8 modules**: 1,595 lignes (~76 KB)
- **Gzippe**: ~20 KB

## Maintenance

### Logs de debug

Ajouter des logs dans les modules pour faciliter le debug:

```javascript
console.log('[ModuleName] Action:', data);
```

### Erreurs

Toujours catcher les erreurs et afficher un message utilisateur:

```javascript
try {
    // Votre code
} catch (error) {
    console.error('Erreur:', error);
    showStatus(' Une erreur est survenue', 'error');
}
```

## Documentation complete

Voir: `/MODULARISATION-EMMA-CONFIG-RAPPORT.md`
