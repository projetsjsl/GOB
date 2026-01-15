// 
// CHAT ASSISTANT - Assistant IA pour Emma Config
// 

import { getAllConfigs } from './prompts-manager.js';

const CHAT_API_ENDPOINT = '/api/chat-assistant';
const STORAGE_KEY = 'emma-config-chat-history';

let chatHistory = [];
let isOpen = false;

/**
 * Initialise le chat assistant
 */
export function initChatAssistant() {
    loadChatHistory();
    createChatWidget();
    attachChatEventListeners();
}

/**
 * Cree le widget de chat
 */
function createChatWidget() {
    const widget = document.createElement('div');
    widget.id = 'chatAssistant';
    widget.innerHTML = `
        <!-- Chat Bubble -->
        <button id="chatBubble" class="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-white text-2xl z-50 hover:scale-110">
            
            <span id="chatNotification" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full hidden animate-pulse"></span>
        </button>

        <!-- Chat Panel -->
        <div id="chatPanel" class="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl hidden flex-col overflow-hidden z-50 border-2 border-indigo-200">
            <!-- Header -->
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="text-2xl"></span>
                    <div>
                        <h3 class="font-bold">Assistant Emma Config</h3>
                        <p class="text-xs text-indigo-100">Alimente par Gemini 2.0 Flash</p>
                    </div>
                </div>
                <button id="chatClose" class="hover:bg-white/20 rounded-full p-1 transition">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <!-- Messages Container -->
            <div id="chatMessages" class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                <div class="text-center text-gray-500 text-sm">
                    <p> Bonjour! Je suis votre assistant pour Emma Config.</p>
                    <p class="mt-2">Posez-moi des questions sur:</p>
                    <div class="mt-2 text-xs space-y-1">
                        <div>- Comment utiliser l'interface</div>
                        <div>- Creer des prompts efficaces</div>
                        <div>- Architecture des prompts</div>
                        <div>- Integration n8n</div>
                    </div>
                </div>
            </div>

            <!-- Input Area -->
            <div class="p-4 bg-white border-t border-gray-200">
                <div class="flex gap-2">
                    <input
                        type="text"
                        id="chatInput"
                        placeholder="Posez votre question..."
                        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                    <button
                        id="chatSend"
                        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                    >
                        <span>Envoyer</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                        </svg>
                    </button>
                </div>
                <div class="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <button id="chatClear" class="hover:text-red-600 transition">
                         Effacer l'historique
                    </button>
                    <div id="chatStatus"></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(widget);
}

/**
 * Attache les event listeners
 */
function attachChatEventListeners() {
    const bubble = document.getElementById('chatBubble');
    const panel = document.getElementById('chatPanel');
    const close = document.getElementById('chatClose');
    const send = document.getElementById('chatSend');
    const input = document.getElementById('chatInput');
    const clear = document.getElementById('chatClear');

    bubble.addEventListener('click', toggleChat);
    close.addEventListener('click', toggleChat);
    send.addEventListener('click', sendMessage);
    clear.addEventListener('click', clearHistory);

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

/**
 * Toggle chat panel
 */
function toggleChat() {
    isOpen = !isOpen;
    const panel = document.getElementById('chatPanel');
    const bubble = document.getElementById('chatBubble');

    if (isOpen) {
        panel.classList.remove('hidden');
        panel.classList.add('flex');
        bubble.classList.add('scale-0');
    } else {
        panel.classList.add('hidden');
        panel.classList.remove('flex');
        bubble.classList.remove('scale-0');
    }
}

/**
 * Envoie un message
 */
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // Ajouter message utilisateur
    addMessage('user', message);
    input.value = '';

    // Afficher typing indicator
    showTypingIndicator();

    try {
        // Construire le contexte avec les configs actuelles
        const context = await buildContext();

        // Appeler Gemini
        const response = await callGemini(message, context);

        // Ajouter reponse
        hideTypingIndicator();
        addMessage('assistant', response);

        // Sauvegarder historique
        saveChatHistory();
    } catch (error) {
        hideTypingIndicator();
        addMessage('assistant', ` Erreur: ${error.message}`);
        console.error('Chat error:', error);
    }
}

/**
 * Construit le contexte pour Gemini
 */
async function buildContext() {
    const configs = getAllConfigs();
    const configsCount = Object.keys(configs).reduce((acc, cat) => acc + Object.keys(configs[cat]).length, 0);

    // Extraire les keys des prompts avec details
    const promptKeys = [];
    const briefings = [];
    let totalBriefings = 0;
    let activeBriefings = 0;

    Object.keys(configs).forEach(category => {
        Object.keys(configs[category]).forEach(key => {
            const config = configs[category][key];
            promptKeys.push({
                key,
                category,
                description: config.description,
                type: config.type,
                delivery_enabled: config.delivery_enabled,
                email_recipients: config.email_recipients?.length || 0
            });

            if (category === 'briefing') {
                totalBriefings++;
                if (config.delivery_enabled) activeBriefings++;
                briefings.push({
                    key,
                    name: config.value?.name || key,
                    schedule: config.value?.schedule,
                    enabled: config.delivery_enabled
                });
            }
        });
    });

    const context = `
Tu es un assistant expert pour Emma Config, l'interface complete de gestion et configuration pour Emma IA (analyste financiere CFA).


 CONTEXTE ACTUEL DE L'APPLICATION


STATISTIQUES:
- Total prompts configures: ${configsCount}
- Categories: ${Object.keys(configs).join(', ')}
- Briefings configures: ${totalBriefings}
- Briefings actifs: ${activeBriefings}

ARCHITECTURE DE L'APPLICATION:
- Interface: emma-config.html (modularisee en ES6)
- Modules principaux:
  - main.js - Initialisation et coordination
  - prompts-manager.js - Gestion des prompts
  - dashboard-manager.js - Tableau de bord et visualisations
  - design-manager.js - Configuration design emails
  - sms-manager.js - Configuration SMS
  - delivery-manager.js - Gestion destinataires et envois
  - chat-assistant.js - Ce chatbot (moi!)
  - api-client.js - Communication avec Supabase
  - preview-manager.js - Previsualisation des emails
  - ui-helpers.js - Utilitaires UI

ONGLETS DISPONIBLES:
1.  Configuration - Vue d'ensemble, stats, architecture visuelle
2.  Prompts - Gestion detaillee des prompts
3.  Design - Personnalisation des emails
4.  SMS - Configuration SMS
5.  Aide - Documentation

FONCTIONNALITES CLES:
 Gestion complete des prompts (CRUD)
 Architecture hierarchique visuelle avec filtrage par relations
 Configuration design emails (couleurs, branding, layout)
 Configuration SMS (segments, signatures)
 Gestion destinataires emails
 Previsualisation en temps reel (Web/Email/SMS)
 Filtrage et recherche avances
 Integration n8n via API Supabase


 PROMPTS DISPONIBLES (${configsCount} total)


${promptKeys.map(p => `- ${p.key} (${p.category}, ${p.type})
  Description: ${p.description || 'Aucune description'}
  ${p.delivery_enabled ? ` Livraison active (${p.email_recipients} destinataire${p.email_recipients > 1 ? 's' : ''})` : ''}`).join('\n\n')}


 BRIEFINGS AUTOMATISES


${briefings.map(b => `${b.enabled ? '' : ''} ${b.name}
   Horaire: ${b.schedule || 'Non configure'}
   Cle: ${b.key}`).join('\n\n')}


 TON ROLE ET CAPACITES


TU PEUX AIDER AVEC:
 Comprendre l'interface Emma Config (navigation, fonctionnalites)
 Expliquer l'architecture des prompts et leurs relations
 Creer/modifier des prompts efficaces pour Emma IA
 Configurer le design des emails (couleurs, branding, layout)
 Configurer les SMS (signatures, segments)
 Gerer les destinataires et la livraison
 Integration n8n (webhooks, API Supabase)
 Utiliser les filtres et visualisations
 Debugging et troubleshooting
 Suggerer des ameliorations d'architecture
 Expliquer les fonctionnalites de chaque module
 Fournir des exemples SQL pour Supabase

TYPES DE PROMPTS:
- system: Prompts de base (identity CFA, personas)
- prompt: Prompts d'intent specialises (analyse technique, fondamentale, etc.)
- briefing: Briefings automatises (matin, midi, soir)

ARCHITECTURE DES RELATIONS:
- Niveau 1: Prompts systeme (base) -> utilises par
- Niveau 2: Prompts d'intent (specialises) -> integres dans
- Niveau 3: Briefings automatises (envois cron)

FILTRAGE PAR RELATIONS:
- Cliquer sur " Voir relations" dans l'architecture
- Affiche tous les prompts relies (references + referencedBy)
- Bouton "Annuler le filtre" pour revenir a la vue globale

DIRECTIVES:
- Sois concis et precis
- Utilise des emojis pour clarifier
- Fournis des exemples de code/SQL quand pertinent
- Reste dans le contexte de Emma Config et Emma IA (analyse financiere)
- Si tu suggeres un nouveau prompt, donne le format SQL INSERT complet pour Supabase
- Explique les fonctionnalites de l'interface quand demande
- Guide l'utilisateur vers les bons onglets/sections

EXEMPLE DE REPONSE POUR CREER UN PROMPT:
\`\`\`sql
INSERT INTO emma_config (category, key, value, description, type, metadata)
VALUES (
    'prompt',
    'intent_analyse_crypto',
    'Tu es Emma, analyste CFA specialisee en cryptomonnaies...',
    'Analyse specialisee pour les cryptomonnaies',
    'string',
    '{"channel": "web"}'::jsonb
);
\`\`\`
`;

    return context;
}

/**
 * Appelle l'API Chat Assistant (securisee cote serveur)
 */
async function callGemini(userMessage, context) {
    const response = await fetch(CHAT_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: userMessage,
            context: context,
            history: chatHistory
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.message) {
        throw new Error('Invalid response from chat API');
    }

    return data.message;
}

/**
 * Ajoute un message au chat
 */
function addMessage(role, content) {
    const container = document.getElementById('chatMessages');

    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');
    bubble.className = `max-w-[80%] rounded-lg px-4 py-2 ${
        role === 'user'
            ? 'bg-indigo-600 text-white rounded-br-none'
            : 'bg-white text-gray-800 rounded-bl-none shadow border border-gray-200'
    }`;

    // Format markdown simple
    const formattedContent = formatMarkdown(content);
    bubble.innerHTML = formattedContent;

    messageDiv.appendChild(bubble);
    container.appendChild(messageDiv);

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;

    // Ajouter a l'historique
    if (role === 'user' || role === 'assistant') {
        chatHistory.push({ role, content, timestamp: Date.now() });
    }
}

/**
 * Format markdown simple
 */
function formatMarkdown(text) {
    return text
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-800 text-green-400 p-2 rounded mt-2 text-xs overflow-x-auto"><code>$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

/**
 * Affiche l'indicateur de typing
 */
function showTypingIndicator() {
    const container = document.getElementById('chatMessages');
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'flex justify-start';
    indicator.innerHTML = `
        <div class="bg-white text-gray-800 rounded-lg rounded-bl-none px-4 py-2 shadow border border-gray-200">
            <div class="flex gap-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
        </div>
    `;
    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
}

/**
 * Cache l'indicateur de typing
 */
function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

/**
 * Charge l'historique
 */
function loadChatHistory() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            chatHistory = JSON.parse(stored);
            // Restaurer les messages dans l'UI
            setTimeout(() => {
                chatHistory.forEach(msg => {
                    if (msg.role === 'user' || msg.role === 'assistant') {
                        addMessageToUI(msg.role, msg.content);
                    }
                });
            }, 100);
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

/**
 * Ajoute un message a l'UI sans l'ajouter a l'historique
 */
function addMessageToUI(role, content) {
    const container = document.getElementById('chatMessages');

    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');
    bubble.className = `max-w-[80%] rounded-lg px-4 py-2 ${
        role === 'user'
            ? 'bg-indigo-600 text-white rounded-br-none'
            : 'bg-white text-gray-800 rounded-bl-none shadow border border-gray-200'
    }`;

    const formattedContent = formatMarkdown(content);
    bubble.innerHTML = formattedContent;

    messageDiv.appendChild(bubble);
    container.appendChild(messageDiv);
}

/**
 * Sauvegarde l'historique
 */
function saveChatHistory() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
    } catch (error) {
        console.error('Error saving chat history:', error);
    }
}

/**
 * Efface l'historique
 */
function clearHistory() {
    if (confirm('Effacer tout l\'historique de conversation?')) {
        chatHistory = [];
        localStorage.removeItem(STORAGE_KEY);

        const container = document.getElementById('chatMessages');
        container.innerHTML = `
            <div class="text-center text-gray-500 text-sm">
                <p> Bonjour! Je suis votre assistant pour Emma Config.</p>
                <p class="mt-2">Posez-moi des questions sur:</p>
                <div class="mt-2 text-xs space-y-1">
                    <div>- Comment utiliser l'interface</div>
                    <div>- Creer des prompts efficaces</div>
                    <div>- Architecture des prompts</div>
                    <div>- Integration n8n</div>
                </div>
            </div>
        `;
    }
}
