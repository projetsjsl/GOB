// 
// DESIGN MANAGER - Gestion du design des emails
// 

import { loadDesignConfig as apiLoadDesign, saveDesignConfig as apiSaveDesign } from './api-client.js';
import { showStatus } from './ui-helpers.js';

let designConfig = null;
let originalDesignConfig = null;

/**
 * Charge la configuration du design
 */
export async function loadDesignConfig() {
    try {
        designConfig = await apiLoadDesign();
        originalDesignConfig = JSON.parse(JSON.stringify(designConfig));
        populateDesignForm(designConfig);
        updateDesignPreview();
    } catch (error) {
        console.error('Error loading design config:', error);
        showStatus(' Erreur chargement design', 'error');
    }
}

/**
 * Remplit le formulaire avec les donnees du design
 */
export function populateDesignForm(config) {
    // Branding
    document.getElementById('designAvatarUrl').value = config.branding?.avatar?.url || '';
    document.getElementById('designLogoUrl').value = config.branding?.logo?.url || '';
    document.getElementById('designCompanyName').value = config.branding?.companyName || '';
    document.getElementById('designTagline').value = config.branding?.tagline || '';

    // Colors
    const colors = config.colors || {};
    document.getElementById('designColorPrimary').value = colors.primary || '#6366f1';
    document.getElementById('designColorPrimaryText').value = colors.primary || '#6366f1';
    document.getElementById('designColorPrimaryDark').value = colors.primaryDark || '#4f46e5';
    document.getElementById('designColorPrimaryDarkText').value = colors.primaryDark || '#4f46e5';
    document.getElementById('designColorPrimaryLight').value = colors.primaryLight || '#8b5cf6';
    document.getElementById('designColorPrimaryLightText').value = colors.primaryLight || '#8b5cf6';
    document.getElementById('designColorText').value = colors.textDark || '#1f2937';
    document.getElementById('designColorTextValue').value = colors.textDark || '#1f2937';

    // Header
    document.getElementById('designShowAvatar').checked = config.header?.showAvatar !== false;
    document.getElementById('designShowDate').checked = config.header?.showDate !== false;
    document.getElementById('designShowEdition').checked = config.header?.showEdition !== false;

    // Footer
    document.getElementById('designShowLogo').checked = config.footer?.showLogo !== false;
    document.getElementById('designShowDisclaimer').checked = config.footer?.showDisclaimer !== false;
    document.getElementById('designDisclaimer').value = config.footer?.disclaimerText || '';
    document.getElementById('designCopyright').value = config.footer?.copyrightText || '';

    // SMS
    document.getElementById('smsMaxSegments').value = config.sms?.maxSegments || 10;
    document.getElementById('smsWarningThreshold').value = config.sms?.warningThreshold || 5;
    document.getElementById('smsSignature').value = config.sms?.signature || '- Emma IA';
    document.getElementById('smsKeepSectionEmojis').checked = config.sms?.keepSectionEmojis !== false;
    document.getElementById('smsShowWarning').checked = config.sms?.showSegmentWarning !== false;
}

/**
 * Recupere les donnees du formulaire
 */
export function getDesignFormData() {
    return {
        branding: {
            avatar: { url: document.getElementById('designAvatarUrl').value },
            logo: { url: document.getElementById('designLogoUrl').value },
            companyName: document.getElementById('designCompanyName').value,
            tagline: document.getElementById('designTagline').value
        },
        colors: {
            primary: document.getElementById('designColorPrimary').value,
            primaryDark: document.getElementById('designColorPrimaryDark').value,
            primaryLight: document.getElementById('designColorPrimaryLight').value,
            textDark: document.getElementById('designColorText').value
        },
        header: {
            showAvatar: document.getElementById('designShowAvatar').checked,
            showDate: document.getElementById('designShowDate').checked,
            showEdition: document.getElementById('designShowEdition').checked
        },
        footer: {
            showLogo: document.getElementById('designShowLogo').checked,
            showDisclaimer: document.getElementById('designShowDisclaimer').checked,
            disclaimerText: document.getElementById('designDisclaimer').value,
            copyrightText: document.getElementById('designCopyright').value
        },
        sms: {
            maxSegments: parseInt(document.getElementById('smsMaxSegments').value),
            warningThreshold: parseInt(document.getElementById('smsWarningThreshold').value),
            signature: document.getElementById('smsSignature').value,
            keepSectionEmojis: document.getElementById('smsKeepSectionEmojis').checked,
            showSegmentWarning: document.getElementById('smsShowWarning').checked
        }
    };
}

/**
 * Sauvegarde le design
 */
export async function saveDesign() {
    try {
        const data = getDesignFormData();
        const result = await apiSaveDesign(data);
        if (result.success) {
            designConfig = result.config;
            originalDesignConfig = JSON.parse(JSON.stringify(designConfig));
            showStatus(' Design sauvegarde!', 'success');
        } else {
            showStatus(' Erreur: ' + result.error, 'error');
        }
    } catch (error) {
        showStatus(' Erreur sauvegarde', 'error');
    }
}

/**
 * Annule les modifications
 */
export function cancelDesignChanges() {
    if (originalDesignConfig) {
        populateDesignForm(originalDesignConfig);
        updateDesignPreview();
        showStatus(' Modifications annulees', 'info');
    }
}

/**
 * Reinitialise aux valeurs par defaut
 */
export async function resetDesignToDefaults() {
    if (confirm('Reinitialiser tous les parametres design aux valeurs par defaut?')) {
        try {
            const config = await apiLoadDesign();
            populateDesignForm(config);
            updateDesignPreview();
            showStatus(' Reinitialise aux valeurs par defaut', 'info');
        } catch (error) {
            showStatus(' Erreur', 'error');
        }
    }
}

/**
 * Met a jour le preview du design
 */
export function updateDesignPreview() {
    const preview = document.getElementById('designPreview');
    const primary = document.getElementById('designColorPrimary').value;
    const primaryLight = document.getElementById('designColorPrimaryLight').value;
    const avatar = document.getElementById('designAvatarUrl').value;
    const logo = document.getElementById('designLogoUrl').value;
    const company = document.getElementById('designCompanyName').value || 'GOB Apps';

    preview.innerHTML = `
        <div style="max-width:500px;margin:0 auto;font-family:sans-serif;background:#f8fafc;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <div style="background:linear-gradient(135deg,${primary},${primaryLight});color:white;padding:20px;text-align:center;">
                ${avatar ? `<img src="${avatar}" style="width:48px;height:48px;border-radius:50%;margin-bottom:8px;">` : '<div style="font-size:32px;margin-bottom:8px;"></div>'}
                <h2 style="margin:0;font-size:20px;">Emma En Direct</h2>
                <p style="margin:4px 0 0;opacity:0.9;font-size:12px;">EDITION MATIN | ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            <div style="padding:20px;background:white;">
                <p style="color:#1f2937;line-height:1.6;">Bonjour! Voici votre briefing matinal des marches financiers...</p>
                <h3 style="color:${primary};margin:16px 0 8px;"> Marches</h3>
                <p style="color:#4b5563;font-size:14px;">Les indices sont en hausse ce matin...</p>
            </div>
            <div style="padding:16px;background:#f8fafc;text-align:center;border-top:1px solid #e5e7eb;">
                ${logo ? `<img src="${logo}" style="height:30px;margin-bottom:8px;">` : ''}
                <p style="margin:0;font-size:11px;color:#6b7280;"> Genere par Emma IA - ${company}</p>
            </div>
        </div>
    `;
}

/**
 * Retourne la configuration actuelle (pour export)
 */
export function getCurrentDesignConfig() {
    return designConfig;
}
