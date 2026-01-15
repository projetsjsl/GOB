// ========================================
// VERIFICATION EMMA - SCRIPT DE VALIDATION
// ========================================

/**
 * Script de verification pour s'assurer que tous les composants Emma sont correctement installes
 */

class EmmaVerification {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
  }

  // Executer toutes les verifications
  async runAllChecks() {
    console.log(' Debut de la verification Emma...');
    
    try {
      await this.checkFiles();
      await this.checkModules();
      await this.checkConfiguration();
      await this.checkDependencies();
      await this.checkBrowserSupport();
      
      this.displayResults();
      return this.getOverallStatus();
    } catch (error) {
      console.error(' Erreur lors de la verification:', error);
      return false;
    }
  }

  // Verifier la presence des fichiers
  async checkFiles() {
    const requiredFiles = [
      'emma-financial-profile.js',
      'emma-gemini-service.js',
      'emma-ui-components.js',
      'emma-styles.css',
      'emma-dashboard-integration.js',
      'emma-config.js'
    ];

    for (const file of requiredFiles) {
      try {
        const response = await fetch(file);
        if (response.ok) {
          this.addResult('', `Fichier ${file} trouve`);
        } else {
          this.addError(` Fichier ${file} manquant ou inaccessible`);
        }
      } catch (error) {
        this.addError(` Erreur lors de la verification de ${file}: ${error.message}`);
      }
    }
  }

  // Verifier les modules ES6
  async checkModules() {
    try {
      // Test d'import du profil financier
      const { getFinancialProfile } = await import('./emma-financial-profile.js');
      const profile = getFinancialProfile();
      this.addResult('', 'Module emma-financial-profile.js importe avec succes');
      
      if (profile && profile.name) {
        this.addResult('', `Profil financier charge: ${profile.name}`);
      } else {
        this.addError(' Profil financier invalide');
      }
    } catch (error) {
      this.addError(` Erreur d'import emma-financial-profile.js: ${error.message}`);
    }

    try {
      // Test d'import du service Gemini
      const { emmaGeminiService } = await import('./emma-gemini-service.js');
      this.addResult('', 'Module emma-gemini-service.js importe avec succes');
      
      if (emmaGeminiService && typeof emmaGeminiService.generateResponse === 'function') {
        this.addResult('', 'Service Gemini initialise correctement');
      } else {
        this.addError(' Service Gemini invalide');
      }
    } catch (error) {
      this.addError(` Erreur d'import emma-gemini-service.js: ${error.message}`);
    }

    try {
      // Test d'import des composants UI
      const { EmmaChatInterface } = await import('./emma-ui-components.js');
      this.addResult('', 'Module emma-ui-components.js importe avec succes');
      
      if (typeof EmmaChatInterface === 'function') {
        this.addResult('', 'Composants UI disponibles');
      } else {
        this.addError(' Composants UI invalides');
      }
    } catch (error) {
      this.addError(` Erreur d'import emma-ui-components.js: ${error.message}`);
    }

    try {
      // Test d'import de la configuration
      const { emmaConfig } = await import('./emma-config.js');
      this.addResult('', 'Module emma-config.js importe avec succes');
      
      if (emmaConfig && emmaConfig.ui) {
        this.addResult('', 'Configuration Emma chargee');
      } else {
        this.addError(' Configuration Emma invalide');
      }
    } catch (error) {
      this.addError(` Erreur d'import emma-config.js: ${error.message}`);
    }
  }

  // Verifier la configuration
  async checkConfiguration() {
    try {
      const { getFinancialProfile, loadFinancialPrompt } = await import('./emma-financial-profile.js');
      
      // Charger le prompt
      const profile = loadFinancialPrompt();
      
      if (profile.prompt && profile.prompt.length > 100) {
        this.addResult('', 'Prompt financier configure');
      } else {
        this.addWarning(' Prompt financier court ou manquant');
      }

      if (profile.specialties && profile.specialties.length > 0) {
        this.addResult('', `${profile.specialties.length} specialites configurees`);
      } else {
        this.addWarning(' Aucune specialite configuree');
      }

    } catch (error) {
      this.addError(` Erreur de configuration: ${error.message}`);
    }
  }

  // Verifier les dependances
  async checkDependencies() {
    // Verifier localStorage
    if (typeof Storage !== 'undefined') {
      this.addResult('', 'localStorage supporte');
    } else {
      this.addError(' localStorage non supporte');
    }

    // Verifier fetch API
    if (typeof fetch !== 'undefined') {
      this.addResult('', 'Fetch API supportee');
    } else {
      this.addError(' Fetch API non supportee');
    }

    // Verifier les modules ES6
    // Note: import is a keyword and cannot be checked with typeof
    // if (typeof import !== 'undefined') {
    //   this.addResult('', 'Modules ES6 supportes');
    // } else {
    //   this.addError(' Modules ES6 non supportes');
    // }

    // Verifier les Promises
    if (typeof Promise !== 'undefined') {
      this.addResult('', 'Promises supportees');
    } else {
      this.addError(' Promises non supportees');
    }
  }

  // Verifier le support du navigateur
  async checkBrowserSupport() {
    const userAgent = navigator.userAgent;
    
    // Detecter le navigateur
    if (userAgent.includes('Chrome')) {
      this.addResult('', 'Navigateur Chrome detecte');
    } else if (userAgent.includes('Firefox')) {
      this.addResult('', 'Navigateur Firefox detecte');
    } else if (userAgent.includes('Safari')) {
      this.addResult('', 'Navigateur Safari detecte');
    } else if (userAgent.includes('Edge')) {
      this.addResult('', 'Navigateur Edge detecte');
    } else {
      this.addWarning(' Navigateur non reconnu - compatibilite non garantie');
    }

    // Verifier la version
    const isModernBrowser = (
      'fetch' in window &&
      'Promise' in window &&
      'Map' in window &&
      'Set' in window &&
      'Symbol' in window
    );

    if (isModernBrowser) {
      this.addResult('', 'Navigateur moderne detecte');
    } else {
      this.addError(' Navigateur obsolete - mise a jour recommandee');
    }
  }

  // Ajouter un resultat positif
  addResult(icon, message) {
    this.results.push({ icon, message, type: 'success' });
  }

  // Ajouter une erreur
  addError(message) {
    this.errors.push(message);
  }

  // Ajouter un avertissement
  addWarning(message) {
    this.warnings.push(message);
  }

  // Afficher les resultats
  displayResults() {
    console.log('\n RESULTATS DE LA VERIFICATION EMMA\n');
    
    // Afficher les succes
    if (this.results.length > 0) {
      console.log(' SUCCES:');
      this.results.forEach(result => {
        console.log(`  ${result.icon} ${result.message}`);
      });
    }

    // Afficher les avertissements
    if (this.warnings.length > 0) {
      console.log('\n AVERTISSEMENTS:');
      this.warnings.forEach(warning => {
        console.log(`  ${warning}`);
      });
    }

    // Afficher les erreurs
    if (this.errors.length > 0) {
      console.log('\n ERREURS:');
      this.errors.forEach(error => {
        console.log(`  ${error}`);
      });
    }

    // Resume
    console.log('\n RESUME:');
    console.log(`   Succes: ${this.results.length}`);
    console.log(`   Avertissements: ${this.warnings.length}`);
    console.log(`   Erreurs: ${this.errors.length}`);
    
    const status = this.getOverallStatus();
    console.log(`\n STATUT GLOBAL: ${status ? ' PRET' : ' PROBLEMES DETECTES'}`);
  }

  // Obtenir le statut global
  getOverallStatus() {
    return this.errors.length === 0;
  }

  // Generer un rapport HTML
  generateHTMLReport() {
    const status = this.getOverallStatus();
    const statusClass = status ? 'success' : 'error';
    const statusText = status ? 'PRET' : 'PROBLEMES DETECTES';

    return `
      <div class="emma-verification-report">
        <h2> Rapport de Verification Emma</h2>
        <div class="status ${statusClass}">
          <strong>Statut: ${statusText}</strong>
        </div>
        
        <div class="results">
          <h3> Succes (${this.results.length})</h3>
          <ul>
            ${this.results.map(r => `<li>${r.icon} ${r.message}</li>`).join('')}
          </ul>
        </div>
        
        ${this.warnings.length > 0 ? `
          <div class="warnings">
            <h3> Avertissements (${this.warnings.length})</h3>
            <ul>
              ${this.warnings.map(w => `<li>${w}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${this.errors.length > 0 ? `
          <div class="errors">
            <h3> Erreurs (${this.errors.length})</h3>
            <ul>
              ${this.errors.map(e => `<li>${e}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }
}

// Instance globale
const emmaVerification = new EmmaVerification();

// Auto-execution si appele directement
if (typeof window !== 'undefined') {
  window.emmaVerification = emmaVerification;
  
  // Executer automatiquement au chargement
  document.addEventListener('DOMContentLoaded', () => {
    emmaVerification.runAllChecks();
  });
}

// Export pour utilisation en module
export { emmaVerification };
