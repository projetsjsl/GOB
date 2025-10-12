// Test simple Emma sans prompt complexe
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    return res.status(503).json({ 
      error: 'GEMINI_API_KEY not configured',
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log('🧪 Test simple Gemini...');
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent({
      contents: [
        { 
          role: 'user', 
          parts: [{ text: 'Dis juste bonjour' }] 
        }
      ]
    });
    
    const response = result.response;
    const text = response.text();
    
    return res.status(200).json({ 
      success: true,
      response: text,
      model: 'gemini-1.5-flash',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur test Gemini:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}

