// ============================================================================
// API Endpoint: Yield Curve AI Analysis
// Analyse IA des courbes de taux via Gemini avec recherche web
// ============================================================================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

  if (!GEMINI_API_KEY && !PERPLEXITY_API_KEY) {
    return res.status(503).json({
      error: 'Aucune clé API IA configurée',
      fallback: true
    });
  }

  try {
    const { 
      usData, 
      caData, 
      spreads, 
      section = 'overview',
      language = 'fr'
    } = req.body || {};

    // Construire le contexte des données
    const dataContext = buildDataContext(usData, caData, spreads);
    
    // Construire le prompt selon la section
    const prompt = buildAnalysisPrompt(section, dataContext, language);

    let aiResponse;

    // Essayer Perplexity d'abord (avec recherche web)
    if (PERPLEXITY_API_KEY) {
      try {
        aiResponse = await callPerplexity(PERPLEXITY_API_KEY, prompt, section);
      } catch (e) {
        console.log('Perplexity failed, trying Gemini:', e.message);
      }
    }

    // Fallback vers Gemini
    if (!aiResponse && GEMINI_API_KEY) {
      aiResponse = await callGemini(GEMINI_API_KEY, prompt);
    }

    if (!aiResponse) {
      throw new Error('Toutes les APIs IA ont échoué');
    }

    return res.status(200).json({
      success: true,
      analysis: aiResponse.content,
      source: aiResponse.source,
      model: aiResponse.model,
      section,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur AI Analysis:', error);
    return res.status(200).json({
      success: true,
      analysis: getFallbackAnalysis(req.body?.section || 'overview'),
      source: 'fallback',
      model: 'static',
      fallback: true,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function buildDataContext(usData, caData, spreads) {
  const formatRate = (rate) => rate !== undefined ? `${rate.toFixed(2)}%` : 'N/A';
  
  let context = `## DONNÉES DE MARCHÉ ACTUELLES\n\n`;
  
  // US Rates
  if (usData && usData.points) {
    context += `### 🇺🇸 Courbe des Taux US (Treasury)\n`;
    usData.points.forEach(p => {
      const change = p.change1D !== undefined ? ` (${p.change1D > 0 ? '+' : ''}${p.change1D.toFixed(1)} pb)` : '';
      context += `- ${p.maturity}: ${formatRate(p.yield)}${change}\n`;
    });
    context += `- Taux directeur Fed: ${formatRate(usData.policyRate)}\n\n`;
  }
  
  // Canada Rates
  if (caData && caData.points) {
    context += `### 🇨🇦 Courbe des Taux Canada (Obligations d'État)\n`;
    caData.points.forEach(p => {
      const change = p.change1D !== undefined ? ` (${p.change1D > 0 ? '+' : ''}${p.change1D.toFixed(1)} pb)` : '';
      context += `- ${p.maturity}: ${formatRate(p.yield)}${change}\n`;
    });
    context += `- Taux directeur BoC: ${formatRate(caData.policyRate)}\n\n`;
  }
  
  // Spreads
  if (spreads) {
    context += `### 📊 Écarts Clés (Spreads)\n`;
    if (spreads['2Y-10Y'] !== undefined) context += `- Spread 2Y-10Y: ${spreads['2Y-10Y'].toFixed(0)} pb ${spreads['2Y-10Y'] < 0 ? '⚠️ INVERSÉ' : ''}\n`;
    if (spreads['3M-10Y'] !== undefined) context += `- Spread 3M-10Y: ${spreads['3M-10Y'].toFixed(0)} pb ${spreads['3M-10Y'] < 0 ? '⚠️ INVERSÉ' : ''}\n`;
    if (spreads['US-CA-10Y'] !== undefined) context += `- Différentiel US-CA 10Y: ${spreads['US-CA-10Y'].toFixed(0)} pb\n`;
  }
  
  return context;
}

function buildAnalysisPrompt(section, dataContext, language) {
  const today = new Date().toLocaleDateString('fr-CA', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const sectionPrompts = {
    overview: `Tu es un analyste obligataire senior CFA® spécialisé dans les marchés de taux. 

${dataContext}

Date d'analyse: ${today}

MISSION: Fournir une analyse concise (150-200 mots) de la situation actuelle des marchés obligataires US et Canada.

STRUCTURE REQUISE:
1. **État actuel**: Décris la forme des courbes (normale, plate, inversée) et ce que cela signifie
2. **Signaux clés**: Les 2-3 points les plus importants à retenir
3. **Perspective macro**: Implications pour la politique monétaire et l'économie
4. **Comparaison historique**: Comment ces niveaux se comparent aux moyennes historiques

STYLE: Professionnel, factuel, sans jargon excessif. Utilise des émojis pour la clarté visuelle.
LANGUE: Français`,

    comparison: `Tu es un analyste obligataire senior CFA® spécialisé dans les marchés de taux.

${dataContext}

Date d'analyse: ${today}

MISSION: Analyser en détail la comparaison entre les courbes US et Canada (150-200 mots).

STRUCTURE REQUISE:
1. **Différentiel de politique monétaire**: Écart entre Fed et BoC, et ses implications
2. **Dynamique des spreads**: Évolution récente du différentiel US-CA
3. **Impact devises**: Lien avec le taux de change USD/CAD
4. **Opportunités**: Implications pour les investisseurs obligataires

STYLE: Professionnel, axé sur l'actionnable.
LANGUE: Français`,

    spreads: `Tu es un analyste obligataire senior CFA® spécialisé dans l'analyse des spreads.

${dataContext}

Date d'analyse: ${today}

MISSION: Analyser les écarts de rendement et leurs implications (150-200 mots).

STRUCTURE REQUISE:
1. **Inversion de courbe**: Le spread 2Y-10Y est-il inversé? Implications historiques
2. **Indicateur de récession**: Le spread 3M-10Y comme signal avancé
3. **Différentiel international**: Ce que dit l'écart US-Canada
4. **Contexte**: Comment interpréter ces signaux dans l'environnement actuel

STYLE: Analytique, avec contexte historique.
LANGUE: Français`,

    historical: `Tu es un analyste obligataire senior CFA® avec expertise en cycles économiques.

${dataContext}

Date d'analyse: ${today}

MISSION: Mettre en perspective historique la situation actuelle des taux (150-200 mots).

STRUCTURE REQUISE:
1. **Cycle actuel**: Où sommes-nous dans le cycle de taux?
2. **Comparaisons**: Similitudes avec des périodes passées (2006-2007, 2019, etc.)
3. **Tendances**: Direction probable des taux à moyen terme
4. **Risques**: Les principaux risques à surveiller

STYLE: Perspectif historique, éducatif.
LANGUE: Français`
  };

  return sectionPrompts[section] || sectionPrompts.overview;
}

async function callPerplexity(apiKey, prompt, section) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.3,
      search_recency_filter: 'day',
      search_domain_filter: [
        'bloomberg.com', 
        'reuters.com', 
        'wsj.com', 
        'ft.com',
        'bankofcanada.ca',
        'federalreserve.gov'
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Perplexity error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || '',
    source: 'perplexity',
    model: 'sonar'
  };
}

async function callGemini(apiKey, prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 800
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    source: 'gemini',
    model: 'gemini-2.0-flash-exp'
  };
}

function getFallbackAnalysis(section) {
  const fallbacks = {
    overview: `📊 **Analyse des Courbes de Taux**

Les marchés obligataires affichent actuellement une configuration caractéristique d'une fin de cycle de resserrement monétaire.

**Points clés:**
• La courbe US reste légèrement inversée sur le segment 2Y-10Y, signal historiquement précurseur d'un ralentissement économique
• La Fed maintient une posture prudente avec des taux directeurs élevés
• L'écart US-Canada reflète le différentiel de politique monétaire entre les deux banques centrales

**Perspective:** Les marchés anticipent une normalisation graduelle des taux à mesure que l'inflation se rapproche des cibles.

_Analyse générée localement - Actualisation recommandée_`,

    comparison: `📈 **Comparaison US vs Canada**

Le différentiel de rendement entre les obligations américaines et canadiennes reflète des trajectoires de politique monétaire distinctes.

**Observations:**
• Les taux US restent supérieurs aux taux canadiens sur toutes les maturités
• La BoC a commencé son cycle de baisse avant la Fed
• L'écart 10Y se situe dans sa fourchette historique normale

**Impact devises:** Ce différentiel soutient le dollar américain face au dollar canadien.

_Analyse générée localement - Actualisation recommandée_`,

    spreads: `🔍 **Analyse des Spreads**

Les écarts de rendement fournissent des signaux importants sur les anticipations économiques.

**Signaux:**
• Le spread 2Y-10Y inversé signale historiquement une récession dans les 12-18 mois
• Le spread 3M-10Y est un indicateur encore plus fiable
• L'écart US-Canada reflète les différences de croissance et d'inflation

**Interprétation:** L'inversion actuelle doit être contextualisée avec la politique monétaire exceptionnelle post-COVID.

_Analyse générée localement - Actualisation recommandée_`,

    historical: `📅 **Perspective Historique**

La configuration actuelle des courbes présente des similitudes avec plusieurs périodes passées.

**Comparaisons:**
• Similaire à 2006-2007: fin de cycle de hausse, courbe inversée
• Différent de 2019: contexte inflationniste plus marqué
• Niveau absolu des taux plus élevé que la décennie précédente

**Cycle:** Nous sommes probablement en fin de cycle de resserrement, avec des baisses de taux anticipées à horizon 6-12 mois.

_Analyse générée localement - Actualisation recommandée_`
  };

  return fallbacks[section] || fallbacks.overview;
}
