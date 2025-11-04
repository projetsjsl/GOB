/**
 * Phone Number to Name Mapping
 *
 * Permet à Emma de personnaliser ses réponses SMS en reconnaissant
 * les personnes qui lui écrivent.
 *
 * Format: '+1XXXXXXXXXX': 'Prénom Nom'
 */

export const phoneToNameMapping = {
  // Numéros connus
  '+14183185826': 'J-S',        // +1 (418) 318-5826
  '+14187501061': 'Daniel',      // +1 (418) 750-1061

  // Ajoutez d'autres contacts ici:
  // '+15145551234': 'Jean Dupont',
  // '+14385559876': 'Marie Tremblay',
  // '+15145550000': 'Client VIP',
};

/**
 * Obtient le nom associé à un numéro de téléphone
 * @param {string} phoneNumber - Numéro de téléphone (format: +1XXXXXXXXXX)
 * @returns {string} Le nom de la personne ou le numéro si inconnu
 */
export function getNameFromPhone(phoneNumber) {
  return phoneToNameMapping[phoneNumber] || phoneNumber;
}

/**
 * Vérifie si un numéro est connu
 * @param {string} phoneNumber - Numéro de téléphone
 * @returns {boolean} True si le numéro est dans le mapping
 */
export function isKnownContact(phoneNumber) {
  return phoneNumber in phoneToNameMapping;
}

export default {
  phoneToNameMapping,
  getNameFromPhone,
  isKnownContact
};
