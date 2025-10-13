import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, ticker } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(200).json({ 
        error: 'Claude API key not configured',
        analysis: JSON.stringify({
          ticker: ticker,
          companyName: `${ticker} Corporation`,
          lastUpdate: new Date().toISOString(),
          metrics: {
            marketCap: "N/A",
            bpaGrowth: "N/A",
            peRatio: "N/A",
            sector: "N/A",
            dividendYield: "N/A",
            dividendFrequency: "N/A",
            exDivDate: "N/A",
            annualPayout: "N/A",
            price: "N/A",
            priceChange: "N/A"
          },
          companyProfile: {
            description: "Analyse en attente - Claude API non configurée",
            employees: "N/A",
            innovation: "N/A"
          },
          competition: {
            competitors: ["N/A"],
            valueProposition: "N/A",
            advantages: "N/A"
          },
          quantRating: {
            valuation: "N/A",
            growth: "N/A",
            profitability: "N/A",
            momentum: "N/A",
            revisions: "N/A"
          },
          sectorAnalysis: {
            valuation: "Analyse en attente",
            growth: "Analyse en attente",
            profitability: "Analyse en attente",
            momentum: "Analyse en attente",
            revisions: "Analyse en attente"
          },
          intermediateConclusion: "Analyse en attente - Claude API non configurée",
          strengths: ["Configuration requise"],
          concerns: ["Claude API non configurée"],
          finalConclusion: {
            strengths: "N/A",
            weaknesses: "N/A",
            recommendation: "Configuration de l'API Claude requise",
            rating: "Hold"
          }
        })
      });
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const analysis = response?.content?.[0]?.text || '';
    if (!analysis) throw new Error('Réponse Claude vide');

    res.status(200).json({
      success: true,
      analysis: analysis,
      ticker: ticker
    });

  } catch (error) {
    console.error('Erreur Claude API:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'analyse Claude',
      details: error.message 
    });
  }
}
