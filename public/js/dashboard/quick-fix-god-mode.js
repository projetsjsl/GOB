/**
 * Quick Fix GOD MODE
 * 
 * Script de correction rapide a executer dans la console
 * Si rien ne s'affiche, executez ce script
 */

(function() {
    'use strict';

    console.log('%c QUICK FIX GOD MODE', 'color: #ef4444; font-weight: bold; font-size: 16px');
    console.log('='.repeat(50));

    // 1. Forcer le mode grille
    localStorage.setItem('gob-dashboard-view-mode', 'grid');
    console.log(' Mode grille force');

    // 2. Creer un layout par defaut minimal
    const defaultLayout = [
        { i: 'titres-portfolio', x: 0, y: 0, w: 12, h: 12, minW: 8, minH: 8 },
        { i: 'marches-global', x: 0, y: 12, w: 12, h: 10, minW: 6, minH: 6 },
        { i: 'emma-chat', x: 0, y: 22, w: 6, h: 10, minW: 4, minH: 8 },
        { i: 'jlab-terminal', x: 6, y: 22, w: 6, h: 10, minW: 4, minH: 8 }
    ];

    localStorage.setItem('gob_dashboard_grid_layout_v1', JSON.stringify(defaultLayout));
    console.log(' Layout par defaut cree:', defaultLayout.length, 'widgets');

    // 3. Verifier les composants
    const components = {
        'DashboardGridWrapper': typeof window.DashboardGridWrapper !== 'undefined',
        'ReactGridLayout': typeof window.ReactGridLayout !== 'undefined',
        'StocksNewsTab': typeof window.StocksNewsTab !== 'undefined',
        'MarketsEconomyTab': typeof window.MarketsEconomyTab !== 'undefined',
        'AskEmmaTab': typeof window.AskEmmaTab !== 'undefined',
        'JLabUnifiedTab': typeof window.JLabUnifiedTab !== 'undefined'
    };

    console.log('\n Composants disponibles:');
    Object.entries(components).forEach(([name, available]) => {
        console.log(`  ${available ? '' : ''} ${name}`);
    });

    // 4. Recharger la page
    console.log('\n Rechargement de la page dans 2 secondes...');
    setTimeout(() => {
        window.location.reload();
    }, 2000);

    console.log('\n' + '='.repeat(50));
})();
