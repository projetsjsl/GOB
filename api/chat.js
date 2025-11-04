/**
 * API Chat Centralisée - Point d'entrée unifié multi-canal
 *
 * Route toutes les requêtes des différents canaux (web, email, SMS, messenger)
 * vers le function calling router Emma existant (emma-agent.js)
 *
 * Architecture:
 * Canal → /api/chat → User Manager → Conversation Manager → emma-agent → Response → Channel Adapter
 */

import { getOrCreateUserProfile } from '../lib/user-manager.js';
import { getOrCreateConversation, saveConversationTurn, getConversationHistory, formatHistoryForEmma } from '../lib/conversation-manager.js';
import { adaptForChannel } from '../lib/channel-adapter.js';

/**
 * Handler POST /api/chat
 *
 * Body: {
 *   message: string,
 *   userId: string,
 *   channel: 'web' | 'email' | 'sms' | 'messenger',
 *   conversationId?: string,
 *   metadata?: object
 * }
 */
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: 'Only POST requests are accepted'
    });
  }

  const startTime = Date.now();

  try {
    // 1. VALIDATION DES PARAMÈTRES
    const { message, userId, channel, conversationId, metadata } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid message parameter'
      });
    }

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid userId parameter'
      });
    }

    const validChannels = ['web', 'email', 'sms', 'messenger'];
    if (!channel || !validChannels.includes(channel)) {
      return res.status(400).json({
        success: false,
        error: `Invalid channel. Must be one of: ${validChannels.join(', ')}`
      });
    }

    console.log(`[Chat API] Requête reçue - Canal: ${channel}, User: ${userId}, Message: "${message.substring(0, 50)}..."`);

    // 2. GESTION UTILISATEUR
    let userProfile;
    try {
      userProfile = await getOrCreateUserProfile(userId, channel, metadata);
      console.log(`[Chat API] User profile ID: ${userProfile.id}`);
    } catch (error) {
      console.error('[Chat API] Erreur user profile:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get or create user profile',
        details: error.message
      });
    }

    // 3. GESTION CONVERSATION
    let conversation;
    try {
      conversation = await getOrCreateConversation(
        userProfile.id,
        channel,
        userId // channelIdentifier
      );
      console.log(`[Chat API] Conversation ID: ${conversation.id}`);
    } catch (error) {
      console.error('[Chat API] Erreur conversation:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get or create conversation',
        details: error.message
      });
    }

    // 4. RÉCUPÉRER HISTORIQUE (pour contexte Emma)
    let conversationHistory = [];
    try {
      conversationHistory = await getConversationHistory(conversation.id, 10); // 10 derniers messages
      console.log(`[Chat API] Historique: ${conversationHistory.length} messages`);
    } catch (error) {
      console.error('[Chat API] Erreur récupération historique:', error);
      // Non-bloquant, on continue sans historique
    }

    // 5. PRÉPARER LE CONTEXTE POUR EMMA-AGENT
    const emmaContext = {
      output_mode: channel === 'email' ? 'ticker_note' : 'chat', // Email = format long, autres = chat
      tickers: metadata?.tickers || [],
      stockData: metadata?.stockData || {},
      newsData: metadata?.newsData || [],
      apiStatus: metadata?.apiStatus || {},
      conversationHistory: formatHistoryForEmma(conversationHistory)
    };

    // 6. APPELER EMMA-AGENT (Function Calling Router existant)
    let emmaResponse;
    try {
      console.log('[Chat API] Appel emma-agent...');

      // Simuler appel interne à emma-agent
      // En production, on importe et appelle la fonction directement
      const emmaAgentModule = await import('./emma-agent.js');
      const emmaRequest = {
        method: 'POST',
        body: {
          message: message,
          context: emmaContext
        }
      };

      // Mock response object for emma-agent
      let emmaResponseData = null;
      const emmaRes = {
        status: (code) => ({
          json: (data) => {
            emmaResponseData = data;
            return emmaResponseData;
          }
        }),
        setHeader: () => {}
      };

      // Call emma-agent
      await emmaAgentModule.default(emmaRequest, emmaRes);

      if (!emmaResponseData || !emmaResponseData.success) {
        console.error('[Chat API] Emma agent unsuccessful response:', JSON.stringify(emmaResponseData, null, 2));
        throw new Error(`Emma agent returned unsuccessful response: ${emmaResponseData?.error || emmaResponseData?.response || 'Unknown error'}`);
      }

      emmaResponse = emmaResponseData;
      console.log(`[Chat API] Emma response reçue - Model: ${emmaResponse.model}, Tools: ${emmaResponse.tools_used?.length || 0}`);

    } catch (error) {
      console.error('[Chat API] Erreur appel emma-agent:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get response from Emma',
        details: error.message
      });
    }

    // 7. ADAPTER LA RÉPONSE POUR LE CANAL
    let adaptedResponse;
    try {
      adaptedResponse = adaptForChannel(emmaResponse.response, channel);
      console.log(`[Chat API] Réponse adaptée pour ${channel} (${adaptedResponse.length} chars)`);
    } catch (error) {
      console.error('[Chat API] Erreur adaptation canal:', error);
      adaptedResponse = emmaResponse.response; // Fallback: réponse brute
    }

    // 8. SAUVEGARDER DANS LA CONVERSATION
    try {
      await saveConversationTurn(
        conversation.id,
        message,
        emmaResponse.response, // Sauvegarder la réponse originale (pas adaptée)
        {
          model: emmaResponse.model,
          toolsUsed: emmaResponse.tools_used,
          executionTimeMs: emmaResponse.execution_time_ms,
          confidence: emmaResponse.confidence,
          channel: channel
        }
      );
      console.log('[Chat API] Conversation sauvegardée');
    } catch (error) {
      console.error('[Chat API] Erreur sauvegarde conversation:', error);
      // Non-bloquant, on continue
    }

    // 9. RÉPONSE FINALE
    const executionTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      response: adaptedResponse, // Réponse adaptée au canal
      conversationId: conversation.id,
      metadata: {
        llmUsed: emmaResponse.model,
        toolsUsed: emmaResponse.tools_used || [],
        failedTools: emmaResponse.failed_tools || [],
        confidence: emmaResponse.confidence,
        dataConfidence: emmaResponse.data_confidence,
        intent: emmaResponse.intent,
        executionTimeMs: executionTime,
        emmaExecutionTimeMs: emmaResponse.execution_time_ms,
        channel: channel,
        messageCount: conversationHistory.length + 1
      }
    });

  } catch (error) {
    console.error('[Chat API] Erreur générale:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Exemple de requête:
 *
 * POST /api/chat
 * {
 *   "message": "Analyse AAPL",
 *   "userId": "+14385443662",
 *   "channel": "sms",
 *   "metadata": {
 *     "name": "Daniel"
 *   }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "response": "Apple (AAPL) se négocie à 150.25$ (+2.3%)...",
 *   "conversationId": "uuid-1234",
 *   "metadata": {
 *     "llmUsed": "perplexity",
 *     "toolsUsed": ["fmp-quote", "fmp-fundamentals"],
 *     "executionTimeMs": 2341,
 *     "channel": "sms"
 *   }
 * }
 */
