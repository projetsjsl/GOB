/**
 * API Endpoint pour générer les emails Emma En Direct
 */

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { type } = req.query;
        
        if (!type) {
            return res.status(400).json({ 
                error: 'Missing type parameter. Must be: "matin"/"morning", "midi"/"midday", or "soir"/"evening"' 
            });
        }
        
        // ═══════════════════════════════════════════════════════════
        // CONVERSION FRANÇAIS → ANGLAIS (pour compatibilité)
        // ═══════════════════════════════════════════════════════════
        const typeMapping = {
          // Français → Anglais
          'matin': 'morning',
          'midi': 'midday',
          'soir': 'evening',
          // Anglais (compatibilité)
          'morning': 'morning',
          'midday': 'midday',
          'evening': 'evening',
          'noon': 'midday' // Ancien format
        };
        
        const normalizedType = typeMapping[type.toLowerCase()];
        
        if (!normalizedType) {
            return res.status(400).json({ 
                error: `Invalid briefing type: "${type}". Must be: "matin"/"morning", "midi"/"midday", or "soir"/"evening"` 
            });
        }

        console.log(`📧 Generating ${normalizedType} briefing (${type})...`);

        // 1. Charger la configuration du prompt
        const promptConfig = await loadPromptConfig(normalizedType);
        
        // 2. Préparer le contexte pour Emma
        const context = {
            briefing_type: normalizedType,
            current_time: new Date().toISOString(),
            montreal_time: new Date().toLocaleString('fr-CA', { 
                timeZone: 'America/Montreal',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            date: new Date().toLocaleDateString('fr-CA'),
            tools_priority: promptConfig.tools_priority
        };

        // 3. Appeler Emma Agent pour générer le contenu
        const emmaResponse = await callEmmaAgent(promptConfig.prompt, context);
        
        if (!emmaResponse.success) {
            throw new Error(`Emma Agent failed: ${emmaResponse.error}`);
        }

        // 4. Générer le HTML de l'email
        const emailHtml = generateEmailHtml(emmaResponse.response, promptConfig, context);

        // 5. Enregistrer dans l'historique
        await saveBriefingHistory(type, emailHtml, emmaResponse);

        return res.status(200).json({
            success: true,
            type: type,
            content: emailHtml,
            metadata: {
                generated_at: context.current_time,
                montreal_time: context.montreal_time,
                tools_used: emmaResponse.tools_used,
                execution_time_ms: emmaResponse.execution_time_ms,
                is_reliable: emmaResponse.is_reliable
            }
        });

    } catch (error) {
        console.error('❌ Emma Briefing API Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            type: req.query.type || 'unknown'
        });
    }
}

async function loadPromptConfig(type) {
    try {
        const configPath = path.join(process.cwd(), 'config', 'briefing-prompts.json');
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        if (!configData[type]) {
            throw new Error(`No prompt configuration found for type: ${type}`);
        }
        
        return configData[type];
    } catch (error) {
        console.error('❌ Failed to load prompt config:', error);
        throw new Error('Failed to load briefing configuration');
    }
}

async function callEmmaAgent(prompt, context) {
    try {
        const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/emma-agent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: prompt,
                context: context
            })
        });

        if (!response.ok) {
            throw new Error(`Emma Agent API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('❌ Emma Agent call failed:', error);
        throw new Error('Failed to generate briefing content');
    }
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * BONNES PRATIQUES HTML EMAIL (compatibilité Outlook, Gmail, Apple Mail)
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * ✅ UTILISER:
 * - Tables avec role="presentation" pour le layout
 * - Attributs: cellpadding="0" cellspacing="0" border="0"
 * - Styles 100% inline (pas de <style> dans <head>)
 * - Couleurs hexadécimales complètes (#FFFFFF, pas #FFF)
 * - Font stack: Arial, Helvetica, sans-serif
 * - Width explicites sur tables (max 600px)
 * - Padding au lieu de margin
 * 
 * ❌ NE PAS UTILISER:
 * - <div> pour structure principale
 * - Flexbox, Grid, CSS moderne
 * - linear-gradient, box-shadow
 * - border-radius > 4px (Outlook l'ignore)
 * - Classes CSS ou <style> block
 * - margin (utiliser padding)
 * ════════════════════════════════════════════════════════════════════════════
 */
function generateEmailHtml(content, promptConfig, context) {
    const subject = promptConfig.email_config.subject_template.replace('{date}', context.date);
    const formattedContent = formatContentForHtml(content);
    const disclaimerText = promptConfig.config?.disclaimer_text || 'Les informations fournies sont à des fins éducatives uniquement et ne constituent pas des conseils financiers personnalisés.';
    
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 20px 0;">
                
                <!-- CONTENEUR PRINCIPAL - max 600px -->
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff;">
                    
                    <!-- HEADER -->
                    <tr>
                        <td style="text-align: center; border-bottom: 2px solid #007bff; padding: 20px 30px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-size: 24px; font-weight: bold; color: #007bff; font-family: Arial, Helvetica, sans-serif; text-align: center;">
                                        Emma En Direct
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height: 5px; line-height: 5px;">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 14px; color: #666666; font-family: Arial, Helvetica, sans-serif; text-align: center;">
                                        ${context.montreal_time} - ${promptConfig.name}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- CONTENT -->
                    <tr>
                        <td style="padding: 30px; font-size: 16px; line-height: 1.8; color: #333333; font-family: Arial, Helvetica, sans-serif;">
                            ${formattedContent}
                        </td>
                    </tr>
                    
                    <!-- FOOTER -->
                    <tr>
                        <td style="padding: 20px 30px; border-top: 1px solid #dee2e6;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <!-- Signature -->
                                <tr>
                                    <td style="font-size: 14px; font-style: italic; color: #007bff; font-family: Arial, Helvetica, sans-serif; text-align: center; padding-bottom: 15px;">
                                        — Emma, votre assistante financière intelligente
                                    </td>
                                </tr>
                                <!-- Disclaimer -->
                                <tr>
                                    <td style="font-size: 10px; color: #999999; font-family: Arial, Helvetica, sans-serif; text-align: center; background-color: #f8f9fa; padding: 10px;">
                                        ${disclaimerText}
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

function formatContentForHtml(content) {
    // Conversion basique du markdown vers HTML
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}

async function saveBriefingHistory(type, content, emmaResponse) {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.warn('⚠️ Supabase not configured, skipping history save');
            return;
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/briefings_history`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: type,
                content: content,
                sent_status: 'pending',
                tools_used: emmaResponse.tools_used,
                execution_time_ms: emmaResponse.execution_time_ms
            })
        });

        if (!response.ok) {
            console.error('❌ Failed to save briefing history:', response.status);
        } else {
            console.log('✅ Briefing history saved successfully');
        }
    } catch (error) {
        console.error('❌ Error saving briefing history:', error);
    }
}
