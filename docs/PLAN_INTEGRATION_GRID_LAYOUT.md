# Plan d'Intégration Grid Layout dans le Dashboard Principal

## 🎯 Objectif

Transformer le dashboard principal (`beta-combined-dashboard.html`) pour utiliser le système de grid layout modulaire, tout en conservant toutes les fonctionnalités existantes. L'utilisateur doit pouvoir basculer entre la vue onglets (actuelle) et la vue grille (nouvelle).

## 📋 État Actuel

- **Dashboard principal**: `beta-combined-dashboard.html` avec système d'onglets
- **Login redirige vers**: `/beta-combined-dashboard.html`
- **Système actuel**: Navigation par onglets avec `activeTab` / `setActiveTab`
- **Composants**: Tous les tabs sont des composants React individuels

## 🚀 Plan d'Intégration

### Phase 1: Ajout du Toggle Vue Onglets/Grille

**Fichier**: `public/beta-combined-dashboard.html`

1. Ajouter un bouton toggle dans la barre de navigation
2. Ajouter un état `viewMode` ('tabs' | 'grid')
3. Sauvegarder la préférence dans localStorage

```javascript
const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('gob-view-mode');
    return saved || 'tabs'; // Par défaut: onglets (compatibilité)
});
```

### Phase 2: Créer un Wrapper Grid Layout

**Fichier**: `public/js/dashboard/components/grid-layout/DashboardGridWrapper.js` (nouveau)

Créer un composant qui :
- Transforme les onglets existants en widgets de grille
- Mappe chaque tab vers un widget configurable
- Gère le layout persistant par utilisateur

```javascript
const TAB_TO_WIDGET_MAP = {
    'stocks-news': { component: 'StocksNewsTab', defaultSize: { w: 12, h: 10 } },
    'intellistocks': { component: 'IntelliStocksTab', defaultSize: { w: 12, h: 12 } },
    'ask-emma': { component: 'AskEmmaTab', defaultSize: { w: 6, h: 8 } },
    'markets-economy': { component: 'MarketsEconomyTabRGL', defaultSize: { w: 12, h: 10 } },
    // ... tous les autres tabs
};
```

### Phase 3: Intégrer React Grid Layout

**Fichier**: `public/beta-combined-dashboard.html`

1. Le système est déjà chargé (ligne 134-137)
2. Créer un layout par défaut basé sur les onglets actifs
3. Permettre la personnalisation du layout

### Phase 4: Migration des Données

**Fichier**: `public/js/dashboard/components/grid-layout/LayoutMigrator.js` (nouveau)

Créer un système de migration qui :
- Convertit les préférences d'onglets en layout de grille
- Migre les layouts existants vers le nouveau système
- Gère la compatibilité ascendante

### Phase 5: Mode Édition

Ajouter un mode édition pour :
- Activer/désactiver le drag & drop
- Redimensionner les widgets
- Ajouter/supprimer des widgets
- Sauvegarder le layout personnalisé

## 🔧 Implémentation Détaillée

### Étape 1: Modifier BetaCombinedDashboard

**Dans `app-inline.js`**, ajouter :

```javascript
const BetaCombinedDashboard = () => {
    // ... états existants ...
    
    // Nouvel état pour le mode de vue
    const [viewMode, setViewMode] = useState(() => {
        try {
            return localStorage.getItem('gob-view-mode') || 'tabs';
        } catch {
            return 'tabs';
        }
    });
    
    // Layout pour la vue grille
    const [gridLayout, setGridLayout] = useState(() => {
        try {
            const saved = localStorage.getItem('gob-grid-layout');
            return saved ? JSON.parse(saved) : getDefaultGridLayout();
        } catch {
            return getDefaultGridLayout();
        }
    });
    
    // Fonction pour obtenir le layout par défaut basé sur les onglets
    const getDefaultGridLayout = () => {
        return [
            { i: 'stocks-news', x: 0, y: 0, w: 12, h: 10 },
            { i: 'intellistocks', x: 0, y: 10, w: 12, h: 12 },
            { i: 'ask-emma', x: 0, y: 22, w: 6, h: 8 },
            // ... autres widgets par défaut
        ];
    };
    
    // Render conditionnel
    return (
        <div>
            {/* Barre de navigation avec toggle */}
            <nav>
                {/* ... navigation existante ... */}
                <button onClick={() => {
                    const newMode = viewMode === 'tabs' ? 'grid' : 'tabs';
                    setViewMode(newMode);
                    localStorage.setItem('gob-view-mode', newMode);
                }}>
                    {viewMode === 'tabs' ? '📐 Vue Grille' : '📑 Vue Onglets'}
                </button>
            </nav>
            
            {/* Contenu conditionnel */}
            {viewMode === 'tabs' ? (
                // Vue onglets existante
                <div className="tab-content">
                    {/* ... contenu actuel ... */}
                </div>
            ) : (
                // Vue grille nouvelle
                <DashboardGridWrapper 
                    layout={gridLayout}
                    onLayoutChange={setGridLayout}
                    isDarkMode={isDarkMode}
                    // Passer tous les états et fonctions nécessaires
                    tickers={tickers}
                    stockData={stockData}
                    newsData={newsData}
                    // ... autres props
                />
            )}
        </div>
    );
};
```

### Étape 2: Créer DashboardGridWrapper

**Nouveau fichier**: `public/js/dashboard/components/grid-layout/DashboardGridWrapper.js`

```javascript
const DashboardGridWrapper = ({ 
    layout, 
    onLayoutChange, 
    isDarkMode,
    // Toutes les props nécessaires pour les composants
    tickers,
    stockData,
    newsData,
    // ... autres props
}) => {
    const RGL = window.ReactGridLayout;
    const ResponsiveGridLayout = useMemo(() => 
        RGL && RGL.WidthProvider && RGL.Responsive 
            ? RGL.WidthProvider(RGL.Responsive) 
            : null
    , [RGL]);
    
    const [isEditing, setIsEditing] = useState(false);
    
    const renderWidget = (item) => {
        const widgetConfig = TAB_TO_WIDGET_MAP[item.i];
        if (!widgetConfig) return null;
        
        const Component = window[widgetConfig.component];
        if (!Component) {
            return <div>Composant {widgetConfig.component} non chargé</div>;
        }
        
        // Passer toutes les props nécessaires
        return (
            <Component
                isDarkMode={isDarkMode}
                tickers={tickers}
                stockData={stockData}
                newsData={newsData}
                // ... autres props
            />
        );
    };
    
    if (!ResponsiveGridLayout) {
        return <div>Chargement du système de grille...</div>;
    }
    
    return (
        <div>
            {/* Contrôles d'édition */}
            <div className="flex justify-end p-4">
                <button onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? '✓ Terminer' : '✎ Modifier Layout'}
                </button>
            </div>
            
            {/* Grille */}
            <ResponsiveGridLayout
                className="layout"
                layouts={{ lg: layout }}
                breakpoints={{ lg: 1200 }}
                cols={{ lg: 12 }}
                rowHeight={50}
                onLayoutChange={(newLayout) => {
                    if (isEditing) {
                        onLayoutChange(newLayout);
                        localStorage.setItem('gob-grid-layout', JSON.stringify(newLayout));
                    }
                }}
                isDraggable={isEditing}
                isResizable={isEditing}
                margin={[16, 16]}
            >
                {layout.map(item => (
                    <div key={item.i}>
                        {renderWidget(item)}
                    </div>
                ))}
            </ResponsiveGridLayout>
        </div>
    );
};
```

### Étape 3: Mapping des Composants

Créer le mapping complet entre les tabs et les widgets :

```javascript
const TAB_TO_WIDGET_MAP = {
    'stocks-news': {
        component: 'StocksNewsTab',
        label: 'Stocks & News',
        icon: 'Newspaper',
        defaultSize: { w: 12, h: 10 },
        minSize: { w: 6, h: 6 }
    },
    'intellistocks': {
        component: 'IntelliStocksTab',
        label: 'JLab™',
        icon: 'ChartLine',
        defaultSize: { w: 12, h: 12 },
        minSize: { w: 8, h: 8 }
    },
    'ask-emma': {
        component: 'AskEmmaTab',
        label: 'Emma IA™',
        icon: 'Brain',
        defaultSize: { w: 6, h: 8 },
        minSize: { w: 4, h: 6 }
    },
    'markets-economy': {
        component: 'MarketsEconomyTabRGL',
        label: 'Marchés & Économie',
        icon: 'Globe',
        defaultSize: { w: 12, h: 10 },
        minSize: { w: 6, h: 6 }
    },
    // ... tous les autres tabs
};
```

## 📝 Checklist d'Implémentation

- [ ] Ajouter le toggle vue onglets/grille dans la navigation
- [ ] Créer `DashboardGridWrapper.js`
- [ ] Créer le mapping TAB_TO_WIDGET_MAP
- [ ] Intégrer React Grid Layout dans le rendu conditionnel
- [ ] Ajouter le mode édition avec bouton
- [ ] Implémenter la sauvegarde du layout dans localStorage
- [ ] Créer un layout par défaut basé sur les onglets
- [ ] Tester la compatibilité avec tous les composants
- [ ] Ajouter la migration des préférences existantes
- [ ] Documenter le nouveau système

## 🎨 Expérience Utilisateur

1. **Par défaut**: Vue onglets (comportement actuel)
2. **Toggle**: Bouton pour basculer vers vue grille
3. **Première utilisation grille**: Layout par défaut basé sur les onglets actifs
4. **Personnalisation**: Mode édition pour réorganiser
5. **Persistance**: Layout sauvegardé par utilisateur

## 🔄 Migration Progressive

- Phase 1: Ajouter le toggle (vue onglets par défaut)
- Phase 2: Implémenter la vue grille en parallèle
- Phase 3: Permettre la bascule entre les deux vues
- Phase 4: Rendre la vue grille par défaut (optionnel)

## ⚠️ Points d'Attention

1. **Compatibilité**: Tous les composants doivent fonctionner en mode widget
2. **Performance**: Le grid layout ne doit pas ralentir le dashboard
3. **Mobile**: Adapter le layout pour mobile (breakpoints)
4. **Migration**: Gérer la transition pour les utilisateurs existants
