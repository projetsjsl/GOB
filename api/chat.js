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
 * Valide qu'une réponse est complète selon le type d'analyse
 * 
 * @param {string} response - La réponse à valider
 * @param {string} analysisType - Type d'analyse (comprehensive_analysis, fundamentals, etc.)
 * @param {object} intentData - Données d'intention (forcedIntent)
 * @returns {boolean} true si la réponse est complète, false sinon
 */
function validateResponseCompleteness(response, analysisType, intentData) {
  const intent = intentData?.intent || analysisType;
  
  // Pour comprehensive_analysis, vérifier présence des sections obligatoires
  if (intent === 'comprehensive_analysis') {
    // 🚨 STRICT: Les 9 sections DOIVENT être présentes (tolérance max: 1 section manquante)
    const requiredSections = [
      'VALORISATION',      // Section 1
      'FONDAMENTAUX',      // Section 2
      'CROISSANCE',        // Section 3
      'MOAT',              // Section 4
      'DIVIDENDE',         // Section 5 (ou "N/A - Pas de dividende")
      'RISQUES',           // Section 6
      'NEWS',              // Section 7 (ou "Actualités")
      'RECOMMANDATION',    // Section 8
      'QUESTIONS'          // Section 9 (ou "Questions suivi")
    ];

    const responseUpper = response.toUpperCase();
    const missingSections = requiredSections.filter(
      section => !responseUpper.includes(section)
    );

    // Tolérance STRICTE: Maximum 1 section manquante OU < 1200 mots = INCOMPLET
    const wordCount = response.split(/\s+/).length;
    const isComplete = missingSections.length <= 1 && wordCount >= 1200;

    if (!isComplete) {
      console.warn(`⚠️ [Validation] Analyse INCOMPLÈTE - Sections manquantes (${missingSections.length}/9): ${missingSections.join(', ')}, Mots: ${wordCount}/1200`);
    } else if (missingSections.length > 0) {
      console.log(`✓ [Validation] Analyse acceptée avec ${missingSections.length} section manquante: ${missingSections.join(', ')}, Mots: ${wordCount}`);
    } else {
      console.log(`✅ [Validation] Analyse COMPLÈTE - Toutes les 9 sections présentes, Mots: ${wordCount}`);
    }

    return isComplete;
  }
  
  // Pour autres types, validation basique (longueur minimale)
  const minWordCount = {
    'fundamentals': 500,
    'technical_analysis': 400,
    'news': 300,
    'stock_price': 100
  };
  
  const wordCount = response.split(/\s+/).length;
  return wordCount >= (minWordCount[intent] || 200);
}

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

      // CAS 2: Numéro inconnu sans nom - demander le nom SAUF si requête financière
      if (!isKnownInContacts && !hasName && !awaitingName) {
        // ✅ FIX: Détecter si c'est une requête financière (ANALYSE, PRIX, NEWS, etc.)
        // Si oui, traiter la requête d'abord, demander le nom après
        const messageUpper = message.trim().toUpperCase();
        const financialKeywords = [
          'ANALYSE', 'ANALYZE', 'PRIX', 'PRICE', 'NEWS', 'ACTUALITES', 'ACTUALITÉS',
          'RSI', 'MACD', 'FONDAMENTAUX', 'FUNDAMENTALS', 'TECHNIQUE', 'TECHNICAL',
          'COMPARER', 'COMPARE', 'RATIOS', 'CROISSANCE', 'GROWTH', 'MARCHE', 'MARKET',
          'INDICES', 'INDICES', 'SECTEUR', 'SECTOR', 'ACHETER', 'BUY', 'VENDRE', 'SELL',
          'LISTE', 'LIST', 'AJOUTER', 'ADD', 'RETIRER', 'REMOVE', 'TOP 5', 'SKILLS',
          'RESULTATS', 'EARNINGS', 'CALENDRIER', 'CALENDAR', 'INFLATION', 'FED', 'TAUX'
        ];
        
        const isFinancialRequest = financialKeywords.some(keyword => 
          messageUpper.includes(keyword) || messageUpper.startsWith(keyword + ' ')
        );
        
        // Détecter aussi les tickers (mots en majuscules de 1-5 lettres)
        const tickerPattern = /^[A-Z]{1,5}(\s|$)/;
        const hasTicker = tickerPattern.test(messageUpper) || messageUpper.match(/[A-Z]{2,5}/);

        if (!isFinancialRequest && !hasTicker) {
          // Ce n'est pas une requête financière → demander le nom
          console.log(`[Chat API] Numéro inconnu détecté, demande du nom (message non-financier)`);

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
        } else {
          // Requête financière détectée → traiter la requête, demander le nom après
          console.log(`[Chat API] Numéro inconnu mais requête financière détectée, traitement de la requête d'abord`);
          // Continuer le flux normal pour traiter la requête
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

    // 4.5. RÉCUPÉRER LA WATCHLIST - CONDITIONNEL (optimisation performance)
    // NOTE: Ces listes sont des FAVORIS/RACCOURCIS uniquement.
    // Emma a accès à MILLIERS de tickers mondiaux via APIs (FMP, Polygon, etc.)
    let userWatchlist = [];
    let teamTickers = [];
    
    // Déclarer forcedIntent qui sera initialisé plus tard (ligne 581+)
    let forcedIntent = null;

    // SIMPLIFICATION: Charger toujours (optimisation conditionnelle causait trop d'erreurs)
    // L'impact performance est minime (~300ms) comparé à la stabilité
    try {
      console.log('[Chat API] Loading watchlist/team_tickers');
      
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Charger watchlist et team_tickers depuis la table unifiée tickers
        const [watchlistResult, teamTickersResult] = await Promise.all([
          // Watchlist: source='watchlist' ou 'both'
          // Note: On charge les watchlists globales (user_id IS NULL) ET les watchlists utilisateur
          supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .or('source.eq.watchlist,source.eq.both')
            .order('ticker', { ascending: true }),
          // Team tickers: source='team' ou 'both'
          supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .or('source.eq.team,source.eq.both')
            .order('priority', { ascending: false })
        ]);

        // Traiter watchlist
        if (!watchlistResult.error && watchlistResult.data?.length > 0) {
          userWatchlist = watchlistResult.data.map(item => item.ticker);
          console.log(`[Chat API] Watchlist: ${userWatchlist.length} tickers`);
        } else if (watchlistResult.error && watchlistResult.error.code !== 'PGRST116') {
          console.log(`[Chat API] Watchlist non trouvée ou vide pour user ${userProfile.id}`);
        }

        // Traiter team_tickers
        if (!teamTickersResult.error && teamTickersResult.data?.length > 0) {
          teamTickers = teamTickersResult.data.map(item => item.ticker);
          console.log(`[Chat API] Team tickers: ${teamTickers.length} tickers`);
        } else {
          // Fallback hardcodé
          teamTickers = [
            'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
            'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
            'TRP', 'UNH', 'UL', 'VZ', 'WFC'
          ];
        }
      } catch (error) {
        console.error('[Chat API] Error loading lists (non-blocking):', error.message);
        // Fallback en cas d'erreur
        teamTickers = [
          'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
          'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
          'TRP', 'UNH', 'UL', 'VZ', 'WFC'
        ];
      }
    } catch (error) {
      console.error('[Chat API] Erreur chargement listes (non-bloquant):', error.message);
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
          : 'https://gob-projetsjsls-projects.vercel.app';

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
    // forcedIntent déjà déclaré ligne 205
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

    // 6.7. 💾 CACHE INTELLIGENT (2H) - DÉSACTIVÉ
    // Le cache de 2h a été désactivé pour que chaque demande soit régénérée
    console.log(`[Chat API] 🔄 CACHE DÉSACTIVÉ - Chaque demande sera régénérée`);
    
    // Générer clé de cache basée sur ticker + type d'analyse + canal (pour référence uniquement)
    const primaryTicker = (forcedIntent?.tickers && forcedIntent.tickers.length > 0) 
      ? forcedIntent.tickers[0] 
      : (metadata?.tickers && metadata.tickers.length > 0 ? metadata.tickers[0] : null);
    
    const analysisType = forcedIntent?.intent || 'general';
    const isSimulation = req.body.simulate === true; // Flag pour mode simulation
    
    // CACHE DÉSACTIVÉ - Ne plus vérifier ni utiliser le cache
    // let cacheKey = null;
    // let cachedData = null;
    
    // CODE CACHE COMMENTÉ - Désactivé pour régénération systématique
    /*
    if (primaryTicker && !isSimulation) {
      cacheKey = generateCacheKey(primaryTicker, analysisType, channel);
      cachedData = await getCachedResponse(cacheKey);
      
      if (cachedData) {
        const cacheAge = Math.round((Date.now() - cachedData.created_at) / 1000 / 60);
        console.log(`[Chat API] 💾 ✅ CACHE HIT - Âge: ${cacheAge} min, Hits: ${cachedData.hit_count}`);
        
        // Adapter la réponse cachée pour le canal
        let adaptedCachedResponse;
        try {
          // ✅ adaptForChannel peut retourner une Promise pour email (async)
          const adaptedResult = adaptForChannel(cachedData.response, channel, emmaContext);
          adaptedCachedResponse = adaptedResult instanceof Promise ? await adaptedResult : adaptedResult;
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
    */

    // 7. APPELER EMMA-AGENT (Function Calling Router existant) OU SMS V2 ORCHESTRATOR
    let emmaResponse;

    // 🚀 FEATURE FLAG: SMS V2 Complete System (28 intents)
    const USE_SMS_V2_COMPLETE = process.env.USE_SMS_ORCHESTRATOR_V2_COMPLETE === 'true';

    if (channel === 'sms' && USE_SMS_V2_COMPLETE) {
      // ⭐ NOUVEAU: SMS V2 Orchestrator (28 intents, LLM formatter only)
      try {
        console.log('[Chat API] 🚀 Appel SMS V2 Orchestrator (28 intents)...');

        const { processSMS } = await import('../lib/sms/sms-orchestrator-complete.cjs');
        const trimmedMessage = message.trim();

        const smsResult = await processSMS(trimmedMessage, {
          userId: userId,
          previousMessages: conversationHistory.slice(-3),
          previousSources: metadata?.previousSources || [],
        });

        // Adapter format de réponse pour compatibilité avec le reste du code
        emmaResponse = {
          success: true,
          response: smsResult.response,
          model: 'sms-v2-orchestrator',
          tools_used: [smsResult.metadata.dataSource || 'unknown'],
          execution_time_ms: smsResult.metadata.latency || 0,
          confidence: smsResult.metadata.needsClarification ? 0.5 : 1.0,
          intent: smsResult.metadata.intent,
          metadata: {
            smsV2: true,
            intent: smsResult.metadata.intent,
            latency: smsResult.metadata.latency,
            dataSource: smsResult.metadata.dataSource,
            validation: smsResult.metadata.validation,
            truncated: smsResult.metadata.truncated,
            pipeline: smsResult.metadata.pipeline,
          }
        };

        console.log(`[Chat API] ✅ SMS V2 response - Intent: ${emmaResponse.intent}, Latency: ${emmaResponse.execution_time_ms}ms`);

      } catch (error) {
        console.error('[Chat API] ❌ Erreur SMS V2 Orchestrator:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to process SMS with v2 system',
          details: error.message
        });
      }
    } else {
      // ✅ INCHANGÉ: Web, Email, Messenger, SMS (si flag=false)
      try {
        console.log(`[Chat API] Appel emma-agent (canal: ${channel})...`);

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

        // ⏱️ TIMEOUT INTELLIGENT : SMS=60s, Email=90s, Web/Messenger=75s
        const timeoutMs = channel === 'sms' ? 60000 : channel === 'email' ? 90000 : 75000;
        console.log(`[Chat API] ⏱️ Timeout configuré: ${timeoutMs}ms pour canal ${channel}`);

        // Call emma-agent avec timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Emma agent timeout after ${timeoutMs}ms`)), timeoutMs)
        );

        await Promise.race([
          emmaAgentModule.default(emmaRequest, emmaRes),
          timeoutPromise
        ]);

        if (!emmaResponseData || !emmaResponseData.success) {
          console.error('[Chat API] Emma agent unsuccessful response:', JSON.stringify(emmaResponseData, null, 2));
          throw new Error(`Emma agent returned unsuccessful response: ${emmaResponseData?.error || emmaResponseData?.response || 'Unknown error'}`);
        }

        emmaResponse = emmaResponseData;
        console.log(`[Chat API] Emma response reçue - Model: ${emmaResponse.model}, Tools: ${emmaResponse.tools_used?.length || 0}`);

        // ✅ VALIDATION: Vérifier la complétude de la réponse pour comprehensive_analysis
        if (forcedIntent?.intent === 'comprehensive_analysis') {
          const isComplete = validateResponseCompleteness(
            emmaResponse.response,
            'comprehensive_analysis',
            forcedIntent
          );

          if (!isComplete) {
            console.error(`❌ [Validation] RÉPONSE INCOMPLÈTE détectée pour comprehensive_analysis`);
            console.error(`   → Longueur: ${emmaResponse.response.length} chars`);
            console.error(`   → Mots: ${emmaResponse.response.split(/\s+/).length}`);
            console.error(`   → Model: ${emmaResponse.model}`);
            console.error(`   → Le prompt comprehensive_analysis n'a pas été suivi correctement`);
            // Note: On laisse passer la réponse mais on log l'erreur pour diagnostic
          }
        }

      } catch (error) {
        console.error('[Chat API] Erreur appel emma-agent:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to get response from Emma',
          details: error.message
        });
      }
    }

    // 8. ADAPTER LA RÉPONSE POUR LE CANAL
    let adaptedResponse;
    try {
      console.log(`[Chat API] 🔧 AVANT adaptation - Channel: ${channel}, Longueur: ${emmaResponse.response.length} chars`);
      console.log(`[Chat API] 🔧 Premiers 200 chars AVANT: ${emmaResponse.response.substring(0, 200)}`);
      
      // Passer le contexte + citations pour SMS (liens TradingView + sources amicales)
      // ✅ Ajouter tickers pour emails (logos d'entreprises)
      const adaptContext = {
        ...emmaContext,
        citations: emmaResponse.response.citations || [],  // 📰 Ajouter citations pour formatage amical
        tickers: emmaResponse.metadata?.intent?.tickers || emmaContext.tickers || []  // 🏢 Tickers pour logos emails
      };
      
      // ✅ adaptForChannel peut retourner une Promise pour email (async)
      const adaptedResult = adaptForChannel(emmaResponse.response, channel, adaptContext);
      adaptedResponse = adaptedResult instanceof Promise ? await adaptedResult : adaptedResult;
      
      console.log(`[Chat API] ✅ APRÈS adaptation - Channel: ${channel}, Longueur: ${adaptedResponse.length} chars`);
      console.log(`[Chat API] ✅ Premiers 200 chars APRÈS: ${adaptedResponse.substring(0, 200)}`);
      console.log(`[Chat API] ✅ Contient emojis numérotés: ${/[0-9]️⃣/.test(adaptedResponse)}`);
    } catch (error) {
      console.error('[Chat API] ❌ Erreur adaptation canal:', error);
      adaptedResponse = emmaResponse.response; // Fallback: réponse brute
    }

    // 8.5. 💾 SAUVEGARDER DANS LE CACHE (si applicable)
    // CACHE DÉSACTIVÉ - Ne plus sauvegarder dans le cache
    // Chaque demande sera régénérée sans mise en cache
    /*
    if (cacheKey && primaryTicker && !isSimulation) {
      try {
        // ✅ NOUVEAU: Valider complétude avant mise en cache
        const isComplete = validateResponseCompleteness(
          emmaResponse.response, 
          analysisType, 
          forcedIntent
        );
        
        if (!isComplete) {
          console.warn(`⚠️ [Cache] Réponse incomplète détectée, pas de mise en cache`);
          console.warn(`⚠️ [Cache] Longueur: ${emmaResponse.response.length} chars, Type: ${analysisType}`);
          // Ne pas mettre en cache les réponses incomplètes
        } else {
          await setCachedResponse(cacheKey, emmaResponse.response, {
            ticker: primaryTicker,
            analysis_type: analysisType,
            channel: channel,
            user_id: userId,
            model: emmaResponse.model,
            tools_used: emmaResponse.tools_used,
            confidence: emmaResponse.confidence
          });
          console.log('[Chat API] 💾 ✅ Réponse complète sauvegardée dans le cache (expire: 2h)');
        }
      } catch (error) {
        console.error('[Chat API] ⚠️ Erreur sauvegarde cache (non-bloquant):', error);
        // Non-bloquant, on continue
      }
    }
    */

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
