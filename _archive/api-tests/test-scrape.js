/**
 * Test endpoint - vérifie si l'API fonctionne sans Puppeteer
 */

export const config = {
  maxDuration: 10,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { ticker } = req.query;

  return res.status(200).json({
    success: true,
    message: 'Test API fonctionne!',
    ticker: ticker || 'N/A',
    note: 'Puppeteer sera ajouté après ce test',
    timestamp: new Date().toISOString()
  });
}
