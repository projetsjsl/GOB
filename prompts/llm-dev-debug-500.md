# Prompt complet pour LLM dev/debug

Voici le prompt exhaustif a utiliser avec un LLM developpeur pour resoudre vos erreurs 500:

```markdown
# Contexte du projet

Je developpe une plateforme financiere full-stack avec React/Node.js, deployee sur Vercel, utilisant Supabase comme backend. L'application gere 1000+ profils d'actions boursieres avec sauvegarde de snapshots financiers.

## Stack technique
- **Frontend**: React (index.js avec hooks)
- **Backend**: API Routes Node.js sur Vercel
- **Base de donnees**: Supabase (PostgreSQL)
- **Deploiement**: Vercel
- **API externe**: Financial Modeling Prep (FMP)

## Fichiers concernes
```
appConfigApi.js (ligne 11, 13, 92)
profileApi.js (ligne 8, 43, 50)
index.js (lignes 35904, 35906, 57486, 57510, 60912, 61000)
```

---

# Probleme: Erreurs 500 massives et intermittentes

## Symptomes observes

### 1. Endpoint `app-config` (CRITIQUE - 100% echec)
```
GET https://gobapps.com/api/app-config?all=true
Status: 500 (Internal Server Error)
Frequence: Systematique, chaque appel echoue
Message: "Impossible de charger les configurations depuis Supabase, utilisation des valeurs par defaut"
```

**Call stack:**
```
loadAppConfig @ appConfigApi.js:11
  ↓
getConfigValue @ appConfigApi.js:92
  ↓
saveProfilesBatchToSupabase @ profileApi.js:43
  ↓
saveToSupabase @ index.js:57486
  ↓
saveProfiles @ index.js:57510
  ↓
handleSyncFromSupabase @ index.js:60912
```

### 2. Endpoint `finance-snapshots` (INTERMITTENT - ~30% echec)
```
POST https://gobapps.com/api/finance-snapshots
Status: 500 (Internal Server Error)
Comportement: Echoue aleatoirement, reussit apres 1-2 retries
```

**Exemples de tickers affectes:**
- AWI, DIS, CNH, CNP, BHP (retry 1/2 apres 1000ms)
- LAMR, GWO.TO, IEX, MFC-PB.TO, K.TO (retry 1/2)
- BLK, ETN, CNSWF, CSCO, EBRZF (retry 2/2 apres 2000ms)

**Pattern observe:**
```javascript
WARN: Snapshot error 500 for CPAY, retry 1/2 apres 1000ms...
saveSnapshot @ index.js:35904

OK: Snapshot saved: CPAY v1 (apres 1 retry)
```

### 3. Endpoints FMP (404 - secondaire)
```
GET /api/fmp-company-data?symbol=BHP
GET /api/fmp-company-data?symbol=CHDN
GET /api/fmp-sector-data?sector=Energy
Status: 404 (Not Found)
```

---

## Logs systeme cles

### Pattern de sauvegarde batch
```
Sauvegarde batch de 1001 profils dans Supabase...
EvaluationDetails: Donnees recues {
  dataLength: 27,
  lastYear: 2024,
  lastYearEPS: 3.44,
  lastYearCF: 3.66,
  lastYearBV: 20.1
}
```

### Retry logic actuel
```javascript
// La logique de retry fonctionne mais masque le probleme sous-jacent
WARN: Snapshot error 500 for BLK, retry 1/2 apres 1000ms...
WARN: Snapshot error 500 for BLK, retry 2/2 apres 2000ms...
OK: Snapshot saved: BLK v1 (apres 1 retry)
```

### Performance warning
```
[Violation] Forced reflow while executing JavaScript took 31ms
```

---

## Code suspects (a investiguer)

### appConfigApi.js
```javascript
// Ligne 11 - Ou l'erreur 500 se produit
export async function loadAppConfig() {
  try {
    const response = await fetch('/api/app-config?all=true');
    // Toujours 500 ici

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('Impossible de charger les configurations depuis Supabase, utilisation des valeurs par defaut');
    // Ligne 13 - Fallback
    return DEFAULT_CONFIG;
  }
}

// Ligne 92
export function getConfigValue(key) {
  const config = await loadAppConfig();
  return config[key] || DEFAULT_VALUES[key];
}
```

### profileApi.js
```javascript
// Ligne 8 - saveSnapshot appele ici
export async function saveProfileToSupabase(profile) {
  const snapshotResult = await saveSnapshot(profile);
  // ...
}

// Ligne 43 & 50 - Batch processing
export async function saveProfilesBatchToSupabase(profiles) {
  const batchSize = await getConfigValue('BATCH_SIZE'); // Appel config

  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize);

    await Promise.all(
      batch.map(profile => saveProfileToSupabase(profile)) // Ligne 50
    );
  }
}
```

### index.js
```javascript
// Ligne 35904 - Fonction saveSnapshot avec retry
async function saveSnapshot(profile) {
  const maxRetries = 2;
  const retryDelay = 1000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/finance-snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log(`Snapshot saved: ${profile.ticker} v1`);
      return await response.json();

    } catch (error) {
      if (attempt < maxRetries) {
        console.warn(`Snapshot error 500 for ${profile.ticker}, retry ${attempt + 1}/${maxRetries} apres ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      } else {
        console.error(`Failed to save ${profile.ticker} after ${maxRetries} retries`);
        throw error;
      }
    }
  }
}

// Ligne 57486 - saveToSupabase wrapper
async function saveToSupabase(profiles) {
  await saveProfilesBatchToSupabase(profiles);
}

// Ligne 57510 - saveProfiles trigger
async function saveProfiles(profiles) {
  console.log(`Sauvegarde batch de ${profiles.length} profils dans Supabase...`);
  await saveToSupabase(profiles);
}

// Ligne 60912 - Event handler
async function handleSyncFromSupabase() {
  const profiles = await fetchProfilesFromAPI();
  await saveProfiles(profiles);
}
```

---

## Questions specifiques pour diagnostic

### Backend (Vercel/Supabase)

1. **Endpoint `/api/app-config`:**
   - Quel est le code exact de ce endpoint?
   - Utilise-t-il Supabase client correctement?
   - Y a-t-il des logs serveur Vercel disponibles?
   - Les variables d'environnement (SUPABASE_URL, SUPABASE_ANON_KEY) sont-elles definies?

2. **Endpoint `/api/finance-snapshots`:**
   - Pourquoi echoue-t-il de maniere intermittente?
   - Y a-t-il des rate limits sur Supabase?
   - Le payload est-il trop gros (1001 profils)?
   - Y a-t-il des contraintes de concurrence (Promise.all sur 1001 items)?

3. **Configuration Supabase:**
   - Table `app_config` existe-t-elle?
   - Row Level Security (RLS) est-il configure?
   - Y a-t-il des timeouts cote base de donnees?
   - Les quotas Supabase sont-ils atteints?

### Frontend

4. **Race conditions:**
   - Y a-t-il plusieurs appels simultanes a `loadAppConfig()`?
   - Le cache de config est-il implemente?
   - Les appels batch sont-ils trop agressifs (1001 simultanes)?

5. **Network:**
   - Les erreurs 500 sont-elles liees a des timeouts?
   - Y a-t-il des CORS issues?
   - Le domaine gobapps.com est-il correctement configure sur Vercel?

---

## Hypotheses a tester

### Hypothese #1: Supabase connection pooling
```javascript
// Le client Supabase est-il reutilise ou recree a chaque appel?
// Verifier si createClient() est appele trop souvent
```

### Hypothese #2: Vercel serverless timeout
```javascript
// Les functions Vercel ont un timeout de 10s par defaut
// Sauvegarder 1001 profils pourrait depasser cette limite
```

### Hypothese #3: Promise.all overload
```javascript
// Sauvegarder 1001 snapshots en parallele via Promise.all
// Pourrait causer throttling cote Supabase
// Solution: implementer pLimit ou p-queue
```

### Hypothese #4: Missing error handling
```javascript
// L'endpoint /api/app-config ne log peut-etre pas l'erreur reelle
// Ajouter try-catch avec console.error(error.message, error.stack)
```

---

## Actions de debugging demandees

### Priorite 1: Diagnostic backend

1. **Ajouter logging exhaustif dans `/api/app-config`:**
```javascript
export default async function handler(req, res) {
  console.log('[app-config] Request received:', {
    method: req.method,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    console.log('[app-config] Supabase client created');

    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .single();

    if (error) {
      console.error('[app-config] Supabase error:', error);
      return res.status(500).json({
        error: error.message,
        code: error.code,
        details: error.details
      });
    }

    console.log('[app-config] Success:', data);
    return res.status(200).json(data);

  } catch (error) {
    console.error('[app-config] Caught exception:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
```

2. **Verifier les logs Vercel:**
   - Aller sur Vercel Dashboard > Project > Functions
   - Consulter les logs en temps reel pendant le deploiement
   - Chercher les erreurs stack trace

3. **Tester l'endpoint directement:**
```bash
curl -v https://gobapps.com/api/app-config?all=true
```

### Priorite 2: Rate limiting frontend

4. **Implementer p-limit pour controler la concurrence:**
```javascript
import pLimit from 'p-limit';

const limit = pLimit(10); // Max 10 concurrent requests

export async function saveProfilesBatchToSupabase(profiles) {
  const promises = profiles.map(profile =>
    limit(() => saveProfileToSupabase(profile))
  );

  await Promise.all(promises);
}
```

### Priorite 3: Configuration Supabase

5. **Verifier la table `app_config`:**
```sql
-- Verifier que la table existe
SELECT * FROM app_config LIMIT 1;

-- Verifier les RLS policies
SELECT * FROM pg_policies WHERE tablename = 'app_config';
```

6. **Verifier les quotas Supabase:**
   - Dashboard Supabase > Settings > Database
   - Verifier: Connections, API requests/min, Database size

---

## Solutions proposees

### Solution A: Caching de la config (quick fix)
```javascript
let configCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 60000; // 1 minute

export async function loadAppConfig() {
  const now = Date.now();

  if (configCache && (now - cacheTimestamp < CACHE_TTL)) {
    return configCache;
  }

  try {
    const response = await fetch('/api/app-config?all=true');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    configCache = await response.json();
    cacheTimestamp = now;
    return configCache;

  } catch (error) {
    console.warn('Config load failed, using defaults');
    return DEFAULT_CONFIG;
  }
}
```

### Solution B: Batch intelligent avec retry exponential
```javascript
async function saveWithExponentialBackoff(profile, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('/api/finance-snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (response.ok) return await response.json();

      // Si 429 (rate limit), attendre plus longtemps
      if (response.status === 429) {
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 2000));
        continue;
      }

      throw new Error(`HTTP ${response.status}`);

    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
}
```

### Solution C: Chunking des batches
```javascript
async function saveProfilesInChunks(profiles, chunkSize = 50) {
  for (let i = 0; i < profiles.length; i += chunkSize) {
    const chunk = profiles.slice(i, i + chunkSize);

    console.log(`Processing chunk ${i / chunkSize + 1}/${Math.ceil(profiles.length / chunkSize)}`);

    await Promise.all(
      chunk.map(profile => saveProfileToSupabase(profile))
    );

    // Pause entre chunks pour eviter rate limiting
    if (i + chunkSize < profiles.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}
```

---

## Informations a fournir

Pour resoudre ce probleme, j'ai besoin de:

1. **Code complet de `/api/app-config.js`** (ou .ts)
2. **Code complet de `/api/finance-snapshots.js`**
3. **Logs Vercel** des endpoints pendant les erreurs 500
4. **Variables d'environnement** (sans valeurs sensibles):
   ```
   SUPABASE_URL=***
   SUPABASE_ANON_KEY=***
   FMP_API_KEY=***
   ```
5. **Schema Supabase** de la table `app_config`:
   ```sql
   \d app_config
   ```
6. **Tier Vercel** (Hobby, Pro, Enterprise?)
7. **Plan Supabase** (Free, Pro, Enterprise?)

---

## Objectif final

Identifier et corriger la cause racine des erreurs 500 pour que:
- OK: `app-config` charge a 100% sans fallback
- OK: `finance-snapshots` sauvegarde sans retry necessaire
- OK: Les 1001 profils se sauvegardent de maniere fiable
- OK: Aucune erreur intermittente en production
```

***

Veux-tu que je cree ce prompt dans un fichier telechargeable ou que je t'aide a implementer directement une des solutions proposees?

Sources
[1] file.txt https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/117891440/e1a54349-f78c-45be-8e44-7142fd1fa0c1/file.txt
