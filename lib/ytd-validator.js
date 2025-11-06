/**
 * YTD Validator - Validation des données YTD pour cohérence
 * 
 * Problème: Emma retourne parfois des YTD incohérents (ex: -15% vs -34% vs -40%)
 * Cause: Perplexity scrape le web sans source unique
 * Solution: Valider que les YTD sont cohérents avec les données FMP
 * 
 * Règles de validation:
 * 1. YTD ne peut jamais être > performance 12 mois
 * 2. Si YTD > 12 mois, utiliser FMP comme source de vérité
 * 3. Documenter la source de chaque métrique
 */

/**
 * Valide les données YTD pour un stock
 * 
 * @param {Object} stock - Données du stock
 * @param {number} stock.ytd - Performance YTD en %
 * @param {number} stock.oneYear - Performance 12 mois en %
 * @param {string} stock.symbol - Ticker
 * @returns {Object} { valid, issues, source, confidence }
 */
export function validateYTDData(stock) {
    const issues = [];
    let source = 'perplexity';
    let confidence = 0.8;
    
    // Vérification 1: YTD logiquement valide
    if (stock.ytd !== undefined && stock.oneYear !== undefined) {
        const ytd = parseFloat(stock.ytd);
        const oneYear = parseFloat(stock.oneYear);
        
        // YTD (janvier à maintenant) ne peut pas dépasser performance 12 mois
        if (Math.abs(ytd) > Math.abs(oneYear) + 5) { // Tolérance de 5%
            issues.push({
                type: 'YTD_EXCEEDS_12M',
                message: `YTD (${ytd}%) ne peut pas dépasser 12M (${oneYear}%)`,
                severity: 'high'
            });
            source = 'fmp'; // Force FMP si incohérent
            confidence = 0.5;
        }
    }
    
    // Vérification 2: YTD négatif mais 12M positif (possible mais rare)
    if (stock.ytd < 0 && stock.oneYear > 0) {
        issues.push({
            type: 'YTD_NEGATIVE_12M_POSITIVE',
            message: 'YTD négatif alors que 12M positif - vérifier correction de prix',
            severity: 'medium'
        });
    }
    
    // Vérification 3: Volatilité des données (si historique disponible)
    if (stock.ytdHistory && stock.ytdHistory.length > 1) {
        const values = stock.ytdHistory.map(v => parseFloat(v));
        const variance = calculateVariance(values);
        
        // Si variance > 10%, marquer comme instable
        if (variance > 10) {
            issues.push({
                type: 'HIGH_YTD_VARIANCE',
                message: `Variance YTD élevée (${variance.toFixed(1)}%) - sources conflictuelles`,
                severity: 'medium'
            });
            source = 'fmp'; // Force FMP si données instables
            confidence = 0.6;
        }
    }
    
    return {
        valid: issues.filter(i => i.severity === 'high').length === 0,
        issues,
        source,
        confidence,
        timestamp: new Date().toISOString()
    };
}

/**
 * Enrichit les données de stock avec source et confiance
 * Utilisé dans les réponses Emma pour documenter d'où viennent les chiffres
 * 
 * @param {Object} stockData - Données du stock
 * @param {string} primarySource - Source primaire ('fmp', 'perplexity', 'yahoofinance')
 * @returns {Object} Données enrichies avec métadonnées
 */
export function enrichStockDataWithSources(stockData, primarySource = 'fmp') {
    const enriched = { ...stockData };
    
    // Mapper des métadonnées de source pour chaque métrique
    const sourceMetadata = {
        fmp: {
            source: 'FMP (Financial Modeling Prep)',
            reliability: 0.95,
            updateFrequency: 'Real-time',
            cachedOk: true
        },
        perplexity: {
            source: 'Perplexity AI Search',
            reliability: 0.75,
            updateFrequency: 'Real-time',
            cachedOk: false // Perplexity scrape fresh à chaque fois
        },
        yahoofinance: {
            source: 'Yahoo Finance',
            reliability: 0.9,
            updateFrequency: 'Real-time',
            cachedOk: true
        }
    };
    
    // Pour chaque métrique critique, assigner une source
    const metricSources = {
        ytd: primarySource, // YTD doit venir de FMP
        price: primarySource,
        pe: primarySource,
        dividend: primarySource,
        analysis: 'perplexity' // Analyse synthétique
    };
    
    enriched._sources = metricSources;
    enriched._metadata = {
        primary_source: primarySource,
        source_details: sourceMetadata[primarySource],
        validation: validateYTDData(stockData),
        timestamp: new Date().toISOString()
    };
    
    return enriched;
}

/**
 * Formate les sources pour affichage dans réponse Emma
 * 
 * @param {Object} stockData - Données enrichies du stock
 * @returns {string} Texte à inclure dans réponse
 */
export function formatSourcesForResponse(stockData) {
    const sources = stockData._sources || {};
    const metadata = stockData._metadata || {};
    
    if (!metadata.validation || metadata.validation.issues.length === 0) {
        // Données OK, source discrète
        return `[Données: ${metadata.primary_source}]`;
    }
    
    // Données problématiques, ajouter note
    const issues = metadata.validation.issues
        .filter(i => i.severity === 'high')
        .map(i => `⚠️ ${i.message}`)
        .join('\n');
    
    return `\n🔍 Validation données: ${metadata.validation.valid ? '✅' : '⚠️'}\n${issues}`;
}

/**
 * Calcule la variance (écart-type) d'une liste de nombres
 */
function calculateVariance(numbers) {
    if (numbers.length < 2) return 0;
    
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(x => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev;
}

/**
 * Détecte si une valeur YTD semble hallucination de Perplexity
 * 
 * @param {number} ytd - Valeur YTD
 * @param {Array} priorYtdValues - Valeurs YTD précédentes pour ce ticker
 * @returns {Object} { isHallucination, confidence, recommendation }
 */
export function detectYTDHallucination(ytd, priorYtdValues = []) {
    if (priorYtdValues.length === 0) {
        return { isHallucination: false, confidence: 0, recommendation: 'NO_PRIOR_DATA' };
    }
    
    const variance = calculateVariance([ytd, ...priorYtdValues]);
    
    // Si variance > 20%, probablement une hallucination
    if (variance > 20) {
        return {
            isHallucination: true,
            confidence: 0.85,
            recommendation: 'USE_FMP_INSTEAD',
            message: `YTD ${ytd}% semble incohérent avec historique`
        };
    }
    
    return {
        isHallucination: false,
        confidence: 0.9,
        recommendation: 'OK_TO_USE'
    };
}

export default {
    validateYTDData,
    enrichStockDataWithSources,
    formatSourcesForResponse,
    detectYTDHallucination
};

