// ==UserScript==
// @name         GOB Seeking Alpha Auto-Scraper
// @namespace    https://gobapps.com
// @version      1.1
// @description  Scrape automatiquement les pages Seeking Alpha Virtual Analyst Report
// @author       GOB Dashboard
// @match        https://seekingalpha.com/symbol/*/virtual_analyst_report*
// @match        https://www.seekingalpha.com/symbol/*/virtual_analyst_report*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(async function() {
    'use strict';

    console.log('🤖 GOB AUTO-SCRAPER ACTIVÉ');

    // Attendre que la page soit complètement chargée
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
            console.error('❌ Impossible d\'extraire le ticker de l\'URL');
            return;
        }

        console.log(`📊 Scraping automatique de ${ticker}...`);

        // Créer un indicateur visuel en haut de la page
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
        indicator.innerHTML = `🤖 GOB Auto-Scraper: Scraping ${ticker}... <span id="gob-status">En cours</span>`;
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
            console.log(`✅ ${fullText.length} caractères extraits`);

            // Extraire des sections structurées
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

            console.log(`📦 ${Object.keys(sections).length} sections trouvées`);
            updateStatus('Extraction terminée ✅');

            // 1. Sauvegarder les données brutes
            updateStatus('Sauvegarde Supabase...', 'yellow');
            console.log('💾 Sauvegarde Supabase...');

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
                console.log(`✅ Données brutes sauvegardées`);
                updateStatus('Données sauvegardées ✅', 'lightgreen');
            } else {
                console.warn(`⚠️ Erreur sauvegarde (${saveResponse.status})`);
            }

            // 2. Analyser avec Perplexity
            updateStatus('Analyse Perplexity...', 'yellow');
            console.log('🤖 Analyse Perplexity...');

            const textForAnalysis = fullText.substring(0, 15000);

            const analysisResponse = await fetch('https://gobapps.com/api/emma-agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Analyse ces données Seeking Alpha pour ${ticker} et structure-les selon le schéma seeking_alpha_analysis:\n\n${textForAnalysis}`,
                    context: {
                        output_mode: 'data',
                        ticker: ticker,
                        task: 'seeking_alpha_analysis'
                    }
                })
            });

            if (analysisResponse.ok) {
                const analysisData = await analysisResponse.json();
                console.log(`✅ Analyse Perplexity terminée`);

                // Extraire et parser le JSON
                let analysisToSave = {};

                if (typeof analysisData.response === 'string') {
                    let responseText = analysisData.response;
                    responseText = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

                    const firstBrace = responseText.indexOf('{');
                    const lastBrace = responseText.lastIndexOf('}');

                    if (firstBrace !== -1 && lastBrace !== -1) {
                        responseText = responseText.substring(firstBrace, lastBrace + 1);
                        try {
                            analysisToSave = JSON.parse(responseText);
                        } catch (e) {
                            console.warn('⚠️ Impossible de parser le JSON');
                        }
                    }
                } else if (typeof analysisData.response === 'object') {
                    analysisToSave = analysisData.response;
                }

                // 3. Sauvegarder l'analyse
                const analysisSaveResponse = await fetch('https://gobapps.com/api/seeking-alpha-scraping?type=analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ticker: ticker,
                        ...analysisToSave
                    })
                });

                if (analysisSaveResponse.ok) {
                    console.log(`✅ Analyse structurée sauvegardée`);
                    updateStatus('Analyse sauvegardée ✅', 'lightgreen');
                }
            } else {
                console.warn(`⚠️ Erreur analyse Perplexity`);
                updateStatus('Analyse échouée ⚠️', 'orange');
            }

            // SUCCESS!
            console.log(`\n🎉 TRAITEMENT COMPLET POUR ${ticker}!\n`);
            updateStatus(`TERMINÉ pour ${ticker} 🎉`, 'lightgreen');

            // Changer la couleur du bandeau en vert
            indicator.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';

            // Fermeture automatique après 3 secondes
            await new Promise(resolve => setTimeout(resolve, 3000));

            console.log('🚪 Fermeture automatique...');
            updateStatus('Fermeture automatique...', 'white');

            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                window.close();
            } catch (e) {
                console.log('💡 Impossible de fermer automatiquement - fermez manuellement');
                indicator.innerHTML = `🎉 TERMINÉ pour ${ticker}! Vous pouvez fermer cette page.`;
            }

        } catch (error) {
            console.error(`❌ Erreur: ${error.message}`);
            updateStatus(`ERREUR: ${error.message}`, 'red');
            indicator.style.background = 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)';

            // Afficher l'erreur pendant 5 secondes
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
})();
