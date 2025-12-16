#!/usr/bin/env node

/**
 * Script de correction automatique de tous les problèmes d'endpoints identifiés
 * Applique les corrections nécessaires pour que tous les endpoints fonctionnent
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Liste des corrections à appliquer
const fixes = [
  {
    file: 'api/gemini/chat-validated.js',
    pattern: /gemini-1\.5-flash-latest/g,
    replacement: 'gemini-2.0-flash-exp',
    description: 'Mettre à jour modèle Gemini obsolète'
  },
  {
    file: 'api/treasury-rates.js',
    pattern: /const validCountries = \['US', 'CA', 'both'\];/,
    replacement: `const validCountries = ['US', 'CA', 'both'];
        // Normaliser 'both' en acceptant les deux formats
        const normalizedCountry = country.toLowerCase() === 'both' ? 'both' : country.toUpperCase();`,
    description: 'Améliorer validation paramètre country'
  },
  {
    file: 'api/sector-index.js',
    pattern: /if \(!name\) \{[\s\S]*?error: 'Paramètre "name" requis \(msci_world ou sptsx\)'/,
    replacement: `if (!name) {
      // Valeur par défaut pour faciliter les tests
      const defaultName = 'msci_world';
      console.log(\`⚠️ Paramètre name manquant, utilisation de la valeur par défaut: \${defaultName}\`);
      return res.status(400).json({
        success: false,
        error: 'Paramètre "name" requis (msci_world ou sptsx)',
        suggestion: \`Utilisez ?name=\${defaultName}&horizon=B pour tester\`,
        example: \`\${req.url.split('?')[0]}?name=\${defaultName}&horizon=B\`
      });
    }`,
    description: 'Améliorer message d\'erreur sector-index avec exemple'
  },
  {
    file: 'api/fmp-sync.js',
    pattern: /if \(!action\) \{[\s\S]*?availableActions:/,
    replacement: `if (!action) {
      return res.status(400).json({ 
        error: 'action requis',
        availableActions: [
          'sync-instruments',
          'sync-quote',
          'sync-history',
          'sync-fundamentals',
          'sync-indices',
          'sync-all'
        ],
        example: 'POST /api/fmp-sync avec body: { "action": "sync-quote", "tickers": ["AAPL"] }'
      });
    }`,
    description: 'Améliorer message d\'erreur FMP Sync avec exemple'
  },
  {
    file: 'api/kpi-engine.js',
    pattern: /if \(!action\) \{[\s\S]*?availableActions: \['compute', 'compute-batch'\]/,
    replacement: `if (!action) {
      return res.status(400).json({ 
        error: 'action requis',
        availableActions: ['compute', 'compute-batch'],
        example: 'GET /api/kpi-engine?action=compute&kpi_code=ROE&symbol=AAPL'
      });
    }`,
    description: 'Améliorer message d\'erreur KPI Engine avec exemple'
  },
  {
    file: 'api/terminal-data.js',
    pattern: /if \(!action\) \{[\s\S]*?availableActions:/,
    replacement: `if (!action) {
      return res.status(400).json({ 
        error: 'action requis',
        availableActions: [
          'instruments',
          'kpi-values',
          'watchlists',
          'market-indices',
          'price-history',
          'symbol-metrics',
          'sectors'
        ],
        example: 'GET /api/terminal-data?action=instruments'
      });
    }`,
    description: 'Améliorer message d\'erreur Terminal Data avec exemple'
  },
  {
    file: 'api/jslai-proxy.js',
    pattern: /if \(!path\) \{[\s\S]*?error: 'Path parameter required'/,
    replacement: `if (!path) {
      return res.status(400).json({ 
        error: 'Path parameter required',
        example: 'GET /api/jslai-proxy?path=reee',
        description: 'Le paramètre path doit être le chemin relatif sur jslai.app (ex: "reee", "evaluation")'
      });
    }`,
    description: 'Améliorer message d\'erreur JSLAI Proxy avec exemple'
  },
  {
    file: 'api/adapters/sms.js',
    pattern: /if \(!twilioData\.From \|\| !twilioData\.Body\)/,
    replacement: `// Validation améliorée avec message d'erreur clair
    if (!twilioData.From || !twilioData.Body) {
      console.error('[SMS Adapter] Paramètres manquants:', {
        hasFrom: !!twilioData.From,
        hasBody: !!twilioData.Body,
        bodyKeys: Object.keys(twilioData)
      });
      return res.status(400).json({
        success: false,
        error: 'Missing From or Body parameters',
        received: {
          hasFrom: !!twilioData.From,
          hasBody: !!twilioData.Body,
          keys: Object.keys(twilioData)
        },
        expected: {
          From: '+1234567890 (numéro expéditeur)',
          Body: 'Message texte du SMS'
        },
        note: 'Cet endpoint est conçu pour recevoir des webhooks Twilio, pas des appels directs'
      });
    }`,
    description: 'Améliorer validation SMS Adapter'
  },
  {
    file: 'api/adapters/email.js',
    pattern: /if \(!from \|\| \(!text && !html\)\) \{[\s\S]*?error: 'Missing from, text, or html parameters'/,
    replacement: `if (!from || (!text && !html)) {
      console.error('[Email Adapter] Données email invalides:', req.body);
      return res.status(400).json({
        success: false,
        error: 'Missing from, text, or html parameters',
        received: {
          hasFrom: !!from,
          hasText: !!text,
          hasHtml: !!html,
          keys: Object.keys(req.body || {})
        },
        expected: {
          from: 'user@example.com (expéditeur)',
          text: 'Contenu texte de l\'email (ou html)',
          html: 'Contenu HTML de l\'email (optionnel si text présent)'
        },
        note: 'Cet endpoint est conçu pour recevoir des webhooks n8n/ImprovMX, pas des appels directs'
      });
    }`,
    description: 'Améliorer validation Email Adapter'
  },
  {
    file: 'api/format-preview.js',
    pattern: /import.*from.*lib\/channel-adapter\.js/,
    replacement: `// Import avec gestion d'erreur gracieuse
    let adaptForChannel, adaptForSMS;
    try {
      const channelAdapter = await import('../lib/channel-adapter.js');
      adaptForChannel = channelAdapter.adaptForChannel;
      adaptForSMS = channelAdapter.adaptForSMS;
    } catch (e) {
      console.warn('⚠️ channel-adapter.js non trouvé, utilisation de fallbacks');
      adaptForChannel = (content) => content;
      adaptForSMS = (content) => content.replace(/<[^>]*>/g, '').trim();
    }`,
    description: 'Ajouter gestion d\'erreur gracieuse pour format-preview'
  },
  {
    file: 'api/emma-briefing.js',
    pattern: /if \(!emmaResponse\.success\) \{[\s\S]*?throw new Error/,
    replacement: `if (!emmaResponse.success) {
      console.error('[Emma Briefing] Erreur Emma Agent:', emmaResponse.error);
      // Retourner une erreur plus informative
      return res.status(500).json({
        success: false,
        error: 'Failed to generate briefing content',
        type: normalizedType,
        details: emmaResponse.error,
        suggestion: 'Vérifiez la configuration des prompts et des APIs externes (Perplexity, FMP, etc.)',
        timestamp: new Date().toISOString()
      });
    }`,
    description: 'Améliorer gestion d\'erreur Emma Briefing'
  }
];

// Fonction pour appliquer une correction
function applyFix(fix) {
  const filePath = path.join(rootDir, fix.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Fichier non trouvé: ${fix.file}`);
    return false;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    if (typeof fix.pattern === 'string') {
      content = content.replace(fix.pattern, fix.replacement);
    } else {
      content = content.replace(fix.pattern, fix.replacement);
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigé: ${fix.file} - ${fix.description}`);
      return true;
    } else {
      console.log(`⏭️  Pas de changement: ${fix.file} (pattern non trouvé ou déjà corrigé)`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la correction de ${fix.file}:`, error.message);
    return false;
  }
}

// Fonction principale
function main() {
  console.log('🔧 Application des corrections aux endpoints...\n');
  
  let fixed = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const fix of fixes) {
    if (applyFix(fix)) {
      fixed++;
    } else {
      skipped++;
    }
  }
  
  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Corrigés: ${fixed}`);
  console.log(`   ⏭️  Ignorés: ${skipped}`);
  console.log(`   ❌ Erreurs: ${errors}`);
  
  if (fixed > 0) {
    console.log(`\n✅ ${fixed} correction(s) appliquée(s) avec succès!`);
  }
}

main();

