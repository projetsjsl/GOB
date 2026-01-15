/**
 * Emma Config API - Expose Emma's configuration for multi-site use
 */

import { applyCors, validateApiKey } from './_middleware/emma-cors.js';

const EMMA_PERSONAS = {
  finance: {
    id: 'finance',
    name: 'Emma IA • Finance',
    role: 'Expert financier et analyste de marché',
    model: 'claude-sonnet-4-20250514',
    style: 'professional',
    capabilities: ['quotes', 'analysis', 'news', 'briefings'],
    systemPrompt: `Tu es Emma, une assistante financière experte. Tu analyses les marchés avec précision et fournis des insights actionables.`
  },
  critic: {
    id: 'critic',
    name: 'Emma IA • Critic',
    role: 'Analyste critique et contradicteur',
    model: 'claude-sonnet-4-20250514',
    style: 'analytical',
    capabilities: ['analysis', 'risk-assessment'],
    systemPrompt: `Tu es Emma en mode critique. Tu challenges les hypothèses et identifies les risques.`
  },
  researcher: {
    id: 'researcher',
    name: 'Emma IA • Researcher',
    role: 'Chercheur et investigateur',
    model: 'claude-sonnet-4-20250514',
    style: 'thorough',
    capabilities: ['research', 'deep-analysis'],
    systemPrompt: `Tu es Emma en mode recherche. Tu creuses en profondeur et fournis des analyses détaillées.`
  },
  writer: {
    id: 'writer',
    name: 'Emma IA • Writer',
    role: 'Rédacteur et communicateur',
    model: 'claude-sonnet-4-20250514',
    style: 'eloquent',
    capabilities: ['writing', 'reports', 'briefings'],
    systemPrompt: `Tu es Emma en mode rédaction. Tu produis des contenus clairs, engageants et bien structurés.`
  },
  geek: {
    id: 'geek',
    name: 'Emma IA • Geek',
    role: 'Expert technique et données',
    model: 'claude-sonnet-4-20250514',
    style: 'technical',
    capabilities: ['technical', 'data', 'metrics'],
    systemPrompt: `Tu es Emma en mode geek. Tu plonges dans les données et métriques techniques.`
  },
  ceo: {
    id: 'ceo',
    name: 'Emma IA • CEO',
    role: 'Vision stratégique et leadership',
    model: 'claude-sonnet-4-20250514',
    style: 'executive',
    capabilities: ['strategy', 'decisions', 'leadership'],
    systemPrompt: `Tu es Emma en mode CEO. Tu penses stratégie, vision long-terme et décisions exécutives.`
  },
  macro: {
    id: 'macro',
    name: 'Emma IA • Macro',
    role: 'Économiste macro et géopolitique',
    model: 'claude-sonnet-4-20250514',
    style: 'macro',
    capabilities: ['macro', 'economics', 'geopolitics'],
    systemPrompt: `Tu es Emma en mode macro. Tu analyses les tendances économiques globales et géopolitiques.`
  },
  politics: {
    id: 'politics',
    name: 'Emma IA • Politics',
    role: 'Analyste politique et réglementaire',
    model: 'claude-sonnet-4-20250514',
    style: 'political',
    capabilities: ['politics', 'regulation', 'policy'],
    systemPrompt: `Tu es Emma en mode politique. Tu analyses l'impact des politiques et régulations sur les marchés.`
  }
};

const EMMA_COMMANDS = [
  { name: 'emma-quote', description: 'Get stock quote', endpoint: '/api/fmp?endpoint=quote&symbol={TICKER}' },
  { name: 'emma-news', description: 'Get market news', endpoint: '/api/news?ticker={TICKER}' },
  { name: 'emma-earnings', description: 'Get earnings data', endpoint: '/api/fmp?endpoint=earnings&symbol={TICKER}' },
  { name: 'emma-fundamentals', description: 'Get fundamentals', endpoint: '/api/fmp?endpoint=profile&symbol={TICKER}' },
  { name: 'emma-technical', description: 'Technical analysis', endpoint: '/api/fmp?endpoint=technical&symbol={TICKER}' },
  { name: 'emma-dividend', description: 'Dividend info', endpoint: '/api/fmp?endpoint=dividend&symbol={TICKER}' },
  { name: 'emma-insider', description: 'Insider trading', endpoint: '/api/fmp?endpoint=insider&symbol={TICKER}' },
  { name: 'emma-briefing-matin', description: 'Morning briefing', endpoint: '/api/briefing?type=morning' },
  { name: 'emma-briefing-midi', description: 'Midday briefing', endpoint: '/api/briefing?type=midday' },
  { name: 'emma-briefing-soir', description: 'Evening briefing', endpoint: '/api/briefing?type=evening' }
];

const EMMA_ENDPOINTS = [
  { path: '/api/fmp', method: 'GET', description: 'Financial data from FMP', auth: false },
  { path: '/api/news', method: 'GET', description: 'Aggregated news', auth: false },
  { path: '/api/chat', method: 'POST', description: 'Emma chat interface', auth: false },
  { path: '/api/briefing', method: 'GET/POST', description: 'Generate briefings', auth: false },
  { path: '/api/emma-config', method: 'GET', description: 'Emma configuration', auth: true }
];

export default async function handler(req, res) {
  const handled = applyCors(req, res);
  if (handled) return;

  const auth = validateApiKey(req);
  if (!auth.valid) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: auth.reason
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, id } = req.query;

  try {
    switch (type) {
      case 'personas':
        return res.status(200).json({
          success: true,
          data: EMMA_PERSONAS,
          count: Object.keys(EMMA_PERSONAS).length
        });

      case 'persona':
        if (!id) {
          return res.status(400).json({ error: 'Missing persona id parameter' });
        }
        if (!EMMA_PERSONAS[id]) {
          return res.status(404).json({ error: `Persona '${id}' not found` });
        }
        return res.status(200).json({
          success: true,
          data: EMMA_PERSONAS[id]
        });

      case 'commands':
        return res.status(200).json({
          success: true,
          data: EMMA_COMMANDS,
          count: EMMA_COMMANDS.length
        });

      case 'endpoints':
        return res.status(200).json({
          success: true,
          data: EMMA_ENDPOINTS,
          baseUrl: 'https://gobapps.com',
          count: EMMA_ENDPOINTS.length
        });

      default:
        return res.status(200).json({
          success: true,
          name: 'Emma IA',
          version: '2.0',
          description: 'AI Financial Assistant',
          available: {
            personas: Object.keys(EMMA_PERSONAS).length,
            commands: EMMA_COMMANDS.length,
            endpoints: EMMA_ENDPOINTS.length
          },
          usage: {
            personas: '/api/emma-config?type=personas',
            persona: '/api/emma-config?type=persona&id=finance',
            commands: '/api/emma-config?type=commands',
            endpoints: '/api/emma-config?type=endpoints'
          }
        });
    }
  } catch (error) {
    console.error('Emma Config Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
