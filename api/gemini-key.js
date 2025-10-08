// ========================================
// API ROUTE VERCEL - CLÉ GEMINI
// ========================================

export default function handler(req, res) {
  // Ajouter des headers CORS pour éviter les problèmes de cross-origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Vérifier que c'est une requête GET
  if (req.method !== 'GET') {
    console.log('❌ Méthode non autorisée:', req.method);
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  console.log('🔑 Tentative de récupération de la clé API Gemini...');
  
  // Récupérer la clé API depuis les variables d'environnement Vercel
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔍 Variables d\'environnement disponibles:', Object.keys(process.env).filter(key => key.includes('GEMINI')));
  console.log('🔑 Clé API trouvée:', geminiApiKey ? 'OUI (masquée)' : 'NON');

  if (!geminiApiKey) {
    console.log('❌ Clé API Gemini non configurée');
    return res.status(500).json({ 
      error: 'Clé API Gemini non configurée',
      message: 'Veuillez configurer la variable d\'environnement GEMINI_API_KEY dans Vercel',
      debug: {
        availableEnvVars: Object.keys(process.env).filter(key => key.includes('GEMINI')),
        timestamp: new Date().toISOString()
      }
    });
  }

  console.log('✅ Clé API Gemini récupérée avec succès');
  
  // Retourner la clé API (sécurisé côté serveur)
  return res.status(200).json({
    apiKey: geminiApiKey,
    source: 'vercel-env',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
}
