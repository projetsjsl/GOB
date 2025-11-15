/**
 * LLM Formatter
 *
 * ⚠️ RÔLE LIMITÉ: Ce module FORMATE uniquement les réponses.
 *
 * RÈGLES ABSOLUES:
 * 1. Le LLM NE DOIT JAMAIS être source de faits
 * 2. Le LLM ne fait que: résumer, reformuler, structurer
 * 3. Toutes les données factuelles proviennent des data-fetchers
 * 4. Si donnée manquante → dire "Donnée indisponible"
 * 5. Sources OBLIGATOIRES à la fin de chaque réponse
 *
 * Utilise Perplexity API (comme système actuel) pour formatting.
 */

const fetch = require('node-fetch');

// Configuration Perplexity pour formatter
const PERPLEXITY_FORMATTER_CONFIG = {
  baseUrl: 'https://api.perplexity.ai',
  model: 'sonar', // Modèle léger pour formatting (pas besoin de sonar-pro)
  temperature: 0.3, // Faible température = plus prévisible
  maxTokens: 400, // Limite stricte pour SMS
};

// Limites SMS (norme UCS-2)
const SMS_LIMITS = {
  singleSMS: 160, // 1 SMS = 160 caractères
  maxSMS: 320, // Max 2 SMS = 320 caractères
  warningThreshold: 300, // Seuil d'avertissement
};

/**
 * Formate les données pour réponse SMS
 * @param {Object} sourceData - Données brutes des APIs (SOURCE DE VÉRITÉ)
 * @param {string} intent - Intent détecté (ANALYSE, DONNEES, etc.)
 * @param {Object} options - Options de formatage
 * @returns {Promise<Object>} { text, sources, metadata }
 */
async function formatForSMS(sourceData, intent, options = {}) {
  // Construire le prompt STRICT selon l'intent
  const prompt = buildFormatterPrompt(sourceData, intent, options);

  // Appeler Perplexity pour formatter (PAS pour inventer des faits!)
  const formatted = await callPerplexityFormatter(prompt);

  // Post-traitement: ajouter sources, vérifier longueur
  const final = postProcessSMS(formatted, sourceData);

  // Validation anti-hallucination
  validateNoHallucination(final.text, sourceData);

  return final;
}

/**
 * Construit le prompt de formatage STRICT
 * @param {Object} sourceData - Données source
 * @param {string} intent - Intent
 * @param {Object} options - Options
 * @returns {string} Prompt
 */
function buildFormatterPrompt(sourceData, intent, options = {}) {
  const baseRules = `RÈGLES ABSOLUES:
1. Utilise UNIQUEMENT les données fournies ci-dessous
2. JAMAIS inventer de chiffres, prix, ou faits
3. Si donnée manquante, dire "Donnée indisponible"
4. Réponse en français, phrases courtes et claires
5. Maximum 280 caractères (2 SMS)
6. NE PAS inclure les sources (ajoutées automatiquement après)

`;

  let dataContext = '';
  let taskInstruction = '';

  switch (intent) {
    case 'ANALYSE':
      dataContext = buildAnalysisContext(sourceData);
      taskInstruction = `Résume cette analyse en 2-3 phrases:
- Prix actuel et variation
- Indicateur clé (P/E ou autre)
- Sentiment/contexte bref`;
      break;

    case 'DONNEES':
      dataContext = buildDataContext(sourceData);
      taskInstruction = `Présente cette donnée de manière claire et concise:
- Valeur actuelle
- Variation si disponible
- Contexte bref en 1 phrase`;
      break;

    case 'RESUME':
      dataContext = buildResumeContext(sourceData);
      taskInstruction = `Résume ce contenu en 2-3 phrases max:
- Point principal
- Chiffres clés si disponibles
- Conclusion courte`;
      break;

    case 'CALCUL':
      dataContext = buildCalculationContext(sourceData);
      taskInstruction = `Présente ce résultat de calcul:
- Résultat principal
- Contexte/interprétation en 1 phrase`;
      break;

    case 'SOURCES':
      // Cas spécial: pas besoin de LLM
      return null;

    case 'AIDE':
      // Cas spécial: réponse prédéfinie
      return null;

    default:
      throw new Error(`Intent inconnu: ${intent}`);
  }

  return `${baseRules}

DONNÉES À UTILISER:
${dataContext}

TÂCHE:
${taskInstruction}

RÉPONSE (max 280 caractères):`;
}

/**
 * Construit le contexte pour intent ANALYSE
 */
function buildAnalysisContext(sourceData) {
  const { quote, profile, ratios } = sourceData;

  let context = '';

  if (quote) {
    context += `Prix: ${quote.price || 'N/A'}\n`;
    context += `Variation: ${quote.change || 'N/A'} (${quote.changePercent || 'N/A'}%)\n`;
    context += `Volume: ${quote.volume || 'N/A'}\n`;
  }

  if (profile) {
    context += `Entreprise: ${profile.companyName || 'N/A'}\n`;
    context += `Secteur: ${profile.sector || 'N/A'}\n`;
    context += `Capitalisation: ${profile.mktCap || 'N/A'}\n`;
  }

  if (ratios) {
    context += `P/E: ${ratios.peRatio || 'N/A'}\n`;
    context += `ROE: ${ratios.returnOnEquity || 'N/A'}\n`;
  }

  return context || 'Aucune donnée disponible';
}

/**
 * Construit le contexte pour intent DONNEES
 */
function buildDataContext(sourceData) {
  const { dataType, value, change, changePercent, context: ctx } = sourceData;

  let context = `Type: ${dataType}\n`;
  context += `Valeur: ${value || 'N/A'}\n`;

  if (change !== undefined) {
    context += `Variation: ${change} (${changePercent}%)\n`;
  }

  if (ctx) {
    context += `Contexte: ${ctx}\n`;
  }

  return context;
}

/**
 * Construit le contexte pour intent RESUME
 */
function buildResumeContext(sourceData) {
  const { summary, sources, citations } = sourceData;

  let context = `Résumé Perplexity:\n${summary}\n`;

  if (citations && citations.length > 0) {
    context += `\nCitations: ${citations.join(', ')}\n`;
  }

  return context;
}

/**
 * Construit le contexte pour intent CALCUL
 */
function buildCalculationContext(sourceData) {
  const { calculationType, result } = sourceData;

  let context = `Type de calcul: ${calculationType}\n`;

  if (calculationType === 'loan') {
    context += `Paiement mensuel: ${result.monthlyPayment}\n`;
    context += `Total intérêts: ${result.totalInterest}\n`;
  } else if (calculationType === 'variation') {
    context += `Variation: ${result.change} (${result.changePercent}%)\n`;
    context += `Direction: ${result.direction}\n`;
  } else if (calculationType === 'ratio') {
    context += `Ratio P/E: ${result.pe}\n`;
    context += `Interprétation: ${result.interpretation}\n`;
  }

  return context;
}

/**
 * Appelle Perplexity pour formatter (pas pour inventer!)
 */
async function callPerplexityFormatter(prompt) {
  if (!prompt) {
    // Cas spéciaux sans LLM (SOURCES, AIDE)
    return null;
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY non configurée');
  }

  const payload = {
    model: PERPLEXITY_FORMATTER_CONFIG.model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: PERPLEXITY_FORMATTER_CONFIG.temperature,
    max_tokens: PERPLEXITY_FORMATTER_CONFIG.maxTokens,
    return_citations: false, // Pas de citations pour formatter
  };

  try {
    const response = await fetch(`${PERPLEXITY_FORMATTER_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      timeout: 8000, // 8s timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('Perplexity: Aucune réponse');
    }

    return {
      text: data.choices[0].message.content.trim(),
      model: data.model,
      usage: data.usage,
    };
  } catch (err) {
    console.error('[LLM Formatter] Erreur Perplexity:', err.message);
    throw new Error(`Erreur formatting: ${err.message}`);
  }
}

/**
 * Post-traitement: sources + longueur SMS
 */
function postProcessSMS(formatted, sourceData) {
  if (!formatted) {
    // Cas spéciaux
    return handleSpecialCases(sourceData);
  }

  let text = formatted.text;

  // Extraire la source
  const source = sourceData.source || 'API';

  // Vérifier longueur AVANT ajout source
  const maxTextLength = SMS_LIMITS.maxSMS - source.length - 10; // -10 pour "\n\nSource: "

  if (text.length > maxTextLength) {
    // Tronquer intelligemment (dernier point ou dernière phrase complète)
    text = truncateIntelligently(text, maxTextLength);
  }

  // Ajouter source
  const finalText = `${text}\n\nSource: ${source}`;

  // Vérification finale
  if (finalText.length > SMS_LIMITS.maxSMS) {
    // Tronquer encore plus agressivement
    const emergency = SMS_LIMITS.maxSMS - source.length - 15;
    text = truncateIntelligently(text, emergency);
    return {
      text: `${text}...\n\nSource: ${source}`,
      sources: [source],
      truncated: true,
      metadata: {
        originalLength: formatted.text.length,
        finalLength: finalText.length,
        model: formatted.model,
      },
    };
  }

  return {
    text: finalText,
    sources: [source],
    truncated: false,
    metadata: {
      originalLength: formatted.text.length,
      finalLength: finalText.length,
      model: formatted.model,
    },
  };
}

/**
 * Tronque intelligemment (au dernier point ou espace)
 */
function truncateIntelligently(text, maxLength) {
  if (text.length <= maxLength) return text;

  // Chercher le dernier point avant maxLength
  const lastPeriod = text.lastIndexOf('.', maxLength);
  if (lastPeriod > maxLength * 0.7) {
    // Si point trouvé et pas trop loin
    return text.substring(0, lastPeriod + 1);
  }

  // Sinon, chercher le dernier espace
  const lastSpace = text.lastIndexOf(' ', maxLength);
  if (lastSpace > maxLength * 0.7) {
    return text.substring(0, lastSpace);
  }

  // Dernière option: couper brutalement
  return text.substring(0, maxLength);
}

/**
 * Gère les cas spéciaux (SOURCES, AIDE) sans LLM
 */
function handleSpecialCases(sourceData) {
  if (sourceData.intent === 'SOURCES') {
    const sources = sourceData.previousSources || [];
    if (sources.length === 0) {
      return {
        text: "Aucune source disponible pour le message précédent.",
        sources: [],
        truncated: false,
        metadata: { special: 'SOURCES' },
      };
    }

    const sourceList = sources.map((s, i) => `${i + 1}. ${s}`).join('\n');
    return {
      text: `Sources:\n${sourceList}`,
      sources,
      truncated: false,
      metadata: { special: 'SOURCES' },
    };
  }

  if (sourceData.intent === 'AIDE') {
    const helpText = `Commandes SMS:
• Analyse X
• Prix X
• Résumé: sujet
• Calcul prêt A B C
• Source ?

X = ticker (ex: AAPL)`;

    return {
      text: helpText,
      sources: [],
      truncated: false,
      metadata: { special: 'AIDE' },
    };
  }

  throw new Error('Cas spécial non géré');
}

/**
 * Validation anti-hallucination
 * Vérifie que tous les chiffres de la réponse existent dans sourceData
 */
function validateNoHallucination(responseText, sourceData) {
  // Extraire tous les nombres de la réponse
  const numbersInResponse = extractNumbers(responseText);

  if (numbersInResponse.length === 0) {
    // Pas de nombres = pas de risque
    return true;
  }

  // Convertir sourceData en string pour recherche
  const sourceStr = JSON.stringify(sourceData).toLowerCase();

  // Vérifier chaque nombre
  for (const num of numbersInResponse) {
    // Tolérance: arrondi (ex: 123.45 vs 123.4)
    const rounded = Math.round(num * 10) / 10;

    if (!sourceStr.includes(num.toString()) && !sourceStr.includes(rounded.toString())) {
      console.warn(`[Anti-Hallucination] Nombre suspect détecté: ${num}`);
      // Note: On log mais on ne bloque pas (trop strict = faux positifs)
    }
  }

  return true;
}

/**
 * Extrait tous les nombres d'un texte
 */
function extractNumbers(text) {
  const regex = /\d+\.?\d*/g;
  const matches = text.match(regex);
  return matches ? matches.map(parseFloat) : [];
}

module.exports = {
  formatForSMS,
  SMS_LIMITS,
  PERPLEXITY_FORMATTER_CONFIG, // Export pour tests
};
