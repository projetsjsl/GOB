/**
 * Script d'audit complet du site GOB Dashboard
 * Navigation systématique, détection de bugs, capture de screenshots
 */

const fs = require('fs');
const path = require('path');

const AUDIT_REPORT = {
  startTime: new Date().toISOString(),
  bugs: [],
  screenshots: [],
  navigation: [],
  errors: [],
  warnings: [],
  fixes: []
};

const MAIN_TABS = [
  'admin', 'marches', 'nouvelles', 'titres', 'jlab', 'emma'
];

const SUB_TABS = {
  'admin': ['admin-config', 'admin-briefings', 'admin-scraping', 'admin-fastgraphs', 'admin-settings', 'admin-jsla'],
  'marches': ['marches-global', 'marches-calendar', 'marches-yield'],
  'nouvelles': ['nouvelles-main'],
  'titres': ['titres-portfolio', 'titres-watchlist', 'titres-3p1', 'titres-seeking', 'titres-compare'],
  'jlab': ['jlab-terminal', 'jlab-advanced', 'jlab-compare', 'jlab-screener', 'jlab-fastgraphs', 'jlab-curvewatch'],
  'emma': ['emma-chat', 'emma-vocal', 'emma-group', 'emma-terminal', 'emma-live', 'emma-finvox']
};

function logBug(category, severity, description, evidence, location) {
  AUDIT_REPORT.bugs.push({
    id: `BUG-${AUDIT_REPORT.bugs.length + 1}`,
    category,
    severity,
    description,
    evidence,
    location,
    timestamp: new Date().toISOString()
  });
}

function logScreenshot(name, description) {
  AUDIT_REPORT.screenshots.push({
    name,
    description,
    timestamp: new Date().toISOString()
  });
}

function saveReport() {
  const reportPath = path.join(__dirname, '../docs/AUDIT_COMPLET_SITE.md');
  const reportContent = generateReport();
  fs.writeFileSync(reportPath, reportContent, 'utf-8');
  console.log(`📄 Rapport sauvegardé: ${reportPath}`);
}

function generateReport() {
  return `# 🔍 Audit Complet du Site GOB Dashboard
**Date**: ${AUDIT_REPORT.startTime}  
**Durée**: En cours...  
**Objectif**: Détecter et corriger tous les bugs, incohérences, erreurs UI/UX, calculs, et problèmes de code

## 📊 Statistiques

- **Bugs détectés**: ${AUDIT_REPORT.bugs.length}
- **Screenshots capturés**: ${AUDIT_REPORT.screenshots.length}
- **Erreurs console**: ${AUDIT_REPORT.errors.length}
- **Avertissements**: ${AUDIT_REPORT.warnings.length}

## 🐛 BUGS DÉTECTÉS

${AUDIT_REPORT.bugs.map(bug => `
### ${bug.id} - ${bug.category} (${bug.severity})
**Description**: ${bug.description}  
**Localisation**: ${bug.location}  
**Preuve**: ${bug.evidence}  
**Timestamp**: ${bug.timestamp}
`).join('\n')}

## 📸 Screenshots

${AUDIT_REPORT.screenshots.map(ss => `- **${ss.name}**: ${ss.description} (${ss.timestamp})`).join('\n')}

## ✅ Corrections Appliquées

${AUDIT_REPORT.fixes.map(fix => `- ${fix}`).join('\n') || 'Aucune correction appliquée pour le moment'}

---
*Rapport généré automatiquement par l'audit système*
`;
}

module.exports = { logBug, logScreenshot, saveReport, AUDIT_REPORT };
