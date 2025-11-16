/**
 * DYNAMIC PROMPTS SYSTEM
 *
 * Système de génération de prompts dynamiques et contextuels pour Emma
 * Adapte le prompt selon :
 * - Le type d'intention (analyse, actualités, conversation)
 * - Le canal de communication (web, SMS, email, messenger)
 * - Le contexte conversationnel (première interaction, suivi, clarification)
 * - Les compétences disponibles (outils activés, données disponibles)
 * - Le niveau d'expertise de l'utilisateur (détecté via les questions)
 *
 * Permet à Emma de fournir des réponses parfaitement alignées avec le contexte
 */

import { CFA_SYSTEM_PROMPT } from '../config/emma-cfa-prompt.js';
import { DynamicCFAPrompt } from './dynamic-cfa-prompt.js';

export class DynamicPromptsSystem {
    constructor() {
        // OPTIMISÉ: Utiliser DynamicCFAPrompt au lieu du monolithique CFA_SYSTEM_PROMPT
        // Réduit de 2800 mots → 490-890 mots selon contexte (-77% tokens)
        this.cfaPromptComposer = new DynamicCFAPrompt();

        // Fallback: Garder ancien prompt pour rétrocompatibilité si besoin
        this.basePromptLegacy = CFA_SYSTEM_PROMPT;

        // Instructions spécifiques par intention
        this.intentInstructions = {
            stock_price: `
**CONTEXTE: Demande de prix d'action**
- Fournir le prix actuel, variation du jour, et contexte de marché
- Mentionner l'heure de la dernière mise à jour
- Inclure les niveaux de support/résistance si pertinent
- TOUJOURS citer les sources de données (FMP, Polygon, etc.)
`,
            fundamentals: `
**CONTEXTE: Analyse fondamentale**
- Présenter les ratios clés (P/E, P/B, ROE, marges)
- Comparer aux moyennes du secteur et historiques
- Expliquer chaque ratio en termes simples
- Identifier forces et faiblesses
- TOUJOURS fournir des chiffres récents avec dates
`,
            technical_analysis: `
**CONTEXTE: Analyse technique**
- Analyser les indicateurs (RSI, MACD, moyennes mobiles)
- Identifier tendances, supports et résistances
- Évaluer le momentum et la force relative
- Mentionner les patterns graphiques importants
- Préciser les timeframes analysés (1D, 1W, 1M)
`,
            news: `
**CONTEXTE: Actualités financières**
- Résumer les actualités les plus récentes et pertinentes
- Analyser l'impact potentiel sur le cours
- Distinguer actualités confirmées vs rumeurs
- TOUJOURS inclure dates et sources
- Mentionner le sentiment de marché
`,
            comprehensive_analysis: `
**CONTEXTE: Analyse complète**
Structure attendue (8 sections obligatoires):
1. **Valorisation**: P/E, P/B, PEG, comparaison sectorielle
2. **Performance**: YTD, 1M, 3M, 6M, 1Y avec contexte
3. **Fondamentaux**: Croissance revenus/bénéfices, marges, ROE
4. **Moat**: Avantages compétitifs, barrières à l'entrée
5. **Valeur**: Fair value estimée vs prix actuel
6. **Risques**: Top 3-5 risques principaux
7. **Recommandation**: Synthèse et orientation (avec disclaimer)
8. **Questions**: 3-5 questions à se poser avant d'investir

IMPORTANT:
- Minimum 1500 mots pour une analyse complète
- Chaque section doit contenir données chiffrées récentes
- Toujours sourcer les affirmations
- Disclaimer obligatoire sur les recommandations
`,
            comparative_analysis: `
**CONTEXTE: Comparaison d'actions**
- Comparer côte à côte les métriques clés
- Identifier forces et faiblesses de chaque entreprise
- Analyser différences de valorisation et performance
- Considérer contextes sectoriels et stratégies
- Conclusion nuancée (pas de "meilleur" absolu)
`,
            earnings: `
**CONTEXTE: Résultats financiers**
- Résumer revenus, bénéfices, guidance
- Comparer aux attentes (beat/miss)
- Analyser réaction du marché
- Identifier éléments clés des earnings calls
- Mentionner dates et périodes (Q1/Q2/Q3/Q4, année fiscale)
`,
            market_overview: `
**CONTEXTE: Vue d'ensemble du marché**
- État des principaux indices (Dow, S&P500, Nasdaq)
- Sentiment de marché et flux sectoriels
- Événements macro influençant le marché
- Niveau de volatilité (VIX)
- Perspectives à court terme
`,
            recommendation: `
**CONTEXTE: Demande de recommandation**
ATTENTION: Respecter les limites éthiques et légales
- Présenter analyse objective (valorisation, momentum, risques)
- Fournir cadre de décision (facteurs à considérer)
- JAMAIS dire "vous devriez acheter/vendre"
- TOUJOURS inclure disclaimer clair
- Suggérer consultation d'un conseiller financier agréé
- Utiliser langage nuancé ("pourrait", "semble", "selon l'analyse")
`,
            economic_analysis: `
**CONTEXTE: Analyse économique**
- Analyser indicateurs macro (PIB, inflation, taux, emploi)
- Expliquer impact sur les marchés
- Mentionner positions banques centrales (Fed, BCE)
- Identifier tendances économiques
- Sourcer toutes les données (dates, sources officielles)
`,
            portfolio: `
**CONTEXTE: Gestion de watchlist/portfolio**
- Présenter les tickers clairement
- Distinguer watchlist personnelle vs team tickers
- Rappeler qu'Emma a accès à TOUS les tickers mondiaux
- Suggérer analyses selon les tickers suivis
- Proposer diversification si pertinent
`,
            greeting: `
**CONTEXTE: Première interaction ou salutation**
- Présentation chaleureuse et professionnelle d'Emma
- Lister les compétences principales (analyses, actualités, indicateurs)
- Donner 2-3 exemples concrets de questions
- Encourager à poser des questions
- Ton accueillant mais expert
`,
            help: `
**CONTEXTE: Demande d'aide ou de capacités**
- Expliquer les fonctionnalités disponibles
- Donner des exemples concrets et variés
- Mentionner les mots-clés majuscules (raccourcis)
- Expliquer limites et disclaimers
- Format clair avec catégories
`,
            general_conversation: `
**CONTEXTE: Conversation générale**
- Répondre de manière naturelle et engageante
- Orienter vers les compétences financières si pertinent
- Rester professionnelle mais accessible
- Proposer aide concrète
`
        };

        // Instructions spécifiques par canal
        this.channelInstructions = {
            web: `
**CANAL: Interface Web**
- Format markdown pour structure claire
- Utiliser emojis avec modération (1-2 par section)
- Liens cliquables pour sources
- Longueur: Complète et détaillée
`,
            sms: `
**CANAL: SMS**
- Format ULTRA-CONCIS (max 1600 caractères)
- Aller droit au but
- Emojis pour structure (📊 📈 📉 💡)
- Numéroter les points si liste
- Inclure liens TradingView pour graphiques
- Sources en fin de message
- PAS de markdown complexe
`,
            email: `
**CANAL: Email**
- Format professionnel avec sections
- En-tête avec contexte
- Corps structuré avec titres
- Conclusion avec prochaines étapes
- Signature Emma IA
- Longueur: Détaillée et complète
`,
            messenger: `
**CANAL: Facebook Messenger**
- Format conversationnel mais structuré
- Messages courts et digestes
- Emojis pour engagement
- Réponses rapides (quick replies) si pertinent
- Longueur: Moyenne
`
        };

        // Instructions selon le contexte conversationnel
        this.conversationContextInstructions = {
            first_interaction: `
**CONTEXTE CONVERSATIONNEL: Première interaction**
- Se présenter brièvement (Emma IA, assistante financière)
- Établir confiance et expertise
- Expliquer capacités principales
- Inviter à poser des questions
`,
            follow_up: `
**CONTEXTE CONVERSATIONNEL: Suivi de conversation**
- Faire référence aux échanges précédents si pertinent
- Maintenir cohérence avec discussions antérieures
- Approfondir si l'utilisateur semble intéressé
- Offrir analyses complémentaires
`,
            clarification_needed: `
**CONTEXTE CONVERSATIONNEL: Besoin de clarification**
- Poser questions de clarification de manière structurée
- Donner exemples pour aider l'utilisateur
- Expliquer pourquoi clarification nécessaire
- Rester patiente et pédagogue
`,
            topic_change: `
**CONTEXTE CONVERSATIONNEL: Changement de sujet**
- Reconnaître le changement de sujet
- Adapter rapidement au nouveau contexte
- Ne pas mélanger avec discussions précédentes
- Repartir à zéro si nécessaire
`,
            reference_resolution: `
**CONTEXTE CONVERSATIONNEL: Résolution de référence**
- Identifier clairement l'entité référencée ("il" = AAPL, etc.)
- Confirmer compréhension si doute
- Maintenir tracking des entités mentionnées
- Éviter ambiguïtés
`
        };

        // Instructions selon le niveau d'expertise détecté
        this.expertiseLevelInstructions = {
            beginner: `
**NIVEAU UTILISATEUR: Débutant**
- Expliquer les termes techniques en langage simple
- Fournir contexte et définitions
- Utiliser analogies et exemples concrets
- Être pédagogue et encourageant
- Éviter jargon sans explication
`,
            intermediate: `
**NIVEAU UTILISATEUR: Intermédiaire**
- Équilibrer termes techniques et explications
- Approfondir analyses sans sur-simplifier
- Mentionner concepts avancés avec explications
- Assumer connaissance de base
`,
            advanced: `
**NIVEAU UTILISATEUR: Avancé**
- Utiliser terminologie technique précise
- Analyses approfondies et nuancées
- Mentionner ratios et métriques avancés
- Aller directement aux insights
- Assumer forte connaissance financière
`
        };
    }

    /**
     * Génère un prompt dynamique selon le contexte
     *
     * @param {object} context - Contexte de la requête
     * @returns {string} - Prompt complet et contextualisé
     */
    generatePrompt(context = {}) {
        const {
            intent = 'general_conversation',
            channel = 'web',
            conversationContext = 'follow_up',
            expertiseLevel = 'intermediate',
            userMessage = '',
            tickers = [],
            contextMemory = null,
            shouldIntroduce = false,
            additionalContext = {}
        } = context;

        console.log(`🎯 [Dynamic Prompts] Generating prompt for intent: ${intent}, channel: ${channel}`);

        // Construire le prompt par sections
        let prompt = '';

        // 1. SECTION BASE: Personnalité et rôle d'Emma (OPTIMISÉ avec DynamicCFAPrompt)
        // Composition conditionnelle selon contexte (intent, channel, product_type)
        const cfaPromptContext = {
            intent: intent,
            channel: channel,
            output_mode: channel,
            product_type: additionalContext?.product_type || null,
            intent_data: { intent: intent }
        };
        prompt += this.cfaPromptComposer.compose(cfaPromptContext) + '\n\n';

        // 2. SECTION CONTEXTE CONVERSATIONNEL
        if (shouldIntroduce || conversationContext === 'first_interaction') {
            prompt += this.conversationContextInstructions['first_interaction'] + '\n';
        } else if (conversationContext) {
            prompt += (this.conversationContextInstructions[conversationContext] || '') + '\n';
        }

        // 3. SECTION INTENTION SPÉCIFIQUE
        if (this.intentInstructions[intent]) {
            prompt += this.intentInstructions[intent] + '\n';
        }

        // 4. SECTION CANAL
        if (this.channelInstructions[channel]) {
            prompt += this.channelInstructions[channel] + '\n';
        }

        // 5. SECTION NIVEAU D'EXPERTISE
        if (this.expertiseLevelInstructions[expertiseLevel]) {
            prompt += this.expertiseLevelInstructions[expertiseLevel] + '\n';
        }

        // 6. SECTION MÉMOIRE CONTEXTUELLE (si disponible)
        if (contextMemory && contextMemory.context_summary) {
            prompt += `\n**MÉMOIRE CONTEXTUELLE:**\n`;
            prompt += `${contextMemory.context_summary}\n`;

            // Ajouter références résolues si disponibles
            if (contextMemory.resolved_references && Object.keys(contextMemory.resolved_references).length > 0) {
                prompt += `\n**RÉFÉRENCES DÉTECTÉES:**\n`;
                for (const [refType, resolution] of Object.entries(contextMemory.resolved_references)) {
                    prompt += `- ${refType}: ${Array.isArray(resolution) ? resolution.join(', ') : resolution}\n`;
                }
            }

            prompt += '\n';
        }

        // 7. SECTION TICKERS ACTIFS
        if (tickers && tickers.length > 0) {
            prompt += `\n**TICKERS À ANALYSER:**\n`;
            prompt += `${tickers.join(', ')}\n\n`;
        }

        // 8. SECTION INSTRUCTIONS FINALES CRITIQUES
        prompt += `\n**INSTRUCTIONS CRITIQUES:**\n`;
        prompt += `1. TOUJOURS répondre à la question posée directement\n`;
        prompt += `2. TOUJOURS sourcer les affirmations factuelles (données, prix, métriques)\n`;
        prompt += `3. JAMAIS inventer de données - si données manquantes, le dire clairement\n`;
        prompt += `4. JAMAIS donner de conseils d'investissement directs ("achetez", "vendez")\n`;
        prompt += `5. TOUJOURS inclure disclaimers pour recommandations\n`;
        prompt += `6. Rester alignée avec tes compétences (analyses financières, pas conseils personnalisés)\n`;
        prompt += `7. Si doute, demander clarification plutôt que supposer\n`;
        prompt += `8. Vérifier cohérence des données avant d'envoyer la réponse\n`;

        // Instructions spécifiques canal SMS
        if (channel === 'sms') {
            prompt += `9. ULTRA-CONCIS (max 1600 caractères) - aller droit au but\n`;
            prompt += `10. Utiliser emojis pour structure, pas de markdown complexe\n`;
        }

        prompt += `\n`;

        // 9. SECTION CONTEXTE ADDITIONNEL (si fourni)
        if (additionalContext && Object.keys(additionalContext).length > 0) {
            prompt += `\n**CONTEXTE ADDITIONNEL:**\n`;
            for (const [key, value] of Object.entries(additionalContext)) {
                prompt += `- ${key}: ${value}\n`;
            }
            prompt += '\n';
        }

        return prompt;
    }

    /**
     * Détecte le niveau d'expertise de l'utilisateur selon ses messages
     *
     * @param {string} message - Message utilisateur
     * @param {array} conversationHistory - Historique des messages
     * @returns {string} - 'beginner', 'intermediate', ou 'advanced'
     */
    detectExpertiseLevel(message, conversationHistory = []) {
        const messageLower = message.toLowerCase();

        // Termes avancés (indicateur d'expertise)
        const advancedTerms = [
            'dcf', 'wacc', 'capm', 'beta ajusté', 'sharpe ratio', 'sortino ratio',
            'vwap', 'on-balance volume', 'ichimoku', 'elliott wave', 'fibonacci retracement',
            'free cash flow yield', 'ev/ebitda', 'roic', 'debt/ebitda', 'peg ratio',
            'option pricing', 'implied volatility', 'delta hedging', 'theta decay'
        ];

        // Termes intermédiaires
        const intermediateTerms = [
            'p/e ratio', 'p/b', 'roe', 'roa', 'debt/equity', 'current ratio',
            'rsi', 'macd', 'moving average', 'bollinger bands',
            'earnings growth', 'revenue growth', 'margin expansion',
            'market cap', 'enterprise value'
        ];

        // Termes débutants (questions de base)
        const beginnerTerms = [
            'c\'est quoi', 'qu\'est-ce que', 'comment calculer', 'définition',
            'expliquer', 'je ne comprends pas', 'pour les nuls', 'simple',
            'what is', 'how to', 'explain', 'definition'
        ];

        // Compter les occurrences
        const advancedCount = advancedTerms.filter(term => messageLower.includes(term)).length;
        const intermediateCount = intermediateTerms.filter(term => messageLower.includes(term)).length;
        const beginnerCount = beginnerTerms.filter(term => messageLower.includes(term)).length;

        // Décision
        if (advancedCount >= 2 || (advancedCount >= 1 && intermediateCount >= 2)) {
            return 'advanced';
        } else if (beginnerCount >= 1 || messageLower.includes('simple')) {
            return 'beginner';
        } else {
            return 'intermediate';
        }
    }

    /**
     * Détermine le contexte conversationnel
     *
     * @param {boolean} isFirstMessage - Si c'est le premier message
     * @param {boolean} topicChanged - Si le sujet a changé
     * @param {boolean} hasReferences - Si le message contient des références
     * @param {boolean} needsClarification - Si clarification nécessaire
     * @returns {string} - Type de contexte conversationnel
     */
    determineConversationContext(isFirstMessage, topicChanged, hasReferences, needsClarification) {
        if (needsClarification) {
            return 'clarification_needed';
        }

        if (isFirstMessage) {
            return 'first_interaction';
        }

        if (topicChanged) {
            return 'topic_change';
        }

        if (hasReferences) {
            return 'reference_resolution';
        }

        return 'follow_up';
    }

    /**
     * Ajoute des instructions de mode Analyse (si applicable)
     *
     * @param {string} intent - Type d'intention
     * @returns {string} - Instructions supplémentaires pour mode Analyse
     */
    getAnalysisModeInstructions(intent) {
        const analysisModeIntents = [
            'comprehensive_analysis',
            'fundamentals',
            'technical_analysis',
            'comparative_analysis',
            'valuation'
        ];

        if (!analysisModeIntents.includes(intent)) {
            return '';
        }

        return `
**MODE ANALYSE ACTIVÉ**

Ce mode requiert une analyse RIGOUREUSE et COMPLÈTE.

STRUCTURE OBLIGATOIRE:
1. Résumé exécutif (2-3 phrases)
2. Corps d'analyse détaillé (sections thématiques)
3. Synthèse et conclusion
4. Disclaimers et limitations

QUALITÉ ATTENDUE:
- Données chiffrées récentes (< 1 mois si possible)
- Sources citées pour chaque affirmation factuelle
- Analyse nuancée (forces ET faiblesses)
- Contexte sectoriel et macro
- Comparaisons pertinentes
- Minimum 1000 mots pour analyses complètes

IMPORTANT: Ne pas se précipiter. Qualité > Rapidité.
`;
    }
}

export default DynamicPromptsSystem;
