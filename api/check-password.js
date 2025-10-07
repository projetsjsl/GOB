// API de vérification du mot de passe
export default async function handler(req, res) {
    const { method } = req;
    
    // Récupérer le mot de passe depuis les variables d'environnement Vercel
    const SITE_PASSWORD = process.env.SITE_PASSWORD;
    
    // Si pas de mot de passe configuré, permettre l'accès
    if (!SITE_PASSWORD || SITE_PASSWORD === '') {
        return res.status(200).json({
            requiresPassword: false,
            message: 'Aucun mot de passe configuré'
        });
    }
    
    if (method === 'GET') {
        // Vérifier si un mot de passe est requis
        return res.status(200).json({
            requiresPassword: true,
            message: 'Mot de passe requis'
        });
    }
    
    if (method === 'POST') {
        try {
            const { password } = req.body;
            
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Mot de passe requis'
                });
            }
            
            // Vérifier le mot de passe
            if (password === SITE_PASSWORD) {
                return res.status(200).json({
                    success: true,
                    message: 'Mot de passe correct'
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Mot de passe incorrect'
                });
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du mot de passe:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur'
            });
        }
    }
    
    // Méthode non supportée
    return res.status(405).json({
        success: false,
        message: 'Méthode non supportée'
    });
}
