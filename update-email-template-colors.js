/**
 * Script pour améliorer les couleurs du template email
 * pour correspondre au thème du site web (purple/indigo)
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

// Trouver le nœud "Generate HTML Newsletter"
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

if (!generateHtmlNode) {
  console.error('❌ Nœud "Generate HTML Newsletter" non trouvé');
  process.exit(1);
}

// Nouveau code avec couleurs améliorées correspondant au thème du site
const newCode = `const items = $input.all();
const data = items[0].json;

// Fonction pour convertir markdown en HTML (tableaux, gras, italique, etc.)
function markdownToHtml(text) {
  if (!text) return '';
  
  let html = text;
  
  // Convertir les tableaux markdown en HTML
  const tableRegex = /\\|(.+)\\|\\n\\|([-|\\s]+)\\|\\n((?:\\|.+\\|\\n?)+)/g;
  html = html.replace(tableRegex, (match, header, separator, rows) => {
    const headers = header.split('|').map(h => h.trim()).filter(h => h);
    const rowLines = rows.trim().split('\\n').filter(r => r.trim());
    
    let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; background: white;">';
    
    // En-têtes avec gradient purple/indigo
    tableHtml += '<thead><tr style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white;">';
    headers.forEach(h => {
      tableHtml += \`<th style="padding: 12px; text-align: left; border: 1px solid rgba(255,255,255,0.2); font-weight: 600; letter-spacing: 0.3px;">\${h.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')}</th>\`;
    });
    tableHtml += '</tr></thead><tbody>';
    
    // Lignes avec alternance de couleurs
    rowLines.forEach((row, idx) => {
      const cells = row.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length > 0 && !cells[0].match(/^[-|\\s]+$/)) {
        const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        tableHtml += \`<tr style="background: \${bgColor}; transition: background 0.2s;">\`;
        cells.forEach(cell => {
          let cellContent = cell.replace(/\\*\\*(.*?)\\*\\*/g, '<strong style="color: #6366f1;">$1</strong>');
          cellContent = cellContent.replace(/\\*(.*?)\\*/g, '<em>$1</em>');
          cellContent = cellContent.replace(/🏆/g, '<span style="color: #10b981; font-size: 16px;">🏆</span>');
          tableHtml += \`<td style="padding: 10px; border: 1px solid #e5e7eb; color: #1f2937;">\${cellContent}</td>\`;
        });
        tableHtml += '</tr>';
      }
    });
    
    tableHtml += '</tbody></table>';
    return tableHtml;
  });
  
  // Convertir **gras** avec couleur purple
  html = html.replace(/\\*\\*(.*?)\\*\\*/g, '<strong style="color: #6366f1; font-weight: 700;">$1</strong>');
  
  // Convertir *italique*
  html = html.replace(/\\*(?!\\*)(.*?)\\*(?!\\*)/g, '<em style="color: #6b7280;">$1</em>');
  
  // Convertir les titres avec couleurs du thème
  html = html.replace(/^###\\s+(.+)$/gm, '<h3 style="margin-top: 24px; margin-bottom: 12px; color: #6366f1; font-size: 18px; font-weight: 600; border-left: 4px solid #8b5cf6; padding-left: 12px;">$1</h3>');
  html = html.replace(/^##\\s+(.+)$/gm, '<h2 style="margin-top: 28px; margin-bottom: 16px; color: #4f46e5; font-size: 22px; font-weight: 700; border-bottom: 3px solid #6366f1; padding-bottom: 8px;">$1</h2>');
  html = html.replace(/^#\\s+(.+)$/gm, '<h1 style="margin-top: 32px; margin-bottom: 20px; color: #4338ca; font-size: 26px; font-weight: 700; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">$1</h1>');
  
  // Convertir les listes à puces avec couleur purple
  html = html.replace(/^[-•]\\s+(.+)$/gm, '<li style="margin-left: 20px; margin-bottom: 6px; color: #1f2937; position: relative; padding-left: 8px;"><span style="position: absolute; left: -12px; color: #6366f1;">•</span>$1</li>');
  html = html.replace(/(<li.*?<\\/li>\\n?)+/g, '<ul style="margin: 16px 0; padding-left: 20px; list-style: none;">$&</ul>');
  
  // Convertir les séparateurs avec couleur purple
  html = html.replace(/^---+$/gm, '<hr style="border: none; border-top: 2px solid #6366f1; margin: 24px 0; opacity: 0.3;">');
  
  // Convertir les sauts de ligne
  html = html.replace(/\\n\\n/g, '</p><p style="margin-bottom: 12px; color: #1f2937; line-height: 1.7;">');
  html = html.replace(/\\n/g, '<br>');
  
  // Encapsuler dans des paragraphes
  if (!html.startsWith('<')) html = '<p style="margin-bottom: 12px; color: #1f2937; line-height: 1.7;">' + html;
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

// Couleurs du thème (purple/indigo comme le site)
const themeColors = {
  primary: '#6366f1',      // Indigo-500
  primaryDark: '#4f46e5',  // Indigo-600
  primaryLight: '#8b5cf6', // Violet-500
  gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  gradientAlt: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
  success: '#10b981',      // Emerald-500 (vert pour accents)
  textDark: '#1f2937',     // Gray-800
  textMedium: '#4b5563',   // Gray-600
  textLight: '#6b7280',   // Gray-500
  bgLight: '#f8fafc',      // Gray-50
  bgMedium: '#f1f5f9',     // Slate-100
  border: '#e5e7eb',       // Gray-200
  borderDark: '#d1d5db'    // Gray-300
};

const html = \`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter Financière Emma</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.7; 
      color: \${themeColors.textDark}; 
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 20px;
    }
    .container {
      max-width: 700px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(99, 102, 241, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header { 
      background: \${themeColors.gradient}; 
      color: white; 
      padding: 45px 30px; 
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
      background: \${themeColors.bgMedium};
      padding: 24px 30px;
      border-bottom: 3px solid \${themeColors.primary};
    }
    .metadata-box table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .metadata-box td {
      padding: 8px 12px;
      border-bottom: 1px solid \${themeColors.border};
    }
    .metadata-box td:first-child {
      font-weight: 700;
      color: \${themeColors.primaryDark};
      width: 150px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .metadata-box td:last-child {
      color: \${themeColors.textDark};
      font-weight: 500;
    }
    .metadata-box .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      background: \${themeColors.gradient};
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);
    }
    .content { 
      background: #ffffff; 
      padding: 40px 30px;
    }
    .analysis { 
      background: \${themeColors.bgLight}; 
      padding: 35px; 
      border-radius: 12px; 
      margin-bottom: 25px; 
      border-left: 5px solid \${themeColors.primary};
      box-shadow: 0 4px 6px rgba(99, 102, 241, 0.08);
      line-height: 1.8;
    }
    .analysis p {
      margin-bottom: 14px;
      color: \${themeColors.textDark};
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
      background: \${themeColors.gradientAlt};
      border-radius: 12px;
      border: 2px solid \${themeColors.primary};
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
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
      padding: 30px;
      background: \${themeColors.bgMedium};
      border-top: 2px solid \${themeColors.border};
    }
    .footer p {
      margin: 8px 0;
      font-size: 13px;
      color: \${themeColors.textMedium};
    }
    .footer .powered-by {
      font-weight: 700;
      color: \${themeColors.primaryDark};
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer .powered-by::before {
      content: '⚡ ';
      color: \${themeColors.success};
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
          <td><strong style="color: \${themeColors.primaryDark};">\${emmaModel.toUpperCase()}</strong></td>
        </tr>
        \${emmaTools.length > 0 ? \`<tr>
          <td>🔧 Outils utilisés:</td>
          <td><span style="color: \${themeColors.textMedium};">\${emmaTools.join(', ')}</span></td>
        </tr>\` : ''}
        \${emmaExecutionTime > 0 ? \`<tr>
          <td>⏱️ Temps d'exécution:</td>
          <td><strong style="color: \${themeColors.success};">\${(emmaExecutionTime / 1000).toFixed(1)}s</strong></td>
        </tr>\` : ''}
        \${emmaConfidence !== null ? \`<tr>
          <td>📊 Confiance:</td>
          <td><strong style="color: \${themeColors.primaryDark};">\${(emmaConfidence * 100).toFixed(0)}%</strong></td>
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
\`;

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
    subject: \`Newsletter Emma - Mise à jour du \${subjectType}\`
  }
}];`;

// Remplacer le code
generateHtmlNode.parameters.jsCode = newCode;

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');
console.log('✅ Template email mis à jour avec les couleurs du thème du site');
console.log('✅ Couleurs utilisées :');
console.log('   - Primary: #6366f1 (Indigo)');
console.log('   - Gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)');
console.log('   - Success: #10b981 (Emerald) pour accents');
console.log('   - Text: #1f2937 (Gray-800)');
console.log('   - Backgrounds: #f8fafc, #f1f5f9');

