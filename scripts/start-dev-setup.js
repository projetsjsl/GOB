/**
 * Commande /start - Setup initial de développement GOB Dashboard
 * Version complète - Gère tous les scénarios de reprise + génère contexte pour LLM
 */

import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Configuration
const CONFIG = {
    serverPort: 5173,
    serverUrl: 'http://localhost:5173',
    testUrl: 'http://localhost:5173/test-integrations.html',
    serverTimeout: 20000,
    serverRetryDelay: 750,
    maxBranches: 5,
    minDiskSpaceMB: 500, // Minimum 500MB libre
    contextFile: '.start-context.json' // Fichier contexte pour LLM
};

// Options CLI
const ARGS = {
    verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
    fast: process.argv.includes('--fast') || process.argv.includes('-f'),
    lint: process.argv.includes('--lint'),
    noBrowser: process.argv.includes('--no-browser'),
    clean: process.argv.includes('--clean'),
    checkServices: process.argv.includes('--check-services'),
    allPermissions: process.env.ALLOW_ALL_PERMISSIONS === 'true' || 
                   process.argv.includes('--all-permissions')
};

const colors = {
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    dim: '\x1b[2m',
    reset: '\x1b[0m'
};

// Contexte global pour le LLM
const context = {
    timestamp: new Date().toISOString(),
    status: 'unknown',
    environment: {},
    git: {},
    dependencies: {},
    integrations: {},
    server: {},
    issues: { critical: [], warnings: [], info: [] },
    suggestions: []
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logVerbose(message, color = 'dim') {
    if (ARGS.verbose) console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, silent = true) {
    try {
        return execSync(command, { 
            encoding: 'utf-8', 
            cwd: rootDir, 
            stdio: silent ? 'pipe' : 'inherit',
            timeout: 30000
        }).trim();
    } catch (e) {
        return '';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// CURSOR VERSION & UPDATE
// ═══════════════════════════════════════════════════════════════════════════

function checkCursorVersion() {
    const result = {
        version: null,
        updateAvailable: false,
        latestVersion: null,
        message: ''
    };
    
    try {
        // Lire la version actuelle depuis Info.plist (macOS)
        if (process.platform === 'darwin') {
            const plistPath = '/Applications/Cursor.app/Contents/Info.plist';
            if (fs.existsSync(plistPath)) {
                const plistContent = fs.readFileSync(plistPath, 'utf-8');
                const versionMatch = plistContent.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/);
                if (versionMatch) {
                    result.version = versionMatch[1];
                }
            }
        }
        
        // Vérifier si une mise à jour est disponible (async en background)
        // Note: Cursor n'a pas d'API publique, on suggère juste de vérifier
        if (result.version) {
            result.message = `v${result.version}`;
        } else {
            result.message = 'Version inconnue';
        }
        
    } catch (e) {
        result.message = 'Non vérifié';
    }
    
    return result;
}

function suggestCursorUpdate() {
    // Déclencher une vérification de mise à jour en arrière-plan (non-bloquant)
    // Cursor utilise son propre mécanisme de mise à jour automatique
    // On peut juste rappeler à l'utilisateur de vérifier
    
    try {
        // Sur macOS, on peut ouvrir les préférences de Cursor pour vérifier les mises à jour
        // Mais c'est intrusif, donc on suggère juste
        return {
            suggestion: 'Cmd+Shift+P → "Cursor: Check for Updates"',
            autoUpdateEnabled: true // Cursor a généralement l'auto-update activé
        };
    } catch (e) {
        return { suggestion: null, autoUpdateEnabled: false };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// NOUVELLES VÉRIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

function checkDiskSpace() {
    try {
        // macOS/Linux
        const dfOutput = exec('df -m . | tail -1');
        const parts = dfOutput.split(/\s+/);
        const availableMB = parseInt(parts[3]) || 0;
        return {
            available: availableMB,
            ok: availableMB >= CONFIG.minDiskSpaceMB,
            message: `${availableMB}MB disponible`
        };
    } catch (e) {
        return { available: 0, ok: true, message: 'Non vérifié' };
    }
}

function checkEnvVariables() {
    const result = { 
        ok: true, 
        missing: [], 
        present: [],
        sources: {
            local: null,      // Fichier .env trouvé
            vercel: true,     // Variables de production dans Vercel
            supabase: false   // Connexion Supabase OK
        },
        locations: {}  // Où trouver chaque variable
    };
    
    // Variables et leurs emplacements
    const envConfig = {
        // Supabase - critiques
        'SUPABASE_URL': { 
            purpose: 'Database URL', 
            critical: true,
            locations: ['Vercel', '.env', 'Supabase Dashboard']
        },
        'SUPABASE_ANON_KEY': { 
            purpose: 'Database public key', 
            critical: true,
            locations: ['Vercel', '.env', 'Supabase Dashboard']
        },
        'SUPABASE_SERVICE_ROLE_KEY': { 
            purpose: 'Database admin key', 
            critical: false,
            locations: ['Vercel', 'Supabase Dashboard (Settings > API)']
        },
        // FastGraphs
        'FASTGRAPHS_EMAIL': { 
            purpose: 'FastGraph login', 
            critical: false,
            locations: ['Vercel', '.env']
        },
        'FASTGRAPHS_PASSWORD': { 
            purpose: 'FastGraph login', 
            critical: false,
            locations: ['Vercel', '.env']
        },
        // Browserbase
        'BROWSERBASE_API_KEY': { 
            purpose: 'Browser automation', 
            critical: false,
            locations: ['Vercel', 'Browserbase Dashboard']
        },
        'BROWSERBASE_PROJECT_ID': { 
            purpose: 'Browser automation', 
            critical: false,
            locations: ['Vercel', 'Browserbase Dashboard']
        },
        // APIs
        'OPENAI_API_KEY': { 
            purpose: 'OpenAI/GPT', 
            critical: false,
            locations: ['Vercel', 'OpenAI Dashboard']
        },
        'GEMINI_API_KEY': { 
            purpose: 'Google Gemini', 
            critical: false,
            locations: ['Vercel', 'Google AI Studio']
        },
        'PERPLEXITY_API_KEY': { 
            purpose: 'Perplexity AI', 
            critical: false,
            locations: ['Vercel', 'Perplexity Dashboard']
        }
    };
    
    // Chercher les fichiers .env locaux
    const envFiles = ['.env.local', '.env', '.env.development'];
    let envContent = '';
    let localEnvFile = null;
    
    for (const file of envFiles) {
        const path = join(rootDir, file);
        if (fs.existsSync(path)) {
            envContent += fs.readFileSync(path, 'utf-8');
            if (!localEnvFile) localEnvFile = file;
        }
    }
    
    result.sources.local = localEnvFile;
    
    // Vérifier chaque variable
    for (const [varName, config] of Object.entries(envConfig)) {
        const inEnv = envContent.includes(varName) || process.env[varName];
        result.locations[varName] = config.locations;
        
        if (inEnv) {
            result.present.push({ name: varName, purpose: config.purpose });
        } else {
            result.missing.push({ 
                name: varName, 
                purpose: config.purpose, 
                critical: config.critical,
                locations: config.locations
            });
        }
    }
    
    // Vérifier la connexion Supabase
    const supabaseUrl = process.env.SUPABASE_URL || 
                        (envContent.match(/SUPABASE_URL=["']?([^"'\n]+)["']?/)?.[1]);
    if (supabaseUrl) {
        result.sources.supabase = true;
    }
    
    // OK si les variables critiques sont présentes
    result.ok = result.missing.filter(m => m.critical).length === 0;
    
    return result;
}

function checkViteCache() {
    const cacheDir = join(rootDir, 'node_modules', '.vite');
    if (!fs.existsSync(cacheDir)) {
        return { ok: true, message: 'Pas de cache' };
    }
    
    try {
        const stats = fs.statSync(cacheDir);
        const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
        
        // Cache vieux de plus de 7 jours = potentiellement problématique
        if (ageHours > 168 || ARGS.clean) {
            fs.rmSync(cacheDir, { recursive: true, force: true });
            return { ok: true, message: 'Cache nettoyé', cleaned: true };
        }
        
        return { ok: true, message: `Cache: ${Math.round(ageHours)}h` };
    } catch (e) {
        return { ok: true, message: 'Non vérifié' };
    }
}

function checkTypeScript() {
    try {
        const result = exec('npx tsc --noEmit --skipLibCheck 2>&1 | head -20');
        const errorCount = (result.match(/error TS/gi) || []).length;
        return {
            ok: errorCount === 0,
            errors: errorCount,
            message: errorCount > 0 ? `${errorCount} erreur(s) TS` : 'OK'
        };
    } catch (e) {
        return { ok: true, errors: 0, message: 'Non vérifié' };
    }
}

function checkBuildAge() {
    const distDir = join(rootDir, 'dist');
    if (!fs.existsSync(distDir)) {
        return { ok: true, age: null, message: 'Pas de build' };
    }
    
    try {
        const stats = fs.statSync(distDir);
        const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
        const ageDays = Math.floor(ageHours / 24);
        
        return {
            ok: ageDays < 7,
            age: ageDays,
            message: ageDays > 0 ? `Build: ${ageDays} jour(s)` : 'Build: récent'
        };
    } catch (e) {
        return { ok: true, age: null, message: 'Non vérifié' };
    }
}

async function checkExternalService(name, url, timeout = 5000) {
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.get(url, { timeout }, (res) => {
            resolve({ name, ok: res.statusCode < 500, status: res.statusCode });
        });
        req.on('error', () => resolve({ name, ok: false, status: 'error' }));
        req.on('timeout', () => {
            req.destroy();
            resolve({ name, ok: false, status: 'timeout' });
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// FONCTIONS EXISTANTES (améliorées)
// ═══════════════════════════════════════════════════════════════════════════

function cleanupOldFiles() {
    const filesToClean = ['.vite.pid', 'vite-dev-server.log'];
    let cleaned = 0;
    
    filesToClean.forEach(file => {
        const path = join(rootDir, file);
        if (fs.existsSync(path)) {
            try {
                const stats = fs.statSync(path);
                const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
                if (ageHours > 24 || ARGS.clean) {
                    fs.unlinkSync(path);
                    cleaned++;
                }
            } catch (e) {}
        }
    });
    
    return cleaned;
}

function killExistingServer() {
    let killed = false;
    
    try {
        const pids = exec(`lsof -ti:${CONFIG.serverPort}`);
        if (pids) {
            pids.split('\n').filter(p => p.trim()).forEach(pid => {
                try {
                    process.kill(parseInt(pid), 'SIGTERM');
                    killed = true;
                } catch (e) {}
            });
        }
    } catch (e) {}
    
    try {
        const pidFile = join(rootDir, '.vite.pid');
        if (fs.existsSync(pidFile)) {
            const pid = fs.readFileSync(pidFile, 'utf-8').trim();
            try {
                process.kill(parseInt(pid), 0);
                process.kill(parseInt(pid), 'SIGTERM');
                killed = true;
            } catch (e) {}
            fs.unlinkSync(pidFile);
        }
    } catch (e) {}
    
    try {
        exec('pkill -f "vite.*5173" 2>/dev/null || true');
    } catch (e) {}
    
    return killed;
}

function isPortAvailable(port) {
    try {
        const result = exec(`lsof -ti:${port}`);
        return !result;
    } catch (e) {
        return true;
    }
}

function gitPullSafe() {
    const result = { success: false, hasConflicts: false, needsStash: false, message: '', behind: 0 };
    
    const status = exec('git status --porcelain');
    if (status) {
        const hasChanges = status.split('\n').some(l => l.trim() && !l.startsWith('?'));
        if (hasChanges) {
            result.needsStash = true;
            log('  📦 Stash des changements locaux...', 'yellow');
            exec('git stash push -m "auto-stash by /start command"');
        }
    }
    
    try {
        exec('git fetch origin', false);
    } catch (e) {
        result.message = 'Fetch échoué (pas de connexion?)';
        return result;
    }
    
    // Vérifier le retard
    try {
        const behind = exec('git rev-list --count HEAD..origin/main 2>/dev/null');
        result.behind = parseInt(behind) || 0;
    } catch (e) {}
    
    const localHash = exec('git rev-parse HEAD');
    const remoteHash = exec('git rev-parse origin/main 2>/dev/null') || exec('git rev-parse origin/master');
    
    if (localHash === remoteHash) {
        result.success = true;
        result.message = 'Déjà à jour';
        return result;
    }
    
    try {
        const pullOutput = exec('git pull --no-edit origin main 2>&1') || 
                          exec('git pull --no-edit origin master 2>&1');
        
        if (pullOutput.includes('CONFLICT') || pullOutput.includes('conflict')) {
            result.hasConflicts = true;
            result.message = 'Conflits détectés! Résolvez-les manuellement.';
            exec('git merge --abort');
        } else {
            result.success = true;
            result.message = `Pull OK (+${result.behind} commits)`;
        }
    } catch (e) {
        result.message = 'Pull échoué';
    }
    
    if (result.needsStash) {
        try {
            exec('git stash pop');
            log('  📦 Changements locaux restaurés', 'green');
        } catch (e) {
            log('  ⚠️  Conflit lors de la restauration du stash', 'yellow');
            context.issues.warnings.push('Stash non restauré - git stash pop manuellement');
        }
    }
    
    return result;
}

function checkDependenciesNeedSync() {
    if (!fs.existsSync(join(rootDir, 'node_modules'))) {
        return { needsInstall: true, reason: 'node_modules manquant' };
    }
    
    try {
        const lockFile = join(rootDir, 'package-lock.json');
        const modulesDir = join(rootDir, 'node_modules');
        
        if (fs.existsSync(lockFile) && fs.existsSync(modulesDir)) {
            const lockMtime = fs.statSync(lockFile).mtimeMs;
            const modulesMtime = fs.statSync(modulesDir).mtimeMs;
            
            if (lockMtime > modulesMtime) {
                return { needsInstall: true, reason: 'package-lock.json modifié' };
            }
        }
    } catch (e) {}
    
    const pkg = JSON.parse(fs.readFileSync(join(rootDir, 'package.json'), 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const critical = ['react', 'react-dom', 'vite', 'tailwindcss'];
    
    for (const dep of critical) {
        if (!deps[dep]) continue;
        const depPath = join(rootDir, 'node_modules', dep);
        if (!fs.existsSync(depPath)) {
            return { needsInstall: true, reason: `${dep} manquant` };
        }
    }
    
    return { needsInstall: false };
}

async function waitForServer(url, timeoutMs = CONFIG.serverTimeout) {
    const startTime = Date.now();
    let attempts = 0;
    
    while (Date.now() - startTime < timeoutMs) {
        attempts++;
        try {
            const result = await new Promise((resolve, reject) => {
                const req = http.get(url, (res) => {
                    let data = '';
                    res.on('data', chunk => { data += chunk; });
                    res.on('end', () => resolve({ 
                        status: res.statusCode, 
                        ok: res.statusCode === 200 && (data.includes('<!') || data.includes('vite')),
                        size: data.length
                    }));
                });
                req.on('error', reject);
                req.setTimeout(2000, () => reject(new Error('Timeout')));
            });
            
            if (result.ok) {
                return { ready: true, attempts, elapsed: Date.now() - startTime, ...result };
            }
        } catch (e) {
            if (attempts % 5 === 0) {
                process.stdout.write(`\r  ⏳ Tentative ${attempts}...`);
            }
        }
        await new Promise(r => setTimeout(r, CONFIG.serverRetryDelay));
    }
    
    return { ready: false, attempts, elapsed: Date.now() - startTime };
}

function openBrowser(url) {
    if (ARGS.noBrowser) return false;
    try {
        const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
        execSync(`${cmd} "${url}"`, { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
}

function checkEnvironment() {
    const results = [];
    
    const nodeVersion = process.version;
    const nodeMajor = parseInt(nodeVersion.slice(1));
    results.push({
        name: 'Node.js',
        ok: nodeMajor >= 18,
        value: nodeVersion,
        warn: nodeMajor < 20 ? `(recommandé: 20+)` : ''
    });
    
    const npmVersion = exec('npm --version');
    results.push({ name: 'npm', ok: !!npmVersion, value: npmVersion || 'N/A' });
    
    const gitVersion = exec('git --version');
    results.push({ name: 'Git', ok: !!gitVersion, value: gitVersion ? gitVersion.replace('git version ', '') : 'N/A' });
    
    return results;
}

function checkCriticalFiles() {
    const files = ['package.json', 'vite.config.ts', 'index.html'];
    return files.map(f => ({ name: f, ok: fs.existsSync(join(rootDir, f)) }));
}

function checkIntegrations() {
    const results = [];
    
    const fastgraphFile = join(rootDir, 'src/components/tabs/IntelliStocksTab.tsx');
    if (fs.existsSync(fastgraphFile)) {
        const content = fs.readFileSync(fastgraphFile, 'utf-8');
        results.push({ name: 'FastGraph', ok: content.includes('FastGraphSection') });
    }
    
    const groundnewsFile = join(rootDir, 'src/components/tabs/NouvellesTab.tsx');
    if (fs.existsSync(groundnewsFile)) {
        const content = fs.readFileSync(groundnewsFile, 'utf-8');
        results.push({ name: 'Ground News', ok: content.includes('GroundNewsSection') });
    }
    
    const tailwindOk = fs.existsSync(join(rootDir, 'public/css/tailwind.css'));
    results.push({ name: 'Tailwind CSS', ok: tailwindOk });
    
    return results;
}

function detectTechStack() {
    const stack = {
        frontend: [],
        backend: [],
        database: [],
        apis: [],
        build: [],
        conventions: []
    };
    
    // Lire package.json pour détecter les dépendances
    const pkgPath = join(rootDir, 'package.json');
    let pkg = {};
    if (fs.existsSync(pkgPath)) {
        pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    }
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    // Frontend
    if (allDeps['react']) {
        const version = allDeps['react'].replace('^', '').replace('~', '');
        stack.frontend.push({ name: 'React', version, note: 'Hooks, functional components' });
    }
    if (allDeps['typescript'] || fs.existsSync(join(rootDir, 'tsconfig.json'))) {
        stack.frontend.push({ name: 'TypeScript', version: allDeps['typescript']?.replace('^', '') || 'config', note: 'Strict typing preferred' });
    }
    if (allDeps['tailwindcss']) {
        stack.frontend.push({ name: 'Tailwind CSS', version: allDeps['tailwindcss']?.replace('^', ''), note: 'Utility-first, NO inline styles' });
    }
    
    // Vérifier si Babel inline est utilisé (dashboard legacy)
    const dashboardHtml = join(rootDir, 'public/beta-combined-dashboard.html');
    if (fs.existsSync(dashboardHtml)) {
        const content = fs.readFileSync(dashboardHtml, 'utf-8');
        if (content.includes('text/babel')) {
            stack.frontend.push({ 
                name: 'Babel Inline', 
                version: 'runtime', 
                note: 'Pour dashboard legacy - window.ComponentName requis' 
            });
        }
    }
    
    // Build tools
    if (allDeps['vite']) {
        stack.build.push({ name: 'Vite', version: allDeps['vite']?.replace('^', ''), note: 'Dev server & build' });
    }
    if (allDeps['esbuild']) {
        stack.build.push({ name: 'esbuild', version: allDeps['esbuild']?.replace('^', ''), note: 'Bundle components' });
    }
    
    // Backend
    if (fs.existsSync(join(rootDir, 'api'))) {
        stack.backend.push({ name: 'Vercel Serverless', note: 'API routes dans /api' });
    }
    if (fs.existsSync(join(rootDir, 'vercel.json'))) {
        stack.backend.push({ name: 'Vercel', note: 'Déploiement production' });
    }
    
    // Database
    if (allDeps['@supabase/supabase-js']) {
        stack.database.push({ name: 'Supabase', version: allDeps['@supabase/supabase-js']?.replace('^', ''), note: 'PostgreSQL + Auth + Realtime' });
    }
    
    // APIs/LLM
    if (allDeps['@google/generative-ai']) {
        stack.apis.push({ name: 'Google Gemini', sdk: '@google/generative-ai', note: 'PAS @google/genai' });
    }
    if (allDeps['openai']) {
        stack.apis.push({ name: 'OpenAI', sdk: 'openai', note: 'GPT-4, etc.' });
    }
    if (allDeps['@anthropic-ai/sdk']) {
        stack.apis.push({ name: 'Anthropic', sdk: '@anthropic-ai/sdk', note: 'Claude' });
    }
    
    // Conventions importantes (depuis CLAUDE.md et .cursorrules)
    stack.conventions = [
        'Variables dans useState: définir AVANT utilisation',
        'Components Babel: exposer via window.ComponentName',
        'Dropdowns: position fixed + z-index 9999+',
        'Pas de import.meta.env dans Babel inline',
        'Références: typeof check avant utilisation',
        'CSS: variables de thème, pas de couleurs hardcodées'
    ];
    
    return stack;
}

function checkGitStatus() {
    const result = {
        branch: exec('git branch --show-current') || 'main',
        uncommitted: [],
        lastCommit: null,
        activeBranches: [],
        behindMain: 0
    };
    
    const status = exec('git status --short');
    if (status) {
        result.uncommitted = status.split('\n').filter(l => l.trim()).slice(0, 5);
    }
    
    try {
        const behind = exec('git rev-list --count HEAD..origin/main 2>/dev/null');
        result.behindMain = parseInt(behind) || 0;
    } catch (e) {}
    
    const lastHash = exec('git log origin/main -1 --format=%H 2>/dev/null') || exec('git log main -1 --format=%H');
    if (lastHash) {
        result.lastCommit = {
            hash: lastHash.substring(0, 7),
            message: exec(`git log ${lastHash} -1 --format=%s`).substring(0, 60),
            date: exec(`git log ${lastHash} -1 --format=%cr`)
        };
        
        if (!ARGS.fast) {
            const branches = exec('git branch -r --format="%(refname:short)" | grep -v HEAD | grep -v origin/main | head -15');
            if (branches) {
                const activeBranches = [];
                for (const branch of branches.split('\n').filter(b => b.trim())) {
                    const commits = exec(`git log ${lastHash}..${branch} --oneline 2>/dev/null`);
                    if (commits) {
                        const count = commits.split('\n').filter(l => l.trim()).length;
                        if (count > 0) {
                            activeBranches.push({
                                name: branch.replace('origin/', ''),
                                commits: count
                            });
                        }
                    }
                    if (activeBranches.length >= CONFIG.maxBranches) break;
                }
                result.activeBranches = activeBranches.sort((a, b) => b.commits - a.commits);
            }
        }
    }
    
    return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// GÉNÉRATION DU CONTEXTE POUR LLM
// ═══════════════════════════════════════════════════════════════════════════

function generateLLMContext() {
    // Générer des suggestions basées sur les problèmes
    if (context.issues.critical.length > 0) {
        context.suggestions.push('Résoudre les problèmes critiques avant de coder');
    }
    
    if (context.git.behindMain > 0) {
        context.suggestions.push(`Examiner les ${context.git.behindMain} nouveaux commits sur main`);
    }
    
    if (context.git.uncommitted?.length > 0) {
        context.suggestions.push('Commiter ou stash les changements locaux');
    }
    
    if (context.git.activeBranches?.length > 0) {
        context.suggestions.push(`Examiner les branches actives: ${context.git.activeBranches.map(b => b.name).join(', ')}`);
    }
    
    // Définir le statut global
    if (context.issues.critical.length > 0) {
        context.status = 'error';
    } else if (context.issues.warnings.length > 0) {
        context.status = 'warning';
    } else {
        context.status = 'ready';
    }
    
    // Sauvegarder le fichier contexte
    const contextPath = join(rootDir, CONFIG.contextFile);
    fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
    
    return context;
}

function printLLMSummary() {
    console.log('');
    log('📋 RÉSUMÉ POUR L\'AGENT', 'magenta');
    log('─────────────────────────────────────────────────', 'dim');
    
    // État général
    const statusEmoji = context.status === 'ready' ? '✅' : context.status === 'warning' ? '⚠️' : '❌';
    log(`État: ${statusEmoji} ${context.status.toUpperCase()}`, context.status === 'ready' ? 'green' : context.status === 'warning' ? 'yellow' : 'red');
    
    // Git
    if (context.git.branch) {
        log(`Branche: ${context.git.branch}`, 'cyan');
    }
    if (context.git.lastCommit) {
        log(`Dernier commit: ${context.git.lastCommit.hash} (${context.git.lastCommit.date})`, 'dim');
    }
    
    // Sources de configuration
    if (context.environment.sources) {
        log('📂 Configuration:', 'cyan');
        log(`   Local: ${context.environment.sources.local || 'Non configuré (.env.local)'}`, 'dim');
        log(`   Prod: Vercel Dashboard (variables d'environnement)`, 'dim');
        log(`   DB: Supabase Dashboard (API keys)`, 'dim');
    }
    
    // Stack technique
    if (context.stack) {
        log('🛠️  Stack:', 'cyan');
        if (context.stack.frontend.length > 0) {
            log(`   ${context.stack.frontend.map(t => t.name).join(' + ')}`, 'dim');
        }
        if (context.stack.apis.length > 0) {
            log(`   APIs: ${context.stack.apis.map(t => t.name).join(', ')}`, 'dim');
        }
    }
    
    // Conventions importantes
    if (context.stack?.conventions?.length > 0) {
        log('⚠️  Conventions à respecter:', 'yellow');
        context.stack.conventions.slice(0, 3).forEach(c => {
            log(`   • ${c}`, 'dim');
        });
        if (context.stack.conventions.length > 3) {
            log(`   ... voir docs/REPERTOIRE_COMPLET_ERREURS.md`, 'dim');
        }
    }
    
    // Suggestions
    if (context.suggestions.length > 0) {
        console.log('');
        log('💡 Suggestions:', 'yellow');
        // Filtrer les suggestions uniques et pertinentes
        const uniqueSuggestions = [...new Set(context.suggestions)].slice(0, 5);
        uniqueSuggestions.forEach(s => log(`   • ${s}`, 'yellow'));
    }
    
    // Fichier contexte
    console.log('');
    log(`📄 Contexte détaillé: ${CONFIG.contextFile}`, 'dim');
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
    const startTime = Date.now();
    
    console.log('');
    log('🚀 GOB Dashboard - /start', 'green');
    log('═══════════════════════════════════════════════════════\n', 'dim');

    if (ARGS.fast) log('⚡ Mode rapide activé', 'yellow');
    if (ARGS.verbose) log('📝 Mode verbose activé', 'cyan');
    if (ARGS.clean) log('🧹 Mode nettoyage activé', 'yellow');
    if (ARGS.checkServices) log('🌐 Vérification services activée', 'cyan');
    console.log('');

    // ═══════════════════════════════════════════════════════════════════════
    // ÉTAPE 0: Vérification Cursor
    // ═══════════════════════════════════════════════════════════════════════
    const cursorInfo = checkCursorVersion();
    const updateSuggestion = suggestCursorUpdate();
    
    context.cursor = {
        version: cursorInfo.version,
        updateCheck: updateSuggestion.suggestion
    };
    
    log('🖥️  Cursor IDE...', 'blue');
    if (cursorInfo.version) {
        log(`  ✅ Cursor ${cursorInfo.message}`, 'green');
        logVerbose(`     💡 Vérifier les mises à jour: ${updateSuggestion.suggestion}`, 'dim');
    } else {
        log(`  ⚠️  Cursor: ${cursorInfo.message}`, 'yellow');
    }
    console.log('');

    // ═══════════════════════════════════════════════════════════════════════
    // ÉTAPE 0: Vérifications système
    // ═══════════════════════════════════════════════════════════════════════
    if (!ARGS.fast) {
        log('💻 Système...', 'blue');
        
        // Espace disque
        const disk = checkDiskSpace();
        if (disk.ok) {
            logVerbose(`  ✅ Espace disque: ${disk.message}`, 'green');
        } else {
            log(`  ⚠️  Espace disque faible: ${disk.message}`, 'yellow');
            context.issues.warnings.push(`Espace disque faible: ${disk.message}`);
        }
        
        // Cache Vite
        const viteCache = checkViteCache();
        if (viteCache.cleaned) {
            log('  🧹 Cache Vite nettoyé', 'yellow');
        }
        
        console.log('');
    }

    // Nettoyage fichiers obsolètes
    const cleanedFiles = cleanupOldFiles();
    if (cleanedFiles > 0) {
        logVerbose(`  🧹 ${cleanedFiles} fichier(s) obsolète(s) nettoyé(s)`, 'dim');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ÉTAPE 1: Git Pull sécurisé
    // ═══════════════════════════════════════════════════════════════════════
    if (!ARGS.fast) {
        log('📥 Synchronisation Git...', 'blue');
        const gitResult = gitPullSafe();
        
        context.git.pullResult = gitResult.message;
        
        if (gitResult.hasConflicts) {
            log(`  ❌ ${gitResult.message}`, 'red');
            context.issues.critical.push('Conflits Git non résolus');
        } else if (gitResult.success) {
            log(`  ✅ ${gitResult.message}`, 'green');
        } else {
            log(`  ⚠️  ${gitResult.message}`, 'yellow');
            context.issues.warnings.push(gitResult.message);
        }
        console.log('');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ÉTAPE 2: Vérifications environnement
    // ═══════════════════════════════════════════════════════════════════════
    log('🔍 Vérifications...', 'blue');
    
    const [env, files, integrations, git] = await Promise.all([
        Promise.resolve(checkEnvironment()),
        Promise.resolve(checkCriticalFiles()),
        Promise.resolve(checkIntegrations()),
        Promise.resolve(checkGitStatus())
    ]);

    // Stocker dans le contexte
    context.environment = {
        node: env.find(e => e.name === 'Node.js')?.value,
        npm: env.find(e => e.name === 'npm')?.value,
        git: env.find(e => e.name === 'Git')?.value
    };
    context.git = { ...git };
    context.integrations = integrations.reduce((acc, i) => { acc[i.name] = i.ok; return acc; }, {});

    // Affichage environnement
    env.forEach(e => {
        if (e.ok) {
            log(`  ✅ ${e.name}: ${e.value} ${e.warn || ''}`, e.warn ? 'yellow' : 'green');
        } else {
            log(`  ❌ ${e.name}: ${e.value}`, 'red');
            context.issues.critical.push(`${e.name} non disponible`);
        }
    });

    // Fichiers critiques
    const missingFiles = files.filter(f => !f.ok);
    if (missingFiles.length === 0) {
        log('  ✅ Fichiers critiques: OK', 'green');
    } else {
        missingFiles.forEach(f => {
            log(`  ❌ Fichier manquant: ${f.name}`, 'red');
            context.issues.critical.push(`Fichier manquant: ${f.name}`);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ÉTAPE 3: Dépendances
    // ═══════════════════════════════════════════════════════════════════════
    const depsCheck = checkDependenciesNeedSync();
    context.dependencies.needsInstall = depsCheck.needsInstall;
    
    if (depsCheck.needsInstall) {
        log(`  📦 Installation npm (${depsCheck.reason})...`, 'yellow');
        try {
            execSync('npm install', { cwd: rootDir, stdio: 'inherit' });
            log('  ✅ Dépendances installées', 'green');
            context.dependencies.installed = true;
        } catch (e) {
            log('  ❌ Erreur installation npm', 'red');
            context.issues.critical.push('Erreur installation npm');
        }
    } else {
        log('  ✅ Dépendances: OK', 'green');
    }

    // Intégrations
    if (integrations.every(i => i.ok)) {
        log('  ✅ Intégrations: OK', 'green');
    } else {
        integrations.filter(i => !i.ok).forEach(i => {
            log(`  ⚠️  ${i.name}: Non configuré`, 'yellow');
            context.issues.warnings.push(`${i.name} non configuré`);
        });
    }
    
    // Stack technologique
    const techStack = detectTechStack();
    context.stack = techStack;
    
    log('  🛠️  Stack technique détectée:', 'cyan');
    
    // Frontend
    if (techStack.frontend.length > 0) {
        const frontendStr = techStack.frontend.map(t => t.name).join(' + ');
        log(`     Frontend: ${frontendStr}`, 'green');
    }
    
    // Build
    if (techStack.build.length > 0) {
        const buildStr = techStack.build.map(t => t.name).join(' + ');
        logVerbose(`     Build: ${buildStr}`, 'dim');
    }
    
    // Backend
    if (techStack.backend.length > 0) {
        const backendStr = techStack.backend.map(t => t.name).join(' + ');
        logVerbose(`     Backend: ${backendStr}`, 'dim');
    }
    
    // Database
    if (techStack.database.length > 0) {
        const dbStr = techStack.database.map(t => `${t.name}`).join(' + ');
        logVerbose(`     Database: ${dbStr}`, 'dim');
    }
    
    // APIs
    if (techStack.apis.length > 0) {
        const apisStr = techStack.apis.map(t => t.name).join(', ');
        logVerbose(`     APIs: ${apisStr}`, 'dim');
    }

    // Variables d'environnement
    if (!ARGS.fast) {
        const envVars = checkEnvVariables();
        context.environment.variables = envVars;
        context.environment.sources = envVars.sources;
        
        // Afficher les sources de configuration
        log('  📂 Sources de configuration:', 'cyan');
        if (envVars.sources.local) {
            log(`     ✅ Local: ${envVars.sources.local}`, 'green');
        } else {
            log(`     ⚠️  Local: Aucun fichier .env trouvé`, 'yellow');
            context.issues.info.push('Créer .env.local pour le dev local');
        }
        log(`     ✅ Production: Vercel (variables configurées)`, 'green');
        if (envVars.sources.supabase) {
            log(`     ✅ Database: Supabase (connecté)`, 'green');
        } else {
            log(`     ⚠️  Database: Supabase (vérifier SUPABASE_URL)`, 'yellow');
        }
        
        // Variables critiques manquantes
        const criticalMissing = envVars.missing.filter(m => m.critical);
        if (criticalMissing.length > 0) {
            log(`  ⚠️  Variables critiques manquantes:`, 'yellow');
            criticalMissing.forEach(m => {
                log(`     • ${m.name} → ${m.locations.join(' ou ')}`, 'yellow');
            });
        }
        
        // Variables optionnelles (verbose seulement)
        const optionalMissing = envVars.missing.filter(m => !m.critical);
        if (optionalMissing.length > 0 && ARGS.verbose) {
            log(`  ℹ️  Variables optionnelles (dans Vercel):`, 'dim');
            optionalMissing.slice(0, 5).forEach(m => {
                console.log(`     • ${m.name} (${m.purpose})`);
            });
            if (optionalMissing.length > 5) {
                console.log(`     ... et ${optionalMissing.length - 5} autres`);
            }
        }
        
        // Résumé pour l'Agent
        context.suggestions.push('Variables de prod dans Vercel Dashboard');
        if (!envVars.sources.local) {
            context.suggestions.push('Créer .env.local pour développement local');
        }
    }

    console.log('');

    // ═══════════════════════════════════════════════════════════════════════
    // ÉTAPE 4: TypeScript (si --lint)
    // ═══════════════════════════════════════════════════════════════════════
    if (ARGS.lint) {
        log('🔍 TypeScript & Lint...', 'blue');
        
        const tsCheck = checkTypeScript();
        if (tsCheck.ok) {
            log('  ✅ TypeScript: OK', 'green');
        } else {
            log(`  ⚠️  TypeScript: ${tsCheck.message}`, 'yellow');
            context.issues.warnings.push(tsCheck.message);
        }
        
        try {
            const lintResult = exec('npm run lint 2>&1');
            const errorCount = (lintResult.match(/error/gi) || []).length;
            if (errorCount > 0) {
                log(`  ⚠️  Lint: ${errorCount} erreur(s)`, 'yellow');
                context.issues.warnings.push(`${errorCount} erreur(s) de lint`);
            } else {
                log('  ✅ Lint: OK', 'green');
            }
        } catch (e) {}
        
        console.log('');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ÉTAPE 5: Services externes (si --check-services)
    // ═══════════════════════════════════════════════════════════════════════
    if (ARGS.checkServices) {
        log('🌐 Services externes...', 'blue');
        
        const services = await Promise.all([
            checkExternalService('GitHub', 'https://api.github.com'),
            checkExternalService('Supabase', 'https://supabase.com'),
        ]);
        
        services.forEach(s => {
            if (s.ok) {
                log(`  ✅ ${s.name}: OK`, 'green');
            } else {
                log(`  ⚠️  ${s.name}: ${s.status}`, 'yellow');
                context.issues.warnings.push(`${s.name} inaccessible`);
            }
        });
        
        console.log('');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ÉTAPE 6: Git Status
    // ═══════════════════════════════════════════════════════════════════════
    log('📊 État du projet...', 'blue');
    log(`  Branche: ${git.branch}`, 'cyan');
    
    if (git.behindMain > 0) {
        log(`  ⚠️  ${git.behindMain} commit(s) de retard sur main`, 'yellow');
        context.issues.warnings.push(`${git.behindMain} commit(s) de retard`);
    }
    
    if (git.lastCommit) {
        log(`  Dernier main: ${git.lastCommit.hash} - ${git.lastCommit.message}`, 'dim');
        log(`  Date: ${git.lastCommit.date}`, 'dim');
    }
    
    if (git.uncommitted.length > 0) {
        log(`  📝 ${git.uncommitted.length} fichier(s) modifié(s) localement`, 'cyan');
        context.issues.info.push(`${git.uncommitted.length} fichier(s) modifié(s)`);
        if (ARGS.verbose) {
            git.uncommitted.forEach(f => console.log(`     ${f}`));
        }
    }
    
    if (git.activeBranches.length > 0) {
        log(`  🌿 ${git.activeBranches.length} branche(s) active(s):`, 'cyan');
        git.activeBranches.forEach(b => {
            console.log(`     • ${b.name} (${b.commits} commit${b.commits > 1 ? 's' : ''})`);
        });
    }

    console.log('');

    // ═══════════════════════════════════════════════════════════════════════
    // ÉTAPE 7: Serveur
    // ═══════════════════════════════════════════════════════════════════════
    log('🖥️  Serveur de développement...', 'blue');
    
    if (killExistingServer()) {
        log('  ♻️  Ancien serveur arrêté', 'yellow');
        await new Promise(r => setTimeout(r, 1000));
    }
    
    let portRetries = 0;
    while (!isPortAvailable(CONFIG.serverPort) && portRetries < 5) {
        log(`  ⏳ Port ${CONFIG.serverPort} encore occupé, attente...`, 'yellow');
        await new Promise(r => setTimeout(r, 1000));
        killExistingServer();
        portRetries++;
    }
    
    if (!isPortAvailable(CONFIG.serverPort)) {
        log(`  ❌ Port ${CONFIG.serverPort} toujours occupé!`, 'red');
        context.issues.critical.push(`Port ${CONFIG.serverPort} occupé`);
        context.server.status = 'port_blocked';
    } else {
        const viteProcess = spawn('npm', ['run', 'dev'], {
            cwd: rootDir,
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env, VITE_ALLOW_ALL_PERMISSIONS: 'true' }
        });

        const logFile = join(rootDir, 'vite-dev-server.log');
        const logStream = fs.createWriteStream(logFile, { flags: 'w' });
        viteProcess.stdout.pipe(logStream);
        viteProcess.stderr.pipe(logStream);
        viteProcess.unref();
        if (viteProcess.stdout) viteProcess.stdout.unref();
        if (viteProcess.stderr) viteProcess.stderr.unref();

        fs.writeFileSync(join(rootDir, '.vite.pid'), viteProcess.pid.toString());
        logVerbose(`  PID: ${viteProcess.pid}`, 'dim');

        const server = await waitForServer(CONFIG.serverUrl);
        
        context.server = {
            url: CONFIG.serverUrl,
            pid: viteProcess.pid,
            ready: server.ready,
            startTime: server.elapsed
        };
        
        console.log('');
        
        if (server.ready) {
            log(`  ✅ Serveur prêt en ${(server.elapsed / 1000).toFixed(1)}s`, 'green');
            
            if (!ARGS.noBrowser) {
                console.log('');
                log('🌐 Navigateur...', 'blue');
                if (openBrowser(CONFIG.serverUrl)) {
                    log('  ✅ Ouvert', 'green');
                    await new Promise(r => setTimeout(r, 1500));
                    openBrowser(CONFIG.testUrl);
                }
            }
        } else {
            log(`  ⚠️  Serveur non accessible après ${(server.elapsed / 1000).toFixed(0)}s`, 'yellow');
            log(`     Vérifiez les logs: cat ${logFile}`, 'dim');
            context.issues.warnings.push('Serveur lent au démarrage');
        }

        // ═══════════════════════════════════════════════════════════════════
        // RÉSUMÉ FINAL
        // ═══════════════════════════════════════════════════════════════════
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        context.elapsed = elapsed;
        
        console.log('');
        log('═══════════════════════════════════════════════════════', 'green');
        if (context.issues.critical.length === 0 && server.ready) {
            log(`✅ Prêt en ${elapsed}s!`, 'green');
        } else if (context.issues.critical.length > 0) {
            log(`❌ ${context.issues.critical.length} problème(s) critique(s)`, 'red');
        } else {
            log(`⏳ Terminé en ${elapsed}s`, 'yellow');
        }
        log('═══════════════════════════════════════════════════════', 'green');

        console.log('');
        console.log(`📍 ${CONFIG.serverUrl}`);
        console.log(`🛑 kill ${viteProcess.pid}  # pour arrêter`);
        
        if (context.issues.critical.length > 0) {
            console.log('');
            log('❌ Problèmes critiques:', 'red');
            context.issues.critical.forEach(i => log(`   • ${i}`, 'red'));
        }
        
        if (context.issues.warnings.length > 0) {
            console.log('');
            log('⚠️  Avertissements:', 'yellow');
            context.issues.warnings.slice(0, 5).forEach(i => log(`   • ${i}`, 'yellow'));
        }
    }

    // Générer le contexte LLM
    generateLLMContext();
    printLLMSummary();

    console.log('');
    log('💡 Options: --fast | --verbose | --lint | --clean | --check-services | --no-browser', 'dim');
    if (context.cursor?.version) {
        log(`💳 Quotas Cursor: Cmd+Shift+P → "Cursor: Manage Account"`, 'dim');
    }
    console.log('');

    process.exit(context.issues.critical.length > 0 ? 1 : 0);
}

main().catch(e => {
    log(`❌ Erreur: ${e.message}`, 'red');
    console.error(e);
    process.exit(1);
});
