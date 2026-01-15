/**
 * Script de Debogage GOD MODE
 * 
 * A executer dans la console pour diagnostiquer pourquoi rien ne s'affiche
 */

(function() {
    'use strict';

    console.log('%c DEBOGAGE GOD MODE', 'color: #8b5cf6; font-weight: bold; font-size: 16px');
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

    console.log('\n Verifications de base:');
    Object.entries(checks).forEach(([key, value]) => {
        console.log(`  ${value ? '' : ''} ${key}: ${value}`);
    });

    // Verifier le viewMode
    const viewMode = localStorage.getItem('gob-dashboard-view-mode');
    console.log(`\n View Mode: ${viewMode || 'null (defaut = grid)'}`);

    // Verifier le layout
    const layout = localStorage.getItem('gob_dashboard_grid_layout_v1');
    console.log(` Layout sauvegarde: ${layout ? 'Oui' : 'Non'}`);
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

    // Verifier les composants disponibles
    console.log('\n Composants disponibles:');
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
        console.log(`  ${exists ? '' : ''} ${comp}`);
    });

    // Verifier le rendu actuel
    console.log('\n Etat du rendu:');
    const root = document.getElementById('root');
    if (root) {
        console.log(`  Root existe: `);
        console.log(`  Enfants: ${root.children.length}`);
        console.log(`  HTML (premiers 500 chars):`, root.innerHTML.substring(0, 500));
        
        // Verifier si la grille est rendue
        const gridItems = root.querySelectorAll('.react-grid-item');
        const gridLayout = root.querySelector('.react-grid-layout');
        console.log(`  Items grille: ${gridItems.length}`);
        console.log(`  Layout grille: ${gridLayout ? 'Oui' : 'Non'}`);
    } else {
        console.log('  Root existe: ');
    }

    // Verifier les erreurs console
    console.log('\n Erreurs recentes:');
    if (window.__consoleErrors && window.__consoleErrors.length > 0) {
        window.__consoleErrors.forEach((err, i) => {
            console.error(`  ${i + 1}. ${err}`);
        });
    } else {
        console.log('  Aucune erreur capturee');
    }

    // Suggestions de correction
    console.log('\n Suggestions:');
    if (!checks.dashboardGridWrapper) {
        console.log('   DashboardGridWrapper non charge');
        console.log('     -> Verifier que le script est charge dans beta-combined-dashboard.html');
    }
    if (!checks.reactGridLayout) {
        console.log('   React Grid Layout non charge');
        console.log('     -> Verifier le CDN dans beta-combined-dashboard.html');
    }
    if (viewMode === 'tabs') {
        console.log('   Mode onglets actif');
        console.log('     -> Cliquer sur le toggle pour passer en mode grille');
    }
    if (!layout) {
        console.log('   Aucun layout sauvegarde');
        console.log('     -> Le layout par defaut devrait etre cree automatiquement');
    }

    // Fonction pour forcer le mode grille
    window.forceGridMode = function() {
        localStorage.setItem('gob-dashboard-view-mode', 'grid');
        console.log(' Mode grille force, recharger la page');
        window.location.reload();
    };

    // Fonction pour reinitialiser le layout
    window.resetGridLayout = function() {
        localStorage.removeItem('gob_dashboard_grid_layout_v1');
        localStorage.setItem('gob-dashboard-view-mode', 'grid');
        console.log(' Layout reinitialise, recharger la page');
        window.location.reload();
    };

    console.log('\n Fonctions disponibles:');
    console.log('  - forceGridMode() : Forcer le mode grille');
    console.log('  - resetGridLayout() : Reinitialiser le layout');

    console.log('\n' + '='.repeat(50));
})();
