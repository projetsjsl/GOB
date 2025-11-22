// ═══════════════════════════════════════════════════════════════
// PREVIEW MANAGER - Gestion des previews (Web, SMS, Email)
// ═══════════════════════════════════════════════════════════════

import { fetchFormattedPreview } from './api-client.js';

let previewDebounceTimer = null;
let lastPreviewRequest = '';

/**
 * Convertir markdown en HTML
 */
function markdownToHtml(text) {
    if (!text) return '';

    let html = text
        // Emoji section headers (📊 SECTION, 🎯 OBJECTIF, etc.)
        .replace(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}])\s*(\d+\.?\s*)?([A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ\s]+)(\s*[:：])?$/gmu,
            '<span class="section-header">$1 $2$3</span>')
        // Emoji line headers (📈 Something:)
        .replace(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}])\s+(.+)$/gmu, '<span class="emoji-header">$1 $2</span>')
        // Markdown headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // Bold with **
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Warning lines (⚠️, 🚨)
        .replace(/^(⚠️|🚨)(.*)$/gm, '<div class="warning">$1$2</div>')
        // Example blocks
        .replace(/^EXEMPLE[S]?[\s:：]*(.*)/gim, '<div class="example">📋 $1</div>')
        // Numbered lists
        .replace(/^(\d+)\.\s+(.*)$/gm, '<li><strong>$1.</strong> $2</li>')
        // Bullet points
        .replace(/^[•\-✓✅]\s+(.*)$/gm, '<li>$1</li>')
        // Italic
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // Double line breaks = paragraph
        .replace(/\n\n+/g, '</p><p>')
        // Single line break
        .replace(/\n/g, '<br>');

    // Wrap lists in <ul>
    html = html.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');

    return `<p>${html}</p>`;
}

/**
 * Format JSON preview (briefings, configs)
 */
function formatJsonPreview(json) {
    let html = '<div class="preview-content">';

    // Header avec nom
    if (json.name) {
        html += `<h2 style="margin-top:0">📋 ${json.name}</h2>`;
    }

    // Metadata
    const meta = [];
    if (json.schedule) meta.push(`🕐 ${json.schedule}`);
    if (json.tone) meta.push(`🎭 ${json.tone}`);
    if (json.length) meta.push(`📏 ${json.length}`);
    if (meta.length) {
        html += `<p style="color:#6b7280;font-size:0.85rem">${meta.join(' • ')}</p>`;
    }

    // Prompt principal
    if (json.prompt) {
        html += `<div style="margin:1rem 0;padding:1rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">`;
        html += `<strong style="color:#4f46e5">📝 Prompt:</strong>`;
        html += `<div style="margin-top:0.5rem">${markdownToHtml(json.prompt)}</div>`;
        html += `</div>`;
    }

    // Tools
    if (json.tools_priority && json.tools_priority.length) {
        html += `<p><strong>🔧 Outils:</strong> <span style="font-size:0.85rem;color:#6b7280">${json.tools_priority.join(', ')}</span></p>`;
    }

    // Structure
    if (json.structure?.sections) {
        html += `<p><strong>📊 Sections:</strong></p><ul>`;
        json.structure.sections.forEach(s => {
            html += `<li>${s.replace(/_/g, ' ')}</li>`;
        });
        html += `</ul>`;
    }

    // Email config
    if (json.email_config) {
        html += `<div style="margin-top:1rem;padding:0.75rem;background:#eff6ff;border-radius:6px">`;
        html += `<strong>📧 Email:</strong> ${json.email_config.subject_template || ''}`;
        if (json.email_config.preview_text) {
            html += `<br><span style="font-size:0.8rem;color:#6b7280">${json.email_config.preview_text}</span>`;
        }
        html += `</div>`;
    }

    html += '</div>';
    return html;
}

/**
 * Format Web preview
 */
function formatWebPreview(text) {
    if (!text) return '';

    // Détecter si c'est du JSON
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
            const json = JSON.parse(trimmed);
            return formatJsonPreview(json);
        } catch (e) {
            // Pas du JSON valide, continuer avec markdown
        }
    }

    return `<div class="preview-content">${markdownToHtml(text)}</div>`;
}

/**
 * Wrapper SMS avec template visuel
 */
function wrapSmsPreview(data) {
    const isLong = data.smsCount > 5;
    return `
        <div style="background:#1a1a1a;color:white;border-radius:20px;padding:16px;max-width:340px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #333;">
                <span style="font-size:28px;">👩🏻</span>
                <div>
                    <p style="margin:0;font-weight:600;">Emma IA</p>
                    <p style="margin:0;font-size:11px;color:#888;">+1 438-544-EMMA</p>
                </div>
            </div>
            <div style="white-space:pre-wrap;line-height:1.5;max-height:400px;overflow-y:auto;">${data.text}</div>
            <div style="margin-top:12px;padding-top:10px;border-top:1px solid #333;font-size:11px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                <span style="color:#888;">${data.chars} chars</span>
                <span style="color:${isLong ? '#fbbf24' : '#10b981'};">${data.smsCount} segments</span>
                <span style="color:#888;">${data.estimatedCost || ''}</span>
            </div>
            ${isLong ? '<p style="color:#fbbf24;font-size:11px;margin-top:8px;">💡 Conseil: Réduire le contenu pour moins de segments</p>' : ''}
        </div>
    `;
}

/**
 * Extrait le design personnalisé depuis les champs du formulaire
 */
function getCurrentPromptDesign() {
    return {
        colors: {
            primary: document.getElementById('designColorPrimary')?.value || '#6366f1',
            primaryDark: document.getElementById('designColorPrimaryDark')?.value || '#4f46e5',
            primaryLight: document.getElementById('designColorPrimaryLight')?.value || '#8b5cf6',
            textDark: document.getElementById('designColorTextDark')?.value || '#1f2937',
            textMuted: document.getElementById('designColorTextMuted')?.value || '#6b7280',
            background: document.getElementById('designColorBackground')?.value || '#f9fafb',
            border: document.getElementById('designColorBorder')?.value || '#e5e7eb',
            link: document.getElementById('designColorLink')?.value || '#3b82f6',
            button: document.getElementById('designColorButton')?.value || '#6366f1',
            success: document.getElementById('designColorSuccess')?.value || '#10b981',
            warning: document.getElementById('designColorWarning')?.value || '#f59e0b'
        },
        branding: {
            companyName: document.getElementById('designBrandingCompanyName')?.value || 'GOB Apps',
            tagline: document.getElementById('designBrandingTagline')?.value || 'Emma IA - Votre assistante financière',
            avatar: {
                url: document.getElementById('designBrandingAvatarUrl')?.value || '',
                alt: 'Emma IA',
                size: 64
            },
            logo: {
                url: document.getElementById('designBrandingLogoUrl')?.value || '',
                alt: 'GOB Apps',
                width: 120
            }
        },
        header: {
            showAvatar: document.getElementById('designHeaderShowAvatar')?.checked ?? true,
            showDate: document.getElementById('designHeaderShowDate')?.checked ?? true,
            showEdition: document.getElementById('designHeaderShowEdition')?.checked ?? true,
            emoji: document.getElementById('designEmojiHeader')?.value || '📊'
        },
        footer: {
            showLogo: document.getElementById('designFooterShowLogo')?.checked ?? false,
            showDisclaimer: document.getElementById('designFooterShowDisclaimer')?.checked ?? true,
            disclaimerText: 'Les informations fournies sont à titre indicatif et ne constituent pas des conseils financiers.',
            copyrightText: document.getElementById('designFooterCopyright')?.value || '© 2025 GOB Apps - Tous droits réservés'
        },
        sms: {
            maxSegments: parseInt(document.getElementById('designSmsMaxSegments')?.value) || 10,
            signature: document.getElementById('designSmsSignature')?.value || '- Emma IA',
            alertThreshold: parseInt(document.getElementById('designSmsAlertThreshold')?.value) || 5
        },
        typography: {
            fontFamily: document.getElementById('designTypoFontFamily')?.value || 'system-ui, -apple-system, sans-serif',
            fontSize: parseInt(document.getElementById('designTypoFontSize')?.value) || 16,
            lineHeight: parseFloat(document.getElementById('designTypoLineHeight')?.value) || 1.6
        },
        layout: {
            borderRadius: parseInt(document.getElementById('designLayoutBorderRadius')?.value) || 12,
            containerWidth: parseInt(document.getElementById('designLayoutContainerWidth')?.value) || 600,
            padding: document.getElementById('designLayoutPadding')?.value || 'normal',
            shadow: document.getElementById('designLayoutShadow')?.value || 'medium'
        },
        sections: {
            showCallout: document.getElementById('designSectionsShowCallout')?.checked ?? false,
            showSidebar: document.getElementById('designSectionsShowSidebar')?.checked ?? false,
            showBadges: document.getElementById('designSectionsShowBadges')?.checked ?? true,
            showDividers: document.getElementById('designSectionsShowDividers')?.checked ?? true,
            callout: {
                backgroundColor: document.getElementById('designSectionsCalloutBg')?.value || '#dbeafe',
                borderColor: document.getElementById('designSectionsCalloutBorder')?.value || '#3b82f6'
            }
        },
        emojis: {
            header: document.getElementById('designEmojiHeader')?.value || '📊',
            success: document.getElementById('designEmojiSuccess')?.value || '✅',
            alert: document.getElementById('designEmojiAlert')?.value || '⚠️'
        }
    };
}

/**
 * Met à jour le preview (fonction principale)
 */
export async function updatePreview() {
    const text = document.getElementById('editValue').value;
    const mode = document.getElementById('previewMode').value;
    const previewArea = document.getElementById('previewArea');
    const modeLabel = document.getElementById('previewModeLabel');
    const charCount = document.getElementById('charCount');
    const wordCount = document.getElementById('wordCount');
    const lineCount = document.getElementById('lineCount');

    // Stats
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split('\n').length;

    charCount.textContent = `${chars} chars`;
    wordCount.textContent = words;
    lineCount.textContent = lines;

    // Mode label
    const labels = { web: '(Web)', sms: '(SMS 🔄)', email: '(Email 🔄)' };
    modeLabel.textContent = labels[mode] || '(Web)';

    // Render preview
    if (!text.trim()) {
        previewArea.innerHTML = '<p class="text-gray-400 italic">Le preview s\'affiche ici en temps réel...</p>';
        return;
    }

    // Debounce pour appel API
    clearTimeout(previewDebounceTimer);
    const requestKey = `${mode}:${text.substring(0, 100)}`;

    if (requestKey === lastPreviewRequest) return;

    previewArea.innerHTML = '<p class="text-gray-400 italic">⏳ Chargement preview via API...</p>';

    previewDebounceTimer = setTimeout(async () => {
        lastPreviewRequest = requestKey;

        // Extraire le texte du prompt si c'est du JSON
        let contentToFormat = text;
        try {
            const json = JSON.parse(text);
            if (json.prompt) contentToFormat = json.prompt;
        } catch (e) {}

        // Détecter le type de briefing
        let briefingType = 'morning';
        if (text.includes('midday') || text.includes('Mi-Journée')) briefingType = 'midday';
        if (text.includes('evening') || text.includes('Soir')) briefingType = 'evening';

        // Extraire le design actuel
        const customDesign = getCurrentPromptDesign();

        const result = await fetchFormattedPreview(contentToFormat, mode, briefingType, customDesign);

        if (result && result.success) {
            if (mode === 'sms') {
                previewArea.innerHTML = wrapSmsPreview(result);
            } else if (mode === 'web') {
                // Mode Web: afficher le texte formaté
                previewArea.innerHTML = `<div class="preview-content" style="padding:12px;background:#f9fafb;border-radius:8px;line-height:1.6;">${result.text || result.html || markdownToHtml(contentToFormat)}</div>`;
            } else {
                // Mode Email: afficher le HTML complet
                previewArea.innerHTML = result.html;
            }
            modeLabel.textContent = labels[mode].replace('🔄', '✅');
        } else {
            // Fallback local si API fail
            previewArea.innerHTML = `<div class="preview-content">${markdownToHtml(contentToFormat)}</div>`;
            modeLabel.textContent = labels[mode].replace('🔄', '⚠️');
        }
    }, 500);
}

/**
 * Met à jour les badges de canaux selon le contenu
 */
export function updateChannelBadges(configKey) {
    const badges = document.getElementById('channelBadges');
    if (!configKey) return;

    // Détecter les canaux depuis le nom de la config ou son contenu
    const key = configKey.toLowerCase();
    const text = document.getElementById('editValue').value.toLowerCase();

    let channels = [];

    // Détection par annotation @channels dans le prompt
    const channelMatch = text.match(/@channels?:\s*([a-z,\s]+)/i);
    if (channelMatch) {
        channels = channelMatch[1].split(',').map(c => c.trim());
    } else {
        // Détection par défaut
        if (key.includes('sms') || text.includes('format sms')) channels.push('sms');
        if (key.includes('email') || text.includes('format email')) channels.push('email');
        if (key.includes('web') || text.includes('format web')) channels.push('web');

        // Si aucun canal spécifique, tous les canaux
        if (channels.length === 0) channels = ['web', 'sms', 'email'];
    }

    // Render badges
    const badgeHtml = channels.map(ch => {
        const styles = {
            web: 'bg-blue-100 text-blue-700',
            sms: 'bg-green-100 text-green-700',
            email: 'bg-purple-100 text-purple-700'
        };
        const icons = { web: '💻', sms: '📱', email: '📧' };
        return `<span class="px-2 py-0.5 text-xs rounded ${styles[ch] || 'bg-gray-100'}">${icons[ch] || ''} ${ch.toUpperCase()}</span>`;
    }).join('');

    badges.innerHTML = badgeHtml;
}

/**
 * Met à jour le nombre de caractères
 */
export function updateCharCount() {
    const text = document.getElementById('editValue').value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split('\n').length;

    document.getElementById('charCount').textContent = `${chars} chars`;
    document.getElementById('wordCount').textContent = words;
    document.getElementById('lineCount').textContent = lines;
}
