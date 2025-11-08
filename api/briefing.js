/**
 * API Briefing - Génération de briefings automatisés
 * 
 * Pattern: Suit le même pattern que /api/chat.js
 * - Lit les prompts depuis config/briefing-prompts.json
 * - Récupère les tickers depuis Supabase (comme /api/chat)
 * - Appelle /api/emma-agent avec output_mode: 'briefing'
 * - Applique le template HTML selon le type
 * - Retourne contenu formaté (texte + HTML)
 * 
 * Usage:
 * GET /api/briefing?type=morning|midday|evening
 * POST /api/briefing
 * Body: { type: 'morning'|'midday'|'evening', tickers?: string[] }
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateBriefingTemplate } from '../lib/email-templates.js';
import { sendBriefingConfirmation } from '../lib/briefing-confirmation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Charge la configuration des briefings
 */
function loadBriefingConfig() {
  try {
    const configPath = join(__dirname, '..', 'config', 'briefing-prompts.json');
    const configContent = readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('❌ Erreur chargement config briefings:', error);
    throw new Error('Failed to load briefing configuration');
  }
}

/**
 * Récupère les tickers depuis Supabase (comme /api/chat)
 */
async function getTickersFromSupabase() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('⚠️ Supabase non configuré, utilisation tickers par défaut');
      return {
        teamTickers: [
          'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
          'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
          'TRP', 'UNH', 'UL', 'VZ', 'WFC'
        ],
        watchlist: []
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Charger team_tickers et watchlist (comme /api/chat)
    const [teamTickersResult, watchlistResult] = await Promise.all([
      supabase
        .from('tickers')
        .select('ticker')
        .eq('is_active', true)
        .or('source.eq.team,source.eq.both')
        .order('priority', { ascending: false }),
      supabase
        .from('tickers')
        .select('ticker')
        .eq('is_active', true)
        .or('source.eq.watchlist,source.eq.both')
        .order('ticker', { ascending: true })
    ]);

    const teamTickers = teamTickersResult.data?.map(item => item.ticker) || [
      'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
      'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
      'TRP', 'UNH', 'UL', 'VZ', 'WFC'
    ];

    const watchlist = watchlistResult.data?.map(item => item.ticker) || [];

    return { teamTickers, watchlist };
  } catch (error) {
    console.error('❌ Erreur récupération tickers:', error);
    // Fallback
    return {
      teamTickers: [
        'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
        'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
        'TRP', 'UNH', 'UL', 'VZ', 'WFC'
      ],
      watchlist: []
    };
  }
}

/**
 * Appelle Emma Agent pour générer le briefing
 */
async function callEmmaAgent(prompt, tickers, briefingType, toolsPriority) {
  try {
    // Utiliser l'URL Vercel si disponible, sinon localhost
    const baseUrl = process.env.VERCEL_URL 
      ? (process.env.VERCEL_URL.startsWith('http') ? process.env.VERCEL_URL : `https://${process.env.VERCEL_URL}`)
      : process.env.VERCEL 
        ? 'https://gob.vercel.app'
        : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/emma-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: prompt,
        context: {
          output_mode: 'briefing',
          briefing_type: briefingType,
          tickers: tickers,
          tools_priority: toolsPriority || []
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Emma Agent API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Emma Agent returned unsuccessful response');
    }

    return data;
  } catch (error) {
    console.error('❌ Erreur appel Emma Agent:', error);
    throw error;
  }
}

/**
 * Handler principal
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. DÉTERMINER LE TYPE DE BRIEFING
    let briefingType = req.query.type || req.body?.type;

    if (!briefingType) {
      return res.status(400).json({
        success: false,
        error: 'Missing type parameter. Must be: morning, midday, or evening'
      });
    }

    // Normaliser le type
    if (briefingType === 'noon') {
      briefingType = 'midday';
    }

    const validTypes = ['morning', 'midday', 'evening'];
    if (!validTypes.includes(briefingType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    console.log(`📧 Génération briefing ${briefingType}...`);

    // 2. CHARGER LA CONFIGURATION
    const config = loadBriefingConfig();
    const promptConfig = config[briefingType];

    if (!promptConfig) {
      return res.status(400).json({
        success: false,
        error: `Configuration not found for type: ${briefingType}`
      });
    }

    // 3. RÉCUPÉRER LES TICKERS (comme /api/chat)
    const { teamTickers, watchlist } = await getTickersFromSupabase();
    const allTickers = [...new Set([...teamTickers, ...(req.body?.tickers || [])])];

    console.log(`📊 Tickers: ${allTickers.length} (team: ${teamTickers.length}, watchlist: ${watchlist.length})`);

    // 4. PRÉPARER LE PROMPT
    const prompt = promptConfig.prompt;
    const fullPrompt = allTickers.length > 0
      ? `${prompt}\n\nFocus sur ces tickers: ${allTickers.join(', ')}`
      : prompt;

    // 5. APPELER EMMA AGENT (comme /api/chat appelle /api/emma-agent)
    const emmaResponse = await callEmmaAgent(
      fullPrompt, 
      allTickers, 
      briefingType,
      promptConfig.tools_priority || []
    );

    if (!emmaResponse.success) {
      throw new Error(`Emma Agent failed: ${emmaResponse.error}`);
    }

    const content = emmaResponse.response || emmaResponse.analysis || '';

    // 6. GÉNÉRER LE HTML AVEC LE TEMPLATE APPROPRIÉ
    const htmlContent = generateBriefingTemplate(briefingType, content, {
      tickers: allTickers,
      tools_used: emmaResponse.tools_used,
      execution_time_ms: emmaResponse.execution_time_ms
    });

    // 7. PRÉPARER LE SUJET
    const date = new Date().toLocaleDateString('fr-FR');
    const subject = promptConfig.email_config.subject_template.replace('{date}', date);

    // 8. RETOURNER LA RÉPONSE
    return res.status(200).json({
      success: true,
      type: briefingType,
      subject: subject,
      content: content,
      html_content: htmlContent,
      metadata: {
        tickers: allTickers,
        tools_used: emmaResponse.tools_used || [],
        execution_time_ms: emmaResponse.execution_time_ms,
        generated_at: new Date().toISOString(),
        prompt_config: {
          name: promptConfig.name,
          tone: promptConfig.tone,
          length: promptConfig.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur génération briefing:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

