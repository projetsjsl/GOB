/**
 * FMP API Proxy Routes
 * Handles all FMP-related requests
 */

import fmp from '../fmp.js';

export default async function handler(req, res) {
  const { endpoint } = req.query;
  const { symbol, period, limit } = req.query;

  try {
    let result;

    switch (endpoint) {
      case 'profile':
        if (!symbol) return res.status(400).json({ error: 'Parameter symbol required' });
        result = await fmp.getCompanyProfile(symbol);
        break;

      case 'financials':
        if (!symbol) return res.status(400).json({ error: 'Parameter symbol required' });
        result = await fmp.getFinancialStatements(symbol, period || 'quarter', parseInt(limit) || 4);
        break;

      case 'ratios':
        if (!symbol) return res.status(400).json({ error: 'Parameter symbol required' });
        result = await fmp.getFinancialRatiosTTM(symbol);
        break;

      case 'dcf':
        if (!symbol) return res.status(400).json({ error: 'Parameter symbol required' });
        result = await fmp.getDCFValuation(symbol);
        break;

      case 'analyst':
        if (!symbol) return res.status(400).json({ error: 'Parameter symbol required' });
        const [priceTarget, upgrades, rating] = await Promise.allSettled([
          fmp.getPriceTargetConsensus(symbol),
          fmp.getUpgradesDowngrades(symbol, 50),
          fmp.getCompanyRating(symbol)
        ]);
        result = {
          priceTarget: priceTarget.status === 'fulfilled' ? priceTarget.value?.[0] : null,
          upgrades: upgrades.status === 'fulfilled' ? upgrades.value : [],
          rating: rating.status === 'fulfilled' ? rating.value?.[0] : null
        };
        break;

      case 'earnings':
        if (!symbol) return res.status(400).json({ error: 'Parameter symbol required' });
        const [surprises, historical] = await Promise.allSettled([
          fmp.getEarningsSurprises(symbol),
          fmp.getHistoricalEarnings(symbol, 12)
        ]);
        result = {
          surprises: surprises.status === 'fulfilled' ? surprises.value : [],
          historical: historical.status === 'fulfilled' ? historical.value : []
        };
        break;

      case 'insider':
        if (!symbol) return res.status(400).json({ error: 'Parameter symbol required' });
        result = await fmp.getInsiderTrading(symbol, parseInt(limit) || 20);
        break;

      case 'complete':
        if (!symbol) return res.status(400).json({ error: 'Parameter symbol required' });
        result = await fmp.getCompleteAnalysis(symbol);
        break;

      case 'news':
        if (!symbol) return res.status(400).json({ error: 'Parameter symbol required' });
        result = await fmp.getCompanyNews(symbol, parseInt(limit) || 50);
        break;

      default:
        return res.status(404).json({ error: `Unknown endpoint: ${endpoint}` });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(`FMP API error for ${endpoint}:`, error);
    res.status(500).json({ 
      error: 'FMP API request failed', 
      message: error.message,
      endpoint 
    });
  }
}

