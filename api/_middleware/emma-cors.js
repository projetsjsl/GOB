/**
 * Emma CORS & Auth Middleware
 *
 * Provides CORS headers and optional API key authentication
 * for Emma APIs to be used across multiple sites.
 */

const DEFAULT_ALLOWED_ORIGINS = [
  'https://gobapps.com',
  'https://www.gobapps.com',
  'https://gob.vercel.app'
];

const DEFAULT_ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/gob-[a-z0-9-]+\.vercel\.app$/i,
  /^https:\/\/gob-[a-z0-9-]+-projetsjsls-projects\.vercel\.app$/i
];

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

function getAllowedOrigins() {
  const envList = process.env.EMMA_ALLOWED_ORIGINS || '';
  const extra = envList
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return [...DEFAULT_ALLOWED_ORIGINS, ...DEV_ORIGINS, ...extra];
}

function isOriginAllowed(origin) {
  if (!origin) return false;
  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) return true;
  return DEFAULT_ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

export function applyCors(req, res) {
  const origin = req.headers.origin;

  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Emma-Key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

export function validateApiKey(req) {
  const apiKey = req.headers['x-emma-key'] || req.query.apiKey;
  const validKey = process.env.EMMA_API_KEY;

  if (!validKey) {
    return { valid: true, reason: 'No API key configured' };
  }

  if (!apiKey) {
    return { valid: false, reason: 'Missing API key' };
  }

  if (apiKey !== validKey) {
    return { valid: false, reason: 'Invalid API key' };
  }

  return { valid: true };
}

