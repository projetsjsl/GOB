/**
 * SMS Adapter Client-Side
 * 
 * Version JavaScript (frontend) de lib/channel-adapter.js
 * pour previsualiser les messages SMS optimises dans le chatbot web
 */

/**
 * Adapte un message pour affichage SMS (identique au vrai SMS envoye)
 * 
 * @param {string} text - Le texte a adapter
 * @param {object} context - Contexte (tickers, citations, etc.)
 * @returns {string} Texte adapte pour SMS
 */
function adaptForSMS(text, context = {}) {
  let cleanedText = text;

  //  OPTIMISATION SMS: Remplacer emojis complexes par ASCII pour GSM-7
  
  // Emojis numerotes -> chiffres simples
  cleanedText = cleanedText.replace(/0/g, '0.');
  cleanedText = cleanedText.replace(/1/g, '1.');
  cleanedText = cleanedText.replace(/2/g, '2.');
  cleanedText = cleanedText.replace(/3/g, '3.');
  cleanedText = cleanedText.replace(/4/g, '4.');
  cleanedText = cleanedText.replace(/5/g, '5.');
  cleanedText = cleanedText.replace(/6/g, '6.');
  cleanedText = cleanedText.replace(/7/g, '7.');
  cleanedText = cleanedText.replace(/8/g, '8.');
  cleanedText = cleanedText.replace(/9/g, '9.');
  cleanedText = cleanedText.replace(//g, '10.');

  // Emojis communs -> ASCII equivalent
  cleanedText = cleanedText.replace(//g, '[Graphique]');
  cleanedText = cleanedText.replace(//g, '[Hausse]');
  cleanedText = cleanedText.replace(//g, '[Baisse]');
  cleanedText = cleanedText.replace(//g, '$');
  cleanedText = cleanedText.replace(//g, '$');
  cleanedText = cleanedText.replace(//g, '$');
  cleanedText = cleanedText.replace(//g, '[Analyse]');
  cleanedText = cleanedText.replace(//g, '[ATTENTION]');
  cleanedText = cleanedText.replace(//g, '[OK]');
  cleanedText = cleanedText.replace(//g, '[NON]');
  cleanedText = cleanedText.replace(//g, '[+]');
  cleanedText = cleanedText.replace(//g, '*');
  cleanedText = cleanedText.replace(//g, '');
  cleanedText = cleanedText.replace(//g, '');
  cleanedText = cleanedText.replace(//g, '>');
  cleanedText = cleanedText.replace(//g, '[Info]');
  cleanedText = cleanedText.replace(//g, '-');
  cleanedText = cleanedText.replace(//g, 'Sources:');
  cleanedText = cleanedText.replace(//g, '[Top]');
  cleanedText = cleanedText.replace(//g, '*');
  cleanedText = cleanedText.replace(//g, '[Rouge]');
  cleanedText = cleanedText.replace(//g, '[Vert]');
  cleanedText = cleanedText.replace(//g, '[Jaune]');

  //  GARDER EMOJI EMMA AU DEBUT (personnalisation)
  const startsWithEmma = cleanedText.startsWith('');
  const emmaPrefix = startsWithEmma ? ' ' : '';
  
  // Supprimer TOUS les emojis Emma (on remettra 1 seul au debut)
  cleanedText = cleanedText.replace(//g, '');
  cleanedText = cleanedText.replace(//g, '');
  cleanedText = cleanedText.replace(//g, '');
  cleanedText = cleanedText.replace(//g, 'Salut');
  cleanedText = cleanedText.trim();

  //  NORMALISATION CARACTERES ACCENTUES pour GSM-7
  cleanedText = cleanedText.replace(/[aaaa]/g, 'a');
  cleanedText = cleanedText.replace(/[AAAA]/g, 'A');
  cleanedText = cleanedText.replace(/[ee]/g, 'e');
  cleanedText = cleanedText.replace(/[EE]/g, 'E');
  cleanedText = cleanedText.replace(/[ii]/g, 'i');
  cleanedText = cleanedText.replace(/[II]/g, 'I');
  cleanedText = cleanedText.replace(/[ooo]/g, 'o');
  cleanedText = cleanedText.replace(/[OOO]/g, 'O');
  cleanedText = cleanedText.replace(/[uu]/g, 'u');
  cleanedText = cleanedText.replace(/[UU]/g, 'U');
  cleanedText = cleanedText.replace(/c/g, 'c');
  cleanedText = cleanedText.replace(/C/g, 'C');
  cleanedText = cleanedText.replace(/n/g, 'n');
  cleanedText = cleanedText.replace(/N/g, 'N');
  cleanedText = cleanedText.replace(/[]/g, 'oe');
  cleanedText = cleanedText.replace(/[]/g, 'OE');
  cleanedText = cleanedText.replace(/[]/g, 'ae');
  cleanedText = cleanedText.replace(/[]/g, 'AE');

  //  NORMALISATION PONCTUATION pour GSM-7
  cleanedText = cleanedText.replace(/['']/g, "'");
  cleanedText = cleanedText.replace(/[""]/g, '"');
  cleanedText = cleanedText.replace(/[]/g, '<>');
  cleanedText = cleanedText.replace(/[""]/g, '"');
  cleanedText = cleanedText.replace(/[--]/g, '-');
  cleanedText = cleanedText.replace(/[...]/g, '...');
  cleanedText = cleanedText.replace(/[-]/g, '-');

  // Supprimer markdown
  cleanedText = cleanedText.replace(/\*\*\*/g, '');
  cleanedText = cleanedText.replace(/\*\*/g, '');
  cleanedText = cleanedText.replace(/\*/g, '');
  cleanedText = cleanedText.replace(/___/g, '');
  cleanedText = cleanedText.replace(/__/g, '');
  cleanedText = cleanedText.replace(/_([^_]+)_/g, '$1');
  cleanedText = cleanedText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  cleanedText = cleanedText.replace(/^#{1,6}\s+/gm, '');
  
  //  MISE EN EVIDENCE pour SMS (sans formatage riche)
  // Titres en MAJUSCULES
  cleanedText = cleanedText.replace(/^(\d+)\.\s+([^\n]+)/gm, (match, num, title) => {
    if (title.length < 40) {
      return `${num}. ${title.toUpperCase()}`;
    }
    return match;
  });
  
  // Ratios financiers avec >>>
  cleanedText = cleanedText.replace(/\b(P\/E|ROE|ROA|EBITDA|EV\/EBITDA|P\/B|FCF|BPA|CA|Marge nette|Marge brute|Price|Prix|Cours)\s*:/gi, (match) => {
    return `>>> ${match.toUpperCase()}`;
  });
  
  // Separateurs entre sections
  cleanedText = cleanedText.replace(/\n\n(\d+\.)/g, '\n\n---\n$1');
  
  // Mettre en evidence les chiffres importants
  cleanedText = cleanedText.replace(/(\$[\d,]+\.?\d*)/g, '[$1]');
  cleanedText = cleanedText.replace(/([+-]?\d+\.?\d*%)/g, '[$1]');

  // Supprimer images et URLs d'images
  cleanedText = cleanedText.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  cleanedText = cleanedText.replace(/https?:\/\/finviz\.com\/chart\.ashx[^\s)]+/g, '[Graphique supprime]');
  cleanedText = cleanedText.replace(/https?:\/\/[^\s)]+\.(png|jpg|jpeg|gif|svg|webp)[^\s)]*/gi, '[Image supprimee]');

  // Nettoyer espaces
  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
  cleanedText = cleanedText.replace(/ {2,}/g, ' ');
  cleanedText = cleanedText.trim();

  //  PROTECTION CONTRE REPONSES ULTRA-LONGUES
  const MAX_SMS_LENGTH = 1500;
  
  if (cleanedText.length > MAX_SMS_LENGTH) {
    console.log(` [SMS Preview] Reponse tres longue (${cleanedText.length} chars) - creation d'un resume`);
    
    const sections = cleanedText.split(/\n\n+/);
    let summary = '';
    let charCount = 0;
    
    for (const section of sections) {
      const hasNumbers = /\d/.test(section);
      const isShort = section.length < 200;
      
      if (charCount + section.length < MAX_SMS_LENGTH) {
        summary += (summary ? '\n\n' : '') + section;
        charCount += section.length + 2;
      } else if (hasNumbers && isShort) {
        summary += (summary ? '\n\n' : '') + section;
        charCount += section.length + 2;
      } else {
        break;
      }
    }
    
    if (charCount < cleanedText.length - 100) {
      summary += '\n\n[...Analyse complete sur gobapps.com]';
    }
    
    cleanedText = summary;
  }

  //  RETOUR OPTIMISE avec emoji Emma au debut
  return emmaPrefix + cleanedText;
}

/**
 * Decoupe un message en chunks pour affichage multi-SMS
 * 
 * @param {string} text - Le texte a decouper
 * @param {number} maxLength - Longueur max par chunk (default: 1500)
 * @returns {string[]} Tableau de chunks
 */
function chunkTextForSMS(text, maxLength = 1500) {
  const chunks = [];
  let currentChunk = '';

  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      
      // Si une phrase est trop longue, la couper intelligemment
      if (sentence.length > maxLength) {
        let remaining = sentence;
        while (remaining.length > 0) {
          if (remaining.length <= maxLength) {
            chunks.push(remaining);
            remaining = '';
          } else {
            const cutPos = remaining.lastIndexOf(' ', maxLength);
            const finalCut = cutPos > maxLength * 0.7 ? cutPos : maxLength;
            chunks.push(remaining.substring(0, finalCut).trim());
            remaining = remaining.substring(finalCut).trim();
          }
        }
        currentChunk = '';
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Export pour utilisation dans le chatbot
if (typeof window !== 'undefined') {
  window.SMSAdapter = {
    adaptForSMS,
    chunkTextForSMS
  };
}

