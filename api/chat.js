/**
 * API Chat Centralisée - Point d'entrée unifié multi-canal
 *
 * Route toutes les requêtes des différents canaux (web, email, SMS, messenger)
 * vers le function calling router Emma existant (emma-agent.js)
 *
 * Architecture:
 * Canal → /api/chat → User Manager → Conversation Manager → emma-agent → Response → Channel Adapter
 */

import { getOrCreateUserProfile, updateUserProfile } from '../lib/user-manager.js';
import { getOrCreateConversation, saveConversationTurn, getConversationHistory, formatHistoryForEmma } from '../lib/conversation-manager.js';
import { adaptForChannel } from '../lib/channel-adapter.js';
import { getNameFromPhone, isKnownContact } from '../lib/phone-contacts.js';

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
      // Enrichir les métadonnées avec le nom si c'est un contact connu (SMS)
      if (channel === 'sms') {
        const userName = getNameFromPhone(userId);
        if (userName !== userId) { // Si un nom a été trouvé
          metadata.name = userName;
          console.log(`[Chat API] Contact connu: ${userName}`);
        }
      }

      userProfile = await getOrCreateUserProfile(userId, channel, metadata);
      console.log(`[Chat API] User profile ID: ${userProfile.id}, Name: ${userProfile.name}`);
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

    // 3.5 DEMANDER LE NOM SI NUMÉRO INCONNU (SMS uniquement)
    if (channel === 'sms') {
      const isKnownInContacts = isKnownContact(userId);
      const hasName = userProfile.name && userProfile.name !== userId;
      const awaitingName = userProfile.metadata?.awaiting_name === true;

      // CAS 1: Utilisateur en train de donner son nom
      if (awaitingName) {
        console.log(`[Chat API] Réception du nom de l'utilisateur`);

        // Extraire le nom (prendre le message comme nom, nettoyer)
        const userName = message.trim().split(/\s+/)[0]; // Premier mot

        try {
          await updateUserProfile(userProfile.id, {
            name: userName,
            metadata: { ...userProfile.metadata, awaiting_name: false, has_been_introduced: true }
          });
          console.log(`[Chat API] Nom enregistré: ${userName}`);

          // Réponse de confirmation + bienvenue (sans branding, juste accueil)
          const welcomeResponse = `Enchanté ${userName} ! 👋\n\nJe suis Emma, ton assistante IA financière 📊\n\nJe peux t'aider avec :\n📊 Analyses de marchés et actions\n📈 Données financières en temps réel\n📰 Nouvelles économiques\n💡 Conseils et insights\n\nÉcris-moi au 1-438-544-EMMA 📱\n\nComment puis-je t'aider aujourd'hui ?`;

          // Sauvegarder dans la conversation
          await saveConversationTurn(conversation.id, message, welcomeResponse, {
            type: 'name_registration',
            channel: channel
          });

          return res.status(200).json({
            success: true,
            response: welcomeResponse,
            metadata: { name_registered: true, user_name: userName }
          });
        } catch (error) {
          console.error('[Chat API] Erreur enregistrement nom:', error);
          // Continuer normalement en cas d'erreur
        }
      }

      // CAS 2: Numéro inconnu sans nom - demander le nom
      if (!isKnownInContacts && !hasName && !awaitingName) {
        console.log(`[Chat API] Numéro inconnu détecté, demande du nom`);

        try {
          await updateUserProfile(userProfile.id, {
            metadata: { ...userProfile.metadata, awaiting_name: true }
          });

          const askNameResponse = "Bonjour ! 👋\n\nAvant de commencer, pourrais-tu me dire ton prénom ? Ça me permettra de personnaliser nos échanges.";

          // Sauvegarder dans la conversation
          await saveConversationTurn(conversation.id, message, askNameResponse, {
            type: 'name_request',
            channel: channel
          });

          return res.status(200).json({
            success: true,
            response: askNameResponse,
            metadata: { awaiting_name: true }
          });
        } catch (error) {
          console.error('[Chat API] Erreur demande nom:', error);
          // Continuer normalement en cas d'erreur
        }
      }
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

    // 4.5. RÉCUPÉRER LA WATCHLIST DE L'UTILISATEUR (pour contexte Emma)
    let userWatchlist = [];
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: watchlistData, error: watchlistError } = await supabase
        .from('watchlists')
        .select('tickers')
        .eq('user_id', userProfile.id)
        .single();

      if (!watchlistError && watchlistData?.tickers) {
        userWatchlist = watchlistData.tickers;
        console.log(`[Chat API] Watchlist utilisateur: ${userWatchlist.join(', ')} (${userWatchlist.length} tickers)`);
      } else if (watchlistError && watchlistError.code !== 'PGRST116') {
        // PGRST116 = pas de ligne trouvée (watchlist vide)
        console.log(`[Chat API] Watchlist non trouvée ou vide pour user ${userProfile.id}`);
      }
    } catch (error) {
      console.error('[Chat API] Erreur récupération watchlist (non-bloquant):', error.message);
      // Non-bloquant, on continue sans watchlist
    }

    // 4.6. RÉCUPÉRER LES TEAM TICKERS (tickers partagés de l'équipe)
    let teamTickers = [];
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Essayer d'abord la table team_tickers (table principale)
      const { data: teamTickersData, error: teamTickersError } = await supabase
        .from('team_tickers')
        .select('ticker')
        .order('priority', { ascending: false });

      if (!teamTickersError && teamTickersData && teamTickersData.length > 0) {
        teamTickers = teamTickersData.map(item => item.ticker);
        console.log(`[Chat API] Team tickers (team_tickers table): ${teamTickers.join(', ')} (${teamTickers.length} tickers)`);
      } else {
        // Fallback: essayer la nouvelle table tickers avec source='team'
        console.log('[Chat API] Table team_tickers vide ou erreur, essai table tickers...');
        const { data: altTickersData, error: altError } = await supabase
          .from('tickers')
          .select('ticker')
          .eq('source', 'team')
          .eq('is_active', true);

        if (!altError && altTickersData && altTickersData.length > 0) {
          teamTickers = altTickersData.map(item => item.ticker);
          console.log(`[Chat API] Team tickers (tickers table): ${teamTickers.join(', ')} (${teamTickers.length} tickers)`);
        } else {
          // Fallback ultime: liste hardcodée
          teamTickers = [
            'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
            'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
            'TRP', 'UNH', 'UL', 'VZ', 'WFC'
          ];
          console.log(`[Chat API] Team tickers (fallback hardcodé): ${teamTickers.length} tickers`);
        }
      }
    } catch (error) {
      console.error('[Chat API] Erreur récupération team tickers (non-bloquant):', error.message);
      // Fallback en cas d'erreur
      teamTickers = [
        'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
        'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
        'TRP', 'UNH', 'UL', 'VZ', 'WFC'
      ];
    }

    // 5. DÉTECTER SI EMMA DOIT SE PRÉSENTER
    const isFirstMessage = conversationHistory.length === 0;
    const isTestEmma = message.toLowerCase().includes('test emma');
    const hasBeenIntroduced = userProfile.metadata?.has_been_introduced === true;
    const shouldIntroduce = (!hasBeenIntroduced && isFirstMessage) || isTestEmma;

    if (shouldIntroduce) {
      console.log(`[Chat API] Emma va se présenter (first=${isFirstMessage}, test=${isTestEmma}, introduced=${hasBeenIntroduced})`);

      // Marquer que Emma s'est présentée (sauf si c'est juste "Test Emma")
      if (!hasBeenIntroduced && !isTestEmma) {
        try {
          await updateUserProfile(userProfile.id, {
            metadata: { ...userProfile.metadata, has_been_introduced: true }
          });
          console.log(`[Chat API] Flag has_been_introduced défini pour user ${userProfile.id}`);
        } catch (error) {
          console.error('[Chat API] Erreur mise à jour has_been_introduced:', error);
        }
      }
    }

    // 6. PRÉPARER LE CONTEXTE POUR EMMA-AGENT
    // Combiner watchlist + team tickers (union sans doublons)
    const allTickers = [...new Set([...userWatchlist, ...teamTickers])];

    const emmaContext = {
      output_mode: channel === 'email' ? 'ticker_note' : 'chat', // Email = format long, autres = chat
      user_name: userProfile.name || null, // Nom de l'utilisateur pour personnalisation
      user_channel: channel, // Canal de communication
      should_introduce: shouldIntroduce, // Emma doit se présenter
      tickers: metadata?.tickers || allTickers, // Utiliser watchlist + team tickers si pas de tickers fournis
      user_watchlist: userWatchlist, // Watchlist personnelle de l'utilisateur
      team_tickers: teamTickers, // Tickers d'équipe partagés
      all_tickers: allTickers, // Union watchlist + team (sans doublons)
      stockData: metadata?.stockData || {},
      newsData: metadata?.newsData || [],
      apiStatus: metadata?.apiStatus || {},
      conversationHistory: formatHistoryForEmma(conversationHistory)
    };

    // 7. APPELER EMMA-AGENT (Function Calling Router existant)
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

    // 8. ADAPTER LA RÉPONSE POUR LE CANAL
    let adaptedResponse;
    try {
      // Passer le contexte pour SMS (liens TradingView)
      adaptedResponse = adaptForChannel(emmaResponse.response, channel, emmaContext);
      console.log(`[Chat API] Réponse adaptée pour ${channel} (${adaptedResponse.length} chars)`);
    } catch (error) {
      console.error('[Chat API] Erreur adaptation canal:', error);
      adaptedResponse = emmaResponse.response; // Fallback: réponse brute
    }

    // 9. SAUVEGARDER DANS LA CONVERSATION
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

    // 10. RÉPONSE FINALE
    const executionTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      response: adaptedResponse, // Réponse adaptée au canal
      conversationId: conversation.id,
      metadata: {
        user_id: userProfile.id,
        name: userProfile.name,
        conversation_id: conversation.id,
        model: emmaResponse.model,
        llmUsed: emmaResponse.model,
        tools_used: emmaResponse.tools_used || [],
        toolsUsed: emmaResponse.tools_used || [],
        failedTools: emmaResponse.failed_tools || [],
        confidence: emmaResponse.confidence,
        dataConfidence: emmaResponse.data_confidence,
        intent: emmaResponse.intent,
        execution_time_ms: emmaResponse.execution_time_ms,
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
