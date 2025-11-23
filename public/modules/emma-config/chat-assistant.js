// ═══════════════════════════════════════════════════════════════
// CHAT ASSISTANT - Assistant IA pour Emma Config
// ═══════════════════════════════════════════════════════════════

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
 * Crée le widget de chat
 */
function createChatWidget() {
    const widget = document.createElement('div');
    widget.id = 'chatAssistant';
    widget.innerHTML = `
        <!-- Chat Bubble -->
        <button id="chatBubble" class="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-white text-2xl z-50 hover:scale-110">
            💬
            <span id="chatNotification" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full hidden animate-pulse"></span>
        </button>

        <!-- Chat Panel -->
        <div id="chatPanel" class="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl hidden flex-col overflow-hidden z-50 border-2 border-indigo-200">
            <!-- Header -->
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="text-2xl">🤖</span>
                    <div>
                        <h3 class="font-bold">Assistant Emma Config</h3>
                        <p class="text-xs text-indigo-100">Alimenté par Gemini 2.0 Flash</p>
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
                    <p>👋 Bonjour! Je suis votre assistant pour Emma Config.</p>
                    <p class="mt-2">Posez-moi des questions sur:</p>
                    <div class="mt-2 text-xs space-y-1">
                        <div>• Comment utiliser l'interface</div>
                        <div>• Créer des prompts efficaces</div>
                        <div>• Architecture des prompts</div>
                        <div>• Intégration n8n</div>
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
                        🗑️ Effacer l'historique
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

        // Ajouter réponse
        hideTypingIndicator();
        addMessage('assistant', response);

        // Sauvegarder historique
        saveChatHistory();
    } catch (error) {
        hideTypingIndicator();
        addMessage('assistant', `❌ Erreur: ${error.message}`);
        console.error('Chat error:', error);
    }
}

/**
 * Construit le contexte pour Gemini
 */
async function buildContext() {
    const configs = getAllConfigs();
    const configsCount = Object.keys(configs).reduce((acc, cat) => acc + Object.keys(configs[cat]).length, 0);

    // Extraire les keys des prompts
    const promptKeys = [];
    Object.keys(configs).forEach(category => {
        Object.keys(configs[category]).forEach(key => {
            promptKeys.push({ key, category, description: configs[category][key].description });
        });
    });

    const context = `
Tu es un assistant expert pour Emma Config, une interface de gestion de prompts pour Emma IA (analyste financière CFA).

CONTEXTE ACTUEL:
- Total prompts configurés: ${configsCount}
- Catégories: ${Object.keys(configs).join(', ')}

PROMPTS DISPONIBLES:
${promptKeys.map(p => `- ${p.key} (${p.category}): ${p.description || 'Aucune description'}`).join('\n')}

TON RÔLE:
- Aider l'utilisateur à comprendre et utiliser Emma Config
- Suggérer des prompts efficaces selon leurs besoins
- Expliquer l'architecture et les relations entre prompts
- Donner des exemples concrets de prompts
- Aider à l'intégration n8n

DIRECTIVES:
- Sois concis et précis
- Utilise des émojis pour clarifier
- Fournis des exemples de code/SQL quand pertinent
- Reste dans le contexte de Emma Config et Emma IA (analyse financière)
- Si tu suggères un nouveau prompt, donne le format SQL complet

CAPACITÉS:
✅ Expliquer les prompts existants
✅ Suggérer des améliorations
✅ Créer des exemples de prompts
✅ Aider à l'architecture
✅ Expliquer l'intégration n8n
✅ Troubleshooting
`;

    return context;
}

/**
 * Appelle l'API Chat Assistant (sécurisée côté serveur)
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

    // Ajouter à l'historique
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
 * Ajoute un message à l'UI sans l'ajouter à l'historique
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
                <p>👋 Bonjour! Je suis votre assistant pour Emma Config.</p>
                <p class="mt-2">Posez-moi des questions sur:</p>
                <div class="mt-2 text-xs space-y-1">
                    <div>• Comment utiliser l'interface</div>
                    <div>• Créer des prompts efficaces</div>
                    <div>• Architecture des prompts</div>
                    <div>• Intégration n8n</div>
                </div>
            </div>
        `;
    }
}
