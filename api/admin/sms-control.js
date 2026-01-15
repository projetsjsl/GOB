import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const ENV_PATH = path.join(process.cwd(), '.env.local');
let smsServerProcess = null;
let smsServerInfo = null;
let latestLogs = [];

const log = (message) => {
  const entry = `[${new Date().toISOString()}] ${message}`;
  latestLogs.push(entry);
  latestLogs = latestLogs.slice(-200);
  console.log(entry);
};

const readEnvFile = async () => {
  try {
    const content = await fs.readFile(ENV_PATH, 'utf-8');
    return content;
  } catch {
    return '';
  }
};

const parseEnv = (content) => {
  const result = {};
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    result[key] = rest.join('=').replace(/^"|"$/g, '');
  });
  return result;
};

const serializeEnv = (envObj) => Object.entries(envObj)
  .map(([key, value]) => `${key}=${value ?? ''}`)
  .join('\n');

const saveEnvFile = async (envObj) => {
  const content = serializeEnv(envObj);
  await fs.writeFile(ENV_PATH, content, 'utf-8');
};

const importantKeys = [
  'MODE',
  'TEST_MODE',
  'EMMA_WEBHOOK_URL',
  'N8N_WEBHOOK_BASE_URL',
  'PUBLIC_URL',
  'PORT',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER'
];

const mergeWithProcessEnv = (envObj) => {
  const merged = { ...envObj };
  
  // Valeurs par defaut si non definies
  const defaults = {
    MODE: 'test',
    TEST_MODE: 'true',
    N8N_WEBHOOK_BASE_URL: 'https://projetsjsl.app.n8n.cloud',
    EMMA_WEBHOOK_URL: 'https://projetsjsl.app.n8n.cloud/webhook/gob-sms-webhook-test',
    PUBLIC_URL: 'https://gob-kmay.onrender.com',
    PORT: '3000'
  };
  
  importantKeys.forEach((key) => {
    // Priorite: envObj -> process.env -> default
    if (!merged[key] && process.env[key]) {
      merged[key] = process.env[key];
    } else if (!merged[key] && defaults[key]) {
      merged[key] = defaults[key];
    }
  });
  return merged;
};

const getEnv = async () => {
  const content = await readEnvFile();
  return parseEnv(content);
};

const ensureEnvFile = async () => {
  try {
    await fs.access(ENV_PATH);
  } catch {
    await fs.writeFile(ENV_PATH, '', 'utf-8');
  }
};

const applyEnvUpdates = async (updates = {}) => {
  await ensureEnvFile();
  const current = await getEnv();
  const merged = { ...current, ...updates };
  await saveEnvFile(merged);
  return merged;
};

const getServerState = () => ({
  running: Boolean(smsServerProcess),
  info: smsServerInfo,
  logs: latestLogs.slice(-20)
});

const startSmsServer = async (envOverrides = {}) => {
  if (smsServerProcess) {
    throw new Error('Serveur deja en cours d\'execution');
  }

  const envFile = await getEnv();
  const mergedEnv = { ...process.env, ...envFile, ...envOverrides };

  const port = mergedEnv.TEST_SMS_PORT || mergedEnv.PORT || 3000;
  const mode = (mergedEnv.MODE || 'test').toLowerCase();

  const child = spawn('node', ['test-sms-server.js'], {
    env: mergedEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: process.cwd()
  });

  smsServerProcess = child;
  smsServerInfo = {
    pid: child.pid,
    port,
    mode,
    startedAt: new Date().toISOString()
  };

  child.stdout.on('data', (data) => log(`[SMS SERVER] ${data}`));
  child.stderr.on('data', (data) => log(`[SMS SERVER][ERR] ${data}`));
  child.on('exit', (code, signal) => {
    log(`Serveur SMS arrete (code=${code} signal=${signal})`);
    smsServerProcess = null;
    smsServerInfo = null;
  });

  return smsServerInfo;
};

const stopSmsServer = () => {
  if (!smsServerProcess) {
    throw new Error('Aucun serveur en cours');
  }
  smsServerProcess.kill('SIGTERM');
};

const runScenarios = (envOverrides = {}) => new Promise((resolve, reject) => {
  const child = spawn('node', ['test-scenarios.js'], {
    env: { ...process.env, ...envOverrides },
    cwd: process.cwd()
  });
  let output = '';
  child.stdout.on('data', (data) => { output += data; });
  child.stderr.on('data', (data) => { output += data; });
  child.on('exit', (code) => {
    if (code === 0) resolve(output);
    else reject(new Error(output || `Scenarios termines avec code ${code}`));
  });
});

const checkWebhook = async (url) => {
  if (!url) return { status: 'missing', message: 'URL non definie' };
  try {
    //  FIX: Les webhooks n8n ne repondent pas a HEAD, utiliser POST avec payload minimal
    // Test avec un payload minimal pour verifier que le webhook existe et repond
    const testPayload = {
      From: '+15551234567',
      To: '+15559876543',
      Body: 'TEST',
      MessageSid: 'test-check-' + Date.now()
    };
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(testPayload).toString(),
      // Timeout court pour eviter d'attendre trop longtemps
      signal: AbortSignal.timeout(5000)
    });
    
    // n8n peut retourner 200, 201, ou meme 400/500 si le workflow existe mais echoue
    // L'important est que ce n'est PAS 404 (webhook inexistant)
    if (res.status === 404) {
      return { 
        status: 'error', 
        message: `404 Not Found - Le webhook n'existe pas dans n8n. Verifiez que le workflow est active et que le chemin est correct.` 
      };
    }
    
    // Si on obtient une reponse (meme erreur), le webhook existe
    return { 
      status: 'ok', 
      message: `${res.status} ${res.statusText} - Webhook accessible` 
    };
  } catch (error) {
    // Timeout ou erreur reseau
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return { 
        status: 'error', 
        message: 'Timeout - Le webhook n\'a pas repondu dans les 5 secondes. Verifiez que n8n est accessible.' 
      };
    }
    // Erreur reseau (n8n inaccessible, DNS, etc.)
    if (error.message.includes('fetch failed') || error.code === 'ENOTFOUND') {
      return { 
        status: 'error', 
        message: `Erreur reseau - Impossible d'atteindre n8n. Verifiez l'URL: ${url}` 
      };
    }
    return { status: 'error', message: error.message };
  }
};

const handler = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    if (req.method === 'GET') {
      const env = mergeWithProcessEnv(await getEnv());
      const server = getServerState();
      const webhookStatus = await checkWebhook(env.EMMA_WEBHOOK_URL);
      return res.status(200).json({ env, server, webhookStatus });
    }

    if (req.method === 'POST') {
      let body = req.body || {};
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      }
      const { action, payload } = body;

      switch (action) {
        case 'saveEnv': {
          const updated = await applyEnvUpdates(payload || {});
          return res.status(200).json({ success: true, env: updated });
        }
        case 'startServer': {
          const info = await startSmsServer(payload || {});
          return res.status(200).json({ success: true, info });
        }
        case 'stopServer': {
          stopSmsServer();
          return res.status(200).json({ success: true });
        }
        case 'runScenarios': {
          const env = await getEnv();
          const output = await runScenarios(env);
          return res.status(200).json({ success: true, output });
        }
        default:
          return res.status(400).json({ success: false, error: 'Action inconnue' });
      }
    }

    return res.status(405).json({ success: false, error: 'Methode non supportee' });
  } catch (error) {
    console.error('[SMS Control] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export default handler;
