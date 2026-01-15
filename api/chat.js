/**
 * API Chat Centralisee - Point d'entree unifie multi-canal
 *
 * Route toutes les requetes des differents canaux (web, email, SMS, messenger)
 * vers le function calling router Emma existant (emma-agent.js)
 *
 * Architecture:
 * Canal -> /api/chat -> User Manager -> Conversation Manager -> emma-agent -> Response -> Channel Adapter
 */

import { applyCors } from './_middleware/emma-cors.js';
import { getOrCreateUserProfile, updateUserProfile } from '../lib/user-manager.js';
import { getOrCreateConversation, saveConversationTurn, getConversationHistory, formatHistoryForEmma } from '../lib/conversation-manager.js';
import { adaptForChannel } from '../lib/channel-adapter.js';
import { getNameFromPhone, isKnownContact } from '../lib/phone-contacts.js';
import { TickerExtractor } from '../lib/utils/ticker-extractor.js';
import { validateYTDData, enrichStockDataWithSources } from '../lib/ytd-validator.js';
import { generateCacheKey, getCachedResponse, setCachedResponse } from '../lib/response-cache.js';
import { configManager } from '../lib/config-manager.js';

/**
 * Fetch market news from Perplexity API (fallback when FMP fails)
 */
async function fetchPerplexityMarketNews() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.warn('[Chat API] PERPLEXITY_API_KEY not configured');
    return null;
  }

  const prompt = `Agis comme un GESTIONNAIRE DE PORTEFEUILLE SENIOR a Wall Street.
Redige un briefing "REVUE DE MARCHE" concis et professionnel pour tes clients VIP.

STRUCTURE OBLIGATOIRE DU BRIEFING:

1.  ETATS-UNIS (S&P 500, NASDAQ, DOW)
- [Mouvement majeur des indices en % si dispo]
- [Actualite #1 la plus critique qui bouge le marche] (Source: [Nom], [URL])
- [Actualite #2 secteur Tech/Finance] (Source: [Nom], [URL])
- [Actualite #3 autre secteur cle] (Source: [Nom], [URL])

2.  CANADA (TSX, CAD/USD)
- [Actualite #1 Energie/Banques/Mines] (Source: [Nom], [URL])
- [Actualite #2 Economie] (Source: [Nom], [URL])

3.  EUROPE & MONDE
- [Actualite #1 majeure] (Source: [Nom], [URL])
- [Actualite #2 majeure] (Source: [Nom], [URL])

REGLES STRICTES:
- INCLURE LES URLS pour chaque point (c'est CRITIQUE).
- Ton professionnel, direct, pas de blabla.
- Focus sur ce qui fait bouger les prix MAINTENANT.
- Pas d'introduction "Voici le resume...". Commence direct par la section 1.
- SI AUCUNE NEWS MAJEURE: Dis "Marches calmes" pour la section.`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.1,
        search_recency_filter: 'day'
      })
    });

    if (!response.ok) {
      console.error('[Chat API] Perplexity API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      console.log('[Chat API] Perplexity returned market news successfully');
      return ` ACTUALITES DU JOUR\n${content}\n`;
    }
    return null;
  } catch (error) {
    console.error('[Chat API] Perplexity fetch error:', error.message);
    return null;
  }
}

/**
 * Valide qu'une reponse est complete selon le type d'analyse
 * 
 * @param {string} response - La reponse a valider
 * @param {string} analysisType - Type d'analyse (comprehensive_analysis, fundamentals, etc.)
 * @param {object} intentData - Donnees d'intention (forcedIntent)
 * @returns {boolean} true si la reponse est complete, false sinon
 */
function validateResponseCompleteness(response, analysisType, intentData) {
  const intent = intentData?.intent || analysisType;
  
  // Pour comprehensive_analysis, verifier presence des sections obligatoires
  if (intent === 'comprehensive_analysis') {
    //  12 sections UNIFIEES (tolerance: max 2 sections manquantes)
    const requiredSections = [
      'VUE D\'ENSEMBLE',   // Section 1 (ou "OVERVIEW")
      'VALORISATION',      // Section 2
      'FONDAMENTAUX',      // Section 3
      'CROISSANCE',        // Section 4
      'MOAT',              // Section 5
      'VALEUR INTRINSEQUE',// Section 6 (ou "DCF", "FAIR VALUE")
      'RESULTATS',         // Section 7 (ou "EARNINGS", "Q1/Q2/Q3/Q4")
      'MACRO',             // Section 8 (ou "FED", "INFLATION")
      'DIVIDENDE',         // Section 9 (ou "N/A")
      'RISQUES',           // Section 10
      'NEWS',              // Section 11 (ou "CATALYSTS", "ACTUALITES")
      'RECOMMANDATION'     // Section 12 (ou "RECO", "AVIS")
    ];

    const responseUpper = response.toUpperCase();

    // Verification flexible avec alternatives
    const checkSection = (section) => {
      const alternatives = {
        'VUE D\'ENSEMBLE': ['VUE D\'ENSEMBLE', 'OVERVIEW', 'APERCU'],
        'VALEUR INTRINSEQUE': ['VALEUR INTRINSEQUE', 'DCF', 'FAIR VALUE', 'VALEUR'],
        'RESULTATS': ['RESULTATS', 'EARNINGS', 'Q1', 'Q2', 'Q3', 'Q4', 'TRIMESTRE'],
        'MACRO': ['MACRO', 'FED', 'INFLATION', 'TAUX', 'ECONOMIQUE'],
        'NEWS': ['NEWS', 'CATALYSTS', 'ACTUALITES', 'CATALYST'],
        'RECOMMANDATION': ['RECOMMANDATION', 'RECO', 'AVIS', 'BUY', 'SELL', 'HOLD', 'ACHAT', 'VENDRE', 'CONSERVER']
      };

      const alts = alternatives[section] || [section];
      return alts.some(alt => responseUpper.includes(alt));
    };

    const missingSections = requiredSections.filter(section => !checkSection(section));

    // Tolerance: Max 2 sections manquantes, min 800 mots (SMS) ou 1200 mots (Web)
    const wordCount = response.split(/\s+/).length;
    const charCount = response.length;
    const isSMS = charCount < 4000;
    const minWords = isSMS ? 300 : 1200;
    const isComplete = missingSections.length <= 2 && wordCount >= minWords;

    if (!isComplete) {
      console.warn(` [Validation] Analyse INCOMPLETE - Sections manquantes (${missingSections.length}/12): ${missingSections.join(', ')}, Mots: ${wordCount}/${minWords}, Mode: ${isSMS ? 'SMS' : 'Web'}`);
    } else if (missingSections.length > 0) {
      console.log(` [Validation] Analyse acceptee avec ${missingSections.length} sections manquantes: ${missingSections.join(', ')}, Mots: ${wordCount}`);
    } else {
      console.log(` [Validation] Analyse COMPLETE - 12 sections presentes, Mots: ${wordCount}, Mode: ${isSMS ? 'SMS' : 'Web'}`);
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
  const handled = applyCors(req, res);
  if (handled) return;

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: 'Only POST requests are accepted'
    });
  }

  const startTime = Date.now();

  try {
    // 1. VALIDATION DES PARAMETRES
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

    console.log(`[Chat API] Requete recue - Canal: ${channel}, User: ${userId}, Message: "${message.substring(0, 50)}..."`);

    // 2. GESTION UTILISATEUR
    let userProfile;
    try {
      // Enrichir les metadonnees avec le nom si c'est un contact connu (SMS)
      if (channel === 'sms') {
        const userName = getNameFromPhone(userId);
        if (userName !== userId) { // Si un nom a ete trouve
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

    // 3.5 DEMANDER LE NOM SI NUMERO INCONNU (SMS uniquement)
    if (channel === 'sms') {
      const isKnownInContacts = isKnownContact(userId);
      const hasName = userProfile.name && userProfile.name !== userId;
      const awaitingName = userProfile.metadata?.awaiting_name === true;

      // CAS 1: Utilisateur en train de donner son nom
      if (awaitingName) {
        console.log(`[Chat API] Reception du nom de l'utilisateur`);

        // Extraire le nom (prendre le message comme nom, nettoyer)
        const userName = message.trim().split(/\s+/)[0]; // Premier mot

        try {
          await updateUserProfile(userProfile.id, {
            name: userName,
            metadata: { ...userProfile.metadata, awaiting_name: false, has_been_introduced: true }
          });
          console.log(`[Chat API] Nom enregistre: ${userName}`);

          // Reponse de bienvenue (Avec commandes explicites)
          const welcomeResponse = ` Enchante ${userName} ! 

Je suis Emma, ton assistante IA financiere propulsee par JSLAI 

Je peux t'aider sur 3 commandes specifiques:

 Analyses -> ANALYSE [TICKER]
 Prix -> PRIX [TICKER]
 News -> NEWS [TICKER]
Ex: "ANALYSE AAPL" ou "PRIX TSLA"

Pour arreter: reponds STOP`;

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

      // CAS 2: Numero inconnu sans nom - demander le nom SAUF si requete financiere
      if (!isKnownInContacts && !hasName && !awaitingName) {
        //  FIX: Detecter si c'est une requete financiere (ANALYSE, PRIX, NEWS, etc.)
        // Si oui, traiter la requete d'abord, demander le nom apres
        const messageUpper = message.trim().toUpperCase();
        const financialKeywords = [
          'ANALYSE', 'ANALYZE', 'PRIX', 'PRICE', 'NEWS', 'ACTUALITES', 'ACTUALITES',
          'ACHETER', 'BUY', 'VENDRE', 'SELL', 'SKILLS', 'AIDE', 'HELP'
        ];
        
        let isFinancialRequest = financialKeywords.some(keyword => 
          messageUpper.includes(keyword) || messageUpper.startsWith(keyword + ' ')
        );
        
        // Detecter aussi les tickers (mots en majuscules de 1-5 lettres)
        const tickerPattern = /^[A-Z]{1,5}(\s|$)/;
        const hasTicker = tickerPattern.test(messageUpper) || messageUpper.match(/[A-Z]{2,5}/);
        
        //  NOUVEAU: TOP NEWS (Market Overview)
        if (messageUpper.startsWith('TOP') && (messageUpper.includes('NEWS') || messageUpper.includes('TITRES'))) {
           isFinancialRequest = true;
        }

        if (!isFinancialRequest && !hasTicker) {
          // Ce n'est pas une requete financiere -> demander le nom
          console.log(`[Chat API] Numero inconnu detecte, demande du nom (message non-financier)`);

          try {
            await updateUserProfile(userProfile.id, {
              metadata: { ...userProfile.metadata, awaiting_name: true }
            });

            const askNameResponse = "Bonjour ! \n\nAvant de commencer, pourrais-tu me dire ton prenom ? Ca me permettra de personnaliser nos echanges.";

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
          // Requete financiere detectee -> traiter la requete, demander le nom apres
          console.log(`[Chat API] Numero inconnu mais requete financiere detectee, traitement de la requete d'abord`);
          // Continuer le flux normal pour traiter la requete
        }
      }
    }

    // 4. SMS STRICT MODE GUARDRAIL (Nouvelle restriction)
    if (channel === 'sms') {
      const messageUpper = message.trim().toUpperCase();
      
      // Recuperer les commandes autorisees depuis la config (avec fallback)
      const allowedCommands = await configManager.get('routing', 'sms_allowed_commands', [
        'ANALYSE', 'ANALYZE', 
        'PRIX', 'PRICE', 'COURS', 'QUOTE',
        'NEWS', 'ACTUALITES', 'ACTUALITES', 'INFOS',
        'SKILLS', 'AIDE', 'HELP', 'COMMANDES',
        'SALUT', 'BONJOUR', 'HELLO', 'HI', 'COUCOU', 'TEST'
      ]);
      
      const startsWithCommand = allowedCommands.some(cmd => messageUpper.startsWith(cmd));
      const isTickerOnly = /^[A-Z]{1,5}$/.test(messageUpper);
      const isShortReply = message.length < 10 && (['OUI', 'NON', 'YES', 'NO', 'OK'].includes(messageUpper) || /^\d+$/.test(messageUpper));

      if (!startsWithCommand && !isTickerOnly && !isShortReply) {
        console.log(`[Chat API]  SMS Guardrail: Message rejete "${message}"`);
        const guardrailResponse = ` Commande non reconnue.\n\nCommandes disponibles :\n\n ANALYSE [TICKER]\n PRIX [TICKER]\n NEWS [TICKER]\n AIDE\n\nEx: "Analyse MSFT"`;
        
        await saveConversationTurn(conversation.id, message, guardrailResponse, {
          type: 'guardrail_rejection',
          channel: channel
        });

        return res.status(200).json({
          success: true,
          response: guardrailResponse,
          metadata: { guardrail: true }
        });
      }
    }

    // 4. RECUPERER HISTORIQUE (pour contexte Emma)
    let conversationHistory = [];
    try {
      conversationHistory = await getConversationHistory(conversation.id, 10); // 10 derniers messages
      console.log(`[Chat API] Historique: ${conversationHistory.length} messages`);
    } catch (error) {
      console.error('[Chat API] Erreur recuperation historique:', error);
      // Non-bloquant, on continue sans historique
    }

    // 4.5. RECUPERER LA WATCHLIST - CONDITIONNEL (optimisation performance)
    // NOTE: Ces listes sont des FAVORIS/RACCOURCIS uniquement.
    // Emma a acces a MILLIERS de tickers mondiaux via APIs (FMP, Polygon, etc.)
    let userWatchlist = [];
    let teamTickers = [];
    
    // Declarer forcedIntent qui sera initialise plus tard (ligne 581+)
    let forcedIntent = null;

    // SIMPLIFICATION: Charger toujours (optimisation conditionnelle causait trop d'erreurs)
    // L'impact performance est minime (~300ms) compare a la stabilite
    try {
      console.log('[Chat API] Loading watchlist/team_tickers');
      
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Charger watchlist et team_tickers depuis la table unifiee tickers
        // Utilise maintenant la colonne 'category' au lieu de 'source'
        const [watchlistResult, teamTickersResult] = await Promise.all([
          // Watchlist: category='watchlist' ou 'both' OU 'watchlist' IN categories
          // Note: On charge les watchlists globales (user_id IS NULL) ET les watchlists utilisateur
          supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .or('category.eq.watchlist,category.eq.both')
            .order('ticker', { ascending: true }),
          // Team tickers: category='team' ou 'both' OU 'team' IN categories
          supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .or('category.eq.team,category.eq.both')
            .order('priority', { ascending: false })
        ]);

        // Traiter watchlist
        if (!watchlistResult.error && watchlistResult.data?.length > 0) {
          userWatchlist = watchlistResult.data.map(item => item.ticker);
          console.log(`[Chat API] Watchlist: ${userWatchlist.length} tickers`);
        } else if (watchlistResult.error && watchlistResult.error.code !== 'PGRST116') {
          console.log(`[Chat API] Watchlist non trouvee ou vide pour user ${userProfile.id}`);
        }

        // Traiter team_tickers
        if (!teamTickersResult.error && teamTickersResult.data?.length > 0) {
          teamTickers = teamTickersResult.data.map(item => item.ticker);
          console.log(`[Chat API] Team tickers: ${teamTickers.length} tickers`);
        } else {
          // Fallback hardcode
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

    // 5. DETECTER SI EMMA DOIT SE PRESENTER
    const isFirstMessage = conversationHistory.length === 0;
    const isTestEmma = message.toLowerCase().includes('test emma');
    const hasBeenIntroduced = userProfile.metadata?.has_been_introduced === true;

    //  FIX BUG 3: Detecter les salutations pour forcer presentation Emma
    const messageLower = message.toLowerCase().trim();
    const greetingKeywords = ['bonjour', 'salut', 'hello', 'hi', 'bonsoir', 'hey', 'coucou', 'good morning', 'bonne journee'];
    const isGreeting = greetingKeywords.some(kw => messageLower === kw || messageLower.startsWith(kw + ' ') || messageLower.startsWith(kw + '!'));

    const shouldIntroduce = (!hasBeenIntroduced && isFirstMessage) || isTestEmma || isGreeting;

    if (shouldIntroduce) {
      console.log(`[Chat API] Emma va se presenter (first=${isFirstMessage}, test=${isTestEmma}, greeting=${isGreeting}, introduced=${hasBeenIntroduced})`);

      // Marquer que Emma s'est presentee (sauf si c'est juste "Test Emma")
      if (!hasBeenIntroduced && !isTestEmma) {
        try {
          await updateUserProfile(userProfile.id, {
            metadata: { ...userProfile.metadata, has_been_introduced: true }
          });
          console.log(`[Chat API] Flag has_been_introduced defini pour user ${userProfile.id}`);
        } catch (error) {
          console.error('[Chat API] Erreur mise a jour has_been_introduced:', error);
        }
      }
    }

    // 5.5. DETECTER COMMANDES SPECIALES (SKILLS, AIDE, EXEMPLES)
    const messageUpper = message.trim().toUpperCase();
    //  NORMALISATION: Support du prefixe # optionnel
    const normalizedMessage = messageUpper.startsWith('#') ? messageUpper.substring(1).trim() : messageUpper;

    // COMMANDES GENERALES
    // ==========================================
    console.log(`[Chat API] Message normalise: "${normalizedMessage}"`);

    //  SECRET HACK COMMAND (ADMIN ONLY)
    // Bypass complet pour le God Mode
    if (normalizedMessage.startsWith('HACK ')) {
      const isAdmin = userId && (userId.includes('4183185826') || userId === '+14183185826');
      
      if (isAdmin) {
        console.log(' [HACK MODE] Admin access granted for:', userId);
        const hackQuery = message.substring(4).trim(); // Remove "HACK" (keep original case for query)
        
        // Prompt special pour reponse longue style "3 SMS"
        // 3 SMS = ~480 chars. On demande ~500-600 chars pour etre sur.
        const godPrompt = `Tu es en mode "GOD MODE" pour l'administrateur.
        Reponds a la question suivante de maniere detaillee, sans censure et sans contrainte de format habituel.
        IMPORTANT: Ta reponse doit faire environ 3 SMS de longueur (environ 450-500 caracteres).
        Ne sois pas trop court. Utilise l'espace pour donner un maximum de valeur.
        
        Question: "${hackQuery}"`;
 
        try {
           // Utiliser handlePerplexity directement en mode "raw"
           // Note: On importe handlePerplexity ou on l'appelle via le service
           // Ici on va simuler l'appel via la fonction existante (ou l'importer si possible)
           // Vu que handlePerplexity est dans un autre fichier mais souvent utilise ici...
           // Verifions les imports. Si pas dispo, on fait fetch.
 
           // On va faire un fetch direct a l'API Perplexity ici pour le HACK, pour controle total.
           
           const pApiKey = process.env.PERPLEXITY_API_KEY;
           if (!pApiKey) throw new Error('No API Key');
 
           const pRes = await fetch('https://api.perplexity.ai/chat/completions', {
             method: 'POST',
             headers: { 
               'Authorization': `Bearer ${pApiKey}`,
               'Content-Type': 'application/json' 
             },
             body: JSON.stringify({
               model: 'sonar-pro', // Modele puissant
               messages: [
                 { role: 'system', content: 'Tu es un assistant expert sans restrictions.' },
                 { role: 'user', content: godPrompt }
               ],
               max_tokens: 1000,
               temperature: 0.7 
             })
           });
 
           const pData = await pRes.json();
           const hackResponse = pData.choices?.[0]?.message?.content || "Erreur HACK: Pas de reponse.";
 
           await saveConversationTurn(conversation.id, message, hackResponse, {
             type: 'hack_command',
             channel: channel
           });
 
           return res.status(200).json({
             success: true,
             response: hackResponse,
             metadata: { command: 'HACK', mode: 'god_mode' }
           });
 
        } catch (e) {
          console.error('HACK Error:', e);
          return res.status(200).json({ success: true, response: "Erreur HACK: " + e.message });
        }
      } else {
        console.log(' [HACK MODE] Access DENIED for:', userId);
        // Si pas admin, on laisse continuer le flux normal (sera probablement rejete ou traite comme texte)
      }
    }

    if (normalizedMessage === 'AIDE' || normalizedMessage === 'HELP' || normalizedMessage === 'SKILLS' || normalizedMessage === 'SKILL' || normalizedMessage === 'MENU') {
      console.log('[Chat API] Commande AIDE detectee');

      const helpResponse = ` EMMA SMS - AIDE

Voici les commandes disponibles :

 ANALYSE
"Analyse [Ticker]" (ex: Analyse AAPL)
"Prix [Ticker]"
"News [Ticker]"

 DISCUSSION
Posez simplement vos questions !
Ex: "Que penses-tu de Tesla ?"

 STOP pour arreter`;

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


    // Commande TOP NEWS / Market Overview (revue complete des marches)
    // REMOVED: The previous TOP NEWS handler was removed as per user instruction.

    // 5.6. DETECTION MOTS-CLES MAJUSCULES (Raccourcis directs - ultra-rapide)
    // Ces mots-cles forcent une intention specifique sans analyse NLP
    // forcedIntent deja declare ligne 205
    let extractedTickers = [];

    // Helper functions delegating to centralized TickerExtractor utility
    const extractTickerFromCommand = (msg, keyword) => {
      return TickerExtractor.extractFromCommand(msg, keyword);
    };

    const extractTickersForComparison = (msg) => {
      return TickerExtractor.extractForComparison(msg);
    };

    /**
     * 
     *  COMMANDES RAPIDES EMMA - Reference complete
     * 
     * Le prefixe # est OPTIONNEL mais recommande pour faciliter l'identification.
     * Toutes les commandes fonctionnent avec ou sans #.
     *
     *  ANALYSES:
     *   #ANALYSE [TICKER]     -> Analyse complete 12 sections (ex: #ANALYSE AAPL)
     *   #FONDAMENTAUX [TICKER]-> Focus fondamentaux (ROE, marges, ratios)
     *   #TECHNIQUE [TICKER]   -> Analyse technique (RSI, MACD, supports)
     *   #COMPARER [T1] [T2]   -> Comparaison tete-a-tete
     *
     *  DONNEES:
     *   #PRIX [TICKER]        -> Prix actuel et variation
     *   #RATIOS [TICKER]      -> Ratios de valorisation (P/E, P/B, etc.)
     *   #CROISSANCE [TICKER]  -> Metriques de croissance (CAGR, etc.)
     *
     *  INDICATEURS TECHNIQUES:
     *   #RSI [TICKER]         -> RSI avec niveaux
     *   #MACD [TICKER]        -> MACD avec signal
     *   #MOYENNES [TICKER]    -> Moyennes mobiles (SMA/EMA)
     *
     *  ACTUALITES:
     *   #NEWS [TICKER]        -> Dernieres actualites
     *   #ACTUALITES [TICKER]  -> Alias pour NEWS
     *
     *  CALENDRIERS:
     *   #RESULTATS [TICKER]   -> Prochains/derniers earnings
     *   #RESULTATS            -> Calendrier general earnings
     *   #CALENDRIER           -> Calendrier economique
     *
     *  WATCHLIST:
     *   #LISTE                -> Afficher ma watchlist
     *   #AJOUTER [TICKER]     -> Ajouter un ticker
     *   #RETIRER [TICKER]     -> Retirer un ticker
     *
     *  MARCHE:
     *   #INDICES              -> Indices majeurs (S&P, NASDAQ, etc.)
     *   #MARCHE               -> Vue d'ensemble du marche
     *   #SECTEUR [NOM]        -> Analyse sectorielle
     *
     *  RECOMMANDATIONS:
     *   #ACHETER [TICKER]     -> Analyse d'achat potentiel
     *   #VENDRE [TICKER]      -> Analyse de vente potentielle
     *
     *  ECONOMIE:
     *   #FED                  -> Politique monetaire Fed
     *   #INFLATION            -> Analyse inflation
     *   #TAUX                 -> Taux d'interet et courbes
     *
     *  AIDE:
     *   #SKILLS               -> Liste des competences d'Emma
     *   #AIDE                 -> Guide d'utilisation
     * 
     */

    // ANALYSES (normalizedMessage deja defini ligne 407 avec support # optionnel)
    if (normalizedMessage.startsWith('ANALYSE ')) {
      const ticker = extractTickerFromCommand(normalizedMessage, 'ANALYSE');
      if (ticker) {
        forcedIntent = { intent: 'comprehensive_analysis', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut' };
      }
    } else if (normalizedMessage.startsWith('FONDAMENTAUX ')) {
      const ticker = extractTickerFromCommand(normalizedMessage, 'FONDAMENTAUX');
      if (ticker) {
        forcedIntent = { intent: 'fundamentals', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut' };
      }
    } else if (normalizedMessage.startsWith('TECHNIQUE ')) {
      const ticker = extractTickerFromCommand(normalizedMessage, 'TECHNIQUE');
      if (ticker) {
        forcedIntent = { intent: 'technical_analysis', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut' };
      }
    } else if (normalizedMessage.startsWith('COMPARER ') || normalizedMessage.includes(' VS ') || normalizedMessage.includes(' OU ')) {
      const tickers = extractTickersForComparison(normalizedMessage);
      if (tickers.length === 2) {
        forcedIntent = { intent: 'comparative_analysis', tickers: tickers, confidence: 1.0, method: 'keyword_shortcut' };
      }
    }

    // PRIX & DONNEES
    else if (normalizedMessage.startsWith('PRIX ')) {
      const ticker = extractTickerFromCommand(normalizedMessage, 'PRIX');
      if (ticker) {
        forcedIntent = { intent: 'stock_price', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut' };
      }
    } else if (normalizedMessage.startsWith('RATIOS ')) {
      const ticker = extractTickerFromCommand(normalizedMessage, 'RATIOS');
      if (ticker) {
        forcedIntent = { intent: 'fundamentals', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', focus: 'ratios' };
      }
    } else if (normalizedMessage.startsWith('CROISSANCE ')) {
      const ticker = extractTickerFromCommand(normalizedMessage, 'CROISSANCE');
      if (ticker) {
        forcedIntent = { intent: 'fundamentals', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', focus: 'growth' };
      }
    }

    // INDICATEURS TECHNIQUES
    else if (normalizedMessage.startsWith('RSI ')) {
      const ticker = extractTickerFromCommand(normalizedMessage, 'RSI');
      if (ticker) {
        forcedIntent = { intent: 'technical_analysis', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', indicator: 'RSI' };
      }
    } else if (normalizedMessage.startsWith('MACD ')) {
      const ticker = extractTickerFromCommand(normalizedMessage, 'MACD');
      if (ticker) {
        forcedIntent = { intent: 'technical_analysis', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', indicator: 'MACD' };
      }
    } else if (normalizedMessage.startsWith('MOYENNES ')) {
      const ticker = extractTickerFromCommand(normalizedMessage, 'MOYENNES');
      if (ticker) {
        forcedIntent = { intent: 'technical_analysis', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', indicator: 'SMA' };
      }
    }

    // ACTUALITES
    else if (normalizedMessage.startsWith('NEWS ') || normalizedMessage.startsWith('ACTUALITES ')) {
      const keyword = normalizedMessage.startsWith('NEWS') ? 'NEWS' : 'ACTUALITES';
      const ticker = extractTickerFromCommand(normalizedMessage, keyword);
      if (ticker) {
        forcedIntent = { intent: 'news', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut' };
      }
    }

    // CALENDRIERS
    else if (normalizedMessage.startsWith('RESULTATS')) {
      if (normalizedMessage.includes(' ')) {
        // "RESULTATS AAPL" -> earnings pour ticker specifique
        const ticker = extractTickerFromCommand(normalizedMessage, 'RESULTATS');
        if (ticker) {
          forcedIntent = { intent: 'earnings', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut' };
        }
      } else {
        // "RESULTATS" seul -> earnings calendar general
        forcedIntent = { intent: 'earnings', tickers: [], confidence: 1.0, method: 'keyword_shortcut' };
      }
    } else if (normalizedMessage.includes('CALENDRIER')) {
      forcedIntent = { intent: 'economic_analysis', tickers: [], confidence: 1.0, method: 'keyword_shortcut' };
    }

    // WATCHLIST
    else if (normalizedMessage === 'LISTE' || normalizedMessage === 'MA LISTE' || normalizedMessage === 'WATCHLIST') {
      forcedIntent = { intent: 'portfolio', tickers: [], confidence: 1.0, method: 'keyword_shortcut', action: 'view' };
    } else if (normalizedMessage.startsWith('AJOUTER ')) {
      const ticker = extractTickerFromCommand(normalizedMessage, 'AJOUTER');
      if (ticker) {
        forcedIntent = { intent: 'portfolio', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', action: 'add' };
      }
    } else if (normalizedMessage.startsWith('RETIRER ') || normalizedMessage.startsWith('SUPPRIMER ')) {
      const keyword = normalizedMessage.startsWith('RETIRER') ? 'RETIRER' : 'SUPPRIMER';
      const ticker = extractTickerFromCommand(normalizedMessage, keyword);
      if (ticker) {
        forcedIntent = { intent: 'portfolio', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', action: 'remove' };
      }
    }

    // MARCHE
    else if (normalizedMessage === 'INDICES') {
      forcedIntent = { intent: 'market_overview', tickers: [], confidence: 1.0, method: 'keyword_shortcut' };
    }

    // RECOMMANDATION
    else if (normalizedMessage.startsWith('ACHETER ')) {
      const ticker = extractTickerFromCommand(normalizedMessage, 'ACHETER');
      if (ticker) {
        forcedIntent = { intent: 'recommendation', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', bias: 'buy' };
      }
    } else if (normalizedMessage.startsWith('VENDRE ')) {
      const ticker = extractTickerFromCommand(normalizedMessage, 'VENDRE');
      if (ticker) {
        forcedIntent = { intent: 'recommendation', tickers: [ticker], confidence: 1.0, method: 'keyword_shortcut', bias: 'sell' };
      }
    }

    // ECONOMIE
    else if (normalizedMessage.includes('INFLATION') || normalizedMessage.includes('FED') || normalizedMessage.includes('TAUX')) {
      forcedIntent = { intent: 'economic_analysis', tickers: [], confidence: 1.0, method: 'keyword_shortcut' };
    }

    // Si forced intent detecte, logger et utiliser directement
    if (forcedIntent) {
      console.log(`[Chat API]  Mot-cle majuscule detecte: ${forcedIntent.intent} (${forcedIntent.tickers.join(', ') || 'aucun ticker'})`);
    }

    // 6. PREPARER LE CONTEXTE POUR EMMA-AGENT
    // Combiner watchlist + team tickers (union sans doublons)
    const allTickers = [...new Set([...userWatchlist, ...teamTickers])];

    // 6.5.  VALIDATION YTD - Eviter les hallucinations de Perplexity
    // Enrichir les donnees de stock avec validation YTD
    let validatedStockData = metadata?.stockData || {};
    try {
      if (Object.keys(validatedStockData).length > 0) {
        console.log(`[Chat API] Validation YTD pour ${Object.keys(validatedStockData).length} stocks...`);
        
        // Enrichir chaque stock avec validation et source
        for (const ticker in validatedStockData) {
          const stock = validatedStockData[ticker];
          if (stock && typeof stock === 'object') {
            // Valider YTD coherence
            const validation = validateYTDData(stock);
            
            if (!validation.valid) {
              console.warn(` [Chat API] YTD invalide pour ${ticker}:`, validation.issues);
            }
            
            // Enrichir avec metadonnees de source (marque les donnees FMP vs Perplexity)
            validatedStockData[ticker] = enrichStockDataWithSources(stock, 'fmp');
          }
        }
        
        console.log(`[Chat API]  Validation YTD completee`);
      }
    } catch (error) {
      console.warn(`[Chat API]  Erreur validation YTD (non-bloquant):`, error.message);
      // Non-bloquant, continuer avec les donnees originales
    }

    const emmaContext = {
      output_mode: channel === 'email' ? 'ticker_note' : 'chat', // Email = format long, autres = chat
      user_name: userProfile.name || null, // Nom de l'utilisateur pour personnalisation
      user_channel: channel, // Canal de communication
      should_introduce: shouldIntroduce, // Emma doit se presenter
      tickers: metadata?.tickers || (forcedIntent?.tickers.length > 0 ? forcedIntent.tickers : allTickers), // Utiliser forced tickers si present
      user_watchlist: userWatchlist, // Watchlist personnelle de l'utilisateur
      team_tickers: teamTickers, // Tickers d'equipe partages
      all_tickers: allTickers, // Union watchlist + team (sans doublons)
      stockData: validatedStockData, // Utiliser donnees VALIDEES au lieu de metadata?.stockData
      newsData: metadata?.newsData || [],
      apiStatus: metadata?.apiStatus || {},
      conversationHistory: formatHistoryForEmma(conversationHistory),
      forced_intent: forcedIntent // Passer le forced intent a Emma Agent
    };

    // 6.7.  CACHE INTELLIGENT (2H) - DESACTIVE
    // Le cache de 2h a ete desactive pour que chaque demande soit regeneree
    console.log(`[Chat API]  CACHE DESACTIVE - Chaque demande sera regeneree`);
    
    // Generer cle de cache basee sur ticker + type d'analyse + canal (pour reference uniquement)
    const primaryTicker = (forcedIntent?.tickers && forcedIntent.tickers.length > 0) 
      ? forcedIntent.tickers[0] 
      : (metadata?.tickers && metadata.tickers.length > 0 ? metadata.tickers[0] : null);
    
    const analysisType = forcedIntent?.intent || 'general';
    const isSimulation = req.body.simulate === true; // Flag pour mode simulation
    
    // CACHE DESACTIVE - Ne plus verifier ni utiliser le cache
    // let cacheKey = null;
    // let cachedData = null;
    
    // CODE CACHE COMMENTE - Desactive pour regeneration systematique
    /*
    if (primaryTicker && !isSimulation) {
      cacheKey = generateCacheKey(primaryTicker, analysisType, channel);
      cachedData = await getCachedResponse(cacheKey);
      
      if (cachedData) {
        const cacheAge = Math.round((Date.now() - cachedData.created_at) / 1000 / 60);
        console.log(`[Chat API]   CACHE HIT - Age: ${cacheAge} min, Hits: ${cachedData.hit_count}`);
        
        // Adapter la reponse cachee pour le canal
        let adaptedCachedResponse;
        try {
          //  adaptForChannel peut retourner une Promise pour email (async)
          const adaptedResult = adaptForChannel(cachedData.response, channel, emmaContext);
          adaptedCachedResponse = adaptedResult instanceof Promise ? await adaptedResult : adaptedResult;
        } catch (error) {
          console.error('[Chat API] Erreur adaptation reponse cachee:', error);
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
        
        // Retourner reponse cachee
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
        console.log(`[Chat API]   CACHE MISS - Generation nouvelle reponse`);
      }
    } else if (isSimulation) {
      console.log(`[Chat API]  MODE SIMULATION - Cache desactive`);
    }
    */

    // 7. APPELER EMMA-AGENT (Function Calling Router existant) OU SMS V2 ORCHESTRATOR
    let emmaResponse;

    //  FEATURE FLAG: SMS V2 Complete System (28 intents)
    const USE_SMS_V2_COMPLETE = process.env.USE_SMS_ORCHESTRATOR_V2_COMPLETE === 'true';

    if (channel === 'sms' && USE_SMS_V2_COMPLETE) {
      //  NOUVEAU: SMS V2 Orchestrator (28 intents, LLM formatter only)
      try {
        console.log('[Chat API]  Appel SMS V2 Orchestrator (28 intents)...');

        const { processSMS } = await import('../lib/sms/sms-orchestrator-complete.cjs');
        const trimmedMessage = message.trim();

        const smsResult = await processSMS(trimmedMessage, {
          userId: userId,
          previousMessages: conversationHistory.slice(-3),
          previousSources: metadata?.previousSources || [],
        });

        // Adapter format de reponse pour compatibilite avec le reste du code
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

        console.log(`[Chat API]  SMS V2 response - Intent: ${emmaResponse.intent}, Latency: ${emmaResponse.execution_time_ms}ms`);

      } catch (error) {
        console.error('[Chat API]  Erreur SMS V2 Orchestrator:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to process SMS with v2 system',
          details: error.message
        });
      }
    } else {
      //  INCHANGE: Web, Email, Messenger, SMS (si flag=false)
      try {
        console.log(`[Chat API] Appel emma-agent (canal: ${channel})...`);

        // Simuler appel interne a emma-agent
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

        //  TIMEOUT INTELLIGENT : SMS=60s, Email=90s, Web/Messenger=75s
        const timeoutMs = channel === 'sms' ? 60000 : channel === 'email' ? 90000 : 75000;
        console.log(`[Chat API]  Timeout configure: ${timeoutMs}ms pour canal ${channel}`);

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
        console.log(`[Chat API] Emma response recue - Model: ${emmaResponse.model}, Tools: ${emmaResponse.tools_used?.length || 0}`);

        //  VALIDATION: Verifier la completude de la reponse pour comprehensive_analysis
        if (forcedIntent?.intent === 'comprehensive_analysis') {
          const isComplete = validateResponseCompleteness(
            emmaResponse.response,
            'comprehensive_analysis',
            forcedIntent
          );

          if (!isComplete) {
            console.error(` [Validation] REPONSE INCOMPLETE detectee pour comprehensive_analysis`);
            console.error(`   -> Longueur: ${emmaResponse.response.length} chars`);
            console.error(`   -> Mots: ${emmaResponse.response.split(/\s+/).length}`);
            console.error(`   -> Model: ${emmaResponse.model}`);
            console.error(`   -> Le prompt comprehensive_analysis n'a pas ete suivi correctement`);
            // Note: On laisse passer la reponse mais on log l'erreur pour diagnostic
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

    // 8. ADAPTER LA REPONSE POUR LE CANAL
    let adaptedResponse;
    try {
      console.log(`[Chat API]  AVANT adaptation - Channel: ${channel}, Longueur: ${emmaResponse.response.length} chars`);
      console.log(`[Chat API]  Premiers 200 chars AVANT: ${emmaResponse.response.substring(0, 200)}`);
      
      // Passer le contexte + citations pour SMS (liens TradingView + sources amicales)
      //  Ajouter tickers pour emails (logos d'entreprises)
      const adaptContext = {
        ...emmaContext,
        citations: emmaResponse.response.citations || [],  //  Ajouter citations pour formatage amical
        tickers: emmaResponse.metadata?.intent?.tickers || emmaContext.tickers || []  //  Tickers pour logos emails
      };
      
      //  adaptForChannel peut retourner une Promise pour email (async)
      const adaptedResult = adaptForChannel(emmaResponse.response, channel, adaptContext);
      adaptedResponse = adaptedResult instanceof Promise ? await adaptedResult : adaptedResult;
      
      console.log(`[Chat API]  APRES adaptation - Channel: ${channel}, Longueur: ${adaptedResponse.length} chars`);
      console.log(`[Chat API]  Premiers 200 chars APRES: ${adaptedResponse.substring(0, 200)}`);
      console.log(`[Chat API]  Contient emojis numerotes: ${/[0-9]/.test(adaptedResponse)}`);
    } catch (error) {
      console.error('[Chat API]  Erreur adaptation canal:', error);
      adaptedResponse = emmaResponse.response; // Fallback: reponse brute
    }

    // 8.5.  SAUVEGARDER DANS LE CACHE (si applicable)
    // CACHE DESACTIVE - Ne plus sauvegarder dans le cache
    // Chaque demande sera regeneree sans mise en cache
    /*
    if (cacheKey && primaryTicker && !isSimulation) {
      try {
        //  NOUVEAU: Valider completude avant mise en cache
        const isComplete = validateResponseCompleteness(
          emmaResponse.response, 
          analysisType, 
          forcedIntent
        );
        
        if (!isComplete) {
          console.warn(` [Cache] Reponse incomplete detectee, pas de mise en cache`);
          console.warn(` [Cache] Longueur: ${emmaResponse.response.length} chars, Type: ${analysisType}`);
          // Ne pas mettre en cache les reponses incompletes
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
          console.log('[Chat API]   Reponse complete sauvegardee dans le cache (expire: 2h)');
        }
      } catch (error) {
        console.error('[Chat API]  Erreur sauvegarde cache (non-bloquant):', error);
        // Non-bloquant, on continue
      }
    }
    */

    // 9. SAUVEGARDER DANS LA CONVERSATION
    try {
      await saveConversationTurn(
        conversation.id,
        message,
        emmaResponse.response, // Sauvegarder la reponse originale (pas adaptee)
        {
          model: emmaResponse.model,
          toolsUsed: emmaResponse.tools_used,
          executionTimeMs: emmaResponse.execution_time_ms,
          confidence: emmaResponse.confidence,
          channel: channel
        }
      );
      console.log('[Chat API] Conversation sauvegardee');
    } catch (error) {
      console.error('[Chat API] Erreur sauvegarde conversation:', error);
      // Non-bloquant, on continue
    }

    // 10. REPONSE FINALE
    const executionTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      response: adaptedResponse, // Reponse adaptee au canal
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
    console.error('[Chat API] Erreur generale:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Exemple de requete:
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
 *   "response": "Apple (AAPL) se negocie a 150.25$ (+2.3%)...",
 *   "conversationId": "uuid-1234",
 *   "metadata": {
 *     "llmUsed": "perplexity",
 *     "toolsUsed": ["fmp-quote", "fmp-fundamentals"],
 *     "executionTimeMs": 2341,
 *     "channel": "sms"
 *   }
 * }
 */
