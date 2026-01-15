// ========================================
// COMPOSANTS UI EMMA POUR LE DASHBOARD
// ========================================

// Composant principal Emma avec l'interface de l'image
export const EmmaChatInterface = () => {
  return `
    <div class="emma-chat-container">
      <!-- Sidebar gauche -->
      <div class="emma-sidebar">
        <!-- Profil Analyse Financiere -->
        <div class="emma-profile-section">
          <div class="emma-profile-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
            </svg>
          </div>
          <div class="emma-profile-info">
            <h3>Analyse Financiere</h3>
            <p>Affaires</p>
          </div>
        </div>

        <!-- Specialites -->
        <div class="emma-specialties-section">
          <h4>Specialites</h4>
          <div class="emma-specialties-tags">
            <div class="emma-tag active">Analyse financiere</div>
            <div class="emma-tag">Investissements</div>
            <div class="emma-tag">Evaluation</div>
            <div class="emma-tag">Rapports</div>
          </div>
        </div>

        <!-- Personnalisation -->
        <div class="emma-personalization-section">
          <div class="emma-personalization-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5A3.5 3.5 0 0 1 15.5 12A3.5 3.5 0 0 1 12 15.5ZM19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.96 19.05 5.05L16.56 6.05C16.04 5.66 15.5 5.32 14.87 5.07L14.5 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.5 2.42L9.13 5.07C8.5 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.73 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.22 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.65 4.57 12.97L2.46 14.63C2.27 14.78 2.22 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.03 4.95 18.95L7.44 17.94C7.96 18.34 8.5 18.68 9.13 18.93L9.5 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.5 21.58L14.87 18.93C15.5 18.68 16.04 18.34 16.56 17.94L19.05 18.95C19.27 19.03 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98Z" fill="currentColor"/>
            </svg>
            <span>Personnalisation</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 14L12 9L17 14H7Z" fill="currentColor"/>
            </svg>
            <span class="hide-text">Masquer</span>
          </div>
          
          <div class="emma-personalization-options">
            <div class="emma-option">
              <div class="emma-option-bullet"></div>
              <span>Votre style</span>
              <select class="emma-select">
                <option value="standard">Standard</option>
                <option value="detailed">Detaille</option>
                <option value="concise">Concis</option>
              </select>
            </div>
            
            <div class="emma-option">
              <div class="emma-option-bullet"></div>
              <span>Votre niveau</span>
              <select class="emma-select">
                <option value="beginner">Debutant</option>
                <option value="intermediate" selected>Intermediaire</option>
                <option value="advanced">Avance</option>
              </select>
            </div>
            
            <div class="emma-option">
              <div class="emma-option-bullet"></div>
              <span>Ton d'Emma</span>
              <select class="emma-select">
                <option value="friendly">Amical</option>
                <option value="professional" selected>Professionnelle</option>
                <option value="formal">Formel</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Sources fiables -->
        <div class="emma-sources-section">
          <div class="emma-sources-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 12H15.5L14.5 9H12.5L11.5 12H10L12.5 7H14.5L17 12ZM7 15H9V9H7V15ZM19 15H17V13H19V15ZM19 11H17V9H19V11Z" fill="currentColor"/>
            </svg>
            <span>Sources fiables</span>
          </div>
          <div class="emma-sources-content">
            <div class="emma-source-item">Seeking Alpha</div>
            <div class="emma-source-item">Yahoo Finance</div>
            <div class="emma-source-item">MarketWatch</div>
            <div class="emma-source-item">Financial Times</div>
          </div>
        </div>
      </div>

      <!-- Zone de chat principale -->
      <div class="emma-main-chat">
        <!-- Header avec Emma -->
        <div class="emma-chat-header">
          <button class="emma-back-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
            </svg>
          </button>
          
          <div class="emma-avatar">
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2MzY2RjEiLz4KPHBhdGggZD0iTTEyIDEySDE2VjE2SDEyVjEyWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE0IDE0SDE2VjE2SDE0VjE0WiIgZmlsbD0iIzYzNjZGMTIiLz4KPC9zdmc+" alt="Emma" />
          </div>
          
          <div class="emma-title">
            <h2>Emma - Consultations Gratuites</h2>
            <p>Analyse Financiere</p>
          </div>
          
          <button class="emma-send-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
            </svg>
            <span>Envoyer</span>
          </button>
        </div>

        <!-- Zone de messages -->
        <div class="emma-messages-container">
          <div class="emma-welcome-message">
            <div class="emma-message-avatar">
              <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2MzY2RjEiLz4KPHBhdGggZD0iTTEwIDEwSDIyVjIySDEwVjEwWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTEyIDEySDIwVjIwSDEyVjEyWiIgZmlsbD0iIzYzNjZGMTIiLz4KPC9zdmc+" alt="Emma" />
            </div>
            <div class="emma-message-content">
              <p>Bonjour, je suis Emma, assistante virtuelle en analyse financiere. Je peux vous aider avec l'analyse et l'evaluation financiere. Quel est votre defi financier ?</p>
              <div class="emma-reminder">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="#EF4444"/>
                </svg>
                <span>Rappel : Pour des conseils personnalises, consultez toujours un expert qualifie du domaine.</span>
              </div>
              <p>Comment puis-je vous aider ?</p>
            </div>
          </div>
        </div>

        <!-- Zone de saisie -->
        <div class="emma-input-container">
          <input type="text" class="emma-input" placeholder="Posez votre question a Emma..." />
          <button class="emma-send-input">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
};

// Composant d'editeur de prompt
export const EmmaPromptEditor = () => {
  return `
    <div class="emma-prompt-editor">
      <div class="emma-editor-header">
        <h3>Editeur de Prompt Emma</h3>
        <div class="emma-editor-actions">
          <button class="emma-btn emma-btn-secondary" id="emma-reset-prompt">Reinitialiser</button>
          <button class="emma-btn emma-btn-primary" id="emma-save-prompt">Sauvegarder</button>
        </div>
      </div>
      
      <div class="emma-editor-content">
        <label for="emma-prompt-textarea">Prompt personnalise :</label>
        <textarea 
          id="emma-prompt-textarea" 
          class="emma-prompt-textarea"
          placeholder="Saisissez votre prompt personnalise pour Emma..."
          rows="15"
        ></textarea>
        
        <div class="emma-editor-info">
          <p><strong>Variables disponibles :</strong></p>
          <ul>
            <li><code>{userMessage}</code> - Message de l'utilisateur</li>
            <li><code>{dashboardData}</code> - Donnees du dashboard</li>
            <li><code>{currentTime}</code> - Heure actuelle</li>
          </ul>
        </div>
      </div>
    </div>
  `;
};

// Composant de configuration Gemini
export const EmmaGeminiConfig = () => {
  return `
    <div class="emma-gemini-config">
      <div class="emma-config-header">
        <h3>Configuration Gemini</h3>
        <div class="emma-connection-status" id="emma-connection-status">
          <span class="emma-status-indicator"></span>
          <span class="emma-status-text">Non connecte</span>
        </div>
      </div>
      
      <div class="emma-config-content">
        <div class="emma-api-key-section">
          <label for="emma-api-key">Cle API Gemini :</label>
          <div class="emma-api-key-input">
            <input 
              type="password" 
              id="emma-api-key" 
              class="emma-input"
              placeholder="Saisissez votre cle API Gemini..."
            />
            <button class="emma-btn emma-btn-secondary" id="emma-toggle-api-key">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="emma-config-actions">
          <button class="emma-btn emma-btn-primary" id="emma-test-connection">Tester la connexion</button>
          <button class="emma-btn emma-btn-danger" id="emma-clear-api-key">Effacer la cle</button>
        </div>
        
        <div class="emma-config-info">
          <p><strong>Comment obtenir une cle API Gemini :</strong></p>
          <ol>
            <li>Allez sur <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
            <li>Connectez-vous avec votre compte Google</li>
            <li>Creez une nouvelle cle API</li>
            <li>Copiez et collez la cle ci-dessus</li>
          </ol>
        </div>
      </div>
    </div>
  `;
};
