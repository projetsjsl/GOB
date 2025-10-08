// ========================================
// API ROUTE VERCEL - GESTION DE LA WATCHLIST GITHUB
// ========================================

export default async function handler(req, res) {
  try {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const repoOwner = 'projetsjsls'; // Remplacez par votre nom d'utilisateur GitHub
    const repoName = 'GOB'; // Remplacez par votre nom de repository
    const filePath = 'watchlist.json';

    if (!githubToken) {
      return res.status(500).json({
        error: 'Token GitHub non configuré',
        message: 'Veuillez configurer la variable d\'environnement GITHUB_TOKEN dans Vercel'
      });
    }

    if (req.method === 'GET') {
      // Charger la watchlist depuis GitHub
      try {
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const content = Buffer.from(data.content, 'base64').toString('utf-8');
          const watchlistData = JSON.parse(content);
          
          return res.status(200).json({
            status: 'success',
            tickers: watchlistData.tickers || [],
            message: 'Watchlist chargée depuis GitHub',
            timestamp: new Date().toISOString()
          });
        } else if (response.status === 404) {
          // Fichier n'existe pas, retourner une liste vide
          return res.status(200).json({
            status: 'success',
            tickers: [],
            message: 'Fichier watchlist.json non trouvé, watchlist vide',
            timestamp: new Date().toISOString()
          });
        } else {
          const errorData = await response.json();
          return res.status(500).json({
            error: 'Erreur lors du chargement de la watchlist',
            message: errorData.message || 'Erreur inconnue',
            status: response.status
          });
        }
      } catch (error) {
        return res.status(500).json({
          error: 'Erreur lors du chargement de la watchlist',
          message: error.message
        });
      }
    }

    if (req.method === 'POST') {
      // Sauvegarder la watchlist sur GitHub
      const { tickers } = req.body;

      if (!tickers || !Array.isArray(tickers)) {
        return res.status(400).json({
          error: 'Données invalides',
          message: 'Le champ tickers doit être un tableau'
        });
      }

      try {
        // D'abord, récupérer le SHA du fichier existant (si il existe)
        let sha = null;
        try {
          const getResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          if (getResponse.ok) {
            const data = await getResponse.json();
            sha = data.sha;
          }
        } catch (error) {
          // Fichier n'existe pas, on continue sans SHA
        }

        // Préparer le contenu du fichier
        const watchlistData = { 
          tickers,
          lastUpdated: new Date().toISOString(),
          user: 'Dan' // Vous pouvez personnaliser cela
        };
        const content = JSON.stringify(watchlistData, null, 2);
        const encodedContent = Buffer.from(content).toString('base64');

        // Créer ou mettre à jour le fichier
        const updateResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Mise à jour de la watchlist Dan - ${new Date().toISOString()}`,
            content: encodedContent,
            sha: sha // null si nouveau fichier
          })
        });

        if (updateResponse.ok) {
          const result = await updateResponse.json();
          return res.status(200).json({
            status: 'success',
            message: 'Watchlist sauvegardée sur GitHub avec succès',
            tickers: tickers,
            commit: result.commit.sha,
            timestamp: new Date().toISOString()
          });
        } else {
          const errorData = await updateResponse.json();
          return res.status(500).json({
            error: 'Erreur lors de la sauvegarde de la watchlist',
            message: errorData.message || 'Erreur inconnue',
            status: updateResponse.status
          });
        }
      } catch (error) {
        return res.status(500).json({
          error: 'Erreur lors de la sauvegarde de la watchlist',
          message: error.message
        });
      }
    }

    return res.status(405).json({
      error: 'Méthode non autorisée',
      allowed: ['GET', 'POST']
    });

  } catch (error) {
    console.error('Erreur dans github-watchlist API:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
