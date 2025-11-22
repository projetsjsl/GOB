// ═══════════════════════════════════════════════════════════════
// SMS MANAGER - Gestion de la configuration SMS
// ═══════════════════════════════════════════════════════════════

import { saveDesign, cancelDesignChanges } from './design-manager.js';

/**
 * Sauvegarde la config SMS (fait partie du design)
 */
export async function saveSms() {
    await saveDesign();
}

/**
 * Annule les modifications SMS
 */
export function cancelSmsChanges() {
    cancelDesignChanges();
}
