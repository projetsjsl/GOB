/**
 * API Endpoint: Cron Briefings Automatisés
 *
 * Génère et envoie automatiquement les briefings Emma selon le schedule:
 * - 7h20: Briefing Matin (Asie • Futures • Préouverture)
 * - 11h50: Briefing Midi (Wall Street • Clôture Europe)
 * - 16h20: Briefing Soir (Clôture US • Asie Next)
 *
 * @route GET /api/cron-briefings
 */

export default async function handler(req, res) {
    try {
        // 🔐 Vérification du secret CRON (sécurité Vercel)
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

        // 🕐 Déterminer le type de briefing selon l'heure
        const now = new Date();
        const hour = now.getUTCHours(); // UTC time
        // Timezone ET = UTC-5 (hiver) ou UTC-4 (été)
        // 7h20 ET = 12h20 UTC (hiver) ou 11h20 UTC (été)
        // 11h50 ET = 16h50 UTC (hiver) ou 15h50 UTC (été)
        // 16h20 ET = 21h20 UTC (hiver) ou 20h20 UTC (été)

        let briefingType = 'morning';
        let subject = '🌅 Briefing Matin - Emma Financial';

        // Détection basée sur l'heure locale du serveur
        const localHour = now.getHours();

        if (localHour >= 7 && localHour < 11) {
            briefingType = 'morning';
            subject = '🌅 Briefing Matin - Emma Financial';
        } else if (localHour >= 11 && localHour < 16) {
            briefingType = 'noon';
            subject = '☀️ Briefing Midi - Emma Financial';
        } else if (localHour >= 16 && localHour < 22) {
            briefingType = 'evening';
            subject = '🌆 Briefing Soir - Emma Financial';
        }

        console.log(`[CRON] Generating ${briefingType} briefing at ${now.toISOString()}`);

        // 🤖 Appeler Emma Agent pour générer le briefing
        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';

        // ÉTAPE 1: Intent Analysis
        const intentResponse = await fetch(`${baseUrl}/api/emma-agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Génère un briefing ${briefingType} pour aujourd'hui`,
                mode: 'chat'
            })
        });

        if (!intentResponse.ok) {
            throw new Error(`Intent analysis failed: ${intentResponse.status}`);
        }

        const intentData = await intentResponse.json();

        // ÉTAPE 2: Gather Smart Data
        const dataResponse = await fetch(`${baseUrl}/api/emma-agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Collecte les données pour briefing ${briefingType}`,
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

        // ÉTAPE 3: Generate Briefing avec MODE BRIEFING
        const briefingResponse = await fetch(`${baseUrl}/api/emma-agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Génère un briefing ${briefingType} détaillé avec analyses multi-médias`,
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

        // ÉTAPE 4: Enrichir avec visuels (simulé côté serveur)
        // Note: La fonction enrichBriefingWithVisuals() est côté client
        // On va envoyer le markdown brut et laisser l'email client le renderer

        // ÉTAPE 5: Créer le HTML du briefing
        const htmlContent = createBriefingHTML(markdownContent, briefingType, toolsData.data);

        // 📧 Envoyer l'email via Resend
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

        // ✅ Succès
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
 * Crée le HTML du briefing pour l'email
 */
function createBriefingHTML(markdownContent, briefingType, data) {
    const typeEmojis = {
        morning: '🌅',
        noon: '☀️',
        evening: '🌆'
    };

    const typeTitles = {
        morning: 'Briefing Matin',
        noon: 'Briefing Midi',
        evening: 'Briefing Soir'
    };

    const typeSubtitles = {
        morning: 'Asie • Futures • Préouverture',
        noon: 'Wall Street • Clôture Europe',
        evening: 'Clôture US • Asie Next'
    };

    const emoji = typeEmojis[briefingType] || '📊';
    const title = typeTitles[briefingType] || 'Briefing Financier';
    const subtitle = typeSubtitles[briefingType] || 'Analyse de marché';

    // Convertir Markdown en HTML simplifié
    let htmlBody = markdownContent
        .replace(/^### (.+)$/gm, '<h3 style="color: #1e40af; margin-top: 24px;">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 style="color: #1e3a8a; margin-top: 28px;">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 style="color: #1e3a8a;">$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p style="margin: 12px 0; line-height: 1.6;">')
        .replace(/\n/g, '<br>');

    // Wrapper de paragraphe
    htmlBody = `<p style="margin: 12px 0; line-height: 1.6;">${htmlBody}</p>`;

    // Template HTML complet
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Emma Financial</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
    <div style="max-width: 680px; margin: 0 auto; padding: 20px;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 32px; border-radius: 12px; margin-bottom: 24px;">
            <div style="font-size: 48px; margin-bottom: 12px;">${emoji}</div>
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">${title}</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 14px;">${subtitle}</p>
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 12px; opacity: 0.8;">
                📡 Généré par Emma Agent • ${new Date().toLocaleDateString('fr-CA')} ${new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
            </div>
        </div>

        <!-- Content -->
        <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
            ${htmlBody}
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 12px;">
            <p style="margin: 0 0 8px 0;">🤖 Généré automatiquement par <strong>Emma Agent</strong></p>
            <p style="margin: 0; opacity: 0.7;">GOB Apps • Intelligence Financière</p>
        </div>

    </div>
</body>
</html>
    `.trim();
}
