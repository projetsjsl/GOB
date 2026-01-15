/**
 * Scraping Coordinator API
 * Coordonne le scraping client-side avec sauvegarde serveur
 *
 * Nouvelle approche: Le navigateur scrape, l'API sauvegarde
 */

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Retourne le script de scraping a injecter
  if (req.method === 'GET') {
    const { ticker } = req.query;

    // Script qui sera injecte dans la page Seeking Alpha
    const scrapingScript = `
(function() {
  try {
    // Extraire tout le texte de la page
    const fullText = document.body.innerText;

    // Chercher des sections specifiques
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
      const regex = new RegExp(header + '[\\\\s\\\\S]*?(?=(?:' + sectionHeaders.join('|') + ')|$)', 'i');
      const match = fullText.match(regex);
      if (match) {
        sections[header] = match[0].trim();
      }
    });

    // Retourner les donnees
    return {
      success: true,
      fullText: fullText,
      sections: sections,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
})();
    `.trim();

    return res.status(200).json({
      success: true,
      ticker: ticker,
      script: scrapingScript,
      instructions: {
        step1: 'Ouvrir la page Seeking Alpha',
        step2: 'Injecter ce script via console ou bookmarklet',
        step3: 'Le script retourne les donnees automatiquement',
        step4: 'POST les donnees a cette API pour sauvegarde'
      },
      timestamp: new Date().toISOString()
    });
  }

  // POST: Sauvegarder les donnees scrapees
  if (req.method === 'POST') {
    try {
      const { ticker, fullText, sections, url } = req.body;

      if (!ticker || !fullText) {
        return res.status(400).json({
          success: false,
          error: 'ticker et fullText requis'
        });
      }

      console.log(` Reception donnees scrapees pour ${ticker} - ${fullText.length} caracteres`);

      // Ici, on pourrait sauvegarder dans Supabase
      // Pour l'instant, on retourne simplement success

      return res.status(200).json({
        success: true,
        ticker: ticker,
        dataReceived: {
          textLength: fullText.length,
          sectionsCount: Object.keys(sections || {}).length,
          url: url
        },
        message: `Donnees recues pour ${ticker}`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(' Erreur sauvegarde:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
