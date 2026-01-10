/**
 * Script d'audit complet automatisé du site GOB Dashboard
 * Navigation systématique, détection de bugs, capture de screenshots
 */

const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, '../docs/audit-reports');
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

const AUDIT_REPORT = {
  startTime: new Date().toISOString(),
  bugs: [],
  screenshots: [],
  navigation: [],
  consoleErrors: [],
  consoleWarnings: [],
  fixes: [],
  categories: {
    code: [],
    ui: [],
    ux: [],
    calculations: [],
    performance: [],
    accessibility: []
  }
};

const MAIN_TABS = ['admin', 'marches', 'nouvelles', 'titres', 'jlab', 'emma'];
const SUB_TABS = {
  'admin': ['admin-config', 'admin-briefings', 'admin-scraping', 'admin-fastgraphs', 'admin-settings', 'admin-jsla'],
  'marches': ['marches-global', 'marches-calendar', 'marches-yield'],
  'nouvelles': ['nouvelles-main'],
  'titres': ['titres-portfolio', 'titres-watchlist', 'titres-3p1', 'titres-seeking', 'titres-compare'],
  'jlab': ['jlab-terminal', 'jlab-advanced', 'jlab-compare', 'jlab-screener', 'jlab-fastgraphs', 'jlab-curvewatch'],
  'emma': ['emma-chat', 'emma-vocal', 'emma-group', 'emma-terminal', 'emma-live', 'emma-finvox']
};

function logBug(category, severity, description, evidence, location, screenshot) {
  const bug = {
    id: `BUG-${String(AUDIT_REPORT.bugs.length + 1).padStart(4, '0')}`,
    category,
    severity, // 'critical', 'high', 'medium', 'low'
    description,
    evidence,
    location,
    screenshot,
    timestamp: new Date().toISOString()
  };
  
  AUDIT_REPORT.bugs.push(bug);
  AUDIT_REPORT.categories[category].push(bug);
  
  console.log(`🐛 [${severity.toUpperCase()}] ${bug.id}: ${description}`);
  console.log(`   Location: ${location}`);
}

function logScreenshot(name, description, tab) {
  AUDIT_REPORT.screenshots.push({
    name,
    description,
    tab,
    timestamp: new Date().toISOString()
  });
}

function logConsoleError(message, location) {
  AUDIT_REPORT.consoleErrors.push({
    message,
    location,
    timestamp: new Date().toISOString()
  });
}

function logConsoleWarning(message, location) {
  AUDIT_REPORT.consoleWarnings.push({
    message,
    location,
    timestamp: new Date().toISOString()
  });
}

function logFix(bugId, description, code) {
  AUDIT_REPORT.fixes.push({
    bugId,
    description,
    code,
    timestamp: new Date().toISOString()
  });
}

function generateReport() {
  const endTime = new Date().toISOString();
  const duration = Math.round((new Date(endTime) - new Date(AUDIT_REPORT.startTime)) / 1000 / 60);
  
  return `# 🔍 Audit Complet du Site GOB Dashboard
**Date de début**: ${AUDIT_REPORT.startTime}  
**Date de fin**: ${endTime}  
**Durée**: ${duration} minutes  
**Objectif**: Détecter et corriger tous les bugs, incohérences, erreurs UI/UX, calculs, et problèmes de code

## 📊 Statistiques

- **Bugs détectés**: ${AUDIT_REPORT.bugs.length}
  - Critical: ${AUDIT_REPORT.categories.code.filter(b => b.severity === 'critical').length}
  - High: ${AUDIT_REPORT.categories.code.filter(b => b.severity === 'high').length}
  - Medium: ${AUDIT_REPORT.categories.code.filter(b => b.severity === 'medium').length}
  - Low: ${AUDIT_REPORT.categories.code.filter(b => b.severity === 'low').length}
- **Screenshots capturés**: ${AUDIT_REPORT.screenshots.length}
- **Erreurs console**: ${AUDIT_REPORT.consoleErrors.length}
- **Avertissements console**: ${AUDIT_REPORT.consoleWarnings.length}
- **Corrections appliquées**: ${AUDIT_REPORT.fixes.length}

## 🐛 BUGS DÉTECTÉS PAR CATÉGORIE

### Code / Console Errors
${AUDIT_REPORT.categories.code.map(bug => `
#### ${bug.id} - ${bug.severity.toUpperCase()}
**Description**: ${bug.description}  
**Localisation**: ${bug.location}  
**Preuve**: ${bug.evidence}  
**Screenshot**: ${bug.screenshot || 'N/A'}  
**Timestamp**: ${bug.timestamp}
`).join('\n')}

### UI / Interface
${AUDIT_REPORT.categories.ui.map(bug => `
#### ${bug.id} - ${bug.severity.toUpperCase()}
**Description**: ${bug.description}  
**Localisation**: ${bug.location}  
**Preuve**: ${bug.evidence}  
**Screenshot**: ${bug.screenshot || 'N/A'}  
**Timestamp**: ${bug.timestamp}
`).join('\n')}

### UX / Expérience Utilisateur
${AUDIT_REPORT.categories.ux.map(bug => `
#### ${bug.id} - ${bug.severity.toUpperCase()}
**Description**: ${bug.description}  
**Localisation**: ${bug.location}  
**Preuve**: ${bug.evidence}  
**Screenshot**: ${bug.screenshot || 'N/A'}  
**Timestamp**: ${bug.timestamp}
`).join('\n')}

### Calculs / Données
${AUDIT_REPORT.categories.calculations.map(bug => `
#### ${bug.id} - ${bug.severity.toUpperCase()}
**Description**: ${bug.description}  
**Localisation**: ${bug.location}  
**Preuve**: ${bug.evidence}  
**Screenshot**: ${bug.screenshot || 'N/A'}  
**Timestamp**: ${bug.timestamp}
`).join('\n')}

### Performance
${AUDIT_REPORT.categories.performance.map(bug => `
#### ${bug.id} - ${bug.severity.toUpperCase()}
**Description**: ${bug.description}  
**Localisation**: ${bug.location}  
**Preuve**: ${bug.evidence}  
**Screenshot**: ${bug.screenshot || 'N/A'}  
**Timestamp**: ${bug.timestamp}
`).join('\n')}

### Accessibilité
${AUDIT_REPORT.categories.accessibility.map(bug => `
#### ${bug.id} - ${bug.severity.toUpperCase()}
**Description**: ${bug.description}  
**Localisation**: ${bug.location}  
**Preuve**: ${bug.evidence}  
**Screenshot**: ${bug.screenshot || 'N/A'}  
**Timestamp**: ${bug.timestamp}
`).join('\n')}

## 📸 Screenshots Capturés

${AUDIT_REPORT.screenshots.map(ss => `- **${ss.name}**: ${ss.description} (${ss.tab || 'N/A'}) - ${ss.timestamp}`).join('\n')}

## ✅ Corrections Appliquées

${AUDIT_REPORT.fixes.map(fix => `
### Correction ${fix.bugId}
**Description**: ${fix.description}  
**Code**: \`\`\`\n${fix.code}\n\`\`\`  
**Timestamp**: ${fix.timestamp}
`).join('\n') || 'Aucune correction appliquée pour le moment'}

## 📝 Erreurs Console

${AUDIT_REPORT.consoleErrors.map(err => `- **${err.location}**: ${err.message} (${err.timestamp})`).join('\n') || 'Aucune erreur console'}

## ⚠️ Avertissements Console

${AUDIT_REPORT.consoleWarnings.map(warn => `- **${warn.location}**: ${warn.message} (${warn.timestamp})`).join('\n') || 'Aucun avertissement'}

---
*Rapport généré automatiquement par l'audit système*  
*Pour reproduire: Exécuter \`node scripts/audit-complet-automatise.js\`*
`;
}

function saveReport() {
  const reportPath = path.join(REPORT_DIR, `AUDIT_COMPLET_${Date.now()}.md`);
  const reportContent = generateReport();
  fs.writeFileSync(reportPath, reportContent, 'utf-8');
  
  // Also update main report
  const mainReportPath = path.join(__dirname, '../docs/AUDIT_COMPLET_SITE.md');
  fs.writeFileSync(mainReportPath, reportContent, 'utf-8');
  
  console.log(`\n📄 Rapport sauvegardé:`);
  console.log(`   - ${reportPath}`);
  console.log(`   - ${mainReportPath}`);
  console.log(`\n📊 Résumé: ${AUDIT_REPORT.bugs.length} bugs détectés, ${AUDIT_REPORT.fixes.length} corrections appliquées`);
}

module.exports = {
  logBug,
  logScreenshot,
  logConsoleError,
  logConsoleWarning,
  logFix,
  saveReport,
  AUDIT_REPORT,
  MAIN_TABS,
  SUB_TABS
};
