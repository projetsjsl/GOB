/**
 * Serveur Express pour Render
 * 
 * Ce serveur sert les fichiers statiques et monte les routes API
 * pour permettre le déploiement sur Render (au lieu de Vercel)
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware pour parser JSON et URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS global pour toutes les routes API
app.use('/api', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Route de santé pour Render health checks
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Montage dynamique des routes API
async function mountApiRoute(routePath, handlerPath) {
  try {
    const handlerModule = await import(handlerPath);
    const handler = handlerModule.default;
    
    if (typeof handler === 'function') {
      app.all(routePath, async (req, res) => {
        try {
          await handler(req, res);
        } catch (error) {
          console.error(`Erreur dans ${routePath}:`, error);
          if (!res.headersSent) {
            res.status(500).json({
              error: 'Erreur serveur',
              message: error.message
            });
          }
        }
      });
      return true;
    }
  } catch (error) {
    // Ignorer les erreurs silencieusement pour les fichiers qui ne sont pas des handlers
    return false;
  }
  return false;
}

// Fonction pour scanner et monter automatiquement toutes les routes API
async function scanAndMountApiRoutes(dir = './api', basePath = '/api') {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    let mountedCount = 0;
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = fullPath.replace(/\\/g, '/').replace(/^\.\//, '');
      
      if (entry.isDirectory()) {
        // Récursivement scanner les sous-dossiers
        const subPath = `${basePath}/${entry.name}`;
        mountedCount += await scanAndMountApiRoutes(fullPath, subPath);
      } else if (entry.isFile() && extname(entry.name) === '.js') {
        // Essayer de monter le fichier comme route API
        const routePath = entry.name === 'index.js' 
          ? basePath 
          : `${basePath}/${entry.name.replace(/\.js$/, '')}`;
        
        const mounted = await mountApiRoute(routePath, `./${relativePath}`);
        if (mounted) {
          mountedCount++;
          console.log(`✅ Route API montée: ${routePath}`);
        }
      }
    }
    
    return mountedCount;
  } catch (error) {
    console.warn(`⚠️ Erreur lors du scan de ${dir}:`, error.message);
    return 0;
  }
}

// Routes API prioritaires (montées en premier)
const priorityRoutes = [
  { path: '/api/health', file: './api/health-check-simple.js' },
  { path: '/api/chat', file: './api/chat.js' },
  { path: '/api/marketdata', file: './api/marketdata.js' },
  { path: '/api/marketdata/batch', file: './api/marketdata/batch.js' },
  { path: '/api/fmp', file: './api/fmp.js' },
  { path: '/api/gemini/chat', file: './api/gemini/chat.js' },
  { path: '/api/emma-agent', file: './api/emma-agent.js' },
  { path: '/api/emma-briefing', file: './api/emma-briefing.js' },
  { path: '/api/briefing', file: './api/briefing.js' },
  { path: '/api/supabase-watchlist', file: './api/supabase-watchlist.js' },
  { path: '/api/config/tickers', file: './api/config/tickers.js' },
  { path: '/api/calendar-economic', file: './api/calendar-economic.js' },
  { path: '/api/calendar-earnings', file: './api/calendar-earnings.js' },
  { path: '/api/calendar-dividends', file: './api/calendar-dividends.js' },
  { path: '/api/ai-services', file: './api/ai-services.js' },
  { path: '/api/news', file: './api/news.js' },
  { path: '/api/rsi-screener', file: './api/rsi-screener.js' },
  { path: '/api/treasury-rates', file: './api/treasury-rates.js' },
  { path: '/api/yield-curve', file: './api/yield-curve.js' },
  { path: '/api/finviz-news', file: './api/finviz-news.js' },
  { path: '/api/finviz-why-moving', file: './api/finviz-why-moving.js' },
  { path: '/api/adapters/sms', file: './api/adapters/sms.js' },
  { path: '/api/adapters/email', file: './api/adapters/email.js' },
  { path: '/api/adapters/messenger', file: './api/adapters/messenger.js' },
  { path: '/api/briefing-prompts', file: './api/briefing-prompts.js' },
  { path: '/api/theme-colors', file: './api/theme-colors.js' },
  { path: '/api/email-recipients', file: './api/email-recipients.js' },
  { path: '/api/briefing-schedule', file: './api/briefing-schedule.js' },
  { path: '/api/finnhub', file: './api/finnhub.js' }
];

// Monter d'abord les routes prioritaires
console.log('📦 Montage des routes API prioritaires...');
let priorityMounted = 0;
for (const route of priorityRoutes) {
  const mounted = await mountApiRoute(route.path, route.file);
  if (mounted) priorityMounted++;
}

// Ensuite scanner automatiquement le reste
console.log('🔍 Scan automatique des routes API...');
const autoMounted = await scanAndMountApiRoutes();
console.log(`✅ ${priorityMounted + autoMounted} routes API montées au total`);

// Servir les fichiers statiques UNIQUEMENT depuis public/ (source de vérité unique)
// Les fichiers dans dist/ sont des copies synchronisées automatiquement
const staticDirs = ['public'];
let staticDir = null;

for (const dir of staticDirs) {
  const fullPath = join(__dirname, dir);
  if (existsSync(fullPath)) {
    staticDir = fullPath;
    // Désactiver le cache pour les fichiers JavaScript et HTML
    app.use(express.static(fullPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          // Ajouter un timestamp pour forcer le rechargement
          res.setHeader('Last-Modified', new Date().toUTCString());
        }
      }
    }));
    console.log(`✅ Fichiers statiques servis depuis: ${dir}/ (source unique, cache désactivé)`);
    break;
  }
}

// Synchroniser automatiquement les fichiers dashboard au démarrage
try {
  const { syncDirectory } = require('./scripts/sync-dashboard-files.cjs');
  const sourceDir = join(__dirname, 'public/js/dashboard');
  const targetDir = join(__dirname, 'dist/js/dashboard');
  if (existsSync(sourceDir) && existsSync(join(__dirname, 'dist'))) {
    syncDirectory(sourceDir, targetDir);
    console.log('✅ Fichiers dashboard synchronisés automatiquement');
  }
} catch (error) {
  console.warn('⚠️  Synchronisation automatique non disponible:', error.message);
}

// Route de fallback pour SPA - rediriger vers le dashboard
app.get('/', (req, res) => {
  if (staticDir && existsSync(join(staticDir, 'beta-combined-dashboard.html'))) {
    return res.sendFile(join(staticDir, 'beta-combined-dashboard.html'));
  }
  res.redirect('/beta-combined-dashboard.html');
});

// Route pour index.html
app.get('/index.html', (req, res) => {
  if (staticDir && existsSync(join(staticDir, 'beta-combined-dashboard.html'))) {
    return res.sendFile(join(staticDir, 'beta-combined-dashboard.html'));
  }
  res.redirect('/beta-combined-dashboard.html');
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path,
    method: req.method
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📁 Fichiers statiques: ${staticDir || 'aucun trouvé'}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`❤️ Health check: http://localhost:${PORT}/health`);
});

