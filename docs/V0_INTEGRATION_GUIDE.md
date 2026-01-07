# Guide d'Intégration des Composants v0.app

Ce guide explique comment intégrer directement vos composants créés dans v0.app dans le dashboard GOB **sans conversion manuelle**.

## 🎯 Objectif

Permettre l'intégration directe des composants v0.app dans le dashboard GOB sans avoir à convertir manuellement le code TypeScript/JSX.

## 📦 Système d'Intégration

Le système utilise le **V0 Integration Wrapper** (`/js/dashboard/components/v0-integration-wrapper.js`) qui :
- Charge automatiquement les dépendances (React, Recharts, etc.)
- Convertit le code TypeScript/JSX en temps réel
- Expose les composants globalement
- Gère la compatibilité avec Babel Standalone

## 🚀 Utilisation

### Étape 1: Placer votre composant v0

Placez votre composant créé dans v0.app dans le dossier :
```
public/v0-components/[nom-du-composant]/
```

Ou utilisez le dossier existant :
```
public/yieldcurveanalytics/components/
```

### Étape 2: Créer un wrapper Tab

Créez un fichier wrapper dans `/js/dashboard/components/tabs/[NomComposant]Tab.js` :

```javascript
const { useState, useEffect } = React;

const MonComposantTab = ({ isDarkMode }) => {
    const [componentReady, setComponentReady] = useState(false);

    useEffect(() => {
        // Charger le composant v0 via le wrapper
        if (window.V0Integration) {
            window.V0Integration.loadV0Component(
                '/v0-components/mon-composant/component.tsx',
                'MonComposantV0'
            ).then(() => {
                setComponentReady(true);
            }).catch((error) => {
                console.error('Erreur lors du chargement:', error);
            });
        }
    }, []);

    if (!componentReady || !window.MonComposantV0) {
        return <div>Chargement...</div>;
    }

    return <window.MonComposantV0 isDarkMode={isDarkMode} />;
};

window.MonComposantTab = MonComposantTab;
```

### Étape 3: Ajouter au dashboard

1. **Ajouter dans `app-inline.js`** :
```javascript
// Dans SUB_TABS
'jlab': [
    // ... autres onglets
    { id: 'jlab-mon-composant', label: 'Mon Composant', icon: 'Component', component: 'MonComposantTab' }
],

// Dans TAB_ID_MAPPING
'jlab-mon-composant': { main: 'jlab', sub: 'jlab-mon-composant' },

// Dans le rendu
{activeTab === 'jlab-mon-composant' && window.MonComposantTab && 
    <window.MonComposantTab key={`jlab-mon-composant-${tabMountKeys['jlab-mon-composant'] || 0}`} isDarkMode={isDarkMode} />}
```

2. **Ajouter dans `DashboardGridWrapper.js`** :
```javascript
// Dans TAB_TO_WIDGET_MAP
'jlab-mon-composant': { 
    component: 'MonComposantTab', 
    label: 'Mon Composant', 
    icon: 'Component', 
    defaultSize: { w: 12, h: 12 }, 
    minSize: { w: 8, h: 8 } 
},
```

3. **Ajouter dans `tab-lazy-loader.js`** :
```javascript
'jlab-mon-composant': '/js/dashboard/components/tabs/MonComposantTab.js',
```

## 🔧 Adaptations Automatiques

Le wrapper V0 fait automatiquement :
- ✅ Conversion des imports ES6 → accès `window.*`
- ✅ Suppression des types TypeScript
- ✅ Gestion des formats UMD (default exports)
- ✅ Chargement des dépendances (React, Recharts, etc.)

## ⚠️ Limitations

### Imports à éviter
Le wrapper ne peut pas gérer :
- ❌ Imports de composants locaux complexes (`import { X } from './local'`)
- ❌ Imports avec alias TypeScript (`import { X } from '@/lib'`)
- ❌ Imports de bibliothèques non standard

### Solutions

1. **Pour les imports locaux** : Copier le code directement dans le composant ou créer des fonctions globales
2. **Pour les alias** : Utiliser des chemins relatifs ou créer des fonctions globales
3. **Pour les bibliothèques** : Les ajouter dans `V0_DEPENDENCIES` du wrapper

## 📝 Exemple Complet : CurveWatch

Voir `/js/dashboard/components/tabs/CurveWatchTab.js` pour un exemple complet d'intégration.

## 🎨 Bonnes Pratiques

1. **Tester d'abord** : Testez votre composant dans la page standalone avant l'intégration
2. **Gérer les erreurs** : Ajoutez toujours un fallback en cas d'échec de chargement
3. **Mode debug** : Utilisez `console.log` pour diagnostiquer les problèmes
4. **Dépendances** : Vérifiez que toutes les dépendances sont dans `V0_DEPENDENCIES`

## 🐛 Dépannage

### Le composant ne se charge pas
- Vérifiez que le chemin du fichier est correct
- Vérifiez la console pour les erreurs
- Vérifiez que `window.V0Integration` est disponible

### Erreurs de dépendances
- Vérifiez que les dépendances sont dans `V0_DEPENDENCIES`
- Vérifiez que les CDN sont accessibles

### Erreurs de conversion
- Vérifiez que le code TypeScript est valide
- Vérifiez que les imports sont compatibles

## 📚 Ressources

- **Wrapper V0** : `/js/dashboard/components/v0-integration-wrapper.js`
- **Exemple CurveWatch** : `/js/dashboard/components/tabs/CurveWatchTab.js`
- **Composants v0** : `/public/yieldcurveanalytics/components/`
