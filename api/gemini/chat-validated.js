/**
 * Gemini Chat Validated - Version avec validation avancée
 * Chat Emma IA avec validation et gestion d'erreurs améliorée
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { messages, useValidatedMode = true } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        error: 'Messages requis',
        details: 'Le paramètre messages doit être un tableau non vide'
      });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      console.log('❌ Clé API Gemini non configurée');
      return res.status(503).json({
        error: 'Service non disponible',
        message: 'Clé API Gemini non configurée',
        help: 'Configurez GEMINI_API_KEY dans Vercel'
      });
    }

    console.log('✅ Messages valides reçus:', messages.length, 'messages');
    console.log('🔧 Mode validé activé:', useValidatedMode);

    // Validation avancée des messages
    const validatedMessages = messages.map((msg, index) => {
      if (!msg.role || !msg.content) {
        throw new Error(`Message ${index + 1} invalide: role et content requis`);
      }
      
      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        throw new Error(`Message ${index + 1}: role invalide (${msg.role})`);
      }
      
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(msg.content) }]
      };
    });

    console.log('🔧 Initialisation Gemini avec model: gemini-2.0-flash-exp');
    console.log('📤 Envoi de la requête à Gemini');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: validatedMessages,
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.7,
          topP: 0.8,
          topK: 40
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Erreur Gemini API:', response.status, errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Réponse Gemini reçue');

    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      console.error('❌ Réponse Gemini vide:', data);
      throw new Error('Réponse vide de Gemini');
    }

    console.log('✅ Réponse validée et envoyée');

    return res.status(200).json({
      success: true,
      response: responseText,
      usage: {
        promptTokens: data?.usageMetadata?.promptTokenCount || 0,
        responseTokens: data?.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data?.usageMetadata?.totalTokenCount || 0
      },
      model: 'gemini-2.0-flash-exp',
      validated: useValidatedMode,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'appel à Gemini:', error?.message || String(error));
    
    return res.status(500).json({
      error: 'Erreur lors de l\'appel à Gemini',
      details: error?.message || String(error),
      timestamp: new Date().toISOString()
    });
  }
}
