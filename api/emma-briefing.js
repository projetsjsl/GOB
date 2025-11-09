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

function generateEmailHtml(content, promptConfig, context) {
    const subject = promptConfig.email_config.subject_template.replace('{date}', context.date);
    
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 24px;
        }
        .header .subtitle {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
        .content {
            font-size: 16px;
            line-height: 1.8;
        }
        .content h2 {
            color: #007bff;
            font-size: 18px;
            margin-top: 25px;
            margin-bottom: 10px;
        }
        .content h3 {
            color: #495057;
            font-size: 16px;
            margin-top: 20px;
            margin-bottom: 8px;
        }
        .highlight {
            background-color: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #007bff;
            margin: 15px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .signature {
            margin-top: 20px;
            font-style: italic;
            color: #007bff;
        }
        .disclaimer {
            font-size: 10px;
            color: #999;
            margin-top: 20px;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Emma En Direct</h1>
            <div class="subtitle">${context.montreal_time} - ${promptConfig.name}</div>
        </div>
        
        <div class="content">
            ${formatContentForHtml(content)}
        </div>
        
        <div class="footer">
            <div class="signature">
                — Emma, votre assistante financière intelligente
            </div>
            <div class="disclaimer">
                ${promptConfig.config?.disclaimer_text || 'Les informations fournies sont à des fins éducatives uniquement et ne constituent pas des conseils financiers personnalisés.'}
            </div>
        </div>
    </div>
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
