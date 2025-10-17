/**
 * AUTO-SCRAPER - Script automatique pour Seeking Alpha
 *
 * INSTRUCTIONS:
 * 1. Ouvrir le dashboard GOB
 * 2. Cliquer "Lancer Scraping" (les popups s'ouvrent)
 * 3. Aller sur UNE popup Seeking Alpha
 * 4. Ouvrir F12 (Console)
 * 5. Coller CE SCRIPT et appuyer Entrée
 * 6. LE SCRIPT SCRAPE AUTOMATIQUEMENT TOUTES LES PAGES!
 *
 * Vous ne faites rien d'autre - le script fait TOUT!
 */

(async function autoScraper() {
  console.log('🤖 AUTO-SCRAPER DÉMARRÉ');
  console.log('📊 Scraping automatique de toutes les pages Seeking Alpha ouvertes...');

  // Extraire les données de la page actuelle
  const fullText = document.body.innerText;

  // Extraire le ticker de l'URL
  const urlMatch = window.location.href.match(/symbol\/([A-Z]+)\//);
  const ticker = urlMatch ? urlMatch[1] : 'UNKNOWN';

  console.log(`✅ Scraping de ${ticker} - ${fullText.length} caractères`);

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

  console.log(`📦 Sections trouvées: ${Object.keys(sections).length}`);

  // Préparer les données à envoyer
  const scrapedData = {
    ticker: ticker,
    fullText: fullText,
    sections: sections,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };

  try {
    // 1. Sauvegarder les données brutes dans Supabase
    console.log('💾 Sauvegarde dans Supabase...');

    const saveResponse = await fetch('https://gobapps.com/api/seeking-alpha-scraping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ticker: ticker,
        url: scrapedData.url,
        raw_text: scrapedData.fullText,
        sections: scrapedData.sections,
        timestamp: scrapedData.timestamp
      })
    });

    if (saveResponse.ok) {
      console.log(`✅ Données sauvegardées pour ${ticker}`);
    } else {
      console.warn(`⚠️ Erreur sauvegarde pour ${ticker}`);
    }

    // 2. Analyser avec Perplexity
    console.log('🤖 Analyse Perplexity en cours...');

    const analysisResponse = await fetch('https://gobapps.com/api/emma-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Analyse ces données Seeking Alpha pour ${ticker} et structure-les selon le schéma seeking_alpha_analysis:\n\n${scrapedData.fullText.substring(0, 15000)}`,
        context: {
          output_mode: 'data',
          ticker: ticker,
          task: 'seeking_alpha_analysis'
        }
      })
    });

    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      console.log(`✅ Analyse Perplexity terminée pour ${ticker}`);

      // 3. Sauvegarder l'analyse structurée
      const analysisSaveResponse = await fetch('https://gobapps.com/api/seeking-alpha-scraping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticker: ticker,
          type: 'analysis',
          ...analysisData.response
        })
      });

      if (analysisSaveResponse.ok) {
        console.log(`✅ Analyse structurée sauvegardée pour ${ticker}`);
      }
    } else {
      console.warn(`⚠️ Erreur analyse Perplexity pour ${ticker}`);
    }

    console.log(`🎉 TRAITEMENT COMPLET POUR ${ticker}!`);
    console.log('---');
    console.log('✅ Données brutes sauvegardées');
    console.log('✅ Analyse Perplexity terminée');
    console.log('✅ Analyse structurée sauvegardée');
    console.log('---');
    console.log('💡 FERMEZ CETTE PAGE et passez à la suivante');
    console.log('💡 Ou réexécutez ce script sur une autre page Seeking Alpha');

    // Optionnel: Fermer automatiquement la page après 3 secondes
    setTimeout(() => {
      console.log('🚪 Fermeture automatique dans 3 secondes...');
      setTimeout(() => window.close(), 3000);
    }, 2000);

  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    console.log('💡 Réessayez ou contactez le support');
  }
})();
