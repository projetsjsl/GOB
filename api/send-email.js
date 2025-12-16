/**
 * API Endpoint: Send Email via Resend
 *
 * Envoie les briefings Emma par email en utilisant la plateforme Resend
 *
 * @route POST /api/send-email
 * 
 * ════════════════════════════════════════════════════════════════════════════
 * BONNES PRATIQUES HTML EMAIL (compatibilité Outlook, Gmail, Apple Mail)
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * Le paramètre `html` envoyé à ce endpoint DOIT respecter les règles suivantes
 * pour garantir un affichage correct dans TOUS les clients email:
 * 
 * ✅ STRUCTURE OBLIGATOIRE:
 * - Utiliser <table role="presentation"> pour le layout
 * - Attributs sur chaque table: cellpadding="0" cellspacing="0" border="0"
 * - Largeur conteneur principal: width="600" style="max-width: 600px;"
 * - Wrapper externe centré avec <td align="center">
 * 
 * ✅ STYLES:
 * - 100% inline (style="...") sur chaque élément
 * - Font stack: font-family: Arial, Helvetica, sans-serif;
 * - Couleurs hexadécimales complètes (#FFFFFF, pas #FFF)
 * - Utiliser padding au lieu de margin
 * - vertical-align: middle pour aligner images/texte
 * 
 * ❌ NE JAMAIS UTILISER:
 * - <div> pour structure principale
 * - <style> block dans <head> (Outlook ignore)
 * - Classes CSS
 * - Flexbox (display: flex, inline-flex)
 * - Grid
 * - linear-gradient, box-shadow
 * - border-radius > 4px
 * - margin (utiliser padding)
 * - onerror JavaScript
 * 
 * 📧 TEMPLATE DE RÉFÉRENCE:
 * Voir /GOB/.agent/workflows/email-best-practices.md pour un template complet
 * ════════════════════════════════════════════════════════════════════════════
 */

/**
 * Valide le HTML email pour compatibilité Outlook
 * @param {string} html - HTML à valider
 * @returns {Object} { valid: boolean, warnings: string[] }
 */
function validateEmailHtml(html) {
    const warnings = [];
    
    // Patterns problématiques pour Outlook
    if (html.includes('display: flex') || html.includes('display:flex')) {
        warnings.push('Utilise display:flex (non supporté Outlook)');
    }
    if (html.includes('inline-flex')) {
        warnings.push('Utilise inline-flex (non supporté Outlook)');
    }
    if (html.includes('linear-gradient')) {
        warnings.push('Utilise linear-gradient (non supporté Outlook)');
    }
    if (html.includes('box-shadow')) {
        warnings.push('Utilise box-shadow (non supporté Outlook)');
    }
    if (/<style[^>]*>/.test(html)) {
        warnings.push('Contient bloc <style> (partiellement ignoré Outlook)');
    }
    
    // Vérifications positives
    const hasTable = html.includes('<table');
    const hasRolePresentation = html.includes('role="presentation"');
    
    if (!hasTable) {
        warnings.push('Pas de structure table (recommandé pour Outlook)');
    }
    if (hasTable && !hasRolePresentation) {
        warnings.push('Tables sans role="presentation"');
    }
    
    return {
        valid: warnings.length === 0,
        warnings
    };
}

import { logEmail, updateEmailLog } from '../lib/email-logger.js';
import { checkRateLimit } from '../lib/rate-limiter.js';

export default async function handler(req, res) {
    // Méthode POST uniquement
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // ═══════════════════════════════════════════════════════════════
    // RATE LIMITING
    // ═══════════════════════════════════════════════════════════════
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const rateLimitKey = `email:${clientIp}`;
    const rateLimit = checkRateLimit(rateLimitKey, 'email');

    if (!rateLimit.allowed) {
        console.warn(`[Send Email] Rate limit exceeded for ${clientIp}`);
        return res.status(429).json({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 1000)}s`
        });
    }

    const { subject, html, to, briefingType } = req.body;
    const startTime = Date.now();
    let logId = null;

    try {
        // Validation des paramètres
        if (!subject || !html) {
            return res.status(400).json({
                error: 'Missing required fields: subject and html are required'
            });
        }

        // ═══════════════════════════════════════════════════════════════
        // LOGGING (Start)
        // ═══════════════════════════════════════════════════════════════
        logId = logEmail({
            type: briefingType || 'manual',
            channel: 'email',
            recipient: to || 'default',
            subject: subject,
            sizeBytes: Buffer.byteLength(html, 'utf8'),
            status: 'pending'
        });

        // ═══════════════════════════════════════════════════════════════
        // VALIDATION HTML EMAIL
        // ═══════════════════════════════════════════════════════════════
        const htmlValidation = validateEmailHtml(html);
        if (htmlValidation.warnings.length > 0) {
            console.warn('[Send Email] ⚠️ HTML Warnings:', htmlValidation.warnings.join(', '));
        }

        // Vérifier taille du HTML
        const htmlSizeKB = Buffer.byteLength(html, 'utf8') / 1024;
        if (htmlSizeKB > 100) {
            console.warn(`[Send Email] ⚠️ Large email: ${htmlSizeKB.toFixed(1)}KB`);
        }

        // Configuration Resend
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const TO_EMAIL = to || process.env.RESEND_TO_EMAIL || 'projetsjsl@gmail.com';

        if (!RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY not configured');
        }

        // Sanitize subject (remove newlines, trim)
        const cleanSubject = String(subject || 'Sujet Manquant').replace(/[\r\n]+/g, ' ').trim();

        // payload Resend
        const payload = {
            from: FROM_EMAIL,
            to: TO_EMAIL,
            subject: cleanSubject,
            html: html,
            tags: [
                { name: 'category', value: 'briefing' },
                { name: 'type', value: briefingType || 'manual' }
            ]
        };
        
        console.log(`[Send Email] Sending to ${TO_EMAIL} with subject: "${cleanSubject}"`);

        // Appel API Resend
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            // Gérer les erreurs spécifiques Resend
            const errorMessage = data.message || 'Failed to send via Resend';
            const errorCode = data.error?.code || response.status;
            
            // Gérer les limitations Resend gracieusement
            if (errorCode === 429 || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    message: 'Limite d\'envoi Resend atteinte. Réessayez plus tard.',
                    retryAfter: 3600, // 1 heure
                    suggestion: 'Vérifiez votre quota Resend ou attendez avant de réessayer'
                });
            }
            
            throw new Error(errorMessage);
        }

        // ═══════════════════════════════════════════════════════════════
        // LOGGING (Success)
        // ═══════════════════════════════════════════════════════════════
        updateEmailLog(logId, {
            status: 'sent',
            durationMs: Date.now() - startTime,
            metadata: { resendId: data.id }
        });

        return res.status(200).json({
            success: true,
            message: 'Email sent successfully',
            emailId: data.id,
            data: data
        });

    } catch (error) {
        // ═══════════════════════════════════════════════════════════════
        // LOGGING (Error)
        // ═══════════════════════════════════════════════════════════════
        if (logId) {
            updateEmailLog(logId, {
                status: 'failed',
                durationMs: Date.now() - startTime,
                error: error.message
            });
        }
        
        console.error('Send Email Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
