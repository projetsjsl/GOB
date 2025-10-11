import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const REPO_OWNER = 'projetsjsl';
const REPO_NAME = 'GOB';
const BRANCH = 'main';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file, ticker, data, action } = req.body;

    if (!file || !ticker || !data) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!process.env.GITHUB_TOKEN) {
      return res.status(500).json({ 
        error: 'GitHub token not configured',
        message: 'Les fichiers ne peuvent pas être mis à jour sans token GitHub'
      });
    }

    // Récupérer le contenu actuel du fichier
    let currentContent = '';
    let currentSha = null;

    try {
      const { data: fileData } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: file,
        ref: BRANCH
      });

      currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
      currentSha = fileData.sha;
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
      // Le fichier n'existe pas encore, on le créera
    }

    // Parser le contenu JSON existant
    let jsonData = {};
    if (currentContent) {
      try {
        jsonData = JSON.parse(currentContent);
      } catch (parseError) {
        console.error('Erreur parsing JSON existant:', parseError);
        jsonData = {};
      }
    }

    // Mettre à jour les données selon l'action
    if (action === 'update_stock') {
      // Mettre à jour stock_data.json
      if (!jsonData.stocks) {
        jsonData.stocks = {};
      }
      jsonData.stocks[ticker] = data;
      jsonData.lastUpdate = new Date().toISOString();
    } else if (action === 'update_analysis') {
      // Mettre à jour stock_analysis.json
      if (!jsonData.stocks) {
        jsonData.stocks = [];
      }
      
      // Trouver l'index du ticker existant
      const existingIndex = jsonData.stocks.findIndex(stock => stock.ticker === ticker);
      
      if (existingIndex >= 0) {
        // Mettre à jour l'entrée existante
        jsonData.stocks[existingIndex] = {
          ...jsonData.stocks[existingIndex],
          ...data
        };
      } else {
        // Ajouter une nouvelle entrée
        jsonData.stocks.push(data);
      }
      
      jsonData.last_update = new Date().toISOString();
      jsonData.total_stocks = jsonData.stocks.length;
      jsonData.successful = jsonData.stocks.length;
      jsonData.failed = 0;
    }

    // Convertir en JSON formaté
    const updatedContent = JSON.stringify(jsonData, null, 2);

    // Mettre à jour le fichier sur GitHub
    const updateResponse = await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: file,
      message: `Update ${ticker} data - ${action} - ${new Date().toISOString()}`,
      content: Buffer.from(updatedContent).toString('base64'),
      sha: currentSha,
      branch: BRANCH
    });

    res.status(200).json({
      success: true,
      message: `Fichier ${file} mis à jour avec succès pour ${ticker}`,
      commit: updateResponse.data.commit.sha,
      action: action
    });

  } catch (error) {
    console.error('Erreur GitHub API:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour GitHub',
      details: error.message 
    });
  }
}
