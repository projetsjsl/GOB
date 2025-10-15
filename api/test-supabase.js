// ============================================================================
// TEST SUPABASE CONNECTION - Endpoint de test
// ============================================================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const result = {
      timestamp: new Date().toISOString(),
      environment: {
        SUPABASE_URL: SUPABASE_URL ? '✅ Configurée' : '❌ Manquante',
        SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? '✅ Configurée' : '❌ Manquante',
        SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurée' : '❌ Manquante'
      },
      tests: {}
    };

    // Test 1: Variables d'environnement
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(200).json({
        ...result,
        status: 'error',
        message: 'Variables d\'environnement Supabase manquantes',
        instructions: [
          '1. Aller dans Vercel → Settings → Environment Variables',
          '2. Ajouter SUPABASE_URL=https://[project-id].supabase.co',
          '3. Ajouter SUPABASE_ANON_KEY=[votre-anon-key]',
          '4. Ajouter SUPABASE_SERVICE_ROLE_KEY=[votre-service-role-key]',
          '5. Redéployer l\'application'
        ]
      });
    }

    // Test 2: Connexion avec anon key
    try {
      const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: anonData, error: anonError } = await supabaseAnon
        .from('watchlists')
        .select('*')
        .limit(1);

      result.tests.anon_connection = {
        status: anonError ? 'error' : 'success',
        error: anonError?.message || null,
        data_count: anonData?.length || 0
      };
    } catch (error) {
      result.tests.anon_connection = {
        status: 'error',
        error: error.message
      };
    }

    // Test 3: Connexion avec service role key
    if (SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: serviceData, error: serviceError } = await supabaseService
          .from('watchlists')
          .select('*')
          .limit(1);

        result.tests.service_connection = {
          status: serviceError ? 'error' : 'success',
          error: serviceError?.message || null,
          data_count: serviceData?.length || 0
        };
      } catch (error) {
        result.tests.service_connection = {
          status: 'error',
          error: error.message
        };
      }
    }

    // Test 4: Tables disponibles
    const tables = ['watchlists', 'briefings', 'market_news_cache', 'symbol_news_cache'];
    result.tests.tables = {};

    for (const table of tables) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        result.tests.tables[table] = {
          status: error ? 'error' : 'success',
          error: error?.message || null,
          accessible: !error
        };
      } catch (error) {
        result.tests.tables[table] = {
          status: 'error',
          error: error.message,
          accessible: false
        };
      }
    }

    // Déterminer le statut global
    const hasErrors = Object.values(result.tests).some(test => 
      typeof test === 'object' && test.status === 'error'
    );

    return res.status(200).json({
      ...result,
      status: hasErrors ? 'partial' : 'success',
      message: hasErrors ? 'Connexion partielle avec quelques erreurs' : 'Connexion Supabase réussie',
      summary: {
        environment_configured: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
        connection_working: !hasErrors,
        tables_accessible: Object.values(result.tests.tables || {}).filter(t => t.accessible).length
      }
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors du test Supabase',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
