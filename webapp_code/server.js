/**
 * Application Web Intermédiaire pour l'API Alpha Vantage SECTOR
 * 
 * Cette application sert d'intermédiaire pour contourner les restrictions réseau
 * et fournir les données sectorielles aux classeurs Excel.
 * 
 * Endpoints:
 * - GET /api/sector : Récupère le JSON brut de l'API SECTOR d'Alpha Vantage
 * - GET /api/index : Calcule la performance pondérée d'un indice (MSCI World, S&P/TSX)
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'QGSG95SDH5SE52XS';
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Cache simple en mémoire (TTL: 60 secondes pour respecter les limites de l'API)
const cache = {
  data: null,
  timestamp: null,
  ttl: 60000 // 60 secondes
};

// Mapping des secteurs Alpha Vantage vers les noms standardisés
const SECTOR_MAPPING = {
  'Communication Services': 'Communication Services',
  'Consumer Discretionary': 'Consommation discrétionnaire',
  'Consumer Staples': 'Consommation courante',
  'Energy': 'Énergie',
  'Financials': 'Financiers',
  'Health Care': 'Santé',
  'Industrials': 'Industriels',
  'Information Technology': 'Technologie de l\'information',
  'Materials': 'Matériaux',
  'Real Estate': 'Immobilier',
  'Utilities': 'Services publics'
};

// Pondérations sectorielles MSCI World (juillet 2025)
const MSCI_WORLD_WEIGHTS = {
  'Technologie de l\'information': 26.9,
  'Financiers': 16.7,
  'Industriels': 11.4,
  'Consommation discrétionnaire': 10.1,
  'Santé': 9.12,
  'Services de communication': 8.48,
  'Consommation courante': 5.75,
  'Énergie': 3.52,
  'Matériaux': 3.15,
  'Services publics': 2.65,
  'Immobilier': 1.97
};

// Pondérations sectorielles S&P/TSX (31 décembre 2024)
const SPTSX_WEIGHTS = {
  'Financiers': 33.0,
  'Énergie': 17.1,
  'Industriels': 12.6,
  'Technologie de l\'information': 10.1,
  'Matériaux': 11.4,
  'Consommation courante': 4.0,
  'Consommation discrétionnaire': 3.3,
  'Services de communication': 2.4,
  'Immobilier': 2.0,
  'Services publics': 3.8,
  'Santé': 0.3
};

/**
 * Récupère les données sectorielles depuis Alpha Vantage avec cache
 */
async function fetchSectorData() {
  // Vérifier le cache
  if (cache.data && cache.timestamp && (Date.now() - cache.timestamp) < cache.ttl) {
    console.log('📦 Utilisation du cache');
    return cache.data;
  }

  try {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=SECTOR&apikey=${ALPHA_VANTAGE_API_KEY}`;
    console.log(`🔍 Appel Alpha Vantage: ${url.replace(ALPHA_VANTAGE_API_KEY, '***')}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Vérifier les erreurs de l'API
    if (data.Note) {
      throw new Error(`Quota Alpha Vantage dépassé: ${data.Note}`);
    }
    
    if (data.Information) {
      throw new Error(`Information API: ${data.Information}`);
    }

    if (!data['Rank A: Real-Time Performance']) {
      throw new Error('Format de réponse inattendu de l\'API Alpha Vantage');
    }

    // Mettre en cache
    cache.data = data;
    cache.timestamp = Date.now();

    console.log('✅ Données sectorielles récupérées et mises en cache');
    return data;

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des données:', error.message);
    throw error;
  }
}

/**
 * Convertit le nom de secteur Alpha Vantage vers le nom standardisé
 */
function normalizeSectorName(alphaVantageName) {
  // Chercher dans le mapping
  for (const [avName, stdName] of Object.entries(SECTOR_MAPPING)) {
    if (alphaVantageName === avName || alphaVantageName.includes(avName)) {
      return stdName;
    }
  }
  // Si non trouvé, retourner tel quel
  return alphaVantageName;
}

/**
 * Extrait la performance d'un secteur pour un horizon donné
 */
function getSectorPerformance(sectorData, sectorName, horizon) {
  const rankKey = `Rank ${horizon}`;
  
  if (!sectorData[rankKey]) {
    return null;
  }

  const normalizedName = normalizeSectorName(sectorName);
  const performance = sectorData[rankKey][sectorName];

  if (performance === undefined || performance === null) {
    return null;
  }

  return {
    sector: normalizedName,
    performance: parseFloat(performance),
    originalName: sectorName
  };
}

/**
 * Calcule la performance pondérée d'un indice
 */
function calculateIndexPerformance(sectorData, indexName, horizon) {
  const weights = indexName.toLowerCase() === 'msci_world' ? MSCI_WORLD_WEIGHTS : SPTSX_WEIGHTS;
  const rankKey = `Rank ${horizon}`;

  if (!sectorData[rankKey]) {
    throw new Error(`Horizon "${horizon}" non trouvé dans les données`);
  }

  const contributions = [];
  let totalPerformance = 0;
  let totalWeight = 0;

  // Parcourir tous les secteurs dans les données
  for (const [sectorName, performance] of Object.entries(sectorData[rankKey])) {
    const normalizedSector = normalizeSectorName(sectorName);
    const weight = weights[normalizedSector];

    if (weight !== undefined) {
      const perf = parseFloat(performance);
      if (!isNaN(perf)) {
        const contribution = (weight / 100) * perf;
        contributions.push({
          sector: normalizedSector,
          originalName: sectorName,
          weight: weight,
          performance: perf,
          contribution: contribution
        });
        totalPerformance += contribution;
        totalWeight += weight;
      }
    }
  }

  // Normaliser si le total des poids n'est pas exactement 100%
  if (totalWeight !== 100) {
    const adjustmentFactor = 100 / totalWeight;
    totalPerformance = totalPerformance * adjustmentFactor;
    contributions.forEach(c => {
      c.weight = c.weight * adjustmentFactor;
      c.contribution = c.contribution * adjustmentFactor;
    });
  }

  return {
    index: indexName,
    horizon: horizon,
    totalPerformance: totalPerformance,
    totalWeight: totalWeight,
    contributions: contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
  };
}

// ==================== ENDPOINTS ====================

/**
 * GET /api/sector
 * Récupère et renvoie le JSON brut de l'API SECTOR d'Alpha Vantage
 */
app.get('/api/sector', async (req, res) => {
  try {
    const data = await fetchSectorData();
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
      cached: (Date.now() - cache.timestamp) < cache.ttl
    });
  } catch (error) {
    console.error('Erreur /api/sector:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/index
 * Calcule la performance pondérée d'un indice
 * 
 * Paramètres:
 * - name: msci_world ou sptsx
 * - horizon: A, B, C, D, E, F, G, H, I, J (correspond à Rank A, Rank B, etc.)
 */
app.get('/api/index', async (req, res) => {
  try {
    const { name, horizon } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Paramètre "name" requis (msci_world ou sptsx)'
      });
    }

    if (!horizon) {
      return res.status(400).json({
        success: false,
        error: 'Paramètre "horizon" requis (A, B, C, D, E, F, G, H, I, ou J)'
      });
    }

    if (name !== 'msci_world' && name !== 'sptsx') {
      return res.status(400).json({
        success: false,
        error: 'Paramètre "name" doit être "msci_world" ou "sptsx"'
      });
    }

    const validHorizons = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    if (!validHorizons.includes(horizon.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Paramètre "horizon" doit être l'une des valeurs: ${validHorizons.join(', ')}`
      });
    }

    const sectorData = await fetchSectorData();
    const result = calculateIndexPerformance(sectorData, name, horizon.toUpperCase());

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur /api/index:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health
 * Endpoint de santé pour vérifier que le serveur fonctionne
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cacheAge: cache.timestamp ? Math.floor((Date.now() - cache.timestamp) / 1000) : null
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   - GET http://localhost:${PORT}/api/sector`);
  console.log(`   - GET http://localhost:${PORT}/api/index?name=msci_world&horizon=B`);
  console.log(`   - GET http://localhost:${PORT}/api/health`);
  console.log(`\n🔑 Clé API Alpha Vantage: ${ALPHA_VANTAGE_API_KEY.substring(0, 5)}***`);
});








