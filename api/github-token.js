export default function handler(req, res) {
    // Vérifier que la méthode est GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Récupérer le token depuis les variables d'environnement
        const githubToken = process.env.GITHUB_TOKEN;

        if (!githubToken) {
            return res.status(404).json({ 
                error: 'GITHUB_TOKEN not configured',
                message: 'La variable d\'environnement GITHUB_TOKEN n\'est pas configurée sur le serveur'
            });
        }

        // Retourner le token (sans l'exposer complètement pour la sécurité)
        return res.status(200).json({
            token: githubToken,
            configured: true,
            message: 'Token GitHub récupéré depuis l\'environnement serveur'
        });

    } catch (error) {
        console.error('Erreur récupération token GitHub:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Erreur lors de la récupération du token GitHub'
        });
    }
}
