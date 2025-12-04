/**
 * Proxy serveur pour jslai.app
 * Récupère le contenu HTML et le sert depuis gobapps.com
 * Contourne le firewall en gardant l'URL gobapps.com dans la barre d'adresse
 */

export default async function handler(req, res) {
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Path parameter required' });
  }

  try {
    // Construire l'URL cible
    const targetUrl = `https://jslai.app/${path}`;
    
    console.log(`📡 JSL AI Proxy: ${targetUrl}`);

    // Récupérer le contenu HTML
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      }
    });

    if (!response.ok) {
      console.error(`❌ JSL AI Proxy Error: ${response.status} ${response.statusText}`);
      return res.status(response.status).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Erreur</title></head>
        <body>
          <h1>Erreur ${response.status}</h1>
          <p>Impossible de charger le contenu depuis jslai.app</p>
          <p><a href="${targetUrl}" target="_blank">Ouvrir directement</a></p>
        </body>
        </html>
      `);
    }

    let html = await response.text();

    // Réécrire les URLs pour que les ressources se chargent depuis jslai.app
    // mais les liens internes pointent vers notre proxy
    html = html.replace(/href="\/([^"]+)"/g, (match, linkPath) => {
      // Si c'est un lien interne, le faire pointer vers notre proxy
      if (!linkPath.startsWith('http') && !linkPath.startsWith('#')) {
        return `href="/api/jslai-proxy?path=${encodeURIComponent(linkPath)}"`;
      }
      return match;
    });

    // Réécrire les src pour pointer vers jslai.app
    html = html.replace(/src="\/([^"]+)"/g, (match, srcPath) => {
      if (!srcPath.startsWith('http')) {
        return `src="https://jslai.app/${srcPath}"`;
      }
      return match;
    });

    // Réécrire les URLs dans les CSS (url(...))
    html = html.replace(/url\(["']?\/([^"')]+)["']?\)/g, (match, urlPath) => {
      if (!urlPath.startsWith('http')) {
        return `url(https://jslai.app/${urlPath})`;
      }
      return match;
    });

    // Définir le Content-Type
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache 5 minutes

    return res.status(200).send(html);

  } catch (error) {
    console.error('❌ JSL AI Proxy Error:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Erreur</title></head>
      <body>
        <h1>Erreur de proxy</h1>
        <p>${error.message}</p>
        <p><a href="https://jslai.app/${path}" target="_blank">Ouvrir directement</a></p>
      </body>
      </html>
    `);
  }
}

