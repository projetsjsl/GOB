/**
 * LLM Formatter COMPLET - 28 Intents
 *
 * Rôle: FORMATEUR UNIQUEMENT (pas source de vérité)
 * Utilise Perplexity pour condenser les données en format SMS
 */

const fetch = require('node-fetch');

const PERPLEXITY_CONFIG = {
  baseUrl: 'https://api.perplexity.ai',
  model: 'sonar',
  temperature: 0.3,
  maxTokens: 400,
};

const SMS_LIMITS = {
  // Twilio: 1 SMS GSM-7 = 160 chars, UCS-2 = 70 chars
  // 10 SMS concaténés max = 1530 chars (UCS-2) ou 1520 chars (GSM-7)
  // On vise 2 SMS concaténés pour sécurité
  maxChars: 300,        // Limite cible pour 2 SMS UCS-2 (emojis/accents)
  absoluteMax: 1520,    // Limite absolue (10 SMS GSM-7)
  warningThreshold: 280,
};

/**
 * Formate pour SMS (28 intents)
 */
async function formatForSMS(sourceData, intent, options = {}) {
  const prompt = buildFormatterPrompt(sourceData, intent, options);

  if (!prompt) {
    // Réponses prédéfinies (GREETING, HELP, etc.)
    return {
      text: sourceData.response || sourceData.summary || 'Réponse',
      truncated: false,
      metadata: { special: intent },
    };
  }

  const formatted = await callPerplexityFormatter(prompt);
  const final = postProcessSMS(formatted, sourceData);

  return final;
}

/**
 * Construit prompt selon intent
 */
function buildFormatterPrompt(sourceData, intent, options) {
  const baseRules = `RÈGLES:
1. UNIQUEMENT données fournies ci-dessous
2. JAMAIS inventer chiffres
3. Max 280 caractères (on peut aller jusqu'à 1500 si nécessaire pour analyse complète)
4. Français clair, phrases courtes mais complètes
5. NE PAS inclure source (ajoutée après)

`;

  let data = '';
  let task = '';

  switch (intent) {
    // ===== ACTIONS (8) =====
    case 'STOCK_PRICE':
      data = `Prix: ${sourceData.price}$, Variation: ${sourceData.change} (${sourceData.changePercent}%)`;
      task = 'Présente ce prix en 1 phrase.';
      break;

    case 'FUNDAMENTALS':
      const quote = sourceData.quote || {};
      const ratios = sourceData.ratios || {};
      data = `P/E: ${ratios.peRatio || 'N/A'}, ROE: ${ratios.returnOnEquity || 'N/A'}, Marges: ${quote.netProfitMargin || 'N/A'}`;
      task = 'Résume fondamentaux en 2 phrases.';
      break;

    case 'TECHNICAL_ANALYSIS':
      data = sourceData.summary || 'Analyse technique disponible';
      task = 'Condense en 2 phrases max.';
      break;

    case 'NEWS':
      if (sourceData.news && sourceData.news[0]) {
        data = `Titre: ${sourceData.news[0].title}`;
        task = 'Résume cette news en 1-2 phrases.';
      } else {
        data = sourceData.summary || 'Pas de news récente';
        task = 'Informe brièvement.';
      }
      break;

    case 'COMPREHENSIVE_ANALYSIS':
      const q = sourceData.quote || {};
      const p = sourceData.profile || {};
      const r = sourceData.ratios || {};
      data = `${p.companyName || sourceData.ticker}: Prix ${q.price}$ (${q.changesPercentage}%), P/E ${r.peRatio}, ROE ${r.returnOnEquity}%, Marges ${q.netProfitMargin}%, Secteur ${p.sector}, Cap. boursière ${q.marketCap}, Dette ${r.debtToEquity}`;
      task = 'Analyse complète détaillée (peut aller jusqu\'à 1500 caractères). Inclure: 1) Prix et performance, 2) Fondamentaux (P/E, ROE, marges, dette), 3) Contexte secteur, 4) Forces/Faiblesses, 5) Avis synthétique. Sois complet mais concis.';
      break;

    case 'COMPARATIVE_ANALYSIS':
      data = `${sourceData.ticker1}: ${sourceData.data1.price}$ (${sourceData.data1.changePercent}%) vs ${sourceData.ticker2}: ${sourceData.data2.price}$ (${sourceData.data2.changePercent}%)`;
      task = 'Compare en 2 phrases (prix, momentum, préférence).';
      break;

    case 'EARNINGS':
      data = `Résultat: ${sourceData.actual}$, Estimé: ${sourceData.estimated}$, Surprise: ${sourceData.surprise}%`;
      task = 'Présente résultats en 1-2 phrases.';
      break;

    case 'RECOMMENDATION':
      data = `Rating: ${sourceData.rating}, Cible: ${sourceData.targetPrice}$, Reco: ${sourceData.recommendation}`;
      task = 'Résume recommandation en 1 phrase.';
      break;

    // ===== MARCHÉS (2) =====
    case 'MARKET_OVERVIEW':
      if (sourceData.indices) {
        const ind = sourceData.indices.slice(0, 3);
        data = ind.map(i => `${i.name}: ${i.changePercent}%`).join(', ');
        task = 'État marchés en 2 phrases (indices + sentiment).';
      } else {
        data = sourceData.summary || 'Marchés stables';
        task = 'Résume en 2 phrases.';
      }
      break;

    case 'SECTOR_INDUSTRY':
      data = sourceData.summary || `Secteur ${sourceData.sector}: ${sourceData.changePercent}%`;
      task = 'Performance secteur en 1-2 phrases.';
      break;

    // ===== ÉCONOMIE (2) =====
    case 'ECONOMIC_ANALYSIS':
      data = sourceData.summary || 'Données économiques';
      task = 'Résume données macro en 2 phrases max.';
      break;

    case 'POLITICAL_ANALYSIS':
      data = sourceData.summary || 'Analyse politique';
      task = 'Impact marchés en 2 phrases.';
      break;

    // ===== STRATÉGIE (3) =====
    case 'INVESTMENT_STRATEGY':
      data = sourceData.summary || 'Stratégie diversifiée long terme';
      task = 'Conseil stratégie en 2 phrases.';
      break;

    case 'RISK_VOLATILITY':
      data = sourceData.summary || `Risque ${sourceData.ticker}`;
      task = 'Profil risque en 1-2 phrases.';
      break;

    case 'RISK_MANAGEMENT':
      data = sourceData.summary || 'Gestion de risque';
      task = 'Principes clés en 2 phrases.';
      break;

    // ===== VALORISATION (3) =====
    case 'VALUATION':
      data = sourceData.summary || `Valorisation ${sourceData.ticker}`;
      task = 'Fair value estimation en 1-2 phrases.';
      break;

    case 'STOCK_SCREENING':
      data = sourceData.summary || 'Top actions identifiées';
      task = 'Liste 3 tickers + raisons en 3 phrases.';
      break;

    case 'VALUATION_METHODOLOGY':
      data = sourceData.summary || 'Méthodologie DCF';
      task = 'Explique brièvement en 2 phrases.';
      break;

    // ===== CALCULS (1) =====
    case 'FINANCIAL_CALCULATION':
      const type = sourceData.calculationType;
      const res = sourceData.result;

      if (type === 'loan') {
        data = `Prêt ${res.principal}$: Paiement ${res.monthlyPayment}$/mois, Total intérêts ${res.totalInterest}$`;
        task = 'Présente résultat prêt en 1 phrase.';
      } else if (type === 'variation') {
        data = `De ${res.from} à ${res.to}: ${res.change} (${res.changePercent}%)`;
        task = 'Présente variation en 1 phrase.';
      } else {
        data = `Résultat: ${JSON.stringify(res)}`;
        task = 'Présente en 1 phrase.';
      }
      break;

    // ===== ASSETS (2) =====
    case 'FOREX_ANALYSIS':
      if (sourceData.rate) {
        data = `${sourceData.pair}: ${sourceData.rate}, Variation: ${sourceData.changePercent}%`;
        task = 'Taux change en 1 phrase.';
      } else {
        data = sourceData.summary || 'Taux forex';
        task = 'Résume en 1 phrase.';
      }
      break;

    case 'BOND_ANALYSIS':
      data = sourceData.summary || 'Rendement obligations';
      task = 'Résume en 1 phrase.';
      break;

    // ===== ESG (1) =====
    case 'ESG':
      data = sourceData.summary || `ESG ${sourceData.ticker}`;
      task = 'Score ESG en 2 phrases.';
      break;

    default:
      return null;
  }

  return `${baseRules}

DONNÉES:
${data}

TÂCHE: ${task}

RÉPONSE:`;
}

/**
 * Appel Perplexity formatter
 */
async function callPerplexityFormatter(prompt) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY non configurée');

  const response = await fetch(`${PERPLEXITY_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: PERPLEXITY_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: PERPLEXITY_CONFIG.temperature,
      max_tokens: PERPLEXITY_CONFIG.maxTokens,
    }),
    timeout: 8000,
  });

  if (!response.ok) throw new Error(`Perplexity HTTP ${response.status}`);

  const data = await response.json();
  if (!data.choices || data.choices.length === 0) throw new Error('Perplexity: Aucune réponse');

  return {
    text: data.choices[0].message.content.trim(),
    model: data.model,
    usage: data.usage,
  };
}

/**
 * Post-traitement: sources + longueur
 * Support jusqu'à 2 SMS (max 1520 chars avec sources)
 */
function postProcessSMS(formatted, sourceData) {
  let text = formatted.text;
  const source = sourceData.source || 'API';
  const sourceFooter = `\n\nSource: ${source}`;

  // Calculer longueur max pour le texte (en gardant de la place pour source)
  const maxTextLength = SMS_LIMITS.absoluteMax - sourceFooter.length;

  // Si le texte est déjà dans les limites, pas de troncature
  const finalText = `${text}${sourceFooter}`;

  if (finalText.length <= SMS_LIMITS.absoluteMax) {
    // Tout va bien, pas de troncature
    const smsCount = estimateSMSCount(finalText);
    return {
      text: finalText,
      truncated: false,
      metadata: {
        originalLength: formatted.text.length,
        finalLength: finalText.length,
        estimatedSMS: smsCount
      },
    };
  }

  // Texte trop long, tronquer intelligemment
  console.warn(`[Formatter] Texte trop long (${text.length} chars), troncature à ${maxTextLength} chars`);
  text = truncateIntelligently(text, maxTextLength);
  const truncatedFinal = `${text}...${sourceFooter}`;
  const smsCount = estimateSMSCount(truncatedFinal);

  return {
    text: truncatedFinal,
    truncated: true,
    metadata: {
      originalLength: formatted.text.length,
      finalLength: truncatedFinal.length,
      estimatedSMS: smsCount
    },
  };
}

/**
 * Estime le nombre de SMS requis
 * GSM-7: 160 chars/SMS (153 si concaténé)
 * UCS-2 (emojis/accents): 70 chars/SMS (67 si concaténé)
 */
function estimateSMSCount(text) {
  // Détecter si texte contient des caractères UCS-2 (emojis, accents spéciaux)
  const hasUCS2 = /[^\x00-\x7F]/.test(text);

  if (hasUCS2) {
    // UCS-2: 70 chars/SMS, 67 si concaténé
    if (text.length <= 70) return 1;
    return Math.ceil(text.length / 67);
  } else {
    // GSM-7: 160 chars/SMS, 153 si concaténé
    if (text.length <= 160) return 1;
    return Math.ceil(text.length / 153);
  }
}

function truncateIntelligently(text, maxLength) {
  if (text.length <= maxLength) return text;

  const lastPeriod = text.lastIndexOf('.', maxLength);
  if (lastPeriod > maxLength * 0.7) return text.substring(0, lastPeriod + 1);

  const lastSpace = text.lastIndexOf(' ', maxLength);
  if (lastSpace > maxLength * 0.7) return text.substring(0, lastSpace);

  return text.substring(0, maxLength);
}

module.exports = {
  formatForSMS,
  SMS_LIMITS,
};
