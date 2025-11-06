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
import { TickerExtractor } from '../lib/utils/ticker-extractor.js';
import { validateYTDData, enrichStockDataWithSources } from '../lib/ytd-validator.js';
import { generateCacheKey, getCachedResponse, setCachedResponse } from '../lib/response-cache.js';

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
          const welcomeResponse = `Enchanté ${userName} ! 👋\n\nJe suis Emma, ton assistante IA financière 📊\n\nJe peux t'aider avec :\n📊 Analyses de marchés et actions\n📈 Données financières en temps réel\n📰 Nouvelles économiques\n💡 Conseils et insights\n\n💼 Tape SKILLS pour voir mes capacités avancées (calendriers, courbes, briefings, etc.)\n\nÉcris-moi au 1-438-544-EMMA 📱\n\nComment puis-je t'aider aujourd'hui ?`;

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
    // NOTE: Ces listes sont des FAVORIS/RACCOURCIS uniquement.
    // Emma a accès à MILLIERS de tickers mondiaux via APIs (FMP, Polygon, etc.)
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

    // ✅ FIX BUG 3: Détecter les salutations pour forcer présentation Emma
    const messageLower = message.toLowerCase().trim();
    const greetingKeywords = ['bonjour', 'salut', 'hello', 'hi', 'bonsoir', 'hey', 'coucou', 'good morning', 'bonne journée'];
    const isGreeting = greetingKeywords.some(kw => messageLower === kw || messageLower.startsWith(kw + ' ') || messageLower.startsWith(kw + '!'));

    const shouldIntroduce = (!hasBeenIntroduced && isFirstMessage) || isTestEmma || isGreeting;

    if (shouldIntroduce) {
      console.log(`[Chat API] Emma va se présenter (first=${isFirstMessage}, test=${isTestEmma}, greeting=${isGreeting}, introduced=${hasBeenIntroduced})`);

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

    // 5.5. DÉTECTER COMMANDES SPÉCIALES (SKILLS, AIDE, EXEMPLES)
    const messageUpper = message.trim().toUpperCase();

    if (messageUpper === 'SKILLS' || messageUpper === 'SKILL') {
      console.log('[Chat API] Commande SKILLS détectée');

      const skillsResponse = `🤖 EMMA IA - MES COMPÉTENCES

📊 ANALYSES (Mots-clés MAJUSCULES):
• ANALYSE [TICKER] → Analyse complète
• FONDAMENTAUX [TICKER] → Ratios & finances
• TECHNIQUE [TICKER] → Analyse technique
• COMPARER [T1] [T2] → Comparaison
• PRIX [TICKER] → Prix temps réel
• RATIOS [TICKER] → Ratios financiers
• CROISSANCE [TICKER] → Croissance revenus

📈 INDICATEURS TECHNIQUES:
• RSI [TICKER] → Force relative
• MACD [TICKER] → Momentum
• MOYENNES [TICKER] → Moyennes mobiles

📰 ACTUALITÉS:
• TOP 5 NEWS → Top 5 news du jour
• NEWS [TICKER] → News du ticker
• ACTUALITES [TICKER] → Actualités

📅 CALENDRIERS:
• RESULTATS → Earnings calendar
• RESULTATS [TICKER] → Earnings ticker
• CALENDRIER ECONOMIQUE → Événements macro

📊 WATCHLIST:
• LISTE → Voir ta watchlist
• AJOUTER [TICKER] → Ajouter ticker
• RETIRER [TICKER] → Supprimer ticker

📈 MARCHÉ:
• INDICES → Dow, S&P, Nasdaq
• MARCHE → Vue marchés
• SECTEUR [NOM] → Analyse secteur

💼 INVESTISSEMENT:
• ACHETER [TICKER] → Avis achat
• VENDRE [TICKER] → Avis vente

🌍 ÉCONOMIE:
• INFLATION → Données inflation
• FED → Infos Fed/taux
• TAUX → Taux directeurs

🎯 BRIEFINGS AUTO (email):
• 7h20 → Pré-marché
• 15h50 → Intraday
• 20h20 → Post-marché

📚 AIDE:
• AIDE → Guide complet
• EXEMPLES → Exemples questions

💡 TU PEUX AUSSI PARLER NATURELLEMENT:
"Pourquoi Apple monte ?"
"Devrais-je acheter Tesla ?"

🚀 30+ mots-clés disponibles !`;

      // Sauvegarder dans la conversation
      try {
        await saveConversationTurn(conversation.id, message, skillsResponse, {
          type: 'command_skills',
          channel: channel
        });
      } catch (error) {
        console.error('[Chat API] Erreur sauvegarde SKILLS:', error);
      }

      return res.status(200).json({
        success: true,
        response: skillsResponse,
        metadata: { command: 'SKILLS' }
      });
    }

    if (messageUpper === 'AIDE' || messageUpper === 'HELP') {
      console.log('[Chat API] Commande AIDE détectée');

      const helpResponse = `📖 GUIDE EMMA IA

🗣️ PARLE NATURELLEMENT:
Pas besoin de commandes strictes.
Je comprends le français courant !

✅ CE QUE JE FAIS:
• Analyses complètes d'actions
• Prix et données temps réel
• Indicateurs techniques (RSI, MACD)
• Actualités financières
• Calendriers (résultats, événements)
• Gestion watchlist
• Briefings quotidiens (email)

📊 SOURCES DE DONNÉES:
• FMP (Financial Modeling Prep)
• Polygon.io & Twelve Data
• Finnhub & Alpha Vantage
• Données en cache 5-60 min

🎯 ANALYSE TYPIQUE INCLUT:
• Prix actuel & variation
• Ratios: P/E, P/B, ROE, marges
• Croissance revenus/bénéfices
• Consensus analystes
• News récentes avec sources
• Indicateurs techniques

⚡ RÉPONSE RAPIDE:
• Commandes: ~instant
• Analyses: ~10-13 secondes
• Briefings: automatiques 3x/jour

💼 SKILLS → Toutes mes capacités
📱 Contact: 1-438-544-EMMA

Comment puis-je t'aider ? 🚀`;

      try {
        await saveConversationTurn(conversation.id, message, helpResponse, {
          type: 'command_help',
          channel: channel
        });
      } catch (error) {
        console.error('[Chat API] Erreur sauvegarde AIDE:', error);
      }

      return res.status(200).json({
        success: true,
        response: helpResponse,
        metadata: { command: 'AIDE' }
      });
    }

    if (messageUpper === 'EXEMPLES' || messageUpper === 'EXAMPLES') {
      console.log('[Chat API] Commande EXEMPLES détectée');

      const examplesResponse = `💡 EXEMPLES QUI FONCTIONNENT

📊 ANALYSES COMPLÈTES:
• "Analyse AAPL"
• "Analyse complète Microsoft"
• "Dis-moi tout sur NVDA"

💰 PRIX & RATIOS:
• "Prix Tesla"
• "C'est quoi le P/E de MSFT ?"
• "ROE de Apple"
• "Marges bénéficiaires GOOGL"

📈 INDICATEURS TECHNIQUES:
• "RSI de NVDA"
• "MACD Tesla"
• "Moyennes mobiles AAPL"
• "TSLA est suracheté ?"

📰 ACTUALITÉS:
• "Top 5 news" → Top 5 news du jour
• "Actualités Apple"
• "Pourquoi TSLA monte ?"
• "Quoi de neuf en bourse ?"

📅 CALENDRIERS:
• "Prochains résultats AAPL"
• "Résultats cette semaine"
• "Événements économiques"
• "Earnings calendar"

📊 WATCHLIST:
• "Ma liste"
• "Ajouter NVDA"
• "Retirer TSLA"
• "Watchlist de l'équipe"

🎯 COMPARAISONS:
• "Comparer AAPL et MSFT"
• "NVDA vs AMD fondamentaux"

💭 QUESTIONS OUVERTES:
• "Devrais-je acheter Tesla ?"
• "Microsoft est-il cher ?"
• "Meilleures actions IA ?"

👉 Essaie et je comprendrai ! 🤖`;

      try {
        await saveConversationTurn(conversation.id, message, examplesResponse, {
          type: 'command_examples',
          channel: channel
        });
      } catch (error) {
        console.error('[Chat API] Erreur sauvegarde EXEMPLES:', error);
      }

      return res.status(200).json({
        success: true,
        response: examplesResponse,
        metadata: { command: 'EXEMPLES' }
      });
    }

    // Commande TOP 5 NEWS / NEWS du jour (rapide, pas d'appel Emma complet)
    if (messageUpper.includes('TOP 5') || messageUpper.includes('TOP5') || (messageUpper.includes('ACTUALIT') && messageUpper.includes('AUJOURD'))) {
      console.log('[Chat API] Commande TOP 5 NEWS détectée');

      // Appeler endpoint news directement (plus rapide que Emma complète)
      try {
        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'https://gob.vercel.app';

        const newsResponse = await fetch(`${baseUrl}/api/fmp?endpoint=news&limit=5`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (newsResponse.ok) {
          const newsData = await newsResponse.json();

          // Vérifier si c'est un array ou un objet avec data
          const news = Array.isArray(newsData) ? newsData.slice(0, 5) : (newsData.data || []).slice(0, 5);

          if (news.length > 0) {
            let capsuleText = `📰 TOP 5 NEWS FINANCIÈRES\n${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;

            news.forEach((item, idx) => {
              capsuleText += `${idx + 1}. ${item.title || item.headline || 'Sans titre'}\n`;

              // Ajouter un court extrait si disponible
              if (item.text || item.summary) {
                const excerpt = (item.text || item.summary).substring(0, 120).trim();
                capsuleText += `   ${excerpt}...\n`;
              }

              // Ajouter l'URL
              if (item.url || item.link) {
                capsuleText += `   🔗 ${item.url || item.link}\n`;
              }

              capsuleText += '\n';
            });

            capsuleText += '💼 Tape SKILLS pour toutes mes capacités';

            await saveConversationTurn(conversation.id, message, capsuleText, {
              type: 'command_top5news',
              channel: channel,
              news_count: news.length
            });

            return res.status(200).json({
              success: true,
              response: capsuleText,
              metadata: { command: 'TOP5NEWS', news_count: news.length }
            });
          } else {
            console.log('[Chat API] Aucune actualité trouvée');
          }
        } else {
          console.error('[Chat API] Erreur API news:', newsResponse.status);
        }
      } catch (error) {
        console.error('[Chat API] Erreur capsule news:', error.message);
        // Fallback: laisser Emma gérer normalement
      }
    }

    // 5.6. DÉTECTION MOTS-CLÉS MAJUSCULES (Raccourcis directs - ultra-rapide)
    // Ces mots-clés forcent une intention spécifique sans analyse NLP
    let forcedIntent = null;
    let extractedTickers = [];

    // Helper functions delegating to centralized TickerExtractor utility
    const extractTickerFromCommand = (msg, keyword) => {
      return TickerExtractor.extractFromCommand(msg, keyword);
    };

    const extractTickersForComparison = (msg) => {
      return TickerExtractor.extractForComparison(msg);
    };

    // ANALYSES
    if (messageUpper.startsWith('ANALYSE ')) {
      const ticker = extractTickerFromCommand(messageUpper, 'ANALYSE');
      if (ticker) {
        forcedIntent = { intent: 'comprehensive_analysis', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut' };
      }
    } else if (messageUpper.startsWith('FONDAMENTAUX ')) {
      const ticker = extractTickerFromCommand(messageUpper, 'FONDAMENTAUX');
      if (ticker) {
        forcedIntent = { intent: 'fundamentals', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut' };
      }
    } else if (messageUpper.startsWith('TECHNIQUE ')) {
      const ticker = extractTickerFromCommand(messageUpper, 'TECHNIQUE');
      if (ticker) {
        forcedIntent = { intent: 'technical_analysis', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut' };
      }
    } else if (messageUpper.startsWith('COMPARER ') || messageUpper.includes(' VS ') || messageUpper.includes(' OU ')) {
      const tickers = extractTickersForComparison(messageUpper);
      if (tickers.length === 2) {
        forcedIntent = { intent: 'comparative_analysis', tickers: tickers, confidence: 1.0, method: 'keyword_shortcut' };
      }
    }

    // PRIX & DONNÉES
    else if (messageUpper.startsWith('PRIX ')) {
      const ticker = extractTickerFromCommand(messageUpper, 'PRIX');
      if (ticker) {
        forcedIntent = { intent: 'stock_price', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut' };
      }
    } else if (messageUpper.startsWith('RATIOS ')) {
      const ticker = extractTickerFromCommand(messageUpper, 'RATIOS');
      if (ticker) {
        forcedIntent = { intent: 'fundamentals', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', focus: 'ratios' };
      }
    } else if (messageUpper.startsWith('CROISSANCE ')) {
      const ticker = extractTickerFromCommand(messageUpper, 'CROISSANCE');
      if (ticker) {
        forcedIntent = { intent: 'fundamentals', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', focus: 'growth' };
      }
    }

    // INDICATEURS TECHNIQUES
    else if (messageUpper.startsWith('RSI ')) {
      const ticker = extractTickerFromCommand(messageUpper, 'RSI');
      if (ticker) {
        forcedIntent = { intent: 'technical_analysis', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', indicator: 'RSI' };
      }
    } else if (messageUpper.startsWith('MACD ')) {
      const ticker = extractTickerFromCommand(messageUpper, 'MACD');
      if (ticker) {
        forcedIntent = { intent: 'technical_analysis', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', indicator: 'MACD' };
      }
    } else if (messageUpper.startsWith('MOYENNES ')) {
      const ticker = extractTickerFromCommand(messageUpper, 'MOYENNES');
      if (ticker) {
        forcedIntent = { intent: 'technical_analysis', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', indicator: 'SMA' };
      }
    }

    // ACTUALITÉS
    else if (messageUpper.startsWith('NEWS ') || messageUpper.startsWith('ACTUALITES ')) {
      const keyword = messageUpper.startsWith('NEWS') ? 'NEWS' : 'ACTUALITES';
      const ticker = extractTickerFromCommand(messageUpper, keyword);
      if (ticker) {
        forcedIntent = { intent: 'news', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut' };
      }
    }

    // CALENDRIERS
    else if (messageUpper.startsWith('RESULTATS')) {
      if (messageUpper.includes(' ')) {
        // "RESULTATS AAPL" → earnings pour ticker spécifique
        const ticker = extractTickerFromCommand(messageUpper, 'RESULTATS');
        if (ticker) {
          forcedIntent = { intent: 'earnings', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut' };
        }
      } else {
        // "RESULTATS" seul → earnings calendar général
        forcedIntent = { intent: 'earnings', tickers: [], confidence: 1.0, method: 'keyword_shortcut' };
      }
    } else if (messageUpper.includes('CALENDRIER') && messageUpper.includes('ECONOMIQUE')) {
      forcedIntent = { intent: 'economic_analysis', tickers: [], confidence: 1.0, method: 'keyword_shortcut' };
    } else if (messageUpper.includes('CALENDRIER') && messageUpper.includes('EARNINGS')) {
      forcedIntent = { intent: 'earnings', tickers: [], confidence: 1.0, method: 'keyword_shortcut' };
    }

    // WATCHLIST
    else if (messageUpper === 'LISTE' || messageUpper === 'MA LISTE' || messageUpper === 'WATCHLIST') {
      forcedIntent = { intent: 'portfolio', tickers: [], confidence: 1.0, method: 'keyword_shortcut', action: 'view' };
    } else if (messageUpper.startsWith('AJOUTER ')) {
      const ticker = extractTickerFromCommand(messageUpper, 'AJOUTER');
      if (ticker) {
        forcedIntent = { intent: 'portfolio', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', action: 'add' };
      }
    } else if (messageUpper.startsWith('RETIRER ') || messageUpper.startsWith('SUPPRIMER ')) {
      const keyword = messageUpper.startsWith('RETIRER') ? 'RETIRER' : 'SUPPRIMER';
      const ticker = extractTickerFromCommand(messageUpper, keyword);
      if (ticker) {
        forcedIntent = { intent: 'portfolio', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', action: 'remove' };
      }
    }

    // MARCHÉ
    else if (messageUpper === 'INDICES' || messageUpper === 'MARCHE' || messageUpper === 'MARCHÉS') {
      forcedIntent = { intent: 'market_overview', tickers: [], confidence: 1.0, method: 'keyword_shortcut' };
    } else if (messageUpper.includes('SECTEUR ')) {
      // "SECTEUR TECH", "SECTEUR FINANCE", etc.
      forcedIntent = { intent: 'market_overview', tickers: [], confidence: 1.0, method: 'keyword_shortcut', sector: true };
    }

    // RECOMMANDATION
    else if (messageUpper.startsWith('ACHETER ')) {
      const ticker = extractTickerFromCommand(messageUpper, 'ACHETER');
      if (ticker) {
        forcedIntent = { intent: 'recommendation', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', bias: 'buy' };
      }
    } else if (messageUpper.startsWith('VENDRE ')) {
      const ticker = extractTickerFromCommand(messageUpper, 'VENDRE');
      if (ticker) {
        forcedIntent = { intent: 'recommendation', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', bias: 'sell' };
      }
    }

    // ÉCONOMIE
    else if (messageUpper.includes('INFLATION') || messageUpper.includes('FED') || messageUpper.includes('TAUX')) {
      forcedIntent = { intent: 'economic_analysis', tickers: [], confidence: 1.0, method: 'keyword_shortcut' };
    }

    // Si forced intent détecté, logger et utiliser directement
    if (forcedIntent) {
      console.log(`[Chat API] 🎯 Mot-clé majuscule détecté: ${forcedIntent.intent} (${forcedIntent.tickers.join(', ') || 'aucun ticker'})`);
    }

    // 6. PRÉPARER LE CONTEXTE POUR EMMA-AGENT
    // Combiner watchlist + team tickers (union sans doublons)
    const allTickers = [...new Set([...userWatchlist, ...teamTickers])];

    // 6.5. ✅ VALIDATION YTD - Éviter les hallucinations de Perplexity
    // Enrichir les données de stock avec validation YTD
    let validatedStockData = metadata?.stockData || {};
    try {
      if (Object.keys(validatedStockData).length > 0) {
        console.log(`[Chat API] Validation YTD pour ${Object.keys(validatedStockData).length} stocks...`);
        
        // Enrichir chaque stock avec validation et source
        for (const ticker in validatedStockData) {
          const stock = validatedStockData[ticker];
          if (stock && typeof stock === 'object') {
            // Valider YTD cohérence
            const validation = validateYTDData(stock);
            
            if (!validation.valid) {
              console.warn(`⚠️ [Chat API] YTD invalide pour ${ticker}:`, validation.issues);
            }
            
            // Enrichir avec métadonnées de source (marque les données FMP vs Perplexity)
            validatedStockData[ticker] = enrichStockDataWithSources(stock, 'fmp');
          }
        }
        
        console.log(`[Chat API] ✅ Validation YTD complétée`);
      }
    } catch (error) {
      console.warn(`[Chat API] ⚠️ Erreur validation YTD (non-bloquant):`, error.message);
      // Non-bloquant, continuer avec les données originales
    }

    const emmaContext = {
      output_mode: channel === 'email' ? 'ticker_note' : 'chat', // Email = format long, autres = chat
      user_name: userProfile.name || null, // Nom de l'utilisateur pour personnalisation
      user_channel: channel, // Canal de communication
      should_introduce: shouldIntroduce, // Emma doit se présenter
      tickers: metadata?.tickers || (forcedIntent?.tickers.length > 0 ? forcedIntent.tickers : allTickers), // Utiliser forced tickers si présent
      user_watchlist: userWatchlist, // Watchlist personnelle de l'utilisateur
      team_tickers: teamTickers, // Tickers d'équipe partagés
      all_tickers: allTickers, // Union watchlist + team (sans doublons)
      stockData: validatedStockData, // Utiliser données VALIDÉES au lieu de metadata?.stockData
      newsData: metadata?.newsData || [],
      apiStatus: metadata?.apiStatus || {},
      conversationHistory: formatHistoryForEmma(conversationHistory),
      forced_intent: forcedIntent // Passer le forced intent à Emma Agent
    };

    // 6.7. 💾 CACHE INTELLIGENT (2H) - Vérifier si réponse en cache
    // Générer clé de cache basée sur ticker + type d'analyse + canal
    const primaryTicker = (forcedIntent?.tickers && forcedIntent.tickers.length > 0) 
      ? forcedIntent.tickers[0] 
      : (metadata?.tickers && metadata.tickers.length > 0 ? metadata.tickers[0] : null);
    
    const analysisType = forcedIntent?.intent || 'general';
    const isSimulation = req.body.simulate === true; // Flag pour mode simulation
    
    // Générer clé de cache seulement si on a un ticker et que ce n'est pas une simulation
    let cacheKey = null;
    let cachedData = null;
    
    if (primaryTicker && !isSimulation) {
      cacheKey = generateCacheKey(primaryTicker, analysisType, channel);
      cachedData = await getCachedResponse(cacheKey);
      
      if (cachedData) {
        const cacheAge = Math.round((Date.now() - cachedData.created_at) / 1000 / 60);
        console.log(`[Chat API] 💾 ✅ CACHE HIT - Âge: ${cacheAge} min, Hits: ${cachedData.hit_count}`);
        
        // Adapter la réponse cachée pour le canal
        let adaptedCachedResponse;
        try {
          adaptedCachedResponse = adaptForChannel(cachedData.response, channel, emmaContext);
        } catch (error) {
          console.error('[Chat API] Erreur adaptation réponse cachée:', error);
          adaptedCachedResponse = cachedData.response;
        }
        
        // Sauvegarder dans la conversation
        try {
          await saveConversationTurn(
            conversation.id,
            message,
            cachedData.response,
            {
              model: 'cached',
              cached: true,
              cache_age_minutes: cacheAge,
              hit_count: cachedData.hit_count,
              channel: channel
            }
          );
        } catch (error) {
          console.error('[Chat API] Erreur sauvegarde conversation (cache):', error);
        }
        
        // Retourner réponse cachée
        const duration = Date.now() - startTime;
        return res.status(200).json({
          success: true,
          response: adaptedCachedResponse,
          model: 'cached',
          cached: true,
          cache_age_minutes: cacheAge,
          hit_count: cachedData.hit_count,
          execution_time_ms: duration,
          conversationId: conversation.id
        });
      } else {
        console.log(`[Chat API] 💾 ❌ CACHE MISS - Génération nouvelle réponse`);
      }
    } else if (isSimulation) {
      console.log(`[Chat API] 🧪 MODE SIMULATION - Cache désactivé`);
    }

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
      // Passer le contexte + citations pour SMS (liens TradingView + sources amicales)
      const adaptContext = {
        ...emmaContext,
        citations: emmaResponse.citations || []  // 📰 Ajouter citations pour formatage amical
      };
      adaptedResponse = adaptForChannel(emmaResponse.response, channel, adaptContext);
      console.log(`[Chat API] Réponse adaptée pour ${channel} (${adaptedResponse.length} chars)`);
    } catch (error) {
      console.error('[Chat API] Erreur adaptation canal:', error);
      adaptedResponse = emmaResponse.response; // Fallback: réponse brute
    }

    // 8.5. 💾 SAUVEGARDER DANS LE CACHE (si applicable)
    if (cacheKey && primaryTicker && !isSimulation) {
      try {
        await setCachedResponse(cacheKey, emmaResponse.response, {
          ticker: primaryTicker,
          analysis_type: analysisType,
          channel: channel,
          user_id: userId,
          model: emmaResponse.model,
          tools_used: emmaResponse.tools_used,
          confidence: emmaResponse.confidence
        });
        console.log('[Chat API] 💾 ✅ Réponse sauvegardée dans le cache (expire: 2h)');
      } catch (error) {
        console.error('[Chat API] ⚠️ Erreur sauvegarde cache (non-bloquant):', error);
        // Non-bloquant, on continue
      }
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
