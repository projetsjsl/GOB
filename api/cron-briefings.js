/**
 * API Endpoint: Cron Briefings Automatises
 *
 * Genere et envoie automatiquement les briefings Emma selon le schedule:
 * - 7h20: Briefing Matin (Asie - Futures - Preouverture)
 * - 11h50: Briefing Midi (Wall Street - Cloture Europe)
 * - 16h20: Briefing Soir (Cloture US - Asie Next)
 *
 * @route GET /api/cron-briefings
 */

export default async function handler(req, res) {
    try {
        //  Verification du secret CRON (securite Vercel)
        const authHeader = req.headers.authorization;
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            return res.status(500).json({
                error: 'CRON_SECRET not configured'
            });
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            return res.status(401).json({
                error: 'Unauthorized - Invalid cron secret'
            });
        }

        //  Determiner le type de briefing selon l'heure
        const now = new Date();
        const hour = now.getUTCHours(); // UTC time
        // Timezone ET = UTC-5 (hiver) ou UTC-4 (ete)
        // 7h20 ET = 12h20 UTC (hiver) ou 11h20 UTC (ete)
        // 11h50 ET = 16h50 UTC (hiver) ou 15h50 UTC (ete)
        // 16h20 ET = 21h20 UTC (hiver) ou 20h20 UTC (ete)

        let briefingType = 'morning';
        let subject = ' Briefing Matin - Emma Financial';

        // Detection basee sur l'heure locale du serveur
        const localHour = now.getHours();

        if (localHour >= 7 && localHour < 11) {
            briefingType = 'morning';
            subject = ' Briefing Matin - Emma Financial';
        } else if (localHour >= 11 && localHour < 16) {
            briefingType = 'noon';
            subject = ' Briefing Midi - Emma Financial';
        } else if (localHour >= 16 && localHour < 22) {
            briefingType = 'evening';
            subject = ' Briefing Soir - Emma Financial';
        }

        console.log(`[CRON] Generating ${briefingType} briefing at ${now.toISOString()}`);

        //  Appeler Emma Agent pour generer le briefing
        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';

        // ETAPE 1: Intent Analysis
        const intentResponse = await fetch(`${baseUrl}/api/emma-agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Genere un briefing ${briefingType} pour aujourd'hui`,
                mode: 'chat'
            })
        });

        if (!intentResponse.ok) {
            throw new Error(`Intent analysis failed: ${intentResponse.status}`);
        }

        const intentData = await intentResponse.json();

        // ETAPE 2: Gather Smart Data
        const dataResponse = await fetch(`${baseUrl}/api/emma-agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Collecte les donnees pour briefing ${briefingType}`,
                mode: 'data',
                context: {
                    intent: intentData.intent || 'market_briefing',
                    tickers: intentData.key_tickers || ['SPY', 'QQQ', 'DIA'],
                    importance_level: intentData.importance_level || 5
                }
            })
        });

        if (!dataResponse.ok) {
            throw new Error(`Data gathering failed: ${dataResponse.status}`);
        }

        const toolsData = await dataResponse.json();

        // ETAPE 3: Generate Briefing avec MODE BRIEFING
        const briefingResponse = await fetch(`${baseUrl}/api/emma-agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Genere un briefing ${briefingType} detaille avec analyses multi-medias`,
                mode: 'briefing',
                context: {
                    briefingType: briefingType,
                    intent: intentData.intent,
                    importance_level: intentData.importance_level,
                    trending_topics: intentData.trending_topics,
                    key_tickers: intentData.key_tickers
                },
                toolsData: toolsData.data
            })
        });

        if (!briefingResponse.ok) {
            throw new Error(`Briefing generation failed: ${briefingResponse.status}`);
        }

        const briefingData = await briefingResponse.json();
        const markdownContent = briefingData.response || briefingData.analysis;

        // ETAPE 4: Enrichir avec visuels (simule cote serveur)
        // Note: La fonction enrichBriefingWithVisuals() est cote client
        // On va envoyer le markdown brut et laisser l'email client le renderer

        // ETAPE 5: Creer le HTML du briefing
        const htmlContent = createBriefingHTML(markdownContent, briefingType, toolsData.data);

        //  Envoyer l'email via Resend
        const emailResponse = await fetch(`${baseUrl}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject: subject,
                html: htmlContent,
                briefingType: `cron-${briefingType}`
            })
        });

        if (!emailResponse.ok) {
            const emailError = await emailResponse.json();
            throw new Error(`Email sending failed: ${JSON.stringify(emailError)}`);
        }

        const emailResult = await emailResponse.json();

        //  Succes
        return res.status(200).json({
            success: true,
            message: `${briefingType} briefing generated and sent successfully`,
            briefingType: briefingType,
            timestamp: now.toISOString(),
            emailId: emailResult.emailId,
            data: {
                intent: intentData.intent,
                tickers: intentData.key_tickers,
                importance: intentData.importance_level
            }
        });

    } catch (error) {
        console.error('[CRON] Briefing Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate or send briefing',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Cree le HTML du briefing pour l'email
 * 
 * 
 * BONNES PRATIQUES HTML EMAIL (compatibilite Outlook, Gmail, Apple Mail)
 * 
 * 
 *  UTILISER:
 * - Tables avec role="presentation" pour le layout
 * - Attributs: cellpadding="0" cellspacing="0" border="0"
 * - Styles 100% inline (pas de <style> dans <head>)
 * - Couleurs hexadecimales completes (#FFFFFF, pas #FFF)
 * - Font stack: Arial, Helvetica, sans-serif
 * - Width explicites sur tables (max 600px)
 * - Padding au lieu de margin
 * 
 *  NE PAS UTILISER:
 * - <div> pour structure principale
 * - Flexbox, Grid, CSS moderne
 * - linear-gradient, box-shadow
 * - border-radius > 4px (Outlook l'ignore)
 * - Classes CSS ou <style> block
 * - margin (utiliser padding)
 * 
 */
function createBriefingHTML(markdownContent, briefingType, data) {
    const typeEmojis = {
        morning: '',
        noon: '',
        evening: ''
    };

    const typeTitles = {
        morning: 'Briefing Matin',
        noon: 'Briefing Midi',
        evening: 'Briefing Soir'
    };

    const typeSubtitles = {
        morning: 'Asie - Futures - Preouverture',
        noon: 'Wall Street - Cloture Europe',
        evening: 'Cloture US - Asie Next'
    };

    const emoji = typeEmojis[briefingType] || '';
    const title = typeTitles[briefingType] || 'Briefing Financier';
    const subtitle = typeSubtitles[briefingType] || 'Analyse de marche';

    // Convertir Markdown en HTML simplifie avec styles inline
    let htmlBody = markdownContent
        .replace(/^### (.+)$/gm, '<tr><td style="color: #1e40af; font-size: 16px; font-weight: bold; padding: 20px 0 8px 0; font-family: Arial, Helvetica, sans-serif;">$1</td></tr>')
        .replace(/^## (.+)$/gm, '<tr><td style="color: #1e3a8a; font-size: 18px; font-weight: bold; padding: 24px 0 10px 0; font-family: Arial, Helvetica, sans-serif;">$1</td></tr>')
        .replace(/^# (.+)$/gm, '<tr><td style="color: #1e3a8a; font-size: 22px; font-weight: bold; padding: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif;">$1</td></tr>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</td></tr><tr><td style="padding: 8px 0; font-size: 14px; line-height: 1.6; color: #333333; font-family: Arial, Helvetica, sans-serif;">')
        .replace(/\n/g, '<br>');

    // Wrapper le contenu dans une structure table
    htmlBody = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding: 8px 0; font-size: 14px; line-height: 1.6; color: #333333; font-family: Arial, Helvetica, sans-serif;">${htmlBody}</td></tr>
    </table>`;

    const dateStr = new Date().toLocaleDateString('fr-CA');
    const timeStr = new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });

    // Template HTML complet - TABLE-BASED pour compatibilite Outlook
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Emma Financial</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 20px 0;">
                
                <!-- CONTENEUR PRINCIPAL - max 600px -->
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff;">
                    
                    <!-- HEADER - couleur solide (pas de gradient pour Outlook) -->
                    <tr>
                        <td style="background-color: #1e3a8a; color: #ffffff; padding: 32px; text-align: center;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-size: 48px; text-align: center; padding-bottom: 12px;">${emoji}</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 28px; font-weight: bold; text-align: center; color: #ffffff; font-family: Arial, Helvetica, sans-serif; padding-bottom: 8px;">${title}</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 14px; text-align: center; color: #ffffff; opacity: 0.9; font-family: Arial, Helvetica, sans-serif;">${subtitle}</td>
                                </tr>
                                <tr>
                                    <td style="height: 16px; line-height: 16px;">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="border-top: 1px solid rgba(255,255,255,0.3); padding-top: 16px; font-size: 12px; text-align: center; color: #ffffff; opacity: 0.8; font-family: Arial, Helvetica, sans-serif;">
                                         Genere par Emma Agent &bull; ${dateStr} ${timeStr}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- CONTENT -->
                    <tr>
                        <td style="padding: 32px;">
                            ${htmlBody}
                        </td>
                    </tr>
                    
                    <!-- FOOTER -->
                    <tr>
                        <td style="padding: 24px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-size: 12px; color: #6b7280; text-align: center; font-family: Arial, Helvetica, sans-serif; padding-bottom: 8px;">
                                         Genere automatiquement par <strong>Emma Agent</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-size: 12px; color: #9ca3af; text-align: center; font-family: Arial, Helvetica, sans-serif;">
                                        GOB Apps &bull; Intelligence Financiere
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
</body>
</html>`;
}

