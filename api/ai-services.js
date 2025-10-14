// ============================================================================
// API Endpoint: AI Services Unifié
// Regroupe Perplexity, OpenAI et Resend en un seul endpoint
// ============================================================================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { service, ...params } = req.body;

    switch (service) {
      case 'perplexity':
        return await handlePerplexity(req, res, params);
      case 'openai':
        return await handleOpenAI(req, res, params);
      case 'resend':
        return await handleResend(req, res, params);
      default:
        return res.status(400).json({ error: 'Service non reconnu. Utilisez: perplexity, openai, resend' });
    }
  } catch (error) {
    console.error('Erreur AI Services:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
}

// ============================================================================
// PERPLEXITY SEARCH
// ============================================================================
async function handlePerplexity(req, res, { prompt, recency = 'day' }) {
  try {
    if (!prompt) {
      return res.status(400).json({ error: 'Le prompt est requis' });
    }

    if (!process.env.PERPLEXITY_API_KEY) {
      return res.status(200).json({
        success: true,
        content: getFallbackNews(),
        model: 'demo-mode',
        fallback: true
      });
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.1,
        search_recency_filter: recency
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur Perplexity: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    return res.status(200).json({
      success: true,
      content,
      model: 'sonar-pro',
      tokens: data.usage?.total_tokens || 0
    });

  } catch (error) {
    console.error('Erreur Perplexity:', error);
    return res.status(200).json({
      success: true,
      content: getFallbackNews(),
      model: 'demo-mode',
      fallback: true
    });
  }
}

// ============================================================================
// OPENAI ANALYSIS
// ============================================================================
async function handleOpenAI(req, res, { prompt, marketData, news }) {
  try {
    if (!prompt) {
      return res.status(400).json({ error: 'Le prompt est requis' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        success: true,
        content: getFallbackAnalysis(),
        model: 'demo-mode',
        fallback: true
      });
    }

    const contextualPrompt = `
${prompt}

DONNÉES FOURNIES :
━━━━━━━━━━━━━━━━
${JSON.stringify(marketData || {}, null, 2)}

ACTUALITÉS RÉCENTES :
━━━━━━━━━━━━━━━━
${news || 'Aucune actualité disponible'}

Rédige maintenant le briefing selon la structure demandée.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: contextualPrompt }],
        max_tokens: 2500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    return res.status(200).json({
      success: true,
      content,
      model: 'gpt-4',
      tokens: data.usage?.total_tokens || 0
    });

  } catch (error) {
    console.error('Erreur OpenAI:', error);
    return res.status(200).json({
      success: true,
      content: getFallbackAnalysis(),
      model: 'demo-mode',
      fallback: true
    });
  }
}

// ============================================================================
// RESEND EMAIL
// ============================================================================
async function handleResend(req, res, { recipients, subject, html }) {
  try {
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Liste de destinataires requise' });
    }

    if (!subject || !html) {
      return res.status(400).json({ error: 'Sujet et contenu HTML requis' });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(200).json({
        success: true,
        messageId: `demo-${Date.now()}`,
        recipients,
        subject,
        status: 'simulated',
        fallback: true,
        message: 'Email simulé - Mode démo sans clé API Resend'
      });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'briefing@your-domain.com';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Financial AI <${fromEmail}>`,
        to: recipients,
        subject: subject,
        html: html
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur Resend: ${response.status} - ${errorData.message || 'Erreur inconnue'}`);
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      messageId: data.id,
      recipients: recipients,
      subject: subject,
      status: 'sent'
    });

  } catch (error) {
    console.error('Erreur Resend:', error);
    return res.status(200).json({
      success: true,
      messageId: `demo-${Date.now()}`,
      recipients: req.body.recipients,
      subject: req.body.subject,
      status: 'simulated',
      fallback: true,
      message: 'Email simulé - Mode démo'
    });
  }
}

// ============================================================================
// FALLBACK DATA
// ============================================================================
function getFallbackNews() {
  return `
📰 ACTUALITÉS SIMULÉES (Mode Démo)

🏦 BANQUES CENTRALES :
- Fed maintient les taux inchangés à 5.25-5.50%
- BCE envisage une pause dans la hausse des taux
- BOJ maintient sa politique accommodante

📊 DONNÉES ÉCONOMIQUES :
- PMI manufacturier US : 52.1 (vs 51.8 attendu)
- Chômage US : 3.7% (stable)
- Inflation PCE : 2.8% (en baisse)

🏢 RÉSULTATS CORPORATIFS :
- NVDA : Résultats Q3 en hausse de 15%
- TSLA : Livraisons record au trimestre
- AAPL : Guidance révisée à la hausse

⚡ ÉVÉNEMENTS À SURVEILLER :
- Publication des données d'emploi US à 14h30
- Conférence de presse Fed à 15h00
- Résultats META après clôture

Note: Données simulées - Mode démo sans clé API Perplexity
  `;
}

function getFallbackAnalysis() {
  return `
🌏 RÉSUMÉ EXÉCUTIF
Les marchés asiatiques affichent une performance mitigée ce matin, avec le Nikkei en légère hausse (+0.8%) tandis que le Hang Seng recule de 1.2%. Les futures US pointent vers une ouverture positive, suggérant un sentiment risk-on modéré.

📊 PERFORMANCE DES MARCHÉS
• Asie : Divergences régionales marquées
• Futures : ES +0.3%, NQ +0.5%, YM +0.2%
• Secteurs moteurs : Technologie, Santé

💡 CATALYSEURS & ACTUALITÉS CLÉS
1. Résultats NVDA dépassent les attentes (+15% revenus)
2. Fed maintient les taux, ton plus accommodant
3. Tensions géopolitiques en recul

📈 DONNÉES TECHNIQUES
• S&P 500 : Support 4,200, Résistance 4,350
• VIX : 18.5 (sentiment neutre)
• Volume : Moyen, pas de panique

🎯 FOCUS DU JOUR
• Publication données emploi US 14h30
• Conférence Fed 15h00
• Résultats META après clôture

⚠️ RISQUES & OPPORTUNITÉS
Risques : Escalade géopolitique, inflation persistante
Opportunités : Tech oversold, rotation sectorielle

Note: Analyse simulée - Mode démo sans clé API OpenAI
  `;
}
