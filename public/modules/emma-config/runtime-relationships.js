/**
 * RUNTIME RELATIONSHIPS - Mapping des prompts utilises ensemble lors de l'execution
 *
 * Ce fichier definit les relations basees sur l'utilisation reelle des prompts
 * dans les differents scenarios d'execution d'Emma (SMS, Web, Email, Messenger).
 *
 * Architecture d'execution:
 * 1. Identite de base (general_identity ou specialisee par canal)
 * 2. Intent specifique (intent_xxx ou intent_xxx_sms/web/email)
 * 3. Standards CFA (cfa_standards, cfa_instructions)
 * 4. Format de canal (modules dynamiques: smsFormat, webFormat, emailFormat)
 * 5. Briefings (briefing_morning/midday/evening utilisent identites + outils)
 */

/**
 * Flux d'execution par canal et intent
 *
 * Format:
 * {
 *   flowId: {
 *     name: "Nom du flux",
 *     description: "Description du scenario",
 *     prompts: ["prompt_key1", "prompt_key2", ...],
 *     type: "channel" | "intent" | "briefing"
 *   }
 * }
 */
export const RUNTIME_FLOWS = {
    // 
    // FLUX SMS - Analyses via SMS (multi-parties)
    // 
    "sms_comprehensive_analysis": {
        name: " SMS: Analyse Complete",
        description: "Analyse CFA complete d'un ticker via SMS (multi-parties, 12 sections)",
        channel: "sms",
        intent: "comprehensive_analysis",
        prompts: [
            "general_identity_sms",       // Identite pour SMS
            "intent_comprehensive_analysis", // Analyse complete (generique)
            "intent_comprehensive_analysis_sms", // Variante SMS si existe
            "cfa_standards",              // Standards de qualite CFA
            "cfa_instructions",           // Instructions de formatage
            "cfa_identity"                // Identite professionnelle
        ],
        dynamicModules: ["core", "smsFormat", "comprehensiveAnalysis", "qualityChecklist"]
    },

    "sms_stock_price": {
        name: " SMS: Prix Action",
        description: "Demande rapide de prix via SMS",
        channel: "sms",
        intent: "stock_price",
        prompts: [
            "general_identity_sms",
            "intent_stock_price",
            "intent_stock_price_sms",
            "cfa_standards"
        ],
        dynamicModules: ["core", "smsFormat", "quickAnalysis", "qualityChecklist"]
    },

    "sms_news": {
        name: " SMS: Actualites",
        description: "Resume des actualites financieres via SMS",
        channel: "sms",
        intent: "news",
        prompts: [
            "general_identity_sms",
            "intent_news",
            "intent_news_sms",
            "cfa_standards"
        ],
        dynamicModules: ["core", "smsFormat", "quickAnalysis", "qualityChecklist"]
    },

    "sms_fundamentals": {
        name: " SMS: Fondamentaux",
        description: "Analyse fondamentale via SMS",
        channel: "sms",
        intent: "fundamentals",
        prompts: [
            "general_identity_sms",
            "intent_fundamentals",
            "intent_fundamentals_sms",
            "cfa_standards",
            "cfa_instructions"
        ],
        dynamicModules: ["core", "smsFormat", "quickAnalysis", "qualityChecklist"]
    },

    "sms_technical_analysis": {
        name: " SMS: Analyse Technique",
        description: "Indicateurs techniques via SMS",
        channel: "sms",
        intent: "technical_analysis",
        prompts: [
            "general_identity_sms",
            "intent_technical_analysis",
            "intent_technical_analysis_sms",
            "cfa_standards"
        ],
        dynamicModules: ["core", "smsFormat", "quickAnalysis", "qualityChecklist"]
    },

    "sms_greeting": {
        name: " SMS: Salutation",
        description: "Premiere interaction SMS",
        channel: "sms",
        intent: "greeting",
        prompts: [
            "general_identity_sms",
            "intent_greeting",
            "general_instructions"
        ],
        dynamicModules: ["core", "smsFormat"]
    },

    // 
    // FLUX WEB - Chatbot sur dashboard
    // 
    "web_comprehensive_analysis": {
        name: " Web: Analyse Complete",
        description: "Analyse CFA complete via chatbot web (format long, markdown)",
        channel: "web",
        intent: "comprehensive_analysis",
        prompts: [
            "general_identity_web",
            "general_identity",           // Fallback si pas de variante web
            "intent_comprehensive_analysis",
            "intent_comprehensive_analysis_web",
            "cfa_standards",
            "cfa_instructions",
            "cfa_identity"
        ],
        dynamicModules: ["core", "webFormat", "comprehensiveAnalysis", "qualityChecklist"]
    },

    "web_stock_price": {
        name: " Web: Prix Action",
        description: "Demande de prix via chatbot web",
        channel: "web",
        intent: "stock_price",
        prompts: [
            "general_identity_web",
            "general_identity",
            "intent_stock_price",
            "intent_stock_price_web",
            "cfa_standards"
        ],
        dynamicModules: ["core", "webFormat", "quickAnalysis", "qualityChecklist"]
    },

    "web_economic_analysis": {
        name: " Web: Analyse Economique",
        description: "Analyse macro (taux, inflation, Fed) via web",
        channel: "web",
        intent: "economic_analysis",
        prompts: [
            "general_identity_web",
            "general_identity",
            "intent_economic_analysis",
            "intent_economic_analysis_web",
            "cfa_standards"
        ],
        dynamicModules: ["core", "webFormat", "quickAnalysis", "qualityChecklist"]
    },

    "web_market_overview": {
        name: " Web: Vue Marche",
        description: "Apercu des marches (indices, sentiment)",
        channel: "web",
        intent: "market_overview",
        prompts: [
            "general_identity_web",
            "general_identity",
            "intent_market_overview",
            "intent_market_overview_web",
            "cfa_standards"
        ],
        dynamicModules: ["core", "webFormat", "quickAnalysis", "qualityChecklist"]
    },

    "web_greeting": {
        name: " Web: Bienvenue",
        description: "Premiere interaction sur chatbot web",
        channel: "web",
        intent: "greeting",
        prompts: [
            "general_identity_web",
            "general_identity",
            "intent_greeting",
            "intent_greeting_web",
            "general_instructions"
        ],
        dynamicModules: ["core", "webFormat"]
    },

    // 
    // FLUX EMAIL - Reponses par email
    // 
    "email_comprehensive_analysis": {
        name: " Email: Analyse Complete",
        description: "Analyse complete envoyee par email (format professionnel)",
        channel: "email",
        intent: "comprehensive_analysis",
        prompts: [
            "general_identity_email",
            "general_identity",
            "intent_comprehensive_analysis",
            "intent_comprehensive_analysis_email",
            "cfa_standards",
            "cfa_instructions",
            "cfa_identity"
        ],
        dynamicModules: ["core", "emailFormat", "comprehensiveAnalysis", "qualityChecklist"]
    },

    "email_response": {
        name: " Email: Reponse Generale",
        description: "Reponse generale par email",
        channel: "email",
        intent: "general_conversation",
        prompts: [
            "general_identity_email",
            "general_identity",
            "intent_general_conversation",
            "general_instructions"
        ],
        dynamicModules: ["core", "emailFormat"]
    },

    // 
    // FLUX MESSENGER - Facebook Messenger
    // 
    "messenger_stock_price": {
        name: " Messenger: Prix Action",
        description: "Prix et donnees via Facebook Messenger",
        channel: "messenger",
        intent: "stock_price",
        prompts: [
            "general_identity_messenger",
            "general_identity",
            "intent_stock_price",
            "intent_stock_price_messenger",
            "cfa_standards"
        ],
        dynamicModules: ["core", "messengerFormat", "quickAnalysis", "qualityChecklist"]
    },

    "messenger_greeting": {
        name: " Messenger: Bienvenue",
        description: "Premiere interaction sur Messenger",
        channel: "messenger",
        intent: "greeting",
        prompts: [
            "general_identity_messenger",
            "general_identity",
            "intent_greeting",
            "intent_greeting_messenger",
            "general_instructions"
        ],
        dynamicModules: ["core", "messengerFormat"]
    },

    // 
    // FLUX BRIEFINGS - Emails automatiques quotidiens
    // 
    "briefing_morning": {
        name: " Briefing Matin",
        description: "Briefing matinal quotidien (11:20 UTC, 7h20 Montreal)",
        channel: "email",
        intent: "briefing",
        prompts: [
            "briefing_morning",           // Prompt principal du briefing
            "general_identity",           // Identite de base
            "cfa_identity",               // Credibilite professionnelle
            "general_instructions",       // Instructions generales
            "briefing_standards"          // Standards de qualite briefings
        ],
        dynamicModules: ["core", "emailFormat", "qualityChecklist"],
        cron: "20 11 * * 1-5", // Weekdays 11:20 UTC
        recipients: ["daniel.ouellet@jsltl.ca"]
    },

    "briefing_midday": {
        name: " Briefing Midi",
        description: "Briefing mi-journee (15:50 UTC, 11h50 Montreal)",
        channel: "email",
        intent: "briefing",
        prompts: [
            "briefing_midday",
            "general_identity",
            "cfa_identity",
            "general_instructions",
            "briefing_standards"
        ],
        dynamicModules: ["core", "emailFormat", "qualityChecklist"],
        cron: "50 15 * * 1-5", // Weekdays 15:50 UTC
        recipients: ["daniel.ouellet@jsltl.ca"]
    },

    "briefing_evening": {
        name: " Briefing Soir",
        description: "Briefing de cloture (20:20 UTC, 16h20 Montreal)",
        channel: "email",
        intent: "briefing",
        prompts: [
            "briefing_evening",
            "general_identity",
            "cfa_identity",
            "general_instructions",
            "briefing_standards"
        ],
        dynamicModules: ["core", "emailFormat", "qualityChecklist"],
        cron: "20 20 * * 1-5", // Weekdays 20:20 UTC
        recipients: ["daniel.ouellet@jsltl.ca"]
    },

    // 
    // FLUX SPECIALISES - Cas particuliers
    // 
    "comparative_analysis": {
        name: " Analyse Comparative",
        description: "Comparaison de plusieurs tickers (tous canaux)",
        channel: "any",
        intent: "comparative_analysis",
        prompts: [
            "general_identity",
            "intent_comparative_analysis",
            "cfa_standards",
            "cfa_instructions",
            "cfa_identity"
        ],
        dynamicModules: ["core", "comprehensiveAnalysis", "qualityChecklist"]
    },

    "earnings_analysis": {
        name: " Analyse Resultats",
        description: "Analyse de resultats trimestriels (earnings)",
        channel: "any",
        intent: "earnings",
        prompts: [
            "general_identity",
            "intent_earnings",
            "cfa_standards",
            "cfa_instructions"
        ],
        dynamicModules: ["core", "quickAnalysis", "qualityChecklist"]
    },

    "portfolio_management": {
        name: " Gestion Portfolio",
        description: "Gestion watchlist et team tickers",
        channel: "any",
        intent: "portfolio",
        prompts: [
            "general_identity",
            "intent_portfolio",
            "general_instructions"
        ],
        dynamicModules: ["core", "quickAnalysis"]
    },

    "help_request": {
        name: " Demande d'Aide",
        description: "Explication des fonctionnalites d'Emma",
        channel: "any",
        intent: "help",
        prompts: [
            "general_identity",
            "intent_help",
            "general_instructions",
            "general_capabilities"
        ],
        dynamicModules: ["core"]
    }
};

/**
 * Obtient tous les prompts utilises dans un flux
 * @param {string} flowId - ID du flux
 * @returns {string[]} - Liste des cles de prompts
 */
export function getFlowPrompts(flowId) {
    const flow = RUNTIME_FLOWS[flowId];
    if (!flow) return [];

    // Filtrer les doublons et retourner
    return [...new Set(flow.prompts)];
}

/**
 * Obtient tous les flux utilisant un prompt donne
 * @param {string} promptKey - Cle du prompt
 * @returns {Object[]} - Liste des flux utilisant ce prompt
 */
export function getFlowsUsingPrompt(promptKey) {
    const flows = [];

    for (const [flowId, flow] of Object.entries(RUNTIME_FLOWS)) {
        if (flow.prompts.includes(promptKey)) {
            flows.push({
                flowId,
                ...flow
            });
        }
    }

    return flows;
}

/**
 * Obtient tous les prompts lies a un prompt donne (via flows communs)
 * @param {string} promptKey - Cle du prompt
 * @returns {Object} - { references: [], referencedBy: [], flows: [] }
 */
export function getRelatedPrompts(promptKey) {
    const relatedPrompts = new Set();
    const flows = getFlowsUsingPrompt(promptKey);

    // Pour chaque flux utilisant ce prompt, ajouter tous les autres prompts du flux
    flows.forEach(flow => {
        flow.prompts.forEach(p => {
            if (p !== promptKey) {
                relatedPrompts.add(p);
            }
        });
    });

    return {
        references: Array.from(relatedPrompts),
        referencedBy: Array.from(relatedPrompts), // Bidirectionnel car utilises ensemble
        flows: flows.map(f => ({ id: f.flowId, name: f.name, description: f.description }))
    };
}

/**
 * Obtient tous les flux pour un canal specifique
 * @param {string} channel - 'sms' | 'web' | 'email' | 'messenger' | 'any'
 * @returns {Object[]} - Liste des flux
 */
export function getFlowsByChannel(channel) {
    return Object.entries(RUNTIME_FLOWS)
        .filter(([_, flow]) => flow.channel === channel || flow.channel === 'any')
        .map(([flowId, flow]) => ({ flowId, ...flow }));
}

/**
 * Obtient tous les flux pour un intent specifique
 * @param {string} intent - Type d'intention
 * @returns {Object[]} - Liste des flux
 */
export function getFlowsByIntent(intent) {
    return Object.entries(RUNTIME_FLOWS)
        .filter(([_, flow]) => flow.intent === intent)
        .map(([flowId, flow]) => ({ flowId, ...flow }));
}
