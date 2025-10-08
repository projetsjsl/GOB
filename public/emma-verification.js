// ========================================
// VÉRIFICATION EMMA - SCRIPT DE VALIDATION
// ========================================

/**
 * Script de vérification pour s'assurer que tous les composants Emma sont correctement installés
 */

class EmmaVerification {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
  }

  // Exécuter toutes les vérifications
  async runAllChecks() {
    console.log('🔍 Début de la vérification Emma...');
    
    try {
      await this.checkFiles();
      await this.checkModules();
      await this.checkConfiguration();
      await this.checkDependencies();
      await this.checkBrowserSupport();
      
      this.displayResults();
      return this.getOverallStatus();
    } catch (error) {
      console.error('❌ Erreur lors de la vérification:', error);
      return false;
    }
  }

  // Vérifier la présence des fichiers
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
          this.addResult('✅', `Fichier ${file} trouvé`);
        } else {
          this.addError(`❌ Fichier ${file} manquant ou inaccessible`);
        }
      } catch (error) {
        this.addError(`❌ Erreur lors de la vérification de ${file}: ${error.message}`);
      }
    }
  }

  // Vérifier les modules ES6
  async checkModules() {
    try {
      // Test d'import du profil financier
      const { getFinancialProfile } = await import('./emma-financial-profile.js');
      const profile = getFinancialProfile();
      this.addResult('✅', 'Module emma-financial-profile.js importé avec succès');
      
      if (profile && profile.name) {
        this.addResult('✅', `Profil financier chargé: ${profile.name}`);
      } else {
        this.addError('❌ Profil financier invalide');
      }
    } catch (error) {
      this.addError(`❌ Erreur d'import emma-financial-profile.js: ${error.message}`);
    }

    try {
      // Test d'import du service Gemini
      const { emmaGeminiService } = await import('./emma-gemini-service.js');
      this.addResult('✅', 'Module emma-gemini-service.js importé avec succès');
      
      if (emmaGeminiService && typeof emmaGeminiService.generateResponse === 'function') {
        this.addResult('✅', 'Service Gemini initialisé correctement');
      } else {
        this.addError('❌ Service Gemini invalide');
      }
    } catch (error) {
      this.addError(`❌ Erreur d'import emma-gemini-service.js: ${error.message}`);
    }

    try {
      // Test d'import des composants UI
      const { EmmaChatInterface } = await import('./emma-ui-components.js');
      this.addResult('✅', 'Module emma-ui-components.js importé avec succès');
      
      if (typeof EmmaChatInterface === 'function') {
        this.addResult('✅', 'Composants UI disponibles');
      } else {
        this.addError('❌ Composants UI invalides');
      }
    } catch (error) {
      this.addError(`❌ Erreur d'import emma-ui-components.js: ${error.message}`);
    }

    try {
      // Test d'import de la configuration
      const { emmaConfig } = await import('./emma-config.js');
      this.addResult('✅', 'Module emma-config.js importé avec succès');
      
      if (emmaConfig && emmaConfig.ui) {
        this.addResult('✅', 'Configuration Emma chargée');
      } else {
        this.addError('❌ Configuration Emma invalide');
      }
    } catch (error) {
      this.addError(`❌ Erreur d'import emma-config.js: ${error.message}`);
    }
  }

  // Vérifier la configuration
  async checkConfiguration() {
    try {
      const { getFinancialProfile, loadFinancialPrompt } = await import('./emma-financial-profile.js');
      
      // Charger le prompt
      const profile = loadFinancialPrompt();
      
      if (profile.prompt && profile.prompt.length > 100) {
        this.addResult('✅', 'Prompt financier configuré');
      } else {
        this.addWarning('⚠️ Prompt financier court ou manquant');
      }

      if (profile.specialties && profile.specialties.length > 0) {
        this.addResult('✅', `${profile.specialties.length} spécialités configurées`);
      } else {
        this.addWarning('⚠️ Aucune spécialité configurée');
      }

    } catch (error) {
      this.addError(`❌ Erreur de configuration: ${error.message}`);
    }
  }

  // Vérifier les dépendances
  async checkDependencies() {
    // Vérifier localStorage
    if (typeof Storage !== 'undefined') {
      this.addResult('✅', 'localStorage supporté');
    } else {
      this.addError('❌ localStorage non supporté');
    }

    // Vérifier fetch API
    if (typeof fetch !== 'undefined') {
      this.addResult('✅', 'Fetch API supportée');
    } else {
      this.addError('❌ Fetch API non supportée');
    }

    // Vérifier les modules ES6
    if (typeof import !== 'undefined') {
      this.addResult('✅', 'Modules ES6 supportés');
    } else {
      this.addError('❌ Modules ES6 non supportés');
    }

    // Vérifier les Promises
    if (typeof Promise !== 'undefined') {
      this.addResult('✅', 'Promises supportées');
    } else {
      this.addError('❌ Promises non supportées');
    }
  }

  // Vérifier le support du navigateur
  async checkBrowserSupport() {
    const userAgent = navigator.userAgent;
    
    // Détecter le navigateur
    if (userAgent.includes('Chrome')) {
      this.addResult('✅', 'Navigateur Chrome détecté');
    } else if (userAgent.includes('Firefox')) {
      this.addResult('✅', 'Navigateur Firefox détecté');
    } else if (userAgent.includes('Safari')) {
      this.addResult('✅', 'Navigateur Safari détecté');
    } else if (userAgent.includes('Edge')) {
      this.addResult('✅', 'Navigateur Edge détecté');
    } else {
      this.addWarning('⚠️ Navigateur non reconnu - compatibilité non garantie');
    }

    // Vérifier la version
    const isModernBrowser = (
      'fetch' in window &&
      'Promise' in window &&
      'Map' in window &&
      'Set' in window &&
      'Symbol' in window
    );

    if (isModernBrowser) {
      this.addResult('✅', 'Navigateur moderne détecté');
    } else {
      this.addError('❌ Navigateur obsolète - mise à jour recommandée');
    }
  }

  // Ajouter un résultat positif
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

  // Afficher les résultats
  displayResults() {
    console.log('\n📊 RÉSULTATS DE LA VÉRIFICATION EMMA\n');
    
    // Afficher les succès
    if (this.results.length > 0) {
      console.log('✅ SUCCÈS:');
      this.results.forEach(result => {
        console.log(`  ${result.icon} ${result.message}`);
      });
    }

    // Afficher les avertissements
    if (this.warnings.length > 0) {
      console.log('\n⚠️ AVERTISSEMENTS:');
      this.warnings.forEach(warning => {
        console.log(`  ${warning}`);
      });
    }

    // Afficher les erreurs
    if (this.errors.length > 0) {
      console.log('\n❌ ERREURS:');
      this.errors.forEach(error => {
        console.log(`  ${error}`);
      });
    }

    // Résumé
    console.log('\n📈 RÉSUMÉ:');
    console.log(`  ✅ Succès: ${this.results.length}`);
    console.log(`  ⚠️ Avertissements: ${this.warnings.length}`);
    console.log(`  ❌ Erreurs: ${this.errors.length}`);
    
    const status = this.getOverallStatus();
    console.log(`\n🎯 STATUT GLOBAL: ${status ? '✅ PRÊT' : '❌ PROBLÈMES DÉTECTÉS'}`);
  }

  // Obtenir le statut global
  getOverallStatus() {
    return this.errors.length === 0;
  }

  // Générer un rapport HTML
  generateHTMLReport() {
    const status = this.getOverallStatus();
    const statusClass = status ? 'success' : 'error';
    const statusText = status ? 'PRÊT' : 'PROBLÈMES DÉTECTÉS';

    return `
      <div class="emma-verification-report">
        <h2>🔍 Rapport de Vérification Emma</h2>
        <div class="status ${statusClass}">
          <strong>Statut: ${statusText}</strong>
        </div>
        
        <div class="results">
          <h3>✅ Succès (${this.results.length})</h3>
          <ul>
            ${this.results.map(r => `<li>${r.icon} ${r.message}</li>`).join('')}
          </ul>
        </div>
        
        ${this.warnings.length > 0 ? `
          <div class="warnings">
            <h3>⚠️ Avertissements (${this.warnings.length})</h3>
            <ul>
              ${this.warnings.map(w => `<li>${w}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${this.errors.length > 0 ? `
          <div class="errors">
            <h3>❌ Erreurs (${this.errors.length})</h3>
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

// Auto-exécution si appelé directement
if (typeof window !== 'undefined') {
  window.emmaVerification = emmaVerification;
  
  // Exécuter automatiquement au chargement
  document.addEventListener('DOMContentLoaded', () => {
    emmaVerification.runAllChecks();
  });
}

// Export pour utilisation en module
export { emmaVerification };
