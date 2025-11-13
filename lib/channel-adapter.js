/**
 * Channel Adapter - Adaptation des réponses selon le canal
 *
 * Adapte le format des messages selon les contraintes et capacités
 * de chaque canal de communication (SMS, Email, Messenger, Web).
 */

/**
 * Adapte une réponse pour un canal spécifique
 * ✅ AMÉLIORATION: Support async pour adaptForEmail (logos)
 *
 * @param {string} response - La réponse brute d'Emma
 * @param {string} channel - Le canal ('web', 'email', 'sms', 'messenger')
 * @param {object} context - Contexte additionnel (tickers, etc.)
 * @returns {Promise<string|object>|string|object} Réponse adaptée au canal
 */
export function adaptForChannel(response, channel, context = {}) {
  switch (channel) {
    case 'sms':
      return adaptForSMS(response, context);
    case 'email':
      // ✅ adaptForEmail est maintenant async (pour récupérer logos)
      return adaptForEmail(response, context);
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
  
  // Supprimer emojis drapeaux et globe (forcent UCS-2)
  cleanedText = cleanedText.replace(/🌎/g, ''); // Globe
  cleanedText = cleanedText.replace(/🌍/g, ''); // Globe Europe
  cleanedText = cleanedText.replace(/🌏/g, ''); // Globe Asie
  cleanedText = cleanedText.replace(/🇺🇸/g, 'US'); // Drapeau USA
  cleanedText = cleanedText.replace(/🇨🇦/g, 'CA'); // Drapeau Canada
  cleanedText = cleanedText.replace(/🇫🇷/g, 'FR'); // Drapeau France
  cleanedText = cleanedText.replace(/🇬🇧/g, 'UK'); // Drapeau UK
  cleanedText = cleanedText.replace(/🇩🇪/g, 'DE'); // Drapeau Allemagne
  cleanedText = cleanedText.replace(/🇯🇵/g, 'JP'); // Drapeau Japon
  cleanedText = cleanedText.replace(/🇨🇳/g, 'CN'); // Drapeau Chine
  // Supprimer tous les autres drapeaux (regex Unicode)
  cleanedText = cleanedText.replace(/[\u{1F1E0}-\u{1F1FF}]{2}/gu, '');
  
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
  
  // 📊 CONVERSION DES TABLEAUX MARKDOWN EN FORMAT TEXTE LINÉAIRE (SMS)
  // Détecter les tableaux markdown (lignes avec | séparateurs)
  // Pattern amélioré pour capturer les tableaux même avec lignes de séparation
  const tableRegex = /(\|.+\|(?:\r?\n\|[:\-\s|]+\|)?(?:\r?\n\|.+\|)+)/g;
  cleanedText = cleanedText.replace(tableRegex, (tableMatch) => {
    try {
      const lines = tableMatch.trim().split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length < 2) return ''; // Pas assez de lignes pour un tableau
      
      // Ignorer la ligne de séparation (--- ou |---|---|)
      const dataLines = lines.filter(line => {
        const trimmed = line.trim();
        // Ignorer les lignes qui ne contiennent que |, -, :, et espaces
        return !/^[\|\s:\-]+$/.test(trimmed) && trimmed.includes('|');
      });
      
      if (dataLines.length === 0) return '';
      
      // Extraire les en-têtes (première ligne)
      const headerLine = dataLines[0];
      const headers = headerLine.split('|')
        .map(h => h.trim())
        .filter(h => h.length > 0);
      
      if (headers.length === 0) return '';
      
      // Extraire les lignes de données (après les en-têtes)
      const dataRows = dataLines.slice(1).map(line => {
        const cells = line.split('|')
          .map(cell => cell.trim());
        // Retourner toutes les cellules (le filtrage se fera après)
        return cells;
      }).filter(row => row.some(cell => cell.length > 0)); // Ignorer lignes vides
      
      if (dataRows.length === 0) return '';
      
      // Convertir en format texte linéaire pour SMS
      let textTable = '\n';
      
      // Pour chaque ligne de données, créer un format lisible
      dataRows.forEach((row, rowIdx) => {
        // S'assurer qu'on a le bon nombre de colonnes
        const paddedRow = [...row];
        while (paddedRow.length < headers.length) {
          paddedRow.push('');
        }
        
        // Format: "Métrique: Valeur1 | Autre: Valeur2 | ..."
        // Pour la première colonne (généralement la métrique), on l'utilise comme clé
        const firstCol = paddedRow[0] || '';
        const otherCols = paddedRow.slice(1, headers.length);
        
        if (firstCol) {
          // Format avec première colonne comme clé
          const formattedParts = [firstCol];
          headers.slice(1).forEach((header, idx) => {
            const value = otherCols[idx] || '-';
            if (value && value !== '-') {
              formattedParts.push(`${header}: ${value}`);
            }
          });
          textTable += formattedParts.join(' | ') + '\n';
        } else {
          // Format alternatif si pas de première colonne clé
          const formattedParts = headers.map((header, idx) => {
            const value = paddedRow[idx] || '-';
            return `${header}: ${value}`;
          });
          textTable += formattedParts.join(' | ') + '\n';
        }
      });
      
      return textTable + '\n';
    } catch (error) {
      console.warn('⚠️ [SMS Adapter] Erreur conversion tableau:', error.message);
      // En cas d'erreur, retourner le tableau original nettoyé
      return tableMatch.replace(/\|/g, ' | ').replace(/\s+/g, ' ') + '\n\n';
    }
  });
  
  // 📝 PAS de mise en évidence agressive - garder le format naturel comme JC l'a reçu
  // On garde juste la conversion des emojis numérotés (1️⃣ → 1.)

  // 1. Supprimer les images markdown ![alt](url) - silencieusement
  cleanedText = cleanedText.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');

  // 2. Supprimer les URLs d'images Finviz - silencieusement (pas de message)
  cleanedText = cleanedText.replace(/https?:\/\/finviz\.com\/chart\.ashx[^\s)]+/g, '');

  // 3. Supprimer les URLs d'images génériques - silencieusement
  cleanedText = cleanedText.replace(/https?:\/\/[^\s)]+\.(png|jpg|jpeg|gif|svg|webp)[^\s)]*/gi, '');

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
    // ✅ FIX: Utiliser les tickers EXPLICITEMENT demandés par l'utilisateur (context.tickers)
    // au lieu d'extraire naïvement tous les mots en MAJUSCULES de la réponse
    // Cela évite de créer des graphiques pour des acronymes ou suggestions alternatives (TE, SUR, etc.)

    let tickersList = [];

    // Prioriser les tickers du contexte Emma (ceux explicitement demandés)
    if (context?.tickers && Array.isArray(context.tickers) && context.tickers.length > 0) {
      tickersList = context.tickers.slice(0, 2); // Max 2 tickers
      console.log(`📊 [SMS Adapter] Using tickers from context: ${tickersList.join(', ')}`);
    } else {
      // Fallback: Extraire de la réponse SEULEMENT si pas de tickers dans le contexte
      // Utiliser regex plus strict pour éviter faux positifs
      const tickerRegex = /\b([A-Z]{2,5})(?:\s|:|\.|\)|,|$)/g;
      const tickersInResponse = [...new Set(
        (cleanedText.match(tickerRegex) || []).map(t => t.trim().replace(/[^A-Z]/g, ''))
      )];

      // ✅ LISTE ÉTENDUE de faux positifs à filtrer
      const commonWords = [
        'USD', 'CAD', 'EUR', 'GBP', 'CEO', 'CFO', 'IPO', 'ETF', 'AI', 'PE', 'EPS', 'ROE', 'YTD',
        'EMMA', 'SMS', 'FMP', 'API', 'JS', 'DAN', 'GOB', 'JSLAI', 'IA', 'Q1', 'Q2', 'Q3', 'Q4',
        'EST', 'PST', 'VS', 'OK', 'NO', 'YES', 'TE', 'SUR', 'IT', 'IS', 'AS', 'AT', 'OR', 'AN',
        'UN', 'DE', 'LA', 'LE', 'EN', 'ET', 'OU', 'NE', 'SE', 'SI', 'QU', 'QUE', 'CFA', 'FCF',
        'DCF', 'PEG', 'ROA', 'ROS', 'EVA', 'NPV', 'IRR', 'YoY', 'MoM', 'WoW', 'TTM', 'LTM',
        'NTM', 'FY', 'FYE', 'GDP', 'CPI', 'PPI', 'PMI', 'ISM', 'NY', 'US', 'CA', 'UK', 'EU'
      ];

      const validTickers = tickersInResponse.filter(t =>
        t &&
        t.length >= 2 &&
        t.length <= 5 &&
        !commonWords.includes(t) &&
        /^[A-Z]+$/.test(t)
      );

      tickersList = validTickers.slice(0, 2); // Max 2 tickers

      if (tickersList.length > 0) {
        console.log(`⚠️ [SMS Adapter] Fallback: extracted tickers from response: ${tickersList.join(', ')}`);
      }
    }

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
 * Récupère l'URL du logo d'une entreprise par son ticker
 * Utilise plusieurs sources avec fallback
 *
 * @param {string} ticker - Le symbole boursier (ex: AAPL)
 * @returns {Promise<string|null>} URL du logo ou null si non disponible
 */
async function getCompanyLogoUrl(ticker) {
  if (!ticker || typeof ticker !== 'string') {
    return null;
  }

  const cleanTicker = ticker.trim().toUpperCase();

  // Liste de services de logos avec fallback
  const logoUrls = [
    // Companies Logo (gratuit, basé sur ticker)
    `https://companieslogo.com/img/orig/${cleanTicker}.png`,
    // Alternative: Clearbit (nécessite domaine, mais plus fiable pour grandes entreprises)
    // On pourrait utiliser FMP pour obtenir le domaine, mais pour l'instant on utilise Companies Logo
    `https://logo.clearbit.com/${cleanTicker.toLowerCase()}.com`,
  ];

  // Essayer le premier service (Companies Logo)
  // Note: On ne fait pas de vérification HTTP ici pour éviter la latence
  // Les emails HTML supporteront les images cassées avec un alt text
  return logoUrls[0];
}

/**
 * Extrait les tickers mentionnés dans le texte
 *
 * @param {string} text - Le texte à analyser
 * @returns {string[]} Liste des tickers uniques trouvés
 */
function extractTickersFromText(text) {
  // Pattern pour détecter les tickers (2-5 lettres majuscules)
  const tickerRegex = /\b([A-Z]{2,5})\b/g;
  const matches = text.match(tickerRegex) || [];

  // Filtrer les faux positifs (mots communs)
  const commonWords = new Set([
    'USD', 'CAD', 'EUR', 'GBP', 'CEO', 'CFO', 'IPO', 'ETF', 'AI', 'PE', 'EPS',
    'ROE', 'YTD', 'EMMA', 'SMS', 'FMP', 'API', 'JS', 'DAN', 'GOB', 'JSLAI',
    'IA', 'Q1', 'Q2', 'Q3', 'Q4', 'EST', 'PST', 'VS', 'OK', 'NO', 'YES',
    'HTML', 'CSS', 'URL', 'HTTP', 'HTTPS', 'PDF', 'XML', 'JSON'
  ]);

  const validTickers = [...new Set(matches.filter(t => 
    t.length >= 2 && 
    t.length <= 5 && 
    !commonWords.has(t) &&
    /^[A-Z]+$/.test(t)
  ))];

  return validTickers;
}

/**
 * Adapte pour Email (format HTML avec styling)
 * ✅ AMÉLIORATION: Ajoute les logos d'entreprises pour les tickers mentionnés
 *
 * @param {string} text - Le texte à adapter
 * @param {object} context - Contexte optionnel (tickers, etc.)
 * @returns {Promise<string>} HTML formaté pour email
 */
export async function adaptForEmail(text, context = {}) {
  // Convertir markdown simple en HTML
  let html = text;

  // ✅ EXTRACTION DES TICKERS MENTIONNÉS
  const tickersInText = extractTickersFromText(text);
  const tickersFromContext = context.tickers || [];
  const allTickers = [...new Set([...tickersInText, ...tickersFromContext])];

  // ✅ RÉCUPÉRATION DES LOGOS (limiter à 5 pour éviter surcharge)
  const tickersToProcess = allTickers.slice(0, 5);
  const logoMap = new Map();

  // Récupérer les logos en parallèle (sans await pour éviter latence)
  // On génère les URLs mais on ne vérifie pas si elles existent
  for (const ticker of tickersToProcess) {
    const logoUrl = await getCompanyLogoUrl(ticker);
    if (logoUrl) {
      logoMap.set(ticker, logoUrl);
    }
  }

  // ✅ REMPLACER LES MENTIONS DE TICKERS PAR TICKER + LOGO
  // Pattern: Ticker seul ou dans un contexte (ex: "AAPL", "Apple (AAPL)", "analyse AAPL")
  // IMPORTANT: Remplacer en ordre inverse (tickers longs d'abord) pour éviter remplacements en cascade
  const sortedTickers = Array.from(logoMap.entries()).sort((a, b) => b[0].length - a[0].length);
  
  for (const [ticker, logoUrl] of sortedTickers) {
    // Remplacer les mentions de ticker par ticker + logo inline
    // Format: <span style="display: inline-flex; align-items: center; gap: 6px;">
    //           <img src="..." alt="..." style="width: 24px; height: 24px; vertical-align: middle;" />
    //           <strong>AAPL</strong>
    //         </span>
    const logoHtml = `<span class="ticker-logo" style="display: inline-flex; align-items: center; gap: 6px; margin: 0 2px;">
      <img src="${logoUrl}" alt="${ticker} logo" style="width: 24px; height: 24px; vertical-align: middle; border-radius: 4px; object-fit: contain;" onerror="this.style.display='none';" />
      <strong>${ticker}</strong>
    </span>`;

    // Remplacer les occurrences du ticker (mais pas dans les URLs, attributs HTML, ou déjà remplacées)
    // Pattern: \b pour word boundary, éviter de remplacer dans les URLs ou dans les spans déjà créés
    // Échapper les caractères spéciaux du ticker pour le regex
    const escapedTicker = ticker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Ne pas remplacer si déjà dans un span de logo ou dans une URL/attribut HTML
    const tickerRegex = new RegExp(`\\b${escapedTicker}\\b(?![^<]*>|[^<]*</span>|class="ticker-logo")`, 'g');
    html = html.replace(tickerRegex, logoHtml);
  }

  // Headers avec polices Bloomberg-style et couleurs structurelles
  const bloombergFontStack = "'Helvetica Neue', Helvetica, Arial, 'Inter', sans-serif";
  // H1: Noir avec accent bleu subtil pour distinction
  html = html.replace(/^# (.*$)/gim, `<h1 style="color: #000000; margin-top: 28px; margin-bottom: 16px; font-family: ${bloombergFontStack}; font-weight: 700; font-size: 24px; letter-spacing: -0.3px; line-height: 1.3; border-left: 4px solid #1a73e8; padding-left: 12px;">$1</h1>`);
  // H2: Noir avec accent bleu plus subtil
  html = html.replace(/^## (.*$)/gim, `<h2 style="color: #000000; margin-top: 24px; margin-bottom: 12px; font-family: ${bloombergFontStack}; font-weight: 700; font-size: 20px; line-height: 1.4;">$1</h2>`);
  // H3: Noir avec accent gris pour hiérarchie
  html = html.replace(/^### (.*$)/gim, `<h3 style="color: #1a1a1a; margin-top: 20px; margin-bottom: 10px; font-family: ${bloombergFontStack}; font-weight: 600; font-size: 16px; line-height: 1.5;">$1</h3>`);

  // Bold et italique avec polices Bloomberg (noir par défaut)
  html = html.replace(/\*\*([^*]+)\*\*/g, `<strong style="font-family: ${bloombergFontStack}; font-weight: 600; color: #000000;">$1</strong>`);
  html = html.replace(/\*([^*]+)\*/g, `<em style="font-family: ${bloombergFontStack}; color: #333333;">$1</em>`);

  // Liens avec style Bloomberg (bleu pour visibilité mais avec meilleur contraste)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" style="color: #0066cc; font-family: ${bloombergFontStack}; text-decoration: none; border-bottom: 1px solid #0066cc; font-weight: 500;">$1</a>`);

  // Bullet points avec polices Bloomberg (noir)
  html = html.replace(/^- (.*)$/gim, `<li style="font-family: ${bloombergFontStack}; color: #000000; margin-bottom: 6px;">$1</li>`);
  // Wrapper les listes dans <ul> (chercher les groupes de <li>)
  html = html.replace(/(<li[^>]*>.*?<\/li>)/gs, (match) => {
    // Si déjà dans un <ul>, ne pas wrapper
    if (match.includes('<ul')) return match;
    return `<ul style="margin-left: 20px; font-family: ${bloombergFontStack}; color: #000000; padding-left: 0;">${match}</ul>`;
  });

  // Paragraphes avec polices Bloomberg (noir pour meilleure lisibilité)
  html = html.replace(/\n\n/g, `</p><p style="font-family: ${bloombergFontStack}; color: #000000; line-height: 1.7; margin-bottom: 12px;">`);
  html = `<p style="font-family: ${bloombergFontStack}; color: #000000; line-height: 1.7; margin-bottom: 12px;">` + html + '</p>';

  // Template email complet avec polices Bloomberg-style
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  </style>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #000000; background-color: #f5f5f5; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: white; margin: 0; font-size: 28px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 700; letter-spacing: -0.5px;">Emma IA™</h1>
    <p style="color: rgba(255,255,255,0.95); margin: 5px 0 0 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 400;">Assistante Financière GOB</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    ${html}
  </div>

  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666666; font-size: 12px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; border-top: 1px solid #e0e0e0;">
    <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #666666; margin-bottom: 4px;">Groupe Ouellet Bolduc - Analyse Financière Avancée</p>
    <p style="margin: 5px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #888888;">Propulsé par Emma IA™ & JSLAI™ Score</p>
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
