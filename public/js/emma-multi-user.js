/**
 * EMMA MULTI-USER MODULE
 * Gère les conversations Emma avec permissions basées sur les rôles
 */

class EmmaMultiUser {
  constructor() {
    this.currentUser = null;
    this.permissions = null;
    this.sessionId = null;
    this.messages = [];
    this.isInitialized = false;

    console.log('💬 Emma Multi-User: Initialisation...');
  }

  /**
   * Initialise Emma Multi-User
   */
  async init() {
    if (this.isInitialized) {
      console.log('⚠️ Emma déjà initialisée');
      return;
    }

    // Attendre que GOB_AUTH soit disponible (fourni par auth-guard.js)
    if (!window.GOB_AUTH) {
      console.error('❌ GOB_AUTH non disponible - Impossible d\'initialiser Emma');
      return;
    }

    this.currentUser = window.GOB_AUTH.user;
    this.permissions = window.GOB_AUTH.permissions;

    console.log('✅ Emma initialisée pour:', this.currentUser.display_name);
    console.log('🔑 Permissions Emma:', this.permissions);

    // Générer un nouveau session ID
    this.sessionId = this.generateSessionId();

    // Charger l'historique si permissions
    if (this.permissions.view_own_history) {
      await this.loadUserHistory();
    } else {
      console.log('📝 Mode lecture seule - Pas d\'historique à charger');
      this.showReadOnlyNotice();
    }

    // Attacher les événements
    this.attachEventListeners();

    // Si admin, ajouter les fonctionnalités admin
    if (this.permissions.view_all_history) {
      this.initAdminFeatures();
    }

    this.isInitialized = true;
  }

  /**
   * Génère un ID de session unique
   */
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Charge l'historique de l'utilisateur
   */
  async loadUserHistory() {
    try {
      const response = await fetch('/api/supabase-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_latest',
          user_id: this.currentUser.username,
          requesting_user_role: this.currentUser.role
        })
      });

      const data = await response.json();

      if (data.success && data.messages && data.messages.length > 0) {
        this.messages = data.messages;
        this.sessionId = data.session_id || this.sessionId;
        this.renderMessages();
        console.log(`✅ Historique chargé: ${this.messages.length} messages`);
      } else {
        console.log('📝 Aucun historique trouvé - Nouvelle conversation');
      }

    } catch (error) {
      console.error('❌ Erreur chargement historique:', error);
    }
  }

  /**
   * Affiche une notice pour les utilisateurs en lecture seule
   */
  showReadOnlyNotice() {
    const emmaContainer = document.getElementById('emma-chat-container');
    if (!emmaContainer) return;

    const notice = document.createElement('div');
    notice.className = 'bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4';
    notice.innerHTML = `
      <div class="flex items-center gap-2">
        <i class="iconoir-warning-triangle"></i>
        <span class="font-semibold">Mode lecture seule</span>
      </div>
      <p class="text-sm mt-1">
        Vos conversations ne sont pas sauvegardées. Pour sauvegarder vos historiques, contactez un administrateur.
      </p>
    `;

    emmaContainer.prepend(notice);
  }

  /**
   * Attache les événements aux boutons Emma
   */
  attachEventListeners() {
    // Bouton Envoyer
    const sendBtn = document.getElementById('emma-send-btn');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }

    // Input (touche Entrée)
    const input = document.getElementById('emma-input');
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Bouton Nouvelle conversation
    const newChatBtn = document.getElementById('emma-new-chat-btn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => this.startNewSession());
    }

    // Bouton Historique
    const historyBtn = document.getElementById('emma-history-btn');
    if (historyBtn && this.permissions.view_own_history) {
      historyBtn.addEventListener('click', () => this.showHistoryModal());
    } else if (historyBtn) {
      historyBtn.style.display = 'none'; // Cacher si pas de permission
    }

    console.log('✅ Event listeners attachés');
  }

  /**
   * Envoie un message à Emma
   */
  async sendMessage() {
    const input = document.getElementById('emma-input');
    const userMessage = input?.value?.trim();

    if (!userMessage) return;

    // Ajouter message utilisateur
    this.addMessage('user', userMessage);
    input.value = '';

    // Désactiver l'input pendant le traitement
    const sendBtn = document.getElementById('emma-send-btn');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.innerHTML = '<i class="iconoir-loading animate-spin"></i> Réflexion...';
    }

    try {
      // Appel Emma Agent
      const response = await fetch('/api/emma-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: {
            user_id: this.currentUser.username,
            session_id: this.sessionId,
            user_role: this.currentUser.role
          }
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la réponse d\'Emma');
      }

      // Ajouter réponse Emma
      this.addMessage('assistant', data.response, {
        tools_used: data.tools_used,
        confidence: data.confidence,
        failed_tools: data.failed_tools,
        unavailable_sources: data.unavailable_sources
      });

      // Sauvegarder si permissions
      if (this.permissions.save_conversations) {
        await this.saveConversation();
      }

    } catch (error) {
      console.error('❌ Erreur Emma:', error);
      this.addMessage('system', `Erreur: ${error.message}`, { error: true });

    } finally {
      // Réactiver l'input
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="iconoir-send"></i> Envoyer';
      }
    }
  }

  /**
   * Ajoute un message à la conversation
   */
  addMessage(role, content, metadata = {}) {
    const message = {
      role,
      content,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    this.messages.push(message);
    this.renderMessage(message);
  }

  /**
   * Affiche un message dans l'interface
   */
  renderMessage(message) {
    const container = document.getElementById('emma-messages-container');
    if (!container) {
      console.error('❌ Container de messages non trouvé');
      return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `emma-message emma-message-${message.role}`;

    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    // Style selon rôle
    let bgClass = 'bg-blue-500 text-white';
    if (!isUser) {
      bgClass = isSystem ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-white border border-gray-200';
    }

    messageDiv.innerHTML = `
      <div class="flex ${isUser ? 'justify-end' : 'justify-start'} mb-4">
        <div class="max-w-[80%] ${bgClass} rounded-lg p-4 shadow-sm">
          ${!isUser && !isSystem ? `
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xl">🤖</span>
              <span class="font-bold text-sm">Emma IA™</span>
            </div>
          ` : ''}
          <div class="message-content text-sm whitespace-pre-wrap">${this.formatContent(message.content)}</div>
          <div class="text-xs opacity-70 mt-2 flex items-center gap-2">
            <span>${new Date(message.timestamp).toLocaleTimeString('fr-FR')}</span>
            ${message.confidence ? `<span>• Confiance: ${Math.round(message.confidence * 100)}%</span>` : ''}
            ${message.failed_tools && message.failed_tools.length > 0 ? `<span class="text-yellow-600">⚠️ ${message.failed_tools.length} sources indisponibles</span>` : ''}
          </div>
          ${message.unavailable_sources && message.unavailable_sources.length > 0 ? `
            <details class="mt-2 text-xs">
              <summary class="cursor-pointer text-yellow-700">Sources indisponibles (${message.unavailable_sources.length})</summary>
              <ul class="mt-1 ml-4 list-disc text-yellow-600">
                ${message.unavailable_sources.map(source => `<li>${source}</li>`).join('')}
              </ul>
            </details>
          ` : ''}
        </div>
      </div>
    `;

    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Affiche tous les messages
   */
  renderMessages() {
    const container = document.getElementById('emma-messages-container');
    if (!container) return;

    container.innerHTML = '';
    this.messages.forEach(msg => this.renderMessage(msg));
  }

  /**
   * Formate le contenu (markdown basique, liens, etc.)
   */
  formatContent(content) {
    if (!content) return '';

    // Échapper le HTML pour sécurité
    content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Parser les tags spéciaux
    content = content.replace(/\[SOURCE:(.*?)\|(.*?)\]/g,
      '<a href="$2" target="_blank" class="text-blue-600 underline hover:text-blue-800">📎 $1</a>');

    content = content.replace(/\[CHART:(.*?)\]/g,
      '<div class="chart-placeholder bg-gray-100 p-2 rounded mt-2">📊 Graphique: $1</div>');

    // Markdown basique
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // URLs normales
    content = content.replace(/(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" class="text-blue-600 underline">$1</a>');

    return content;
  }

  /**
   * Sauvegarde la conversation dans Supabase
   */
  async saveConversation() {
    if (!this.permissions.save_conversations) {
      console.log('📝 Pas de permission pour sauvegarder');
      return;
    }

    try {
      const response = await fetch('/api/supabase-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          user_id: this.currentUser.username,
          session_id: this.sessionId,
          messages: this.messages,
          requesting_user_role: this.currentUser.role
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Conversation sauvegardée');
      } else {
        console.warn('⚠️ Échec sauvegarde:', data.error);
      }

    } catch (error) {
      console.error('❌ Erreur sauvegarde conversation:', error);
    }
  }

  /**
   * Démarre une nouvelle session
   */
  startNewSession() {
    if (confirm('Voulez-vous commencer une nouvelle conversation? L\'historique actuel sera conservé.')) {
      this.messages = [];
      this.sessionId = this.generateSessionId();

      const container = document.getElementById('emma-messages-container');
      if (container) {
        container.innerHTML = '';
      }

      console.log('✨ Nouvelle conversation démarrée');
    }
  }

  /**
   * Affiche le modal d'historique
   */
  async showHistoryModal() {
    // TODO: Implémenter modal avec liste des conversations
    alert('Fonctionnalité d\'historique - À implémenter');
  }

  /**
   * Initialise les fonctionnalités admin
   */
  initAdminFeatures() {
    console.log('🔓 Fonctionnalités admin activées');

    // Créer bouton "Voir tous les historiques"
    const adminBtn = document.createElement('button');
    adminBtn.id = 'emma-admin-view-all';
    adminBtn.className = 'btn btn-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700';
    adminBtn.innerHTML = '<i class="iconoir-eye"></i> Voir tous les historiques';

    adminBtn.addEventListener('click', () => this.showAllHistoriesModal());

    // Ajouter au container Emma
    const emmaHeader = document.querySelector('#emma-chat-header');
    if (emmaHeader) {
      emmaHeader.appendChild(adminBtn);
    }
  }

  /**
   * Modal admin pour voir tous les historiques
   */
  async showAllHistoriesModal() {
    try {
      const response = await fetch('/api/supabase-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_all_users',
          requesting_user_role: this.currentUser.role
        })
      });

      const data = await response.json();

      if (!data.success) {
        alert('Erreur: ' + data.error);
        return;
      }

      // Créer modal
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold">📊 Tous les Historiques (Admin)</h2>
            <button id="close-admin-modal" class="text-gray-500 hover:text-gray-700">
              <i class="iconoir-cancel text-2xl"></i>
            </button>
          </div>

          <div class="space-y-4">
            ${Object.entries(data.conversations_by_user).map(([userId, conversations]) => `
              <div class="border border-gray-200 rounded-lg p-4">
                <h3 class="font-bold text-lg mb-2">${userId} (${conversations.length} conversations)</h3>
                <ul class="space-y-2">
                  ${conversations.slice(0, 5).map(conv => `
                    <li class="text-sm bg-gray-50 p-2 rounded">
                      <span class="font-semibold">Session:</span> ${conv.session_id.substring(0, 8)}... •
                      <span class="font-semibold">Date:</span> ${new Date(conv.updated_at).toLocaleString('fr-FR')} •
                      <span class="font-semibold">Messages:</span> ${conv.messages.length}
                    </li>
                  `).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Fermer le modal
      document.getElementById('close-admin-modal').addEventListener('click', () => {
        modal.remove();
      });

    } catch (error) {
      console.error('❌ Erreur affichage historiques admin:', error);
      alert('Erreur lors du chargement des historiques');
    }
  }
}

// Initialiser Emma Multi-User quand le DOM et GOB_AUTH sont prêts
window.addEventListener('load', () => {
  // Attendre que GOB_AUTH soit disponible
  const checkAuth = setInterval(() => {
    if (window.GOB_AUTH) {
      clearInterval(checkAuth);
      window.emmaMultiUser = new EmmaMultiUser();
      window.emmaMultiUser.init();
    }
  }, 100);

  // Timeout après 5 secondes
  setTimeout(() => {
    clearInterval(checkAuth);
    if (!window.emmaMultiUser) {
      console.error('❌ Emma Multi-User: Timeout - GOB_AUTH non disponible');
    }
  }, 5000);
});
