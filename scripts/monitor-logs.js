#!/usr/bin/env node

/**
 * Script de monitoring des logs et erreurs
 * Surveille les logs Vercel et génère des alertes pour les erreurs
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Patterns d'erreurs à surveiller
const ERROR_PATTERNS = {
    critical: [
        /500.*Internal Server Error/i,
        /TypeError.*is not a function/i,
        /Cannot read property/i,
        /ReferenceError/i,
        /SyntaxError/i,
        /Database.*error/i,
        /Connection.*refused/i,
        /Timeout/i,
        /ECONNREFUSED/i,
        /ENOTFOUND/i
    ],
    warnings: [
        /404.*Not Found/i,
        /401.*Unauthorized/i,
        /403.*Forbidden/i,
        /429.*Too Many Requests/i,
        /Rate limit/i,
        /Quota.*exceeded/i,
        /API key.*invalid/i,
        /Missing.*parameter/i,
        /Validation.*failed/i
    ],
    info: [
        /Warning/i,
        /Deprecated/i,
        /Slow.*query/i,
        /Cache.*miss/i
    ]
};

// Endpoints à surveiller spécifiquement
const MONITORED_ENDPOINTS = [
    '/api/gemini/chat',
    '/api/chat-assistant',
    '/api/emma-agent',
    '/api/emma-briefing',
    '/api/format-preview',
    '/api/sector',
    '/api/fmp-sync',
    '/api/kpi-engine',
    '/api/terminal-data',
    '/api/send-email',
    '/api/adapters/sms',
    '/api/adapters/email'
];

class LogMonitor {
    constructor() {
        this.errors = {
            critical: [],
            warnings: [],
            info: []
        };
        this.stats = {
            totalRequests: 0,
            errors: 0,
            warnings: 0,
            endpoints: {}
        };
    }

    analyzeLogLine(line) {
        this.stats.totalRequests++;

        // Détecter le type de log
        const isError = line.includes('ERROR') || line.includes('❌') || line.includes('Error:');
        const isWarning = line.includes('WARN') || line.includes('⚠️') || line.includes('Warning:');
        const isInfo = line.includes('INFO') || line.includes('✅') || line.includes('ℹ️');

        // Extraire l'endpoint si présent
        let endpoint = null;
        for (const ep of MONITORED_ENDPOINTS) {
            if (line.includes(ep)) {
                endpoint = ep;
                if (!this.stats.endpoints[endpoint]) {
                    this.stats.endpoints[endpoint] = { requests: 0, errors: 0, warnings: 0 };
                }
                this.stats.endpoints[endpoint].requests++;
                break;
            }
        }

        // Analyser les patterns d'erreur
        for (const pattern of ERROR_PATTERNS.critical) {
            if (pattern.test(line)) {
                this.errors.critical.push({ line, endpoint, timestamp: new Date().toISOString() });
                this.stats.errors++;
                if (endpoint) this.stats.endpoints[endpoint].errors++;
                return 'critical';
            }
        }

        for (const pattern of ERROR_PATTERNS.warnings) {
            if (pattern.test(line)) {
                this.errors.warnings.push({ line, endpoint, timestamp: new Date().toISOString() });
                this.stats.warnings++;
                if (endpoint) this.stats.endpoints[endpoint].warnings++;
                return 'warning';
            }
        }

        for (const pattern of ERROR_PATTERNS.info) {
            if (pattern.test(line)) {
                this.errors.info.push({ line, endpoint, timestamp: new Date().toISOString() });
                return 'info';
            }
        }

        if (isError) {
            this.errors.critical.push({ line, endpoint, timestamp: new Date().toISOString() });
            this.stats.errors++;
            if (endpoint) this.stats.endpoints[endpoint].errors++;
            return 'critical';
        }

        if (isWarning) {
            this.errors.warnings.push({ line, endpoint, timestamp: new Date().toISOString() });
            this.stats.warnings++;
            if (endpoint) this.stats.endpoints[endpoint].warnings++;
            return 'warning';
        }

        return null;
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalRequests: this.stats.totalRequests,
                criticalErrors: this.errors.critical.length,
                warnings: this.errors.warnings.length,
                info: this.errors.info.length,
                errorRate: this.stats.totalRequests > 0 
                    ? ((this.stats.errors / this.stats.totalRequests) * 100).toFixed(2) + '%'
                    : '0%'
            },
            endpoints: this.stats.endpoints,
            errors: {
                critical: this.errors.critical.slice(0, 20), // Limiter à 20 pour le rapport
                warnings: this.errors.warnings.slice(0, 20),
                info: this.errors.info.slice(0, 10)
            },
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    generateRecommendations() {
        const recommendations = [];

        // Analyser les erreurs par endpoint
        for (const [endpoint, stats] of Object.entries(this.stats.endpoints)) {
            const errorRate = stats.requests > 0 
                ? (stats.errors / stats.requests * 100).toFixed(2)
                : 0;

            if (errorRate > 10) {
                recommendations.push({
                    type: 'critical',
                    endpoint,
                    message: `Taux d'erreur élevé (${errorRate}%) sur ${endpoint}`,
                    action: 'Vérifier la configuration et les logs détaillés'
                });
            } else if (errorRate > 5) {
                recommendations.push({
                    type: 'warning',
                    endpoint,
                    message: `Taux d'erreur modéré (${errorRate}%) sur ${endpoint}`,
                    action: 'Surveiller et optimiser si nécessaire'
                });
            }
        }

        // Recommandations générales
        if (this.errors.critical.length > 50) {
            recommendations.push({
                type: 'critical',
                message: 'Nombre élevé d\'erreurs critiques détectées',
                action: 'Réviser la configuration et les dépendances'
            });
        }

        if (this.errors.warnings.some(e => e.line.includes('API key'))) {
            recommendations.push({
                type: 'warning',
                message: 'Erreurs de clés API détectées',
                action: 'Vérifier les variables d\'environnement avec scripts/check-api-keys.js'
            });
        }

        if (this.errors.warnings.some(e => e.line.includes('Rate limit'))) {
            recommendations.push({
                type: 'warning',
                message: 'Limites de taux atteintes',
                action: 'Considérer l\'augmentation des quotas ou l\'implémentation de cache'
            });
        }

        return recommendations;
    }
}

// Analyser un fichier de logs
function analyzeLogFile(filePath) {
    if (!fs.existsSync(filePath)) {
        log(`❌ Fichier de logs non trouvé: ${filePath}`, 'red');
        return null;
    }

    log(`\n📄 Analyse du fichier: ${filePath}`, 'cyan');
    
    const monitor = new LogMonitor();
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    log(`   Lignes à analyser: ${lines.length}`, 'blue');

    lines.forEach((line, index) => {
        if (line.trim()) {
            monitor.analyzeLogLine(line);
        }
    });

    return monitor;
}

// Générer un rapport de monitoring
function generateMonitoringReport(monitor) {
    if (!monitor) {
        log('❌ Aucune donnée à analyser', 'red');
        return;
    }

    const report = monitor.generateReport();

    log('\n' + '='.repeat(80), 'cyan');
    log('📊 RAPPORT DE MONITORING', 'cyan');
    log('='.repeat(80), 'cyan');

    log(`\n📈 STATISTIQUES GLOBALES:`, 'cyan');
    log(`   Total requêtes: ${report.summary.totalRequests}`, 'blue');
    log(`   Erreurs critiques: ${report.summary.criticalErrors}`, report.summary.criticalErrors > 0 ? 'red' : 'green');
    log(`   Avertissements: ${report.summary.warnings}`, report.summary.warnings > 0 ? 'yellow' : 'green');
    log(`   Taux d'erreur: ${report.summary.errorRate}`, parseFloat(report.summary.errorRate) > 5 ? 'red' : 'green');

    if (Object.keys(report.endpoints).length > 0) {
        log(`\n📋 STATISTIQUES PAR ENDPOINT:`, 'cyan');
        for (const [endpoint, stats] of Object.entries(report.endpoints)) {
            const errorRate = stats.requests > 0 
                ? (stats.errors / stats.requests * 100).toFixed(2)
                : 0;
            log(`\n   ${endpoint}:`, 'blue');
            log(`      Requêtes: ${stats.requests}`, 'blue');
            log(`      Erreurs: ${stats.errors}`, stats.errors > 0 ? 'red' : 'green');
            log(`      Avertissements: ${stats.warnings}`, stats.warnings > 0 ? 'yellow' : 'green');
            log(`      Taux d'erreur: ${errorRate}%`, parseFloat(errorRate) > 10 ? 'red' : parseFloat(errorRate) > 5 ? 'yellow' : 'green');
        }
    }

    if (report.errors.critical.length > 0) {
        log(`\n🚨 ERREURS CRITIQUES (${report.errors.critical.length}):`, 'red');
        report.errors.critical.slice(0, 10).forEach((error, index) => {
            log(`\n   ${index + 1}. ${error.endpoint || 'Général'}`, 'red');
            log(`      ${error.line.substring(0, 100)}...`, 'red');
        });
        if (report.errors.critical.length > 10) {
            log(`   ... et ${report.errors.critical.length - 10} autres`, 'red');
        }
    }

    if (report.recommendations.length > 0) {
        log(`\n💡 RECOMMANDATIONS:`, 'cyan');
        report.recommendations.forEach((rec, index) => {
            const color = rec.type === 'critical' ? 'red' : 'yellow';
            log(`\n   ${index + 1}. [${rec.type.toUpperCase()}] ${rec.message}`, color);
            log(`      Action: ${rec.action}`, color);
            if (rec.endpoint) {
                log(`      Endpoint: ${rec.endpoint}`, color);
            }
        });
    }

    // Sauvegarder le rapport
    const reportPath = path.join(__dirname, '..', 'monitoring-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\n📄 Rapport sauvegardé: ${reportPath}`, 'cyan');

    log('\n' + '='.repeat(80), 'cyan');

    return report;
}

// Main
function main() {
    log('🔍 Monitoring des logs...\n', 'cyan');

    // Analyser les logs Vercel si disponibles
    const vercelLogsPath = path.join(__dirname, '..', 'vercel-logs.txt');
    const monitor = analyzeLogFile(vercelLogsPath);

    if (monitor) {
        generateMonitoringReport(monitor);
    } else {
        log('\n💡 Pour analyser les logs Vercel:', 'yellow');
        log('   1. Téléchargez les logs depuis Vercel Dashboard', 'blue');
        log('   2. Sauvegardez-les dans vercel-logs.txt', 'blue');
        log('   3. Relancez ce script', 'blue');
        log('\n   Ou utilisez: vercel logs --follow > vercel-logs.txt', 'blue');
    }

    // Instructions pour monitoring continu
    log('\n📡 MONITORING CONTINU:', 'cyan');
    log('   Pour surveiller les logs en temps réel:', 'yellow');
    log('   vercel logs --follow | node scripts/monitor-logs.js', 'blue');
}

main();

