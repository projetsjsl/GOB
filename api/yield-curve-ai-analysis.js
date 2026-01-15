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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Methode non autorisee' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

  if (!GEMINI_API_KEY && !PERPLEXITY_API_KEY) {
    return res.status(503).json({
      error: 'Aucune cle API IA configuree',
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

    // Construire le contexte des donnees
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
      throw new Error('Toutes les APIs IA ont echoue');
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
  
  let context = `## DONNEES DE MARCHE ACTUELLES\n\n`;
  
  // US Rates
  if (usData && usData.points) {
    context += `###  Courbe des Taux US (Treasury)\n`;
    usData.points.forEach(p => {
      const change = p.change1D !== undefined ? ` (${p.change1D > 0 ? '+' : ''}${p.change1D.toFixed(1)} pb)` : '';
      context += `- ${p.maturity}: ${formatRate(p.yield)}${change}\n`;
    });
    context += `- Taux directeur Fed: ${formatRate(usData.policyRate)}\n\n`;
  }
  
  // Canada Rates
  if (caData && caData.points) {
    context += `###  Courbe des Taux Canada (Obligations d'Etat)\n`;
    caData.points.forEach(p => {
      const change = p.change1D !== undefined ? ` (${p.change1D > 0 ? '+' : ''}${p.change1D.toFixed(1)} pb)` : '';
      context += `- ${p.maturity}: ${formatRate(p.yield)}${change}\n`;
    });
    context += `- Taux directeur BoC: ${formatRate(caData.policyRate)}\n\n`;
  }
  
  // Spreads
  if (spreads) {
    context += `###  Ecarts Cles (Spreads)\n`;
    if (spreads['2Y-10Y'] !== undefined) context += `- Spread 2Y-10Y: ${spreads['2Y-10Y'].toFixed(0)} pb ${spreads['2Y-10Y'] < 0 ? ' INVERSE' : ''}\n`;
    if (spreads['3M-10Y'] !== undefined) context += `- Spread 3M-10Y: ${spreads['3M-10Y'].toFixed(0)} pb ${spreads['3M-10Y'] < 0 ? ' INVERSE' : ''}\n`;
    if (spreads['US-CA-10Y'] !== undefined) context += `- Differentiel US-CA 10Y: ${spreads['US-CA-10Y'].toFixed(0)} pb\n`;
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
    overview: `Tu es un analyste obligataire senior CFA specialise dans les marches de taux. 

${dataContext}

Date d'analyse: ${today}

MISSION: Fournir une analyse concise (150-200 mots) de la situation actuelle des marches obligataires US et Canada.

STRUCTURE REQUISE:
1. **Etat actuel**: Decris la forme des courbes (normale, plate, inversee) et ce que cela signifie
2. **Signaux cles**: Les 2-3 points les plus importants a retenir
3. **Perspective macro**: Implications pour la politique monetaire et l'economie
4. **Comparaison historique**: Comment ces niveaux se comparent aux moyennes historiques

STYLE: Professionnel, factuel, sans jargon excessif. Utilise des emojis pour la clarte visuelle.
LANGUE: Francais`,

    comparison: `Tu es un analyste obligataire senior CFA specialise dans les marches de taux.

${dataContext}

Date d'analyse: ${today}

MISSION: Analyser en detail la comparaison entre les courbes US et Canada (150-200 mots).

STRUCTURE REQUISE:
1. **Differentiel de politique monetaire**: Ecart entre Fed et BoC, et ses implications
2. **Dynamique des spreads**: Evolution recente du differentiel US-CA
3. **Impact devises**: Lien avec le taux de change USD/CAD
4. **Opportunites**: Implications pour les investisseurs obligataires

STYLE: Professionnel, axe sur l'actionnable.
LANGUE: Francais`,

    spreads: `Tu es un analyste obligataire senior CFA specialise dans l'analyse des spreads.

${dataContext}

Date d'analyse: ${today}

MISSION: Analyser les ecarts de rendement et leurs implications (150-200 mots).

STRUCTURE REQUISE:
1. **Inversion de courbe**: Le spread 2Y-10Y est-il inverse? Implications historiques
2. **Indicateur de recession**: Le spread 3M-10Y comme signal avance
3. **Differentiel international**: Ce que dit l'ecart US-Canada
4. **Contexte**: Comment interpreter ces signaux dans l'environnement actuel

STYLE: Analytique, avec contexte historique.
LANGUE: Francais`,

    historical: `Tu es un analyste obligataire senior CFA avec expertise en cycles economiques.

${dataContext}

Date d'analyse: ${today}

MISSION: Mettre en perspective historique la situation actuelle des taux (150-200 mots).

STRUCTURE REQUISE:
1. **Cycle actuel**: Ou sommes-nous dans le cycle de taux?
2. **Comparaisons**: Similitudes avec des periodes passees (2006-2007, 2019, etc.)
3. **Tendances**: Direction probable des taux a moyen terme
4. **Risques**: Les principaux risques a surveiller

STYLE: Perspectif historique, educatif.
LANGUE: Francais`
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
    overview: ` **Analyse des Courbes de Taux**

Les marches obligataires affichent actuellement une configuration caracteristique d'une fin de cycle de resserrement monetaire.

**Points cles:**
- La courbe US reste legerement inversee sur le segment 2Y-10Y, signal historiquement precurseur d'un ralentissement economique
- La Fed maintient une posture prudente avec des taux directeurs eleves
- L'ecart US-Canada reflete le differentiel de politique monetaire entre les deux banques centrales

**Perspective:** Les marches anticipent une normalisation graduelle des taux a mesure que l'inflation se rapproche des cibles.

_Analyse generee localement - Actualisation recommandee_`,

    comparison: ` **Comparaison US vs Canada**

Le differentiel de rendement entre les obligations americaines et canadiennes reflete des trajectoires de politique monetaire distinctes.

**Observations:**
- Les taux US restent superieurs aux taux canadiens sur toutes les maturites
- La BoC a commence son cycle de baisse avant la Fed
- L'ecart 10Y se situe dans sa fourchette historique normale

**Impact devises:** Ce differentiel soutient le dollar americain face au dollar canadien.

_Analyse generee localement - Actualisation recommandee_`,

    spreads: ` **Analyse des Spreads**

Les ecarts de rendement fournissent des signaux importants sur les anticipations economiques.

**Signaux:**
- Le spread 2Y-10Y inverse signale historiquement une recession dans les 12-18 mois
- Le spread 3M-10Y est un indicateur encore plus fiable
- L'ecart US-Canada reflete les differences de croissance et d'inflation

**Interpretation:** L'inversion actuelle doit etre contextualisee avec la politique monetaire exceptionnelle post-COVID.

_Analyse generee localement - Actualisation recommandee_`,

    historical: ` **Perspective Historique**

La configuration actuelle des courbes presente des similitudes avec plusieurs periodes passees.

**Comparaisons:**
- Similaire a 2006-2007: fin de cycle de hausse, courbe inversee
- Different de 2019: contexte inflationniste plus marque
- Niveau absolu des taux plus eleve que la decennie precedente

**Cycle:** Nous sommes probablement en fin de cycle de resserrement, avec des baisses de taux anticipees a horizon 6-12 mois.

_Analyse generee localement - Actualisation recommandee_`
  };

  return fallbacks[section] || fallbacks.overview;
}
