/**
 * Script pour mettre à jour le workflow n8n avec les couleurs centralisées
 * 
 * Récupère les couleurs depuis l'API /api/theme-colors et met à jour
 * le nœud "Generate HTML Newsletter" pour utiliser ces couleurs.
 */

import { readFileSync, writeFileSync } from 'fs';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger la config des couleurs
async function loadThemeConfig() {
  try {
    const configPath = join(__dirname, 'config', 'theme-colors.json');
    const configContent = await readFile(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('❌ Erreur chargement config couleurs:', error);
    throw error;
  }
}

// Générer le code JavaScript avec les couleurs centralisées
async function generateEmailTemplateCode() {
  const theme = await loadThemeConfig();
  const colors = theme.colors;
  const gradients = theme.gradients;
  const emailConfig = theme.email;
  
  return `const items = $input.all();
const data = items[0].json;

// ============================================
// COULEURS CENTRALISÉES DU THÈME GOB
// Source: config/theme-colors.json
// ============================================
const theme = {
  colors: {
    primary: '${colors.primary.value}',
    primaryDark: '${colors.primaryDark.value}',
    primaryLight: '${colors.primaryLight.value}',
    success: '${colors.success.value}',
    text: {
      dark: '${colors.text.dark.value}',
      medium: '${colors.text.medium.value}',
      light: '${colors.text.light.value}',
      muted: '${colors.text.muted.value}'
    },
    background: {
      white: '${colors.background.white.value}',
      light: '${colors.background.light.value}',
      medium: '${colors.background.medium.value}',
      dark: '${colors.background.dark.value}'
    },
    border: {
      light: '${colors.border.light.value}',
      medium: '${colors.border.medium.value}'
    }
  },
  gradients: {
    primary: '${gradients.primary.value}',
    primaryAlt: '${gradients.primaryAlt.value}',
    secondary: '${gradients.secondary.value}'
  },
  email: {
    fonts: {
      primary: '${emailConfig.fonts.primary}'
    },
    spacing: {
      containerMaxWidth: '${emailConfig.spacing.containerMaxWidth}',
      padding: {
        small: '${emailConfig.spacing.padding.small}',
        medium: '${emailConfig.spacing.padding.medium}',
        large: '${emailConfig.spacing.padding.large}'
      },
      borderRadius: {
        small: '${emailConfig.spacing.borderRadius.small}',
        medium: '${emailConfig.spacing.borderRadius.medium}',
        large: '${emailConfig.spacing.borderRadius.large}'
      }
    },
    shadows: {
      small: '${emailConfig.shadows.small}',
      medium: '${emailConfig.shadows.medium}',
      large: '${emailConfig.shadows.large}',
      primary: '${emailConfig.shadows.primary}'
    }
  }
};

// Fonction pour convertir markdown en HTML
function markdownToHtml(text) {
  if (!text) return '';
  
  let html = text;
  
  // Convertir les tableaux markdown en HTML
  const tableRegex = /\\|(.+)\\|\\n\\|([-|\\s]+)\\|\\n((?:\\|.+\\|\\n?)+)/g;
  html = html.replace(tableRegex, (match, header, separator, rows) => {
    const headers = header.split('|').map(h => h.trim()).filter(h => h);
    const rowLines = rows.trim().split('\\n').filter(r => r.trim());
    
    let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; background: ' + theme.colors.background.white + ';">';
    
    // En-têtes avec gradient primary
    tableHtml += '<thead><tr style="background: ' + theme.gradients.primary + '; color: white;">';
    headers.forEach(h => {
      tableHtml += \`<th style="padding: 12px; text-align: left; border: 1px solid rgba(255,255,255,0.2); font-weight: 600; letter-spacing: 0.3px;">\${h.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')}</th>\`;
    });
    tableHtml += '</tr></thead><tbody>';
    
    // Lignes avec alternance
    rowLines.forEach((row, idx) => {
      const cells = row.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length > 0 && !cells[0].match(/^[-|\\s]+$/)) {
        const bgColor = idx % 2 === 0 ? theme.colors.background.white : theme.colors.background.light;
        tableHtml += \`<tr style="background: \${bgColor}; transition: background 0.2s;">\`;
        cells.forEach(cell => {
          let cellContent = cell.replace(/\\*\\*(.*?)\\*\\*/g, '<strong style="color: ' + theme.colors.primary + ';">$1</strong>');
          cellContent = cellContent.replace(/\\*(.*?)\\*/g, '<em>$1</em>');
          cellContent = cellContent.replace(/🏆/g, '<span style="color: ' + theme.colors.success + '; font-size: 16px;">🏆</span>');
          tableHtml += \`<td style="padding: 10px; border: 1px solid \${theme.colors.border.light}; color: \${theme.colors.text.dark};">\${cellContent}</td>\`;
        });
        tableHtml += '</tr>';
      }
    });
    
    tableHtml += '</tbody></table>';
    return tableHtml;
  });
  
  // Convertir **gras** avec couleur primary
  html = html.replace(/\\*\\*(.*?)\\*\\*/g, '<strong style="color: ' + theme.colors.primary + '; font-weight: 700;">$1</strong>');
  
  // Convertir *italique*
  html = html.replace(/\\*(?!\\*)(.*?)\\*(?!\\*)/g, '<em style="color: ' + theme.colors.text.medium + ';">$1</em>');
  
  // Convertir les titres
  html = html.replace(/^###\\s+(.+)$/gm, '<h3 style="margin-top: 24px; margin-bottom: 12px; color: ' + theme.colors.primary + '; font-size: 18px; font-weight: 600; border-left: 4px solid ' + theme.colors.primaryLight + '; padding-left: 12px;">$1</h3>');
  html = html.replace(/^##\\s+(.+)$/gm, '<h2 style="margin-top: 28px; margin-bottom: 16px; color: ' + theme.colors.primaryDark + '; font-size: 22px; font-weight: 700; border-bottom: 3px solid ' + theme.colors.primary + '; padding-bottom: 8px;">$1</h2>');
  html = html.replace(/^#\\s+(.+)$/gm, '<h1 style="margin-top: 32px; margin-bottom: 20px; color: ' + theme.colors.primaryDark + '; font-size: 26px; font-weight: 700;">$1</h1>');
  
  // Convertir les listes
  html = html.replace(/^[-•]\\s+(.+)$/gm, '<li style="margin-left: 20px; margin-bottom: 6px; color: ' + theme.colors.text.dark + '; position: relative; padding-left: 8px;"><span style="position: absolute; left: -12px; color: ' + theme.colors.primary + ';">•</span>$1</li>');
  html = html.replace(/(<li.*?<\\/li>\\n?)+/g, '<ul style="margin: 16px 0; padding-left: 20px; list-style: none;">$&</ul>');
  
  // Convertir les séparateurs
  html = html.replace(/^---+$/gm, '<hr style="border: none; border-top: 2px solid ' + theme.colors.primary + '; margin: 24px 0; opacity: 0.3;">');
  
  // Convertir les sauts de ligne
  html = html.replace(/\\n\\n/g, '</p><p style="margin-bottom: 12px; color: ' + theme.colors.text.dark + '; line-height: 1.7;">');
  html = html.replace(/\\n/g, '<br>');
  
  // Encapsuler dans des paragraphes
  if (!html.startsWith('<')) html = '<p style="margin-bottom: 12px; color: ' + theme.colors.text.dark + '; line-height: 1.7;">' + html;
  if (!html.endsWith('>')) html = html + '</p>';
  
  return html;
}

// Map prompt types to French
const promptTypeFrench = {
  'morning': 'MATIN',
  'noon': 'MIDI',
  'evening': 'SOIR',
  'custom': 'PERSONNALISÉE'
};

const editionType = promptTypeFrench[data.prompt_type] || (data.prompt_type ? data.prompt_type.toUpperCase() : 'PERSONNALISÉE');

// Formatage des métadonnées
const now = new Date();
const generationTime = now.toLocaleString('fr-FR', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Montreal'
});

const triggerType = data.trigger_type || 'Manuel';
const emmaModel = data.emma_model || 'perplexity';
const emmaTools = Array.isArray(data.emma_tools) ? data.emma_tools : [];
const emmaExecutionTime = data.emma_execution_time || 0;
const emmaConfidence = data.emma_confidence || null;

// Convertir le contenu markdown en HTML
const formattedContent = markdownToHtml(data.newsletter_content || '');

const html = \\\`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter Financière Emma</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: \${theme.email.fonts.primary}; 
      line-height: 1.7; 
      color: \${theme.colors.text.dark}; 
      background: linear-gradient(135deg, \${theme.colors.background.light} 0%, \${theme.colors.background.dark} 100%);
      padding: \${theme.email.spacing.padding.small};
    }
    .container {
      max-width: \${theme.email.spacing.containerMaxWidth};
      margin: 0 auto;
      background: \${theme.colors.background.white};
      border-radius: \${theme.email.spacing.borderRadius.large};
      overflow: hidden;
      box-shadow: \${theme.email.shadows.large};
    }
    .header { 
      background: \${theme.gradients.primary}; 
      color: white; 
      padding: \${theme.email.spacing.padding.large} \${theme.email.spacing.padding.medium}; 
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: shimmer 3s ease-in-out infinite;
    }
    @keyframes shimmer {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      50% { transform: translate(-10px, -10px) rotate(5deg); }
    }
    .header h1 { 
      margin: 0; 
      font-size: 34px; 
      font-weight: 800;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      position: relative;
      z-index: 1;
    }
    .subtitle { 
      margin-top: 12px; 
      opacity: 0.95; 
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      position: relative;
      z-index: 1;
    }
    .metadata-box {
      background: \${theme.colors.background.medium};
      padding: 24px \${theme.email.spacing.padding.medium};
      border-bottom: 3px solid \${theme.colors.primary};
    }
    .metadata-box table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .metadata-box td {
      padding: 8px 12px;
      border-bottom: 1px solid \${theme.colors.border.light};
    }
    .metadata-box td:first-child {
      font-weight: 700;
      color: \${theme.colors.primaryDark};
      width: 150px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .metadata-box td:last-child {
      color: \${theme.colors.text.dark};
      font-weight: 500;
    }
    .metadata-box .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      background: \${theme.gradients.primary};
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: \${theme.email.shadows.primary};
    }
    .content { 
      background: \${theme.colors.background.white}; 
      padding: \${theme.email.spacing.padding.large} \${theme.email.spacing.padding.medium};
    }
    .analysis { 
      background: \${theme.colors.background.light}; 
      padding: 35px; 
      border-radius: \${theme.email.spacing.borderRadius.medium}; 
      margin-bottom: 25px; 
      border-left: 5px solid \${theme.colors.primary};
      box-shadow: \${theme.email.shadows.medium};
      line-height: 1.8;
    }
    .analysis p {
      margin-bottom: 14px;
      color: \${theme.colors.text.dark};
    }
    .analysis h2, .analysis h3 {
      margin-top: 24px;
      margin-bottom: 12px;
    }
    .analysis table {
      margin: 20px 0;
      overflow-x: auto;
      display: block;
    }
    .ticker-box {
      margin-top: 25px; 
      padding: 24px; 
      background: \${theme.gradients.primaryAlt};
      border-radius: \${theme.email.spacing.borderRadius.medium};
      border: 2px solid \${theme.colors.primary};
      box-shadow: \${theme.email.shadows.primary};
    }
    .ticker-box strong {
      color: white;
      font-size: 16px;
      display: block;
      margin-bottom: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ticker-list {
      color: rgba(255, 255, 255, 0.95);
      font-weight: 600;
      font-size: 15px;
    }
    .footer { 
      text-align: center; 
      padding: \${theme.email.spacing.padding.medium};
      background: \${theme.colors.background.medium};
      border-top: 2px solid \${theme.colors.border.light};
    }
    .footer p {
      margin: 8px 0;
      font-size: 13px;
      color: \${theme.colors.text.medium};
    }
    .footer .powered-by {
      font-weight: 700;
      color: \${theme.colors.primaryDark};
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer .powered-by::before {
      content: '⚡ ';
      color: \${theme.colors.success};
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Newsletter Financière Emma</h1>
      <div class="subtitle">ÉDITION DU \${editionType} | \${now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
    <div class="metadata-box">
      <table>
        <tr>
          <td>🕐 Heure de génération:</td>
          <td><strong>\${generationTime}</strong></td>
        </tr>
        <tr>
          <td>⚡ Déclencheur:</td>
          <td><span class="badge">\${triggerType}</span></td>
        </tr>
        <tr>
          <td>🤖 Modèle Emma:</td>
          <td><strong style="color: \${theme.colors.primaryDark};">\${emmaModel.toUpperCase()}</strong></td>
        </tr>
        \${emmaTools.length > 0 ? \`<tr>
          <td>🔧 Outils utilisés:</td>
          <td><span style="color: \${theme.colors.text.medium};">\${emmaTools.join(', ')}</span></td>
        </tr>\` : ''}
        \${emmaExecutionTime > 0 ? \`<tr>
          <td>⏱️ Temps d'exécution:</td>
          <td><strong style="color: \${theme.colors.success};">\${(emmaExecutionTime / 1000).toFixed(1)}s</strong></td>
        </tr>\` : ''}
        \${emmaConfidence !== null ? \`<tr>
          <td>📊 Confiance:</td>
          <td><strong style="color: \${theme.colors.primaryDark};">\${(emmaConfidence * 100).toFixed(0)}%</strong></td>
        </tr>\` : ''}
      </table>
    </div>
    <div class="content">
      <div class="analysis">
        \${formattedContent}
      </div>
      \${data.tickers ? \`
      <div class="ticker-box">
        <strong>📈 Tickers suivis :</strong>
        <div class="ticker-list">\${data.tickers}</div>
      </div>
      \` : ''}
    </div>
    <div class="footer">
      <p class="powered-by">Généré par Emma IA | Propulsé par \${emmaModel === 'perplexity' ? 'Perplexity' : 'Gemini'}</p>
      <p>Ceci est une newsletter automatisée. Merci de ne pas répondre à cet email.</p>
    </div>
  </div>
</body>
</html>
\\\`;

const subjectMap = {
  'morning': 'Matin',
  'noon': 'Midi',
  'evening': 'Soir',
  'custom': 'Personnalisée'
};

const subjectType = subjectMap[data.prompt_type] || data.prompt_type;

return [{
  json: {
    ...data,
    html_content: html,
    subject: \\\`Newsletter Emma - Mise à jour du \${subjectType}\\\`
  }
}];`;
}

// Mettre à jour le workflow
async function updateWorkflow() {
  try {
    const workflowPath = join(__dirname, 'n8n-workflow-03lgcA4e9uRTtli1.json');
    const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));
    
    const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');
    if (!generateHtmlNode) {
      console.error('❌ Nœud "Generate HTML Newsletter" non trouvé');
      process.exit(1);
    }
    
    const newCode = await generateEmailTemplateCode();
    generateHtmlNode.parameters.jsCode = newCode;
    
    writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');
    console.log('✅ Workflow n8n mis à jour avec les couleurs centralisées');
    console.log('✅ Les couleurs sont maintenant chargées depuis config/theme-colors.json');
    
  } catch (error) {
    console.error('❌ Erreur mise à jour workflow:', error);
    process.exit(1);
  }
}

updateWorkflow();

