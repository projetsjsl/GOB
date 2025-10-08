// ========================================
// API ROUTE VERCEL - TOKEN GITHUB
// ========================================

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Vérifier si le token GitHub est configuré
    const githubToken = process.env.GITHUB_TOKEN;
    
    if (!githubToken) {
      return res.status(200).json({
        status: 'not_configured',
        message: 'Token GitHub non configuré',
        hasToken: false
      });
    }

    // Tester la validité du token
    return fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    .then(response => {
      if (response.ok) {
        return response.json().then(userData => ({
          status: 'valid',
          message: 'Token GitHub valide',
          hasToken: true,
          user: {
            login: userData.login,
            name: userData.name,
            avatar_url: userData.avatar_url
          }
        }));
      } else {
        return {
          status: 'invalid',
          message: 'Token GitHub invalide',
          hasToken: true,
          error: `HTTP ${response.status}`
        };
      }
    })
    .catch(error => ({
      status: 'error',
      message: 'Erreur de connexion GitHub',
      hasToken: true,
      error: error.message
    }))
    .then(result => res.status(200).json(result));
  }

  if (req.method === 'POST') {
    // Endpoint pour les opérations GitHub (mise à jour de fichiers, etc.)
    const { action, file, data, ticker } = req.body;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
      return res.status(500).json({
        error: 'Token GitHub non configuré',
        message: 'Configurez GITHUB_TOKEN dans les variables d\'environnement Vercel'
      });
    }

    // Gérer différentes actions GitHub
    switch (action) {
      case 'update_file':
        return updateGitHubFile(githubToken, file, data, res);
      case 'get_file':
        return getGitHubFile(githubToken, file, res);
      case 'test_connection':
        return testGitHubConnection(githubToken, res);
      default:
        return res.status(400).json({
          error: 'Action non supportée',
          supportedActions: ['update_file', 'get_file', 'test_connection']
        });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}

// Fonction pour mettre à jour un fichier GitHub
async function updateGitHubFile(token, filePath, data, res) {
  try {
    // Récupérer le contenu actuel du fichier
    const getResponse = await fetch(`https://api.github.com/repos/projetsjsl/GOB/contents/${filePath}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    let sha = null;
    if (getResponse.ok) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    }

    // Préparer le contenu à envoyer
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const message = `Update ${filePath} - ${new Date().toISOString()}`;

    // Mettre à jour le fichier
    const updateResponse = await fetch(`https://api.github.com/repos/projetsjsl/GOB/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        content,
        sha
      })
    });

    if (updateResponse.ok) {
      const result = await updateResponse.json();
      return res.status(200).json({
        status: 'success',
        message: 'Fichier mis à jour avec succès',
        commit: result.commit
      });
    } else {
      const error = await updateResponse.json();
      return res.status(updateResponse.status).json({
        status: 'error',
        message: 'Erreur lors de la mise à jour',
        error: error.message
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur serveur',
      error: error.message
    });
  }
}

// Fonction pour récupérer un fichier GitHub
async function getGitHubFile(token, filePath, res) {
  try {
    const response = await fetch(`https://api.github.com/repos/projetsjsl/GOB/contents/${filePath}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.ok) {
      const fileData = await response.json();
      const content = JSON.parse(Buffer.from(fileData.content, 'base64').toString());
      return res.status(200).json({
        status: 'success',
        data: content,
        sha: fileData.sha
      });
    } else {
      return res.status(response.status).json({
        status: 'error',
        message: 'Fichier non trouvé',
        error: `HTTP ${response.status}`
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur serveur',
      error: error.message
    });
  }
}

// Fonction pour tester la connexion GitHub
async function testGitHubConnection(token, res) {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.ok) {
      const userData = await response.json();
      return res.status(200).json({
        status: 'success',
        message: 'Connexion GitHub réussie',
        user: {
          login: userData.login,
          name: userData.name,
          avatar_url: userData.avatar_url
        }
      });
    } else {
      return res.status(response.status).json({
        status: 'error',
        message: 'Connexion GitHub échouée',
        error: `HTTP ${response.status}`
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur de connexion',
      error: error.message
    });
  }
}