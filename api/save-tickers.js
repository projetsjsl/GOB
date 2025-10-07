// API pour sauvegarder la liste des titres centralisée
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { tickers } = req.body;
        
        if (!Array.isArray(tickers)) {
            return res.status(400).json({ error: 'Les tickers doivent être un tableau' });
        }

        // Valider les tickers (lettres majuscules uniquement)
        const validTickers = tickers.filter(ticker => 
            typeof ticker === 'string' && 
            /^[A-Z]{1,5}$/.test(ticker.toUpperCase())
        ).map(ticker => ticker.toUpperCase());

        // Créer l'objet de données
        const tickerData = {
            tickers: validTickers,
            lastUpdated: new Date().toISOString(),
            count: validTickers.length
        };

        // En production, vous pourriez sauvegarder dans une base de données
        // Pour l'instant, on simule la sauvegarde
        console.log('Tickers sauvegardés:', tickerData);

        res.status(200).json({
            success: true,
            message: 'Tickers sauvegardés avec succès',
            data: tickerData
        });
        
    } catch (error) {
        console.error('Erreur sauvegarde tickers:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la sauvegarde des tickers',
            details: error.message 
        });
    }
}
