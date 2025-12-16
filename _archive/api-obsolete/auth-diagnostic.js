/**
 * API de Diagnostic d'Authentification GOB
 * Vérifie l'état de la base de données et les politiques RLS
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    // Test 1: Vérifier la configuration
    diagnostics.tests.push({
      name: 'Configuration Supabase',
      status: process.env.SUPABASE_URL && process.env.SUPABASE_KEY ? 'PASS' : 'FAIL',
      details: {
        url_configured: !!process.env.SUPABASE_URL,
        key_configured: !!process.env.SUPABASE_KEY,
        url: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'NON_CONFIGURÉ'
      }
    });

    // Test 2: Vérifier l'existence de la table users
    try {
      const { data: usersCheck, error: usersError } = await supabase
        .from('users')
        .select('username')
        .limit(1);

      diagnostics.tests.push({
        name: 'Table users existe',
        status: usersError ? (usersError.code === 'PGRST116' ? 'PASS (vide)' : 'FAIL') : 'PASS',
        details: {
          error_code: usersError?.code,
          error_message: usersError?.message,
          has_data: !usersError && usersCheck && usersCheck.length > 0
        }
      });
    } catch (err) {
      diagnostics.tests.push({
        name: 'Table users existe',
        status: 'ERROR',
        details: { error: err.message }
      });
    }

    // Test 3: Tenter de créer un utilisateur de test
    const testUsername = `test_${Date.now()}`;
    try {
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert([{
          username: testUsername,
          display_name: 'Test User',
          role: 'invite',
          last_login: new Date().toISOString()
        }])
        .select()
        .single();

      diagnostics.tests.push({
        name: 'INSERT dans users',
        status: insertError ? 'FAIL' : 'PASS',
        details: {
          error_code: insertError?.code,
          error_message: insertError?.message,
          error_hint: insertError?.hint,
          error_details: insertError?.details,
          success: !insertError
        }
      });

      // Si l'insertion a réussi, nettoyer en supprimant l'utilisateur test
      if (!insertError && insertData) {
        await supabase
          .from('users')
          .delete()
          .eq('username', testUsername);
      }
    } catch (err) {
      diagnostics.tests.push({
        name: 'INSERT dans users',
        status: 'ERROR',
        details: { error: err.message, stack: err.stack }
      });
    }

    // Test 4: Vérifier les politiques RLS
    try {
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_table_policies', { table_name: 'users' })
        .catch(() => ({ data: null, error: { message: 'RPC function not available' } }));

      diagnostics.tests.push({
        name: 'Politiques RLS (si disponible)',
        status: policies ? 'PASS' : 'SKIP',
        details: {
          available: !!policies,
          error: policiesError?.message,
          policies: policies || 'Fonction RPC non disponible'
        }
      });
    } catch (err) {
      diagnostics.tests.push({
        name: 'Politiques RLS',
        status: 'SKIP',
        details: { note: 'Fonction RPC non disponible' }
      });
    }

    // Test 5: Tester UPDATE
    try {
      // D'abord créer un utilisateur
      const updateTestUsername = `update_test_${Date.now()}`;
      const { data: createData, error: createError } = await supabase
        .from('users')
        .insert([{
          username: updateTestUsername,
          display_name: 'Update Test',
          role: 'invite',
          last_login: new Date().toISOString()
        }])
        .select()
        .single();

      if (!createError && createData) {
        // Essayer de mettre à jour
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('username', updateTestUsername)
          .select()
          .single();

        diagnostics.tests.push({
          name: 'UPDATE dans users',
          status: updateError ? 'FAIL' : 'PASS',
          details: {
            error_code: updateError?.code,
            error_message: updateError?.message,
            error_hint: updateError?.hint,
            error_details: updateError?.details,
            success: !updateError
          }
        });

        // Nettoyer
        await supabase
          .from('users')
          .delete()
          .eq('username', updateTestUsername);
      } else {
        diagnostics.tests.push({
          name: 'UPDATE dans users',
          status: 'SKIP',
          details: { reason: 'Impossible de créer un utilisateur pour tester UPDATE', error: createError?.message }
        });
      }
    } catch (err) {
      diagnostics.tests.push({
        name: 'UPDATE dans users',
        status: 'ERROR',
        details: { error: err.message }
      });
    }

    // Résumé
    const passed = diagnostics.tests.filter(t => t.status === 'PASS' || t.status === 'PASS (vide)').length;
    const failed = diagnostics.tests.filter(t => t.status === 'FAIL' || t.status === 'ERROR').length;
    const skipped = diagnostics.tests.filter(t => t.status === 'SKIP').length;

    diagnostics.summary = {
      total_tests: diagnostics.tests.length,
      passed,
      failed,
      skipped,
      overall_status: failed === 0 ? 'HEALTHY' : 'ISSUES_DETECTED'
    };

    // Recommandations
    diagnostics.recommendations = [];

    const insertTest = diagnostics.tests.find(t => t.name === 'INSERT dans users');
    const updateTest = diagnostics.tests.find(t => t.name === 'UPDATE dans users');

    if (insertTest && insertTest.status === 'FAIL') {
      if (insertTest.details.error_message && insertTest.details.error_message.includes('policy')) {
        diagnostics.recommendations.push({
          priority: 'HIGH',
          issue: 'Politique RLS INSERT manquante',
          solution: 'Exécuter le script supabase-auth-migration.sql dans le SQL Editor de Supabase'
        });
      } else if (insertTest.details.error_message && insertTest.details.error_message.includes('pattern')) {
        diagnostics.recommendations.push({
          priority: 'HIGH',
          issue: 'Erreur de validation de pattern détectée',
          solution: 'Vérifier les contraintes CHECK sur la table users et s\'assurer que les valeurs insérées sont valides',
          details: insertTest.details
        });
      }
    }

    if (updateTest && updateTest.status === 'FAIL') {
      if (updateTest.details.error_message && updateTest.details.error_message.includes('policy')) {
        diagnostics.recommendations.push({
          priority: 'HIGH',
          issue: 'Politique RLS UPDATE manquante',
          solution: 'Exécuter le script supabase-auth-migration.sql dans le SQL Editor de Supabase'
        });
      }
    }

    return res.status(200).json({
      success: true,
      diagnostics
    });

  } catch (error) {
    console.error('Erreur diagnostic:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du diagnostic',
      details: error.message,
      diagnostics
    });
  }
}
