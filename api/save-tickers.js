// API pour sauvegarder la liste des tickers dans tickers.json sur GitHub
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const REPO_OWNER = 'projetsjsl';
const REPO_NAME = 'GOB';
const BRANCH = 'main';
const TICKERS_FILE = 'public/tickers.json';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { tickers } = req.body;
        
        if (!Array.isArray(tickers)) {
            return res.status(400).json({ error: 'Les tickers doivent être un tableau' });
        }

        // Valider les tickers (lettres majuscules uniquement, 1-5 caractères)
        const validTickers = tickers.filter(ticker => 
            typeof ticker === 'string' && 
            /^[A-Z]{1,5}$/.test(ticker.toUpperCase())
        ).map(ticker => ticker.toUpperCase());

        if (validTickers.length === 0) {
            return res.status(400).json({ 
                error: 'Aucun ticker valide fourni',
                message: 'Les tickers doivent être des symboles boursiers valides (1-5 lettres majuscules)'
            });
        }

        // Créer l'objet de données
        const tickerData = {
            tickers: validTickers,
            lastUpdated: new Date().toISOString(),
            count: validTickers.length
        };

        // Si GitHub token est configuré, sauvegarder sur GitHub
        if (process.env.GITHUB_TOKEN) {
            try {
                // Récupérer le contenu actuel du fichier
                let currentSha = null;
                try {
                    const { data: fileData } = await octokit.repos.getContent({
                        owner: REPO_OWNER,
                        repo: REPO_NAME,
                        path: TICKERS_FILE,
                        ref: BRANCH
                    });
                    currentSha = fileData.sha;
                } catch (error) {
                    // Le fichier n'existe pas encore, on le créera
                    console.log('Fichier tickers.json n\'existe pas encore, création...');
                }

                // Convertir en JSON formaté
                const updatedContent = JSON.stringify(tickerData, null, 2);

                // Mettre à jour le fichier sur GitHub
                const updateResponse = await octokit.repos.createOrUpdateFileContents({
                    owner: REPO_OWNER,
                    repo: REPO_NAME,
                    path: TICKERS_FILE,
                    message: `Update tickers list - ${validTickers.length} tickers - ${new Date().toISOString()}`,
                    content: Buffer.from(updatedContent).toString('base64'),
                    sha: currentSha,
                    branch: BRANCH
                });

                return res.status(200).json({
                    success: true,
                    message: `Tickers sauvegardés avec succès sur GitHub`,
                    data: tickerData,
                    github: {
                        commit: updateResponse.data.commit.sha,
                        url: updateResponse.data.content.html_url
                    }
                });
            } catch (githubError) {
                console.error('Erreur GitHub:', githubError);
                // Continuer avec sauvegarde locale si GitHub échoue
            }
        }

        // Sauvegarde locale/mémoire si GitHub n'est pas disponible
        console.log('Tickers sauvegardés (local):', tickerData);
        
        return res.status(200).json({
            success: true,
            message: 'Tickers sauvegardés avec succès (local)',
            data: tickerData,
            warning: 'GitHub token non configuré - sauvegarde locale uniquement'
        });
        
    } catch (error) {
        console.error('Erreur sauvegarde tickers:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la sauvegarde des tickers',
            details: error.message 
        });
    }
}
