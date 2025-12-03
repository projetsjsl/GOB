/**
 * API Endpoint pour gestion des redirections Vercel
 * Permet de lire, créer, modifier et supprimer des redirections dans vercel.json
 * Utilise GitHub API pour modifier le fichier
 */

import { Octokit } from '@octokit/rest';

const octokit = process.env.GITHUB_TOKEN ? new Octokit({
  auth: process.env.GITHUB_TOKEN,
}) : null;

const REPO_OWNER = 'projetsjsl';
const REPO_NAME = 'GOB';
const BRANCH = 'main';
const VERCEL_JSON_PATH = 'vercel.json';

// Fonction pour récupérer vercel.json depuis GitHub
async function getVercelConfig() {
  if (!octokit) {
    throw new Error('GitHub token not configured');
  }

  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: VERCEL_JSON_PATH,
      ref: BRANCH
    });

    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    return {
      config: JSON.parse(content),
      sha: fileData.sha
    };
  } catch (error) {
    if (error.status === 404) {
      throw new Error('vercel.json not found in repository');
    }
    throw error;
  }
}

// Fonction pour sauvegarder vercel.json sur GitHub
async function saveVercelConfig(config, sha, message) {
  if (!octokit) {
    throw new Error('GitHub token not configured');
  }

  const content = JSON.stringify(config, null, 2);
  const encodedContent = Buffer.from(content).toString('base64');

  const response = await octokit.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: VERCEL_JSON_PATH,
    message: message,
    content: encodedContent,
    sha: sha,
    branch: BRANCH
  });

  return response.data;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET': {
        // Récupérer toutes les redirections
        const { config } = await getVercelConfig();
        const redirects = config.redirects || [];
        
        return res.status(200).json({
          success: true,
          redirects: redirects,
          count: redirects.length
        });
      }

      case 'POST': {
        // Créer une nouvelle redirection
        const { source, destination, permanent = false } = req.body;

        if (!source || !destination) {
          return res.status(400).json({
            success: false,
            error: 'Source et destination sont requis'
          });
        }

        // Valider le format source (doit commencer par /)
        if (!source.startsWith('/')) {
          return res.status(400).json({
            success: false,
            error: 'La source doit commencer par /'
          });
        }

        const { config, sha } = await getVercelConfig();

        // Vérifier si la redirection existe déjà
        if (!config.redirects) {
          config.redirects = [];
        }

        const existingIndex = config.redirects.findIndex(r => r.source === source);
        if (existingIndex >= 0) {
          return res.status(409).json({
            success: false,
            error: `Une redirection avec la source "${source}" existe déjà`
          });
        }

        // Ajouter la nouvelle redirection
        config.redirects.push({
          source,
          destination,
          permanent: Boolean(permanent)
        });

        // Sauvegarder
        const commit = await saveVercelConfig(
          config,
          sha,
          `Ajout redirection: ${source} → ${destination}`
        );

        return res.status(200).json({
          success: true,
          message: `Redirection ${source} → ${destination} ajoutée avec succès`,
          redirect: {
            source,
            destination,
            permanent: Boolean(permanent)
          },
          commit: commit.commit.sha
        });
      }

      case 'PUT': {
        // Modifier une redirection existante
        const { source, destination, permanent, newSource } = req.body;

        if (!source) {
          return res.status(400).json({
            success: false,
            error: 'Source est requis pour identifier la redirection à modifier'
          });
        }

        const { config, sha } = await getVercelConfig();

        if (!config.redirects) {
          return res.status(404).json({
            success: false,
            error: 'Aucune redirection trouvée'
          });
        }

        const existingIndex = config.redirects.findIndex(r => r.source === source);
        if (existingIndex < 0) {
          return res.status(404).json({
            success: false,
            error: `Redirection avec source "${source}" non trouvée`
          });
        }

        // Mettre à jour la redirection
        const updatedRedirect = {
          ...config.redirects[existingIndex],
          ...(newSource && { source: newSource }),
          ...(destination && { destination }),
          ...(permanent !== undefined && { permanent: Boolean(permanent) })
        };

        // Vérifier si newSource entre en conflit avec une autre redirection
        if (newSource && newSource !== source) {
          const conflictIndex = config.redirects.findIndex(
            (r, i) => r.source === newSource && i !== existingIndex
          );
          if (conflictIndex >= 0) {
            return res.status(409).json({
              success: false,
              error: `Une redirection avec la source "${newSource}" existe déjà`
            });
          }
        }

        config.redirects[existingIndex] = updatedRedirect;

        // Sauvegarder
        const commit = await saveVercelConfig(
          config,
          sha,
          `Modification redirection: ${source}${newSource && newSource !== source ? ` → ${newSource}` : ''}`
        );

        return res.status(200).json({
          success: true,
          message: `Redirection modifiée avec succès`,
          redirect: updatedRedirect,
          commit: commit.commit.sha
        });
      }

      case 'DELETE': {
        // Supprimer une redirection
        const { source } = req.body;

        if (!source) {
          return res.status(400).json({
            success: false,
            error: 'Source est requis pour identifier la redirection à supprimer'
          });
        }

        const { config, sha } = await getVercelConfig();

        if (!config.redirects) {
          return res.status(404).json({
            success: false,
            error: 'Aucune redirection trouvée'
          });
        }

        const existingIndex = config.redirects.findIndex(r => r.source === source);
        if (existingIndex < 0) {
          return res.status(404).json({
            success: false,
            error: `Redirection avec source "${source}" non trouvée`
          });
        }

        // Supprimer la redirection
        const deletedRedirect = config.redirects[existingIndex];
        config.redirects.splice(existingIndex, 1);

        // Sauvegarder
        const commit = await saveVercelConfig(
          config,
          sha,
          `Suppression redirection: ${source}`
        );

        return res.status(200).json({
          success: true,
          message: `Redirection ${source} supprimée avec succès`,
          redirect: deletedRedirect,
          commit: commit.commit.sha
        });
      }

      default:
        return res.status(405).json({
          success: false,
          error: 'Méthode non autorisée'
        });
    }
  } catch (error) {
    console.error('❌ Erreur API admin redirects:', error);
    
    if (error.message === 'GitHub token not configured') {
      return res.status(500).json({
        success: false,
        error: 'GitHub token non configuré',
        message: 'GITHUB_TOKEN doit être configuré dans les variables d\'environnement Vercel'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

