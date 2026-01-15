/**
 * Utility Functions for Dashboard
 * Contains all shared utility functions used across the dashboard
 */

// Fonction pour nettoyer l'encodage des caracteres
const cleanText = (text) => {
    if (!text) return '';
    return text
        .replace(/A/g, 'e')
        .replace(/A /g, 'e')
        .replace(/A /g, 'a')
        .replace(/A/g, 'c')
        .replace(/A /g, 'o')
        .replace(/A/g, 'a')
        .replace(/A/g, 'i')
        .replace(/A /g, 'i')
        .replace(/A1/g, 'u')
        .replace(/A"/g, 'u')
        .replace(/A"/g, 'e')
        .replace(/A/g, 'a')
        .replace(/A/g, 'o')
        .replace(/A14/g, 'u')
        .replace(/aEURTM/g, "'")
        .replace(/aEUR/g, '"')
        .replace(/aEUR/g, '"')
        .replace(/aEUR"/g, '-')
        .replace(/aEUR"/g, '-');
};

// Fonction pour determiner l'icone et la couleur d'une nouvelle
const getNewsIcon = (title, description, sentiment) => {
    const text = ((title || '') + ' ' + (description || '')).toLowerCase();

    // Categories avec mots-cles (francais et anglais)
    const categories = {
        earnings: {
            keywords: ['earnings', 'resultats', 'profit', 'benefice', 'trimestre', 'quarterly', 'revenue', 'chiffre d\'affaires'],
            icon: 'DollarSign',
            color: 'text-green-500'
        },
        merger: {
            keywords: ['merger', 'acquisition', 'fusionner', 'racheter', 'acquerir', 'deal', 'accord'],
            icon: 'Briefcase',
            color: 'text-purple-500'
        },
        growth: {
            keywords: ['croissance', 'expansion', 'growth', 'augmente', 'monte', 'hausse', 'rally', 'surge', 'gain'],
            icon: 'TrendingUp',
            color: 'text-green-500'
        },
        decline: {
            keywords: ['baisse', 'chute', 'decline', 'drop', 'fall', 'perte', 'loss', 'diminue'],
            icon: 'TrendingDown',
            color: 'text-red-500'
        },
        regulation: {
            keywords: ['regulation', 'regulation', 'law', 'loi', 'sec', 'fda', 'gouvernement', 'government'],
            icon: 'Shield',
            color: 'text-blue-500'
        },
        target: {
            keywords: ['target', 'objectif', 'forecast', 'prevision', 'outlook', 'guidance'],
            icon: 'Target',
            color: 'text-indigo-500'
        },
        market: {
            keywords: ['market', 'marche', 'index', 'indice', 's&p', 'dow', 'nasdaq', 'bourse'],
            icon: 'BarChart3',
            color: 'text-blue-500'
        }
    };

    // Verifier chaque categorie
    for (const [key, category] of Object.entries(categories)) {
        if (category.keywords.some(keyword => text.includes(keyword))) {
            return { icon: category.icon, color: category.color };
        }
    }

    // Par defaut: icone basee sur le sentiment
    if (sentiment === 'positive' || text.includes('positif') || text.includes('success') || text.includes('succes')) {
        return { icon: 'TrendingUp', color: 'text-green-500' };
    }
    if (sentiment === 'negative' || text.includes('negatif') || text.includes('risk') || text.includes('risque')) {
        return { icon: 'TrendingDown', color: 'text-red-500' };
    }

    // Fallback: icone de journal
    return { icon: 'Newspaper', color: 'text-gray-500' };
};

// Fonction pour evaluer la credibilite d'une source de nouvelles
const getSourceCredibility = (sourceName) => {
    if (!sourceName) return 0;

    const source = sourceName.toLowerCase();

    // Tier 1: Sources premium (100-90)
    const tier1 = ['bloomberg', 'reuters', 'wall street journal', 'wsj', 'financial times', 'ft'];
    if (tier1.some(s => source.includes(s))) return 100;

    // Tier 2: Sources institutionnelles (89-80)
    const tier2 = ['cnbc', 'marketwatch', 'barron', 'forbes', 'economist', 'la presse', 'les affaires'];
    if (tier2.some(s => source.includes(s))) return 85;

    // Tier 3: Sources etablies (79-70)
    const tier3 = ['yahoo finance', 'seeking alpha', 'business insider', 'benzinga', 'investopedia'];
    if (tier3.some(s => source.includes(s))) return 75;

    // Tier 4: Agregateurs et PR (69-60)
    const tier4 = ['pr newswire', 'business wire', 'globe newswire', 'accesswire', 'fmp', 'finnhub'];
    if (tier4.some(s => source.includes(s))) return 65;

    // Tier 5: Sources inconnues (50)
    return 50;
};

// Fonction pour trier les nouvelles par credibilite puis par date
const sortNewsByCredibility = (newsArray) => {
    return [...newsArray].sort((a, b) => {
        // 1. Trier par credibilite de la source
        const credibilityA = getSourceCredibility(a.source?.name);
        const credibilityB = getSourceCredibility(b.source?.name);

        if (credibilityB !== credibilityA) {
            return credibilityB - credibilityA; // Descendant (plus credible en premier)
        }

        // 2. Si meme credibilite, trier par date (plus recent en premier)
        const dateA = new Date(a.publishedAt || a.publishedDate || 0);
        const dateB = new Date(b.publishedAt || b.publishedDate || 0);
        return dateB - dateA;
    });
};

// Fonction pour detecter si un article est en francais
const isFrenchArticle = (article) => {
    if (!article) return false;

    const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
    const sourceName = (article.source?.name || '').toLowerCase();

    // Sources francaises connues
    const frenchSources = ['la presse', 'les affaires', 'radio-canada', 'ici', 'le devoir', 'le journal', 'reuters fr', 'bloomberg fr'];
    if (frenchSources.some(source => sourceName.includes(source))) {
        return true;
    }

    // Mots-cles francais communs dans les articles financiers
    const frenchKeywords = [
        'a', 'de', 'et', 'pour', 'dans', 'avec', 'sur', 'plus', 'apres', 'annonce',
        'hausse', 'baisse', 'resultats', 'bourse', 'marche', 'economie', 'entreprise',
        'societe', 'actionnaire', 'benefice', 'chiffre', 'trimestre', 'milliards', 'millions'
    ];

    // Compter combien de mots-cles francais sont presents
    const frenchWordCount = frenchKeywords.filter(keyword => text.includes(keyword)).length;

    // Si 3+ mots-cles francais, considerer comme article francais
    return frenchWordCount >= 3;
};

// Fonction pour extraire le logo depuis les donnees de scraping
const getCompanyLogo = (ticker, seekingAlphaData) => {
    try {
        // Chercher dans les donnees de scraping
        const seekingAlphaItem = seekingAlphaData.stocks?.find(s => s.ticker === ticker);
        if (seekingAlphaItem?.raw_text) {
            // Extraire le logo depuis le JSON dans raw_text
            const logoMatch = seekingAlphaItem.raw_text.match(/"logo":"([^"]+)"/);
            if (logoMatch && logoMatch[1]) {
                return logoMatch[1];
            }
        }
        
        // Fallback vers des logos par defaut
        const defaultLogos = {
            // Tickers US
            'GOOGL': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/GOOGL.svg',
            'T': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/T.svg',
            'CSCO': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/CSCO.svg',
            'CVS': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/CVS.svg',
            'DEO': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/DEO.svg',
            'MDT': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/MDT.svg',
            'JNJ': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/JNJ.svg',
            'JPM': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/JPM.svg',
            'LVMHF': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/LVMHF.svg',
            'MU': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/MU.svg',
            'NSRGY': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/NSRGY.svg',
            'NKE': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/NKE.svg',
            'PFE': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/PFE.svg',
            'UNH': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/UNH.svg',
            'UL': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/UL.svg',
            'VZ': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/VZ.svg',
            'WFC': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/WFC.svg',
            
            // Tickers TSX (Canada)
            'BNS': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/BNS.svg',
            'TD': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/TD.svg',
            'BCE': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/BCE.svg',
            'CNR': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/CNR.svg',
            'MG': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/MG.svg',
            'MFC': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/MFC.svg',
            'NTR': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/NTR.svg',
            'TRP': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/TRP.svg',
            
            // Autres tickers populaires
            'AAPL': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/AAPL.svg',
            'MSFT': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/MSFT.svg',
            'AMZN': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/AMZN.svg',
            'TSLA': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/TSLA.svg',
            'NVDA': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/NVDA.svg',
            'META': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/META.svg'
        };
        
        return defaultLogos[ticker] || `https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/${ticker}.svg`;
    } catch (error) {
        console.error(`Erreur extraction logo pour ${ticker}:`, error?.message || String(error));
        return `https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/${ticker}.svg`;
    }
};

// Fonction pour obtenir le login ID de l'utilisateur
const getUserLoginId = (githubUser) => {
    try {
        const userJson = sessionStorage.getItem('gob-user');
        if (userJson) {
            const user = JSON.parse(userJson);
            return user.username || user.display_name || githubUser?.login || githubUser?.name || 'toi';
        }
    } catch (e) {
        console.warn('Erreur recuperation utilisateur:', e);
    }
    return githubUser?.login || githubUser?.name || 'toi';
};

// Fonction pour obtenir la couleur d'une grade
const getGradeColor = (grade) => {
    if (!grade) return 'bg-gray-100 text-gray-600';
    // Convertir en chaine si ce n'est pas deja le cas
    const gradeStr = String(grade);
    if (!gradeStr || gradeStr.length === 0) return 'bg-gray-100 text-gray-600';
    const letter = gradeStr.charAt(0).toUpperCase();
    if (letter === 'A') return 'bg-green-100 text-green-700';
    if (letter === 'B') return 'bg-gray-100 text-gray-700';
    if (letter === 'C') return 'bg-yellow-100 text-yellow-700';
    if (letter === 'D') return 'bg-green-100 text-green-700';
    if (letter === 'F') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-600';
};

// Parser les donnees brutes de Seeking Alpha
const parseSeekingAlphaRawText = (rawText) => {
    if (!rawText) return null;
    
    try {
        // Extraire les donnees du texte brut
        const data = {};
        
        // Prix actuel
        const priceMatch = rawText.match(/\$(\d+\.\d+)/);
        if (priceMatch) data.price = priceMatch[1];
        
        // Variation
        const changeMatch = rawText.match(/([+-]\d+\.\d+)\s*\(([+-]\d+\.\d+)%\)/);
        if (changeMatch) {
            data.priceChange = changeMatch[1];
            data.priceChangePercent = changeMatch[2];
        }
        
        // Market Cap
        const marketCapMatch = rawText.match(/Market Cap\$?([\d.]+[KMBT])/i);
        if (marketCapMatch) data.marketCap = marketCapMatch[1];
        
        // P/E Ratio
        const peMatch = rawText.match(/P\/E (?:Non-GAAP )?\((?:FWD|TTM)\)([\d.]+)/i);
        if (peMatch) data.peRatio = peMatch[1];
        
        // Dividend Yield
        const divYieldMatch = rawText.match(/(?:Dividend )?Yield(?: \(FWD\))?([\d.]+)%/i);
        if (divYieldMatch) data.dividendYield = divYieldMatch[1] + '%';
        
        // Annual Payout
        const payoutMatch = rawText.match(/Annual Payout(?: \(FWD\))?\$?([\d.]+)/i);
        if (payoutMatch) data.annualPayout = '$' + payoutMatch[1];
        
        // Ex-Dividend Date
        const exDivMatch = rawText.match(/Ex-Dividend Date(\d{1,2}\/\d{1,2}\/\d{4})/i);
        if (exDivMatch) data.exDivDate = exDivMatch[1];
        
        // Frequency
        const freqMatch = rawText.match(/Frequency(Quarterly|Monthly|Annual)/i);
        if (freqMatch) data.dividendFrequency = freqMatch[1];
        
        // Sector
        const sectorMatch = rawText.match(/Sector([A-Za-z\s]+)Industry/i);
        if (sectorMatch) data.sector = sectorMatch[1].trim();
        
        // Quant Ratings
        const valuationMatch = rawText.match(/Valuation([A-F][+-]?)/i);
        if (valuationMatch) data.valuationGrade = valuationMatch[1];
        
        const growthMatch = rawText.match(/Growth([A-F][+-]?)/i);
        if (growthMatch) data.growthGrade = growthMatch[1];
        
        const profitMatch = rawText.match(/Profitability([A-F][+-]?)/i);
        if (profitMatch) data.profitabilityGrade = profitMatch[1];
        
        const momentumMatch = rawText.match(/Momentum([A-F][+-]?)/i);
        if (momentumMatch) data.momentumGrade = momentumMatch[1];
        
        // Company Description
        const descMatch = rawText.match(/Company Profile([^]+?)(?:More\.\.\.|Revenue|Earnings)/i);
        if (descMatch) data.description = descMatch[1].trim().substring(0, 500);
        
        // ROE
        const roeMatch = rawText.match(/Return on Equity([\d.]+)%/i);
        if (roeMatch) data.roe = roeMatch[1] + '%';
        
        // Profit Margin
        const marginMatch = rawText.match(/Net Income Margin([\d.]+)%/i);
        if (marginMatch) data.netMargin = marginMatch[1] + '%';
        
        // Debt to Equity
        const debtMatch = rawText.match(/Total Debt \/ Equity[^]+([\d.]+)%/i);
        if (debtMatch) data.debtToEquity = debtMatch[1] + '%';
        
        return data;
    } catch (error) {
        console.error('Erreur parsing Seeking Alpha:', error);
        return null;
    }
};

// Fonction pour formatter les nombres
const formatNumber = (num, prefix = '', suffix = '') => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    const formattedNum = typeof num === 'number' ? num.toFixed(2) : parseFloat(num).toFixed(2);
    return `${prefix}${formattedNum}${suffix}`;
};

// Fonction pour obtenir l'icone d'un onglet
const getTabIcon = (tabId) => {
    const iconMap = {
        'stocks-news': 'Newspaper',
        'jlab': 'Flask',
        'dans-watchlist': 'Star',
        'ask-emma': 'ChatBubble',
        'emma-sms': 'Phone',
        'admin-jsla': 'Settings',
        'seeking-alpha': 'TrendingUp',
        'scrapping-sa': 'Code',
        'economic-calendar': 'Calendar',
        'investing-calendar': 'Calendar',
        'email-briefings': 'Mail',
        'yield-curve': 'GraphUp',
        'markets-economy': 'BarChart3',
        'plus': 'Plus'
    };
    
    return iconMap[tabId] || 'Activity';
};

// Export functions to window for browser usage
// NOTE: Do NOT use module.exports here - this file is loaded with Babel in browser
// and will cause "exports is not defined" errors
if (typeof window !== 'undefined') {
    window.DASHBOARD_UTILS = window.DASHBOARD_UTILS || {};
    Object.assign(window.DASHBOARD_UTILS, {
        cleanText,
        getNewsIcon,
        getSourceCredibility,
        sortNewsByCredibility,
        isFrenchArticle,
        getCompanyLogo,
        getUserLoginId,
        getGradeColor,
        parseSeekingAlphaRawText,
        formatNumber,
        getTabIcon
    });
}
