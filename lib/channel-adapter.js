/**
 * Channel Adapter - Adaptation des réponses selon le canal
 *
 * Adapte le format des messages selon les contraintes et capacités
 * de chaque canal de communication (SMS, Email, Messenger, Web).
 */

/**
 * Adapte une réponse pour un canal spécifique
 *
 * @param {string} response - La réponse brute d'Emma
 * @param {string} channel - Le canal ('web', 'email', 'sms', 'messenger')
 * @param {object} context - Contexte additionnel (tickers, etc.)
 * @returns {string|object} Réponse adaptée au canal
 */
export function adaptForChannel(response, channel, context = {}) {
  switch (channel) {
    case 'sms':
      return adaptForSMS(response, context);
    case 'email':
      return adaptForEmail(response);
    case 'messenger':
      return adaptForMessenger(response);
    case 'web':
    default:
      return response; // Web peut gérer le contenu complet
  }
}

/**
 * Adapte pour SMS - AUCUNE LIMITE, multi-SMS géré par Twilio
 *
 * @param {string} text - Le texte à adapter
 * @param {object} context - Contexte (tickers, etc.)
 * @returns {string} Texte adapté pour SMS (complet, sans troncature)
 */
export function adaptForSMS(text, context = {}) {
  // 0. NETTOYER LE MARKDOWN AGRESSIVEMENT (SMS = texte brut uniquement)
  let cleanedText = text;

  // 🎨 OPTIMISATION SMS LÉGÈRE: Garder emojis de section, supprimer les répétitifs
  // Compromis: Garde le style visuel mais réduit la longueur
  
  // Emojis numérotés → chiffres simples (cause principale du coût élevé)
  cleanedText = cleanedText.replace(/0️⃣/g, '0.');
  cleanedText = cleanedText.replace(/1️⃣/g, '1.');
  cleanedText = cleanedText.replace(/2️⃣/g, '2.');
  cleanedText = cleanedText.replace(/3️⃣/g, '3.');
  cleanedText = cleanedText.replace(/4️⃣/g, '4.');
  cleanedText = cleanedText.replace(/5️⃣/g, '5.');
  cleanedText = cleanedText.replace(/6️⃣/g, '6.');
  cleanedText = cleanedText.replace(/7️⃣/g, '7.');
  cleanedText = cleanedText.replace(/8️⃣/g, '8.');
  cleanedText = cleanedText.replace(/9️⃣/g, '9.');
  cleanedText = cleanedText.replace(/🔟/g, '10.');

  // ✅ GARDER les emojis de section (📊 💼 🏰 ⚠️ ✅ 💡) - ils donnent du style
  // ❌ SUPPRIMER les emojis répétitifs dans le texte (📈 📉 💰 🚀 📱)
  
  // Supprimer emojis répétitifs/inutiles
  cleanedText = cleanedText.replace(/📱/g, ''); // Téléphone répété
  cleanedText = cleanedText.replace(/💬/g, ''); // Bulle de chat
  cleanedText = cleanedText.replace(/🎯/g, ''); // Cible
  cleanedText = cleanedText.replace(/🔑/g, ''); // Clé
  cleanedText = cleanedText.replace(/🏆/g, ''); // Trophée
  cleanedText = cleanedText.replace(/⭐/g, ''); // Étoile
  cleanedText = cleanedText.replace(/🔴/g, ''); // Cercle rouge
  cleanedText = cleanedText.replace(/🟢/g, ''); // Cercle vert
  cleanedText = cleanedText.replace(/🟡/g, ''); // Cercle jaune
  cleanedText = cleanedText.replace(/🚀/g, ''); // Fusée (sauf dans intro)
  cleanedText = cleanedText.replace(/💵/g, '$');
  cleanedText = cleanedText.replace(/💲/g, '$');
  cleanedText = cleanedText.replace(/🔍/g, '');
  
  // Garder 📊 💼 🏰 ⚠️ ✅ 💡 📈 📉 💰 📰 (emojis de section importants)

  // 🎨 GARDER EMOJI EMMA AU DÉBUT (personnalisation)
  // Mais supprimer les autres emojis pour GSM-7
  const startsWithEmma = cleanedText.startsWith('👩🏻');
  const emmaPrefix = startsWithEmma ? '👩🏻 ' : '';
  
  // Supprimer TOUS les emojis Emma d'abord (on remettra 1 seul au début)
  cleanedText = cleanedText.replace(/👩🏻‍💼/g, '');
  cleanedText = cleanedText.replace(/🤖/g, '');
  cleanedText = cleanedText.replace(/👩🏻/g, '');
  
  // Remplacer 👋 par "Salut" SEULEMENT si pas déjà suivi de "Salut"
  cleanedText = cleanedText.replace(/👋\s*(?!Salut)/gi, 'Salut ');
  cleanedText = cleanedText.replace(/👋\s*Salut/gi, 'Salut');
  
  // Nettoyer les espaces multiples au début
  cleanedText = cleanedText.trim();

  // 🔤 NORMALISATION CARACTÈRES ACCENTUÉS pour GSM-7
  // GSM-7 supporte seulement: à è é ù ì ò (pas â, ê, î, ô, û, ç accentués)
  // On garde les accents supportés et on convertit les autres
  cleanedText = cleanedText.replace(/[âãäå]/g, 'a');
  cleanedText = cleanedText.replace(/[ÂÃÄÅ]/g, 'A');
  cleanedText = cleanedText.replace(/[êë]/g, 'e');
  cleanedText = cleanedText.replace(/[ÊË]/g, 'E');
  cleanedText = cleanedText.replace(/[îï]/g, 'i');
  cleanedText = cleanedText.replace(/[ÎÏ]/g, 'I');
  cleanedText = cleanedText.replace(/[ôõö]/g, 'o');
  cleanedText = cleanedText.replace(/[ÔÕÖ]/g, 'O');
  cleanedText = cleanedText.replace(/[ûü]/g, 'u');
  cleanedText = cleanedText.replace(/[ÛÜ]/g, 'U');
  cleanedText = cleanedText.replace(/ç/g, 'c');
  cleanedText = cleanedText.replace(/Ç/g, 'C');
  cleanedText = cleanedText.replace(/ñ/g, 'n');
  cleanedText = cleanedText.replace(/Ñ/g, 'N');
  cleanedText = cleanedText.replace(/[œ]/g, 'oe');
  cleanedText = cleanedText.replace(/[Œ]/g, 'OE');
  cleanedText = cleanedText.replace(/[æ]/g, 'ae');
  cleanedText = cleanedText.replace(/[Æ]/g, 'AE');

  // 📝 NORMALISATION PONCTUATION pour GSM-7
  // Convertir quotes courbes en quotes droites (GSM-7 compatible)
  cleanedText = cleanedText.replace(/['']/g, "'");
  cleanedText = cleanedText.replace(/[""]/g, '"');
  cleanedText = cleanedText.replace(/[‹›]/g, '<>');
  cleanedText = cleanedText.replace(/[«»]/g, '"');
  cleanedText = cleanedText.replace(/[—–]/g, '-'); // em-dash, en-dash
  cleanedText = cleanedText.replace(/[…]/g, '...'); // ellipsis
  cleanedText = cleanedText.replace(/[•]/g, '-'); // bullet

  // Supprimer tous les astérisques (gras/italique markdown)
  cleanedText = cleanedText.replace(/\*\*\*/g, '');  // ***texte***
  cleanedText = cleanedText.replace(/\*\*/g, '');    // **texte**
  cleanedText = cleanedText.replace(/\*/g, '');      // *texte*

  // Supprimer les underscores markdown (__texte__ ou _texte_)
  cleanedText = cleanedText.replace(/___/g, '');
  cleanedText = cleanedText.replace(/__/g, '');
  cleanedText = cleanedText.replace(/_([^_]+)_/g, '$1');

  // Supprimer les liens markdown [texte](url) et garder juste le texte
  cleanedText = cleanedText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Supprimer les headers markdown (## Titre) mais garder emphase
  cleanedText = cleanedText.replace(/^#{1,6}\s+/gm, '');
  
  // 📝 PAS de mise en évidence agressive - garder le format naturel comme JC l'a reçu
  // On garde juste la conversion des emojis numérotés (1️⃣ → 1.)

  // 1. Supprimer les images markdown ![alt](url)
  cleanedText = cleanedText.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');

  // 2. Supprimer les URLs d'images Finviz (souvent longues et inutiles en SMS)
  cleanedText = cleanedText.replace(/https?:\/\/finviz\.com\/chart\.ashx[^\s)]+/g, '[Graphique supprimé]');

  // 3. Supprimer les URLs d'images génériques
  cleanedText = cleanedText.replace(/https?:\/\/[^\s)]+\.(png|jpg|jpeg|gif|svg|webp)[^\s)]*/gi, '[Image supprimée]');

  // 4. Améliorer le formatage des citations de sources
  // Transformer "[1]", "[2]" en footnotes plus lisibles
  const sourceRegex = /\[(\d+)\]/g;
  const sources = [];
  let sourceCounter = 0;

  // Extraire les sources et les remplacer par des numéros simples
  cleanedText = cleanedText.replace(sourceRegex, (match, num) => {
    sourceCounter++;
    sources.push(num);
    return `(${sourceCounter})`;
  });

  // 5. Si le texte contient "Sources:" ou similaire, le rendre plus compact
  cleanedText = cleanedText.replace(/(?:\n\n|\n)(?:Sources?|Références?|Citations?):\s*\n/gi, '\n📚 Sources: ');

  // 6. Nettoyer les espaces multiples et newlines excessifs
  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines consécutifs
  cleanedText = cleanedText.replace(/ {2,}/g, ' '); // Max 1 espace
  cleanedText = cleanedText.trim();

  // 7. AJOUTER SOURCES D'ACTUALITÉS de manière amicale (2-3 liens max)
  // Combiner citations Perplexity + URLs dans le texte
  const citations = context.citations || [];

  // Extraire aussi les URLs déjà présentes dans le texte (actualités FMP)
  const urlRegex = /https?:\/\/[^\s)]+/g;
  const urlsInText = cleanedText.match(urlRegex) || [];

  // Filtrer sources fiables de Perplexity
  const reliableSources = citations.filter(citation =>
    citation &&
    (citation.url || citation) &&
    (
      /bloomberg|reuters|wsj|ft\.com|cnbc|marketwatch|investing\.com|seekingalpha/i.test(citation.url || citation) ||
      /lapresse|bnnterminal|globeandmail|finance\.yahoo|tradingview/i.test(citation.url || citation)
    )
  );

  // Combiner URLs (Perplexity + URLs déjà dans texte)
  const allSources = [
    ...reliableSources.slice(0, 2).map(c => ({
      url: typeof c === 'string' ? c : c.url,
      title: c.title || extractDomainName(typeof c === 'string' ? c : c.url)
    })),
    ...urlsInText.slice(0, 2).map(url => ({
      url,
      title: extractDomainName(url)
    }))
  ];

  // Dédupliquer par URL
  const uniqueSources = Array.from(
    new Map(allSources.map(s => [s.url, s])).values()
  ).slice(0, 3); // Max 3 sources

  if (uniqueSources.length > 0) {
    // Supprimer les URLs du texte (pour éviter duplication)
    urlsInText.forEach(url => {
      cleanedText = cleanedText.replace(url, '');
    });

    cleanedText += '\n\n📰 Sources:\n';

    uniqueSources.forEach((source) => {
      cleanedText += `📰 ${source.title}: ${source.url}\n`;
    });
  }

  // 8. AJOUTER LIENS TRADINGVIEW pour graphiques interactifs
  // UNIQUEMENT pour les analyses de tickers spécifiques (pas pour liste watchlist)
  const isWatchlistRequest = cleanedText.includes('Votre Watchlist') ||
                              cleanedText.includes('FAVORIS') ||
                              cleanedText.includes('liste de tickers');

  if (!isWatchlistRequest) {
    // 🎯 EXTRACTION INTELLIGENTE: Extraire les tickers MENTIONNÉS dans la réponse
    // au lieu d'utiliser tous les tickers du contexte
    const tickerRegex = /\b([A-Z]{2,5})(?:\s|:|\.|\)|,|$)/g;
    const tickersInResponse = [...new Set(
      (cleanedText.match(tickerRegex) || []).map(t => t.trim().replace(/[^A-Z]/g, ''))
    )];

    // Filtrer les faux positifs courants (mots en majuscules qui ne sont pas des tickers)
    const commonWords = ['USD', 'CAD', 'EUR', 'GBP', 'CEO', 'CFO', 'IPO', 'ETF', 'AI', 'PE', 'EPS', 'ROE', 'YTD', 'EMMA', 'SMS', 'FMP', 'API', 'JS', 'DAN', 'GOB', 'JSLAI', 'IA', 'Q1', 'Q2', 'Q3', 'Q4', 'EST', 'PST', 'VS', 'OK', 'NO', 'YES'];
    const validTickers = tickersInResponse.filter(t =>
      t &&
      t.length >= 2 &&
      t.length <= 5 &&
      !commonWords.includes(t) &&
      /^[A-Z]+$/.test(t)
    );

    // Limiter aux 2 premiers tickers mentionnés (pertinents à la demande)
    const tickersList = validTickers.slice(0, 2);

    // Ajouter section graphiques SEULEMENT si 1-2 tickers spécifiques analysés
    if (tickersList.length > 0 && tickersList.length <= 2) {
      cleanedText += '\n\nGraphiques:\n';
      tickersList.forEach(ticker => {
        cleanedText += `> ${ticker}: https://tradingview.com/chart/?symbol=${ticker}\n`;
      });
    }
  }

  // 🛡️ PROTECTION CONTRE RÉPONSES ULTRA-LONGUES (coût élevé)
  // Si le message est trop long, créer un résumé intelligent
  const MAX_SMS_LENGTH = 5000; // ~35 SMS max en UCS-2 (70 chars chacun) - Permet contenu complet Perplexity
  
  if (cleanedText.length > MAX_SMS_LENGTH) {
    console.log(`⚠️ [SMS Adapter] Réponse très longue (${cleanedText.length} chars) - création d'un résumé`);
    
    // Créer un résumé intelligent en gardant les sections les plus importantes
    const sections = cleanedText.split(/\n\n+/);
    let summary = '';
    let charCount = 0;
    
    for (const section of sections) {
      // Prioriser les sections avec des chiffres (données importantes)
      const hasNumbers = /\d/.test(section);
      const isShort = section.length < 200;
      
      if (charCount + section.length < MAX_SMS_LENGTH) {
        summary += (summary ? '\n\n' : '') + section;
        charCount += section.length + 2;
      } else if (hasNumbers && isShort) {
        // Forcer l'inclusion de sections courtes avec chiffres
        summary += (summary ? '\n\n' : '') + section;
        charCount += section.length + 2;
      } else {
        break;
      }
    }
    
    // Ajouter note de troncature
    if (charCount < cleanedText.length - 100) {
      summary += '\n\n[...Analyse complete sur gobapps.com]';
    }
    
    cleanedText = summary;
  }

  // ✅ RETOUR OPTIMISÉ avec emoji Emma au début
  // Note: 1 emoji (👩🏻) force UCS-2 mais coût acceptable vs personnalisation
  // Réduction tout de même de ~50% grâce à suppression des autres emojis
  return emmaPrefix + cleanedText;
}

/**
 * Extrait le nom de domaine d'une URL pour affichage amical
 *
 * @param {string} url - L'URL complète
 * @returns {string} Nom de domaine simplifié
 */
function extractDomainName(url) {
  try {
    const domain = new URL(url).hostname;

    // Mapping de domaines connus vers noms friendly
    const domainMap = {
      'bloomberg.com': 'Bloomberg',
      'reuters.com': 'Reuters',
      'wsj.com': 'Wall Street Journal',
      'ft.com': 'Financial Times',
      'cnbc.com': 'CNBC',
      'marketwatch.com': 'MarketWatch',
      'investing.com': 'Investing.com',
      'seekingalpha.com': 'Seeking Alpha',
      'lapresse.ca': 'La Presse',
      'bnnterminal.com': 'BNN Bloomberg',
      'theglobeandmail.com': 'Globe and Mail',
      'finance.yahoo.com': 'Yahoo Finance'
    };

    return domainMap[domain] || domain.replace('www.', '');
  } catch (e) {
    return 'Source';
  }
}

/**
 * Découpe un texte en chunks pour SMS
 *
 * @param {string} text - Le texte à découper
 * @param {number} chunkSize - Taille max de chaque chunk
 * @returns {string[]} Tableau de chunks
 */
export function chunkTextForSMS(text, chunkSize = 1500) {
  const chunks = [];
  let currentChunk = '';

  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= chunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Adapte pour Email (format HTML avec styling)
 *
 * @param {string} text - Le texte à adapter
 * @returns {string} HTML formaté pour email
 */
export function adaptForEmail(text) {
  // Convertir markdown simple en HTML
  let html = text;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 style="color: #1a73e8; margin-top: 20px;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="color: #1a73e8; margin-top: 24px;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="color: #1a73e8; margin-top: 28px;">$1</h1>');

  // Bold et italique
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Liens
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #1a73e8;">$1</a>');

  // Bullet points
  html = html.replace(/^- (.*)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul style="margin-left: 20px;">$1</ul>');

  // Paragraphes
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // Template email complet
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Emma IA™</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Assistante Financière GOB</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    ${html}
  </div>

  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px;">
    <p>Groupe Ouellet Bolduc - Analyse Financière Avancée</p>
    <p style="margin: 5px 0;">Propulsé par Emma IA™ & JSLAI™ Score</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Adapte pour Facebook Messenger (format texte structuré)
 *
 * @param {string} text - Le texte à adapter
 * @returns {string} Texte adapté pour Messenger
 */
export function adaptForMessenger(text) {
  // Messenger supporte les emojis et un formatage limité
  // Limite de 2000 caractères par message

  const MAX_LENGTH = 2000;

  if (text.length <= MAX_LENGTH) {
    return text;
  }

  // Tronquer intelligemment
  const truncated = text.substring(0, MAX_LENGTH);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  const cutPoint = Math.max(lastPeriod, lastNewline);

  if (cutPoint > MAX_LENGTH * 0.7) {
    return text.substring(0, cutPoint + 1) + '\n\n💬 Réponse complète disponible sur le web dashboard.';
  }

  return truncated.substring(0, MAX_LENGTH - 80) + '...\n\n💬 Réponse tronquée. Plus de détails sur le dashboard web.';
}

/**
 * Extrait un résumé court d'une réponse (pour notifications)
 *
 * @param {string} text - Le texte complet
 * @param {number} maxLength - Longueur max du résumé
 * @returns {string} Résumé
 */
export function extractSummary(text, maxLength = 150) {
  if (text.length <= maxLength) {
    return text;
  }

  const firstSentence = text.split(/[.!?]/)[0];

  if (firstSentence.length <= maxLength) {
    return firstSentence + '.';
  }

  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Nettoie le texte des caractères problématiques pour SMS
 *
 * @param {string} text - Le texte à nettoyer
 * @returns {string} Texte nettoyé
 */
export function sanitizeForSMS(text) {
  // Supprimer emojis complexes (garder les simples)
  let cleaned = text.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Symbols & pictographs
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport & map
  cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // Flags

  // Normaliser les espaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Détermine si un message nécessite un canal spécifique
 *
 * @param {string} text - Le texte du message
 * @returns {object} Recommandations de canal
 */
export function getChannelRecommendations(text) {
  const hasImages = /\!\[.*\]\(.*\)/.test(text);
  const hasTables = /\|.*\|.*\|/.test(text);
  const hasLongCode = /```[\s\S]{200,}```/.test(text);
  const isLong = text.length > 2000;

  return {
    sms: !hasImages && !hasTables && !hasLongCode && !isLong,
    email: true, // Email peut tout gérer
    messenger: !hasTables && !hasLongCode,
    web: true, // Web peut tout gérer
    preferredChannel: hasImages || hasTables || hasLongCode || isLong ? 'email' : 'any'
  };
}

export default {
  adaptForChannel,
  adaptForSMS,
  adaptForEmail,
  adaptForMessenger,
  chunkTextForSMS,
  extractSummary,
  sanitizeForSMS,
  getChannelRecommendations
};
