// ==UserScript==
// @name         GOB Seeking Alpha Auto-Scraper
// @namespace    https://gobapps.com
// @version      1.2
// @description  Scrape automatiquement les pages Seeking Alpha Virtual Analyst Report (BATCH MODE)
// @author       GOB Dashboard
// @match        https://seekingalpha.com/symbol/*/virtual_analyst_report*
// @match        https://www.seekingalpha.com/symbol/*/virtual_analyst_report*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(async function() {
    'use strict';

    console.log(' GOB AUTO-SCRAPER ACTIVE');

    // Attendre que la page soit completement chargee
    if (document.readyState !== 'complete') {
        window.addEventListener('load', startScraping);
    } else {
        startScraping();
    }

    async function startScraping() {
        // Attendre 2 secondes pour que la page se stabilise
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extraire le ticker de l'URL
        const urlMatch = window.location.href.match(/symbol\/([A-Z]+)\//);
        const ticker = urlMatch ? urlMatch[1] : null;

        if (!ticker) {
            console.error(' Impossible d\'extraire le ticker de l\'URL');
            return;
        }

        console.log(` Scraping automatique de ${ticker}...`);

        // Creer un indicateur visuel en haut de la page
        const indicator = document.createElement('div');
        indicator.id = 'gob-scraper-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            text-align: center;
            font-family: 'Arial', sans-serif;
            font-weight: bold;
            font-size: 16px;
            z-index: 999999;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        `;
        indicator.innerHTML = ` GOB Auto-Scraper: Scraping ${ticker}... <span id="gob-status">En cours</span>`;
        document.body.prepend(indicator);

        const updateStatus = (message, color = 'white') => {
            const statusEl = document.getElementById('gob-status');
            if (statusEl) {
                statusEl.textContent = message;
                statusEl.style.color = color;
            }
        };

        try {
            // Extraire tout le texte de la page
            const fullText = document.body.innerText;
            console.log(` ${fullText.length} caracteres extraits`);

            // Extraire des sections structurees
            const sections = {};
            const sectionHeaders = [
                'Investment Thesis',
                'Valuation',
                'Key Metrics',
                'Financial Performance',
                'Risks',
                'Catalysts',
                'Summary',
                'Price Target'
            ];

            sectionHeaders.forEach(header => {
                const regex = new RegExp(`${header}[\\s\\S]*?(?=(?:${sectionHeaders.join('|')})|$)`, 'i');
                const match = fullText.match(regex);
                if (match) {
                    sections[header] = match[0].trim();
                }
            });

            console.log(` ${Object.keys(sections).length} sections trouvees`);
            updateStatus('Extraction terminee ');

            // 1. Sauvegarder les donnees brutes
            updateStatus('Sauvegarde Supabase...', 'yellow');
            console.log(' Sauvegarde Supabase...');

            const saveResponse = await fetch('https://gobapps.com/api/seeking-alpha-scraping?type=raw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticker: ticker,
                    url: window.location.href,
                    raw_text: fullText,
                    status: 'success'
                })
            });

            if (saveResponse.ok) {
                console.log(` Donnees brutes sauvegardees`);
                updateStatus('Donnees sauvegardees ', 'lightgreen');
            } else {
                console.warn(` Erreur sauvegarde (${saveResponse.status})`);
            }

            // 2. SKIP Perplexity (mode BATCH - on analyse tout a la fin!)
            console.log(' Analyse Perplexity sera faite en BATCH plus tard');
            console.log(' Utilisez le bouton "Analyser TOUT avec Perplexity" dans le dashboard');
            updateStatus('Scraping termine - Analyse en batch plus tard ', 'lightgreen');

            // SUCCESS!
            console.log(`\n TRAITEMENT COMPLET POUR ${ticker}!\n`);
            updateStatus(`TERMINE pour ${ticker} `, 'lightgreen');

            // Changer la couleur du bandeau en vert
            indicator.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';

            // Fermeture automatique apres 3 secondes
            await new Promise(resolve => setTimeout(resolve, 3000));

            console.log(' Fermeture automatique...');
            updateStatus('Fermeture automatique...', 'white');

            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                window.close();
            } catch (e) {
                console.log(' Impossible de fermer automatiquement - fermez manuellement');
                indicator.innerHTML = ` TERMINE pour ${ticker}! Vous pouvez fermer cette page.`;
            }

        } catch (error) {
            console.error(` Erreur: ${error.message}`);
            updateStatus(`ERREUR: ${error.message}`, 'red');
            indicator.style.background = 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)';

            // Afficher l'erreur pendant 5 secondes
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
})();
