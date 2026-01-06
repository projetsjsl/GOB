/**
 * Script de test visuel pour vérifier les intégrations FastGraph et Ground News
 * Capture les preuves visuelles et les logs de console
 */

import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Démarrer un serveur HTTP simple
function startServer(port = 8080) {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            let filePath = join(rootDir, 'public', req.url === '/' ? 'beta-combined-dashboard.html' : req.url);
            
            // Gérer les routes API mockées
            if (req.url.startsWith('/api/')) {
                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                if (req.url.includes('fastgraphs-login')) {
                    res.end(JSON.stringify({ 
                        success: true, 
                        session: { url: 'https://www.fastgraphs.com/' },
                        message: 'Mock login successful'
                    }));
                } else {
                    res.end(JSON.stringify({ success: true }));
                }
                return;
            }

            // Servir les fichiers statiques
            if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
                res.writeHead(404);
                res.end('Not found');
                return;
            }

            const ext = filePath.split('.').pop();
            const contentType = {
                'html': 'text/html',
                'js': 'application/javascript',
                'css': 'text/css',
                'json': 'application/json',
                'png': 'image/png',
                'jpg': 'image/jpeg'
            }[ext] || 'text/plain';

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(fs.readFileSync(filePath));
        });

        server.listen(port, () => {
            console.log(`✅ Serveur HTTP démarré sur http://localhost:${port}`);
            resolve(server);
        });
    });
}

async function testIntegrations() {
    let server;
    let browser;
    let page;

    try {
        // Démarrer le serveur
        server = await startServer(8080);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Lancer le navigateur
        console.log('🌐 Lancement du navigateur...');
        browser = await chromium.launch({ headless: false });
        page = await browser.newPage();

        // Capturer les logs de console
        const consoleLogs = [];
        const consoleErrors = [];
        const consoleWarnings = [];

        page.on('console', msg => {
            const text = msg.text();
            const type = msg.type();
            if (type === 'error') {
                consoleErrors.push(text);
            } else if (type === 'warning') {
                consoleWarnings.push(text);
            } else {
                consoleLogs.push({ type, text });
            }
        });

        // Capturer les erreurs de page
        page.on('pageerror', error => {
            consoleErrors.push(`Page Error: ${error.message}`);
        });

        // Naviguer vers le dashboard
        console.log('📊 Navigation vers le dashboard...');
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 30000 });

        // Attendre que la page charge
        await page.waitForTimeout(3000);

        // Vérifier le CSS Tailwind
        console.log('🎨 Vérification du CSS Tailwind...');
        const tailwindLoaded = await page.evaluate(() => {
            const link = document.querySelector('link[href="/css/tailwind.css"]');
            return link !== null;
        });

        const cdnTailwind = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            return scripts.some(s => s.src && s.src.includes('cdn.tailwindcss.com'));
        });

        // Prendre un screenshot de la page principale
        await page.screenshot({ path: join(rootDir, 'test-screenshot-main.png'), fullPage: true });
        console.log('📸 Screenshot principal capturé: test-screenshot-main.png');

        // Chercher l'onglet Titres/Stocks
        console.log('🔍 Recherche de l\'onglet Titres...');
        const stocksTab = await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('button, [role="tab"], .tab'));
            return tabs.find(t => t.textContent && (t.textContent.includes('Titres') || t.textContent.includes('Stocks') || t.textContent.includes('IntelliStocks')));
        });

        if (stocksTab) {
            console.log('✅ Onglet Titres trouvé');
            await page.evaluate(() => {
                const tabs = Array.from(document.querySelectorAll('button, [role="tab"], .tab'));
                const tab = tabs.find(t => t.textContent && (t.textContent.includes('Titres') || t.textContent.includes('Stocks') || t.textContent.includes('IntelliStocks')));
                if (tab) tab.click();
            });
            await page.waitForTimeout(2000);

            // Vérifier FastGraph
            console.log('📊 Vérification de FastGraph...');
            const fastGraphFound = await page.evaluate(() => {
                return document.body.textContent.includes('FastGraphs') || 
                       document.body.textContent.includes('FastGraph');
            });

            if (fastGraphFound) {
                console.log('✅ Section FastGraph trouvée');
                await page.screenshot({ path: join(rootDir, 'test-screenshot-fastgraph.png'), fullPage: true });
                console.log('📸 Screenshot FastGraph capturé: test-screenshot-fastgraph.png');
            } else {
                console.log('⚠️ Section FastGraph non trouvée');
            }
        }

        // Chercher l'onglet Nouvelles/News
        console.log('🔍 Recherche de l\'onglet Nouvelles...');
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('button, [role="tab"], .tab'));
            const tab = tabs.find(t => t.textContent && (t.textContent.includes('Nouvelles') || t.textContent.includes('News')));
            if (tab) tab.click();
        });
        await page.waitForTimeout(2000);

        // Vérifier Ground News
        console.log('🌍 Vérification de Ground News...');
        const groundNewsFound = await page.evaluate(() => {
            return document.body.textContent.includes('Ground News') || 
                   document.body.textContent.includes('ground.news');
        });

        if (groundNewsFound) {
            console.log('✅ Section Ground News trouvée');
            await page.screenshot({ path: join(rootDir, 'test-screenshot-groundnews.png'), fullPage: true });
            console.log('📸 Screenshot Ground News capturé: test-screenshot-groundnews.png');
        } else {
            console.log('⚠️ Section Ground News non trouvée');
        }

        // Générer le rapport
        const report = {
            timestamp: new Date().toISOString(),
            url: 'http://localhost:8080',
            tailwind: {
                cssLoaded: tailwindLoaded,
                cdnFound: cdnTailwind,
                status: tailwindLoaded && !cdnTailwind ? '✅ OK' : '❌ PROBLÈME'
            },
            fastGraph: {
                found: fastGraphFound,
                status: fastGraphFound ? '✅ OK' : '⚠️ NON TROUVÉ'
            },
            groundNews: {
                found: groundNewsFound,
                status: groundNewsFound ? '✅ OK' : '⚠️ NON TROUVÉ'
            },
            console: {
                logs: consoleLogs.slice(0, 50), // Limiter à 50 logs
                errors: consoleErrors,
                warnings: consoleWarnings
            }
        };

        // Sauvegarder le rapport
        fs.writeFileSync(
            join(rootDir, 'test-integrations-report.json'),
            JSON.stringify(report, null, 2)
        );

        console.log('\n📋 RAPPORT DE TEST');
        console.log('==================');
        console.log(`✅ Tailwind CSS: ${report.tailwind.status}`);
        console.log(`✅ FastGraph: ${report.fastGraph.status}`);
        console.log(`✅ Ground News: ${report.groundNews.status}`);
        console.log(`📝 Erreurs console: ${consoleErrors.length}`);
        console.log(`⚠️ Warnings console: ${consoleWarnings.length}`);
        console.log(`\n📄 Rapport complet sauvegardé: test-integrations-report.json`);

        // Garder le navigateur ouvert pour inspection manuelle
        console.log('\n⏸️ Navigateur ouvert pour inspection manuelle...');
        console.log('Appuyez sur Ctrl+C pour fermer');

        // Attendre 30 secondes avant de fermer
        await page.waitForTimeout(30000);

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        if (browser) await browser.close();
        if (server) server.close();
        console.log('\n✅ Test terminé');
    }
}

testIntegrations().catch(console.error);
