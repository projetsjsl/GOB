#!/usr/bin/env node

/**
 * Script de vérification des clés API manquantes
 * Vérifie les variables d'environnement nécessaires pour tous les endpoints
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Définition des clés API requises par endpoint
const API_KEYS_REQUIRED = {
    // Gemini / AI
    'GEMINI_API_KEY': {
        endpoints: ['/api/gemini/chat', '/api/chat-assistant', '/api/emma-agent'],
        description: 'Clé API Google Gemini pour les services IA',
        provider: 'Google AI Studio',
        url: 'https://aistudio.google.com/app/apikey',
        critical: true
    },
    
    // FMP (Financial Modeling Prep)
    'FMP_API_KEY': {
        endpoints: [
            '/api/fmp',
            '/api/fmp-company-data',
            '/api/fmp-search',
            '/api/fmp-stock-screener',
            '/api/fmp-sector-data',
            '/api/fmp-sync',
            '/api/fmp-batch-sync'
        ],
        description: 'Clé API Financial Modeling Prep pour données financières',
        provider: 'Financial Modeling Prep',
        url: 'https://financialmodelingprep.com/developer/docs/',
        critical: true
    },
    
    // Alpha Vantage
    'ALPHA_VANTAGE_API_KEY': {
        endpoints: ['/api/sector', '/api/sector-index'],
        description: 'Clé API Alpha Vantage pour données sectorielles',
        provider: 'Alpha Vantage',
        url: 'https://www.alphavantage.co/support/#api-key',
        critical: false, // A un fallback avec cache
        note: 'Quota limité (5 requêtes/min, 500/jour)'
    },
    
    // Resend (Email)
    'RESEND_API_KEY': {
        endpoints: ['/api/send-email', '/api/adapters/email'],
        description: 'Clé API Resend pour envoi d\'emails',
        provider: 'Resend',
        url: 'https://resend.com/api-keys',
        critical: true
    },
    'RESEND_FROM_EMAIL': {
        endpoints: ['/api/send-email'],
        description: 'Email expéditeur vérifié dans Resend',
        provider: 'Resend',
        url: 'https://resend.com/domains',
        critical: true,
        note: 'Doit être un domaine vérifié dans Resend'
    },
    
    // Twilio (SMS)
    'TWILIO_ACCOUNT_SID': {
        endpoints: ['/api/adapters/sms'],
        description: 'Account SID Twilio pour SMS',
        provider: 'Twilio',
        url: 'https://console.twilio.com/',
        critical: false
    },
    'TWILIO_AUTH_TOKEN': {
        endpoints: ['/api/adapters/sms'],
        description: 'Auth Token Twilio pour SMS',
        provider: 'Twilio',
        url: 'https://console.twilio.com/',
        critical: false
    },
    'TWILIO_PHONE_NUMBER': {
        endpoints: ['/api/adapters/sms'],
        description: 'Numéro de téléphone Twilio',
        provider: 'Twilio',
        url: 'https://console.twilio.com/phone-numbers',
        critical: false
    },
    
    // Supabase
    'SUPABASE_URL': {
        endpoints: ['Tous les endpoints Supabase'],
        description: 'URL du projet Supabase',
        provider: 'Supabase',
        url: 'https://supabase.com/dashboard',
        critical: true
    },
    'SUPABASE_ANON_KEY': {
        endpoints: ['Tous les endpoints Supabase'],
        description: 'Clé anonyme Supabase (publique)',
        provider: 'Supabase',
        url: 'https://supabase.com/dashboard',
        critical: true
    },
    'SUPABASE_SERVICE_ROLE_KEY': {
        endpoints: ['Endpoints admin Supabase'],
        description: 'Clé service role Supabase (privée)',
        provider: 'Supabase',
        url: 'https://supabase.com/dashboard',
        critical: true,
        note: '⚠️ NE JAMAIS exposer côté client'
    },
    
    // Browserbase (FastGraphs)
    'BROWSERBASE_API_KEY': {
        endpoints: ['/api/fastgraphs-login'],
        description: 'Clé API Browserbase pour automation',
        provider: 'Browserbase',
        url: 'https://www.browserbase.com/',
        critical: false
    },
    'BROWSERBASE_PROJECT_ID': {
        endpoints: ['/api/fastgraphs-login'],
        description: 'Project ID Browserbase',
        provider: 'Browserbase',
        url: 'https://www.browserbase.com/',
        critical: false
    },
    
    // Perplexity (Emma Briefings)
    'PERPLEXITY_API_KEY': {
        endpoints: ['/api/emma-agent', '/api/emma-briefing'],
        description: 'Clé API Perplexity pour briefings',
        provider: 'Perplexity',
        url: 'https://www.perplexity.ai/settings/api',
        critical: false
    }
};

// Vérifier les variables d'environnement
function checkEnvironmentVariables() {
    log('\n' + '='.repeat(80), 'cyan');
    log('🔑 VÉRIFICATION DES CLÉS API', 'cyan');
    log('='.repeat(80) + '\n', 'cyan');

    const results = {
        found: [],
        missing: [],
        critical: [],
        warnings: []
    };

    // Vérifier chaque clé
    for (const [key, config] of Object.entries(API_KEYS_REQUIRED)) {
        const value = process.env[key];
        
        if (value && value.trim() !== '') {
            // Masquer la valeur pour sécurité
            const masked = value.length > 8 
                ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
                : '***';
            
            results.found.push({ key, masked, config });
            log(`✅ ${key}: ${masked}`, 'green');
        } else {
            results.missing.push({ key, config });
            
            if (config.critical) {
                results.critical.push({ key, config });
                log(`❌ ${key}: MANQUANTE (CRITIQUE)`, 'red');
            } else {
                log(`⚠️  ${key}: MANQUANTE (optionnelle)`, 'yellow');
            }
            
            log(`   Endpoints affectés: ${config.endpoints.join(', ')}`, 'yellow');
            log(`   Provider: ${config.provider}`, 'yellow');
            log(`   URL: ${config.url}`, 'blue');
            if (config.note) {
                log(`   Note: ${config.note}`, 'yellow');
            }
            log('');
        }
    }

    // Résumé
    log('\n' + '='.repeat(80), 'cyan');
    log('📊 RÉSUMÉ', 'cyan');
    log('='.repeat(80), 'cyan');
    
    log(`\n✅ Clés trouvées: ${results.found.length}`, 'green');
    log(`❌ Clés manquantes: ${results.missing.length}`, results.missing.length > 0 ? 'red' : 'green');
    log(`🚨 Clés critiques manquantes: ${results.critical.length}`, results.critical.length > 0 ? 'red' : 'green');

    if (results.critical.length > 0) {
        log('\n🚨 CLÉS CRITIQUES MANQUANTES:', 'red');
        results.critical.forEach(({ key, config }) => {
            log(`\n   ${key}`, 'red');
            log(`   Description: ${config.description}`, 'red');
            log(`   Obtenir: ${config.url}`, 'blue');
        });
    }

    // Générer fichier de configuration
    const configTemplate = generateConfigTemplate(results.missing);
    const configPath = path.join(__dirname, '..', '.env.example.required');
    fs.writeFileSync(configPath, configTemplate);
    log(`\n📄 Template de configuration créé: ${configPath}`, 'cyan');

    // Recommandations
    log('\n💡 RECOMMANDATIONS:', 'cyan');
    
    if (results.critical.length > 0) {
        log('\n1. Configurer les clés critiques manquantes dans Vercel:', 'yellow');
        log('   - Allez sur https://vercel.com/dashboard', 'blue');
        log('   - Sélectionnez votre projet', 'blue');
        log('   - Settings → Environment Variables', 'blue');
        log('   - Ajoutez les clés manquantes', 'blue');
    }
    
    if (results.missing.length > results.critical.length) {
        log('\n2. Clés optionnelles peuvent être ajoutées plus tard', 'yellow');
        log('   Les endpoints fonctionneront avec des fonctionnalités limitées', 'yellow');
    }

    log('\n' + '='.repeat(80), 'cyan');

    return results;
}

function generateConfigTemplate(missingKeys) {
    let template = `# Configuration requise pour GOB Apps
# Copiez ce fichier vers .env.local et remplissez les valeurs
# Pour Vercel: Settings → Environment Variables

# ============================================================================
# CLÉS CRITIQUES (REQUISES)
# ============================================================================
`;

    const critical = missingKeys.filter(k => k.config.critical);
    const optional = missingKeys.filter(k => !k.config.critical);

    if (critical.length > 0) {
        template += '\n# CRITIQUES:\n';
        critical.forEach(({ key, config }) => {
            template += `# ${config.description}\n`;
            template += `# Obtenir: ${config.url}\n`;
            template += `${key}=\n\n`;
        });
    }

    if (optional.length > 0) {
        template += '\n# ============================================================================\n';
        template += '# CLÉS OPTIONNELLES\n';
        template += '# ============================================================================\n\n';
        optional.forEach(({ key, config }) => {
            template += `# ${config.description}\n`;
            if (config.note) {
                template += `# Note: ${config.note}\n`;
            }
            template += `# Obtenir: ${config.url}\n`;
            template += `# ${key}=\n\n`;
        });
    }

    return template;
}

// Vérifier aussi dans .env.local si présent
function checkLocalEnv() {
    const envPath = path.join(__dirname, '..', '.env.local');
    try {
        if (fs.existsSync(envPath)) {
            log('\n📁 Fichier .env.local trouvé', 'cyan');
            const envContent = fs.readFileSync(envPath, 'utf8');
            const envVars = {};
            
            envContent.split('\n').forEach(line => {
                const match = line.match(/^([A-Z_]+)=(.*)$/);
                if (match) {
                    envVars[match[1]] = match[2].trim();
                }
            });
            
            log(`   Variables trouvées: ${Object.keys(envVars).length}`, 'cyan');
            return envVars;
        }
    } catch (error) {
        // Fichier protégé ou inaccessible, ignorer silencieusement
        log('\n📁 Fichier .env.local non accessible (permissions)', 'yellow');
    }
    return {};
}

// Main
function main() {
    log('🔍 Vérification des clés API...\n', 'cyan');
    
    // Vérifier .env.local
    const localEnv = checkLocalEnv();
    
    // Vérifier les variables d'environnement
    const results = checkEnvironmentVariables();
    
    // Code de sortie
    process.exit(results.critical.length > 0 ? 1 : 0);
}

main();

