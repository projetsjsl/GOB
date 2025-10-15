// ============================================================================
// CONFIGURATION AUTOMATIQUE SUPABASE
// ============================================================================
// Ce script génère la configuration Supabase pour Vercel
// ============================================================================

const fs = require('fs');
const path = require('path');

// Configuration pour le projet "gob-watchlist"
const SUPABASE_CONFIG = {
  // Remplacez ces valeurs par vos vraies clés Supabase
  PROJECT_ID: 'gob-watchlist', // À remplacer par votre vrai project ID
  SUPABASE_URL: 'https://[VOTRE-PROJECT-ID].supabase.co', // À remplacer
  SUPABASE_ANON_KEY: '[VOTRE-ANON-KEY]', // À remplacer
  SUPABASE_SERVICE_ROLE_KEY: '[VOTRE-SERVICE-ROLE-KEY]' // À remplacer
};

function generateVercelEnvFile() {
  const envContent = `# Configuration Supabase pour Emma En Direct
# Généré automatiquement le ${new Date().toISOString()}

# Supabase Configuration
SUPABASE_URL=${SUPABASE_CONFIG.SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_CONFIG.SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_CONFIG.SUPABASE_SERVICE_ROLE_KEY}

# Autres variables existantes (à conserver)
OPENAI_API_KEY=sk-...E40A
ANTHROPIC_API_KEY=sk-ant-...sgAA
PERPLEXITY_API_KEY=pplx-...s3nz
GEMINI_API_KEY=AI...
RESEND_API_KEY=re_...
`;

  fs.writeFileSync('.env.local', envContent);
  console.log('✅ Fichier .env.local généré');
}

function generateVercelInstructions() {
  const instructions = `# 🚀 INSTRUCTIONS CONFIGURATION VERCEL

## Étape 1: Obtenir les clés Supabase

1. Aller dans votre projet Supabase "gob-watchlist"
2. Settings → API
3. Copier les valeurs suivantes :
   - Project URL
   - anon public
   - service_role

## Étape 2: Configurer dans Vercel

1. Aller dans Vercel Dashboard
2. Sélectionner votre projet "gob"
3. Settings → Environment Variables
4. Ajouter ces variables :

\`\`\`
SUPABASE_URL = https://[votre-project-id].supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

5. Sélectionner : ✅ Production, ✅ Preview, ✅ Development
6. Save et Redéployer

## Étape 3: Tester la connexion

Après le redéploiement, tester :

\`\`\`bash
curl https://gobapps.com/api/health-check-simple
\`\`\`

Résultat attendu :
\`\`\`json
{
  "status": "success",
  "message": "Connexion Supabase réussie",
  "summary": {
    "environment_configured": true,
    "connection_working": true,
    "tables_accessible": 4
  }
}
\`\`\`

## Étape 4: Vérifier l'API Watchlist

\`\`\`bash
curl https://gobapps.com/api/supabase-watchlist
\`\`\`

Résultat attendu :
\`\`\`json
{
  "success": true,
  "source": "supabase",
  "tickers": ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"]
}
\`\`\`
`;

  fs.writeFileSync('VERCEL-SUPABASE-SETUP.md', instructions);
  console.log('✅ Instructions Vercel générées dans VERCEL-SUPABASE-SETUP.md');
}

function updateVercelJson() {
  const vercelJsonPath = 'vercel.json';
  
  if (fs.existsSync(vercelJsonPath)) {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    
    // Ajouter le test-supabase à la configuration
    if (!vercelConfig.functions['api/test-supabase.js']) {
      vercelConfig.functions['api/test-supabase.js'] = {
        maxDuration: 10
      };
      console.log('✅ Configuration vercel.json mise à jour');
    }
    
    fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelConfig, null, 2));
  }
}

function main() {
  console.log('🔧 Configuration automatique Supabase...');
  
  // Générer les fichiers de configuration
  generateVercelEnvFile();
  generateVercelInstructions();
  updateVercelJson();
  
  console.log('\n✅ Configuration terminée !');
  console.log('\n📋 Prochaines étapes :');
  console.log('1. Modifier les valeurs dans .env.local avec vos vraies clés Supabase');
  console.log('2. Suivre les instructions dans VERCEL-SUPABASE-SETUP.md');
  console.log('3. Tester avec : curl https://gobapps.com/api/health-check-simple');
}

if (require.main === module) {
  main();
}

module.exports = { SUPABASE_CONFIG, generateVercelEnvFile, generateVercelInstructions };
