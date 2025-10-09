// ========================================
// INTÉGRATION EMMA DANS LE DASHBOARD
// ========================================

import { EmmaChatInterface, EmmaPromptEditor, EmmaGeminiConfig } from './emma-ui-components.js';
import { emmaGeminiService } from './emma-gemini-service.js';
import { getFinancialProfile, updateFinancialPrompt, loadFinancialPrompt, resetFinancialPrompt } from './emma-financial-profile.js';

class EmmaDashboardIntegration {
  constructor() {
    this.isInitialized = false;
    this.currentMessages = [];
    this.isTyping = false;
    this.promptEditorVisible = false;
    this.geminiConfigVisible = false;
  }

  // Initialiser Emma dans le dashboard
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Charger le prompt personnalisé
      loadFinancialPrompt();
      
      // Créer l'interface Emma
      this.createEmmaInterface();
      
      // Attacher les événements
      this.attachEventListeners();
      
      // Vérifier la connexion Gemini
      await this.checkGeminiConnection();
      
      this.isInitialized = true;
      console.log('✅ Emma intégrée avec succès dans le dashboard');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation d\'Emma:', error);
    }
  }

  // Créer l'interface Emma
  createEmmaInterface() {
    const askEmmaTab = document.querySelector('#ask-emma-tab');
    if (!askEmmaTab) {
      console.error('Onglet Ask Emma non trouvé');
      return;
    }

    // Remplacer le contenu de l'onglet Ask Emma
    askEmmaTab.innerHTML = `
      <div class="emma-dashboard-container">
        <!-- Interface principale Emma -->
        <div class="emma-main-interface" id="emma-main-interface">
          ${EmmaChatInterface()}
        </div>
        
        <!-- Éditeur de prompt (masqué par défaut) -->
        <div class="emma-prompt-editor-container" id="emma-prompt-editor-container" style="display: none;">
          ${EmmaPromptEditor()}
        </div>
        
        <!-- Configuration Gemini (masquée par défaut) -->
        <div class="emma-gemini-config-container" id="emma-gemini-config-container" style="display: none;">
          ${EmmaGeminiConfig()}
        </div>
        
        <!-- Boutons de contrôle -->
        <div class="emma-control-buttons">
          <button class="emma-btn emma-btn-secondary" id="emma-toggle-prompt-editor">
            📝 Éditer le prompt
          </button>
          <button class="emma-btn emma-btn-secondary" id="emma-toggle-gemini-config">
            ⚙️ Configuration Gemini
          </button>
          <button class="emma-btn emma-btn-primary" id="emma-clear-chat">
            🗑️ Effacer la conversation
          </button>
        </div>
      </div>
    `;
  }

  // Attacher les événements
  attachEventListeners() {
    // Envoi de message
    const sendButton = document.getElementById('emma-send-input');
    const inputField = document.querySelector('.emma-input');
    
    if (sendButton && inputField) {
      sendButton.addEventListener('click', () => this.sendMessage());
      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });
    }

    // Boutons de contrôle
    document.getElementById('emma-toggle-prompt-editor')?.addEventListener('click', () => {
      this.togglePromptEditor();
    });

    document.getElementById('emma-toggle-gemini-config')?.addEventListener('click', () => {
      this.toggleGeminiConfig();
    });

    document.getElementById('emma-clear-chat')?.addEventListener('click', () => {
      this.clearChat();
    });

    // Configuration Gemini
    document.getElementById('emma-test-connection')?.addEventListener('click', () => {
      this.testGeminiConnection();
    });

    document.getElementById('emma-save-prompt')?.addEventListener('click', () => {
      this.savePrompt();
    });

    document.getElementById('emma-reset-prompt')?.addEventListener('click', () => {
      this.resetPrompt();
    });

    document.getElementById('emma-clear-api-key')?.addEventListener('click', () => {
      this.clearApiKey();
    });

    // Toggle API key visibility
    document.getElementById('emma-toggle-api-key')?.addEventListener('click', () => {
      this.toggleApiKeyVisibility();
    });

    // Sauvegarde automatique du prompt
    const promptTextarea = document.getElementById('emma-prompt-textarea');
    if (promptTextarea) {
      promptTextarea.addEventListener('input', () => {
        this.autoSavePrompt();
      });
    }
  }

  // Envoyer un message
  async sendMessage() {
    const inputField = document.querySelector('.emma-input');
    const message = inputField.value.trim();
    
    if (!message) return;

    // Ajouter le message utilisateur
    this.addMessage('user', message);
    inputField.value = '';

    // Afficher l'indicateur de frappe
    this.showTypingIndicator();

    try {
      // Obtenir le prompt personnalisé
      const profile = getFinancialProfile();
      
      // Générer la réponse avec Gemini
      const response = await emmaGeminiService.generateResponse(message, profile.prompt);
      
      // Masquer l'indicateur de frappe
      this.hideTypingIndicator();
      
      // Ajouter la réponse d'Emma
      this.addMessage('emma', response);
      
    } catch (error) {
      console.error('Erreur lors de la génération de la réponse:', error);
      this.hideTypingIndicator();
      this.addMessage('error', 'Désolé, je ne peux pas répondre pour le moment. Vérifiez votre configuration Gemini.');
    }
  }

  // Ajouter un message au chat
  addMessage(type, content) {
    const messagesContainer = document.querySelector('.emma-messages-container');
    if (!messagesContainer) return;

    const messageId = Date.now();
    const message = {
      id: messageId,
      type: type,
      content: content,
      timestamp: new Date().toLocaleTimeString('fr-FR')
    };

    this.currentMessages.push(message);

    // Créer l'élément HTML du message
    const messageElement = this.createMessageElement(message);
    
    // Ajouter le message au conteneur
    messagesContainer.appendChild(messageElement);
    
    // Faire défiler vers le bas
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Créer l'élément HTML d'un message
  createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `emma-message ${message.type}`;
    messageDiv.id = `message-${message.id}`;

    if (message.type === 'user') {
      messageDiv.innerHTML = `
        <div class="emma-message-content">
          ${this.escapeHtml(message.content)}
        </div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="emma-message-avatar">
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2MzY2RjEiLz4KPHBhdGggZD0iTTEwIDEwSDIyVjIySDEwVjEwWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTEyIDEySDIwVjIwSDEyVjEyWiIgZmlsbD0iIzYzNjZGMTIiLz4KPC9zdmc+" alt="Emma" />
        </div>
        <div class="emma-message-content">
          ${this.formatMessageContent(message.content)}
        </div>
      `;
    }

    return messageDiv;
  }

  // Formater le contenu du message (rendu enrichi, fond inchangé)
  formatMessageContent(content) {
    const escapeHtml = (s) => {
      const div = document.createElement('div');
      div.textContent = s ?? '';
      return div.innerHTML;
    };

    // Protéger les blocs de code ``` ```
    const codeBlocks = [];
    let t = escapeHtml(content || '');
    t = t.replace(/```([\w-]*)\n([\s\S]*?)\n```/g, (_m, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push({ lang: (lang || '').trim(), code });
      return `@@CODE_BLOCK_${idx}@@`;
    });

    // Gras / italique basiques
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Code inline `code`
    t = t.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-gray-800/10 text-[0.95em]">$1</code>');

    // Titres de section avec emoji
    t = t.replace(/^(🔍|📌|💡|⚠️|✅|🔑|📊|💬|📈|📉|✉️|🔗)\s*(?:\*\*(.+?)\*\*|([^\n]+))$/gm, (_m, emj, boldTitle, plainTitle) => {
      const title = boldTitle || plainTitle || '';
      return `<div class="mt-2 mb-1 font-semibold flex items-center gap-2">${emj} <span>${title}</span></div>`;
    });

    // Titres Markdown
    t = t.replace(/^###\s+(.+)$/gm, '<div class="mt-2 mb-1 font-semibold">$1</div>');
    t = t.replace(/^##\s+(.+)$/gm, '<div class="mt-2 mb-1 font-semibold text-base">$1</div>');
    t = t.replace(/^#\s+(.+)$/gm, '<div class="mt-3 mb-1 font-bold text-lg">$1</div>');

    // Listes à puces groupées
    t = t.replace(/(?:^|\n)((?:[-•*]\s+.+(?:\n|$))+)/gm, (block) => {
      const items = block.trim().split(/\n/)
        .filter(l => /^[-•*]\s+/.test(l))
        .map(l => l.replace(/^[-•*]\s+/, ''))
        .map(x => `<li>${x}</li>`)
        .join('');
      return `\n<ul class="list-disc pl-5 space-y-1">${items}</ul>\n`;
    });

    // Listes numérotées groupées
    t = t.replace(/(?:^|\n)((?:\d+\.\s+.+(?:\n|$))+)/gm, (block) => {
      const items = block.trim().split(/\n/)
        .filter(l => /^\d+\.\s+/.test(l))
        .map(l => l.replace(/^\d+\.\s+/, ''))
        .map(x => `<li>${x}</li>`)
        .join('');
      return `\n<ol class="list-decimal pl-5 space-y-1">${items}</ol>\n`;
    });

    // Citations et séparateurs
    t = t.replace(/^(>+)\s*(.+)$/gm, (_m, _arrows, quote) => `<blockquote class="border-l-4 pl-3 italic opacity-90">${quote}</blockquote>`);
    t = t.replace(/^\s*(?:---|___)\s*$/gm, '<hr class="my-3 opacity-50">');

    // Section Sources
    t = t.replace(/^\s*(?:🔗\s*)?Sources?\s*:\s*$/gim, '<div class="mt-2 mb-1 font-semibold">🔗 Sources</div>');

    // Paragraphes et sauts de ligne
    t = t.replace(/\n\n/g, '</p><p class="mb-2">');
    t = t.replace(/\n/g, '<br>');

    // Linkification d'URLs
    t = t.replace(/((https?:\/\/|www\.)[\w.-]+(?:\/[\w\-._~:\/?#[\]@!$&'()*+,;=%]*)?)/g, (url) => {
      const href = url.startsWith('http') ? url : `http://${url}`;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">${url}</a>`;
    });

    // Réinsertion blocs de code
    t = t.replace(/@@CODE_BLOCK_(\d+)@@/g, (_m, idxStr) => {
      const idx = parseInt(idxStr, 10);
      const block = codeBlocks[idx];
      if (!block) return '';
      const langLabel = block.lang ? `<div class="text-xs opacity-70 mb-1">${block.lang}</div>` : '';
      const codeSafe = block.code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<div class="my-2"><div class="rounded-md border border-gray-200 bg-gray-50 p-3 overflow-auto">${langLabel}<pre class="m-0"><code>${codeSafe}</code></pre></div></div>`;
    });

    return `<div class="leading-relaxed text-sm">${t}</div>`;
  }

  // Échapper le HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Afficher l'indicateur de frappe
  showTypingIndicator() {
    const messagesContainer = document.querySelector('.emma-messages-container');
    if (!messagesContainer || this.isTyping) return;

    this.isTyping = true;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'emma-typing-indicator';
    typingDiv.id = 'emma-typing-indicator';
    typingDiv.innerHTML = `
      <div class="emma-message-avatar">
        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2MzY2RjEiLz4KPHBhdGggZD0iTTEwIDEwSDIyVjIySDEwVjEwWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTEyIDEySDIwVjIwSDEyVjEyWiIgZmlsbD0iIzYzNjZGMTIiLz4KPC9zdmc+" alt="Emma" />
      </div>
      <div class="emma-typing-dots">
        <div class="emma-typing-dot"></div>
        <div class="emma-typing-dot"></div>
        <div class="emma-typing-dot"></div>
      </div>
    `;

    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Masquer l'indicateur de frappe
  hideTypingIndicator() {
    const typingIndicator = document.getElementById('emma-typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
    this.isTyping = false;
  }

  // Basculer l'éditeur de prompt
  togglePromptEditor() {
    const mainInterface = document.getElementById('emma-main-interface');
    const promptEditor = document.getElementById('emma-prompt-editor-container');
    
    if (this.promptEditorVisible) {
      mainInterface.style.display = 'block';
      promptEditor.style.display = 'none';
      this.promptEditorVisible = false;
    } else {
      mainInterface.style.display = 'none';
      promptEditor.style.display = 'block';
      this.promptEditorVisible = true;
      this.loadPromptIntoEditor();
    }
  }

  // Basculer la configuration Gemini
  toggleGeminiConfig() {
    const mainInterface = document.getElementById('emma-main-interface');
    const geminiConfig = document.getElementById('emma-gemini-config-container');
    
    if (this.geminiConfigVisible) {
      mainInterface.style.display = 'block';
      geminiConfig.style.display = 'none';
      this.geminiConfigVisible = false;
    } else {
      mainInterface.style.display = 'none';
      geminiConfig.style.display = 'block';
      this.geminiConfigVisible = true;
      this.loadGeminiConfig();
    }
  }

  // Charger le prompt dans l'éditeur
  loadPromptIntoEditor() {
    const textarea = document.getElementById('emma-prompt-textarea');
    if (textarea) {
      const profile = getFinancialProfile();
      textarea.value = profile.prompt;
    }
  }

  // Charger la configuration Gemini
  loadGeminiConfig() {
    const apiKeyInput = document.getElementById('emma-api-key');
    if (apiKeyInput) {
      const status = emmaGeminiService.getConnectionStatus();
      apiKeyInput.value = status.hasApiKey ? '••••••••••••••••' : '';
      this.updateConnectionStatus(status.isConnected);
    }
  }

  // Mettre à jour le statut de connexion
  updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('emma-connection-status');
    const statusText = statusElement?.querySelector('.emma-status-text');
    
    if (statusElement && statusText) {
      if (isConnected) {
        statusElement.classList.add('connected');
        statusText.textContent = 'Connecté';
      } else {
        statusElement.classList.remove('connected');
        statusText.textContent = 'Non connecté';
      }
    }
  }

  // Tester la connexion Gemini
  async testGeminiConnection() {
    const apiKeyInput = document.getElementById('emma-api-key');
    if (!apiKeyInput) return;

    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      alert('Veuillez saisir une clé API Gemini');
      return;
    }

    try {
      emmaGeminiService.saveApiKey(apiKey);
      await emmaGeminiService.testConnection();
      this.updateConnectionStatus(true);
      alert('✅ Connexion Gemini réussie !');
    } catch (error) {
      this.updateConnectionStatus(false);
      alert(`❌ Erreur de connexion: ${error.message}`);
    }
  }

  // Sauvegarder le prompt
  savePrompt() {
    const textarea = document.getElementById('emma-prompt-textarea');
    if (!textarea) return;

    const newPrompt = textarea.value.trim();
    if (!newPrompt) {
      alert('Le prompt ne peut pas être vide');
      return;
    }

    updateFinancialPrompt(newPrompt);
    alert('✅ Prompt sauvegardé avec succès !');
  }

  // Réinitialiser le prompt
  resetPrompt() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser le prompt à sa valeur par défaut ?')) {
      resetFinancialPrompt();
      this.loadPromptIntoEditor();
      alert('✅ Prompt réinitialisé !');
    }
  }

  // Sauvegarde automatique du prompt
  autoSavePrompt() {
    // Sauvegarder automatiquement après 2 secondes d'inactivité
    clearTimeout(this.autoSaveTimeout);
    this.autoSaveTimeout = setTimeout(() => {
      const textarea = document.getElementById('emma-prompt-textarea');
      if (textarea && textarea.value.trim()) {
        updateFinancialPrompt(textarea.value.trim());
      }
    }, 2000);
  }

  // Effacer la clé API
  clearApiKey() {
    if (confirm('Êtes-vous sûr de vouloir effacer la clé API ?')) {
      emmaGeminiService.clearApiKey();
      const apiKeyInput = document.getElementById('emma-api-key');
      if (apiKeyInput) {
        apiKeyInput.value = '';
      }
      this.updateConnectionStatus(false);
      alert('✅ Clé API effacée !');
    }
  }

  // Basculer la visibilité de la clé API
  toggleApiKeyVisibility() {
    const apiKeyInput = document.getElementById('emma-api-key');
    const toggleButton = document.getElementById('emma-toggle-api-key');
    
    if (apiKeyInput && toggleButton) {
      if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 7C14.76 7 17 9.24 17 12C17 12.65 16.87 13.26 16.64 13.82L19.56 16.74C21.07 15.49 22.26 13.86 23 12C21.27 7.61 17 4.5 12 4.5C10.6 4.5 9.26 4.75 8 5.2L10.17 7.37C10.74 7.13 11.35 7 12 7ZM2 4.27L4.28 6.55L4.73 7C3.08 8.3 1.78 10 1 12C2.73 16.39 7 19.5 12 19.5C13.55 19.5 15.03 19.2 16.38 18.66L16.81 19.09L19.73 22L21 20.73L3.27 3L2 4.27ZM7.53 9.8L9.08 11.35C9.03 11.56 9 11.77 9 12C9 13.66 10.34 15 12 15C12.22 15 12.44 14.97 12.65 14.92L14.2 16.47C13.53 16.8 12.79 17 12 17C9.24 17 7 14.76 7 12C7 11.21 7.2 10.47 7.53 9.8ZM11.84 9.02L14.99 12.17L15.01 12.01C15.01 10.35 13.67 9.01 12.01 9.01L11.84 9.02Z" fill="currentColor"/>
          </svg>
        `;
      } else {
        apiKeyInput.type = 'password';
        toggleButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/>
          </svg>
        `;
      }
    }
  }

  // Effacer le chat
  clearChat() {
    if (confirm('Êtes-vous sûr de vouloir effacer toute la conversation ?')) {
      this.currentMessages = [];
      const messagesContainer = document.querySelector('.emma-messages-container');
      if (messagesContainer) {
        // Garder seulement le message de bienvenue
        const welcomeMessage = messagesContainer.querySelector('.emma-welcome-message');
        messagesContainer.innerHTML = '';
        if (welcomeMessage) {
          messagesContainer.appendChild(welcomeMessage);
        }
      }
    }
  }

  // Vérifier la connexion Gemini
  async checkGeminiConnection() {
    try {
      const status = emmaGeminiService.getConnectionStatus();
      if (status.hasApiKey) {
        await emmaGeminiService.testConnection();
        this.updateConnectionStatus(true);
      } else {
        this.updateConnectionStatus(false);
      }
    } catch (error) {
      this.updateConnectionStatus(false);
    }
  }
}

// Instance globale
export const emmaDashboard = new EmmaDashboardIntegration();

// Auto-initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    emmaDashboard.initialize();
  });
} else {
  emmaDashboard.initialize();
}
