/**
 * Script de Débogage GOD MODE
 * 
 * À exécuter dans la console pour diagnostiquer pourquoi rien ne s'affiche
 */

(function() {
    'use strict';

    console.log('%c🔍 DÉBOGAGE GOD MODE', 'color: #8b5cf6; font-weight: bold; font-size: 16px');
    console.log('='.repeat(50));

    const checks = {
        react: typeof window.React !== 'undefined',
        reactDOM: typeof window.ReactDOM !== 'undefined',
        reactGridLayout: typeof window.ReactGridLayout !== 'undefined',
        betaCombinedDashboard: typeof window.BetaCombinedDashboard !== 'undefined',
        dashboardGridWrapper: typeof window.DashboardGridWrapper !== 'undefined',
        rootElement: document.getElementById('root') !== null,
        rootHasContent: document.getElementById('root')?.children.length > 0
    };

    console.log('\n📋 Vérifications de base:');
    Object.entries(checks).forEach(([key, value]) => {
        console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
    });

    // Vérifier le viewMode
    const viewMode = localStorage.getItem('gob-dashboard-view-mode');
    console.log(`\n📊 View Mode: ${viewMode || 'null (défaut = grid)'}`);

    // Vérifier le layout
    const layout = localStorage.getItem('gob_dashboard_grid_layout_v1');
    console.log(`📐 Layout sauvegardé: ${layout ? 'Oui' : 'Non'}`);
    if (layout) {
        try {
            const parsed = JSON.parse(layout);
            console.log(`   Widgets: ${parsed.length}`);
            parsed.forEach(item => {
                console.log(`   - ${item.i}: ${item.w}x${item.h} @ (${item.x}, ${item.y})`);
            });
        } catch (e) {
            console.error('   Erreur parsing:', e);
        }
    }

    // Vérifier les composants disponibles
    console.log('\n🧩 Composants disponibles:');
    const components = [
        'MarketsEconomyTabRGL',
        'RglDashboard',
        'JLabTab',
        'AskEmmaTab',
        'StocksNewsTab',
        'MarketsEconomyTab'
    ];
    components.forEach(comp => {
        const exists = typeof window[comp] !== 'undefined';
        console.log(`  ${exists ? '✅' : '❌'} ${comp}`);
    });

    // Vérifier le rendu actuel
    console.log('\n🎨 État du rendu:');
    const root = document.getElementById('root');
    if (root) {
        console.log(`  Root existe: ✅`);
        console.log(`  Enfants: ${root.children.length}`);
        console.log(`  HTML (premiers 500 chars):`, root.innerHTML.substring(0, 500));
        
        // Vérifier si la grille est rendue
        const gridItems = root.querySelectorAll('.react-grid-item');
        const gridLayout = root.querySelector('.react-grid-layout');
        console.log(`  Items grille: ${gridItems.length}`);
        console.log(`  Layout grille: ${gridLayout ? 'Oui' : 'Non'}`);
    } else {
        console.log('  Root existe: ❌');
    }

    // Vérifier les erreurs console
    console.log('\n⚠️ Erreurs récentes:');
    if (window.__consoleErrors && window.__consoleErrors.length > 0) {
        window.__consoleErrors.forEach((err, i) => {
            console.error(`  ${i + 1}. ${err}`);
        });
    } else {
        console.log('  Aucune erreur capturée');
    }

    // Suggestions de correction
    console.log('\n💡 Suggestions:');
    if (!checks.dashboardGridWrapper) {
        console.log('  ❌ DashboardGridWrapper non chargé');
        console.log('     → Vérifier que le script est chargé dans beta-combined-dashboard.html');
    }
    if (!checks.reactGridLayout) {
        console.log('  ❌ React Grid Layout non chargé');
        console.log('     → Vérifier le CDN dans beta-combined-dashboard.html');
    }
    if (viewMode === 'tabs') {
        console.log('  ⚠️ Mode onglets actif');
        console.log('     → Cliquer sur le toggle pour passer en mode grille');
    }
    if (!layout) {
        console.log('  ⚠️ Aucun layout sauvegardé');
        console.log('     → Le layout par défaut devrait être créé automatiquement');
    }

    // Fonction pour forcer le mode grille
    window.forceGridMode = function() {
        localStorage.setItem('gob-dashboard-view-mode', 'grid');
        console.log('✅ Mode grille forcé, recharger la page');
        window.location.reload();
    };

    // Fonction pour réinitialiser le layout
    window.resetGridLayout = function() {
        localStorage.removeItem('gob_dashboard_grid_layout_v1');
        localStorage.setItem('gob-dashboard-view-mode', 'grid');
        console.log('✅ Layout réinitialisé, recharger la page');
        window.location.reload();
    };

    console.log('\n🔧 Fonctions disponibles:');
    console.log('  - forceGridMode() : Forcer le mode grille');
    console.log('  - resetGridLayout() : Réinitialiser le layout');

    console.log('\n' + '='.repeat(50));
})();
