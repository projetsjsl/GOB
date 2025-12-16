/**
 * Proxy pour les ressources (JS, CSS, images) de jslai.app
 * Contourne les problèmes CORS et 403
 */

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  try {
    // Décoder l'URL
    const decodedUrl = decodeURIComponent(url);
    
    // S'assurer que l'URL est vers jslai.app
    if (!decodedUrl.startsWith('https://jslai.app/')) {
      return res.status(403).json({ error: 'Only jslai.app URLs are allowed' });
    }

    console.log(`📡 JSL AI Resource Proxy: ${decodedUrl}`);

    // Récupérer la ressource
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Referer': 'https://jslai.app/',
      }
    });

    if (!response.ok) {
      console.error(`❌ Resource Proxy Error: ${response.status} ${response.statusText}`);
      return res.status(response.status).send(`Resource not available: ${response.status}`);
    }

    // Déterminer le Content-Type
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Copier les headers importants
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 heure
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Si c'est du JavaScript, on peut le modifier pour corriger les chemins
    if (contentType.includes('javascript') || contentType.includes('application/javascript') || decodedUrl.endsWith('.js')) {
      let content = await response.text();
      
      // Réécrire les chemins relatifs dans le JS vers jslai.app
      content = content.replace(/["']\/([^"']+)["']/g, (match, path) => {
        if (!path.startsWith('http') && !path.startsWith('//') && !path.startsWith('#')) {
          return `"https://jslai.app/${path}"`;
        }
        return match;
      });
      
      // S'assurer que les fonctions sont exposées globalement si elles sont dans un module
      // Ajouter à la fin du script pour exposer les fonctions globales
      if (!content.includes('window.startEvaluation') && content.includes('startEvaluation')) {
        content += '\n\n// Exposer startEvaluation globalement si elle existe\nif (typeof startEvaluation !== "undefined" && typeof window !== "undefined") {\n  window.startEvaluation = startEvaluation;\n}';
      }
      
      if (!content.includes('window.ShowGuide') && content.includes('ShowGuide')) {
        content += '\n\n// Exposer ShowGuide globalement si elle existe\nif (typeof ShowGuide !== "undefined" && typeof window !== "undefined") {\n  window.ShowGuide = ShowGuide;\n}';
      }
      
      return res.status(200).send(content);
    }

    // Pour les autres types, renvoyer directement
    const buffer = await response.arrayBuffer();
    return res.status(200).send(Buffer.from(buffer));

  } catch (error) {
    console.error('❌ Resource Proxy Error:', error);
    return res.status(500).send(`Error: ${error.message}`);
  }
}

