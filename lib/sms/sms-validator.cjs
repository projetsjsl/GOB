/**
 * SMS Validator
 *
 * Valide les contraintes SMS avant envoi:
 * 1. Longueur respectée (max 2 SMS = 320 caractères UCS-2)
 * 2. Sources présentes (obligatoire)
 * 3. Format correct
 * 4. Pas de caractères interdits
 */

// Limites SMS selon encodage
const SMS_ENCODING = {
  GSM7: {
    name: 'GSM-7',
    singleSMS: 160,
    multiSMS: 153, // Moins à cause du header
    maxSMS: 306, // 2 SMS
  },
  UCS2: {
    name: 'UCS-2',
    singleSMS: 70,
    multiSMS: 67,
    maxSMS: 134, // 2 SMS
  },
};

// Caractères GSM-7 (encodage efficace)
const GSM7_CHARS = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./0-9:;<=>?¡A-ZÄÖÑÜ§¿a-zäöñüà\[\\\]\^\{|\}\~€]*$/;

/**
 * Valide un message SMS avant envoi
 * @param {string} text - Texte du SMS
 * @param {Object} options - Options de validation
 * @returns {Object} { valid, errors, warnings, metadata }
 */
function validateSMS(text, options = {}) {
  const errors = [];
  const warnings = [];
  const metadata = {};

  // 1. Vérifier texte vide
  if (!text || text.trim().length === 0) {
    errors.push('Message vide');
    return { valid: false, errors, warnings, metadata };
  }

  // 2. Détecter encodage (GSM-7 ou UCS-2)
  const isGSM7 = GSM7_CHARS.test(text);
  const encoding = isGSM7 ? SMS_ENCODING.GSM7 : SMS_ENCODING.UCS2;
  metadata.encoding = encoding.name;

  // 3. Compter caractères selon encodage
  const charCount = text.length;
  metadata.charCount = charCount;

  // 4. Calculer nombre de SMS
  let numSMS;
  if (charCount <= encoding.singleSMS) {
    numSMS = 1;
  } else {
    numSMS = Math.ceil(charCount / encoding.multiSMS);
  }
  metadata.numSMS = numSMS;

  // 5. Vérifier limite 2 SMS max
  if (charCount > encoding.maxSMS) {
    errors.push(
      `Message trop long: ${charCount} caractères (max ${encoding.maxSMS} pour ${encoding.name})`
    );
  }

  // Avertissement si proche de la limite
  if (charCount > encoding.maxSMS * 0.9 && charCount <= encoding.maxSMS) {
    warnings.push(`Proche de la limite: ${charCount}/${encoding.maxSMS} caractères`);
  }

  // 6. Vérifier présence sources (obligatoire sauf AIDE)
  const hasSource = /source[s]?:/i.test(text);
  metadata.hasSource = hasSource;

  if (!hasSource && !options.skipSourceCheck) {
    errors.push('Source manquante (obligatoire)');
  }

  // 7. Vérifier format source
  if (hasSource) {
    const sourceMatch = text.match(/source[s]?:\s*(.+)/i);
    if (sourceMatch) {
      metadata.source = sourceMatch[1].trim();
    }
  }

  // 8. Vérifier caractères problématiques
  const problematicChars = findProblematicChars(text);
  if (problematicChars.length > 0) {
    warnings.push(`Caractères spéciaux détectés: ${problematicChars.join(', ')}`);
    metadata.problematicChars = problematicChars;
  }

  // 9. Vérifier structure (phrases cohérentes)
  const hasCoherentStructure = checkCoherentStructure(text);
  if (!hasCoherentStructure) {
    warnings.push('Structure incohérente (phrases tronquées?)');
  }

  // 10. Résultat final
  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    metadata,
  };
}

/**
 * Trouve les caractères problématiques (emojis, caractères rares)
 */
function findProblematicChars(text) {
  const problematic = [];

  // Emojis (range Unicode)
  const emojiRegex = /[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu;
  const emojis = text.match(emojiRegex);
  if (emojis) {
    problematic.push(...emojis);
  }

  // Caractères non-ASCII (hors GSM-7)
  if (!GSM7_CHARS.test(text)) {
    const nonAscii = text.match(/[^\x00-\x7F]/g);
    if (nonAscii) {
      const unique = [...new Set(nonAscii)];
      problematic.push(...unique.filter((c) => !emojis || !emojis.includes(c)));
    }
  }

  return [...new Set(problematic)]; // Dédupliquer
}

/**
 * Vérifie la cohérence structurelle du texte
 */
function checkCoherentStructure(text) {
  // Vérifier qu'il n'y a pas de phrases tronquées brutalement
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    // Vérifier que les phrases se terminent correctement
    const lastChar = trimmed[trimmed.length - 1];
    const endsCorrectly = ['.', '!', '?', ':', ')'].includes(lastChar);

    // Exception: dernière ligne peut être "Source: X"
    const isSourceLine = /^source[s]?:/i.test(trimmed);

    if (!endsCorrectly && !isSourceLine) {
      return false;
    }
  }

  return true;
}

/**
 * Corrige automatiquement un message pour le rendre valide
 * @param {string} text - Texte à corriger
 * @param {Object} options - Options
 * @returns {Object} { text, corrections }
 */
function autoFixSMS(text, options = {}) {
  const corrections = [];

  // 1. Trim espaces
  let fixed = text.trim();

  // 2. Détecter encodage
  const isGSM7 = GSM7_CHARS.test(fixed);
  const encoding = isGSM7 ? SMS_ENCODING.GSM7 : SMS_ENCODING.UCS2;

  // 3. Tronquer si trop long
  if (fixed.length > encoding.maxSMS) {
    const maxLength = encoding.maxSMS - 3; // -3 pour "..."
    fixed = truncateIntelligently(fixed, maxLength) + '...';
    corrections.push(`Tronqué de ${text.length} à ${fixed.length} caractères`);
  }

  // 4. Ajouter source si manquante
  if (!options.skipSourceCheck && !/source[s]?:/i.test(fixed)) {
    const source = options.defaultSource || 'API';
    fixed = `${fixed}\n\nSource: ${source}`;
    corrections.push('Source ajoutée automatiquement');
  }

  // 5. Remplacer caractères problématiques
  const problematic = findProblematicChars(fixed);
  if (problematic.length > 0) {
    for (const char of problematic) {
      fixed = fixed.replace(new RegExp(char, 'g'), '');
    }
    corrections.push(`${problematic.length} caractères spéciaux supprimés`);
  }

  return {
    text: fixed,
    corrections,
  };
}

/**
 * Tronque intelligemment (dernier point ou espace)
 */
function truncateIntelligently(text, maxLength) {
  if (text.length <= maxLength) return text;

  // Chercher le dernier point avant maxLength
  const lastPeriod = text.lastIndexOf('.', maxLength);
  if (lastPeriod > maxLength * 0.7) {
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
 * Estime le coût d'envoi SMS
 * @param {string} text - Texte du SMS
 * @returns {Object} { numSMS, encoding, cost }
 */
function estimateSMSCost(text) {
  const isGSM7 = GSM7_CHARS.test(text);
  const encoding = isGSM7 ? SMS_ENCODING.GSM7 : SMS_ENCODING.UCS2;

  const charCount = text.length;
  let numSMS;

  if (charCount <= encoding.singleSMS) {
    numSMS = 1;
  } else {
    numSMS = Math.ceil(charCount / encoding.multiSMS);
  }

  // Coût approximatif (CAD)
  const costPerSMS = 0.01; // 1 cent par SMS (approximatif)
  const cost = numSMS * costPerSMS;

  return {
    numSMS,
    encoding: encoding.name,
    charCount,
    cost: Math.round(cost * 100) / 100,
  };
}

module.exports = {
  validateSMS,
  autoFixSMS,
  estimateSMSCost,
  SMS_ENCODING, // Export pour tests
};
