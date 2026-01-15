# Emma - Assistante Financiere Integree

##  Vue d'ensemble

Emma est une assistante virtuelle specialisee en analyse financiere, integree dans le dashboard GOB. Elle utilise l'API Gemini de Google pour fournir des reponses intelligentes et personnalisees.

##  Fonctionnalites

###  Chat Intelligent
- Interface de chat moderne et intuitive
- Reponses en temps reel via l'API Gemini
- Support des conversations contextuelles
- Indicateur de frappe anime

###  Personnalisation Avancee
- **Editeur de prompt** : Personnalisez le comportement d'Emma
- **Configuration Gemini** : Gestion de la cle API
- **Parametres de style** : Adaptez le ton et le niveau d'expertise
- **Sauvegarde automatique** : Vos parametres sont conserves

###  Interface Utilisateur
- Design moderne inspire de l'image fournie
- Sidebar avec specialites et personnalisation
- Zone de chat principale avec avatar Emma
- Responsive design pour mobile et desktop

##  Structure des Fichiers

```
GOB/public/
 emma-financial-profile.js      # Profil financier d'Emma
 emma-gemini-service.js         # Service d'integration Gemini
 emma-ui-components.js          # Composants d'interface
 emma-styles.css               # Styles CSS
 emma-dashboard-integration.js  # Integration principale
 README-EMMA.md               # Cette documentation
```

##  Configuration

### 1. Cle API Gemini

1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Creez une nouvelle cle API
4. Dans le dashboard, cliquez sur " Configuration Gemini"
5. Collez votre cle API et testez la connexion

### 2. Personnalisation du Prompt

1. Cliquez sur " Editer le prompt"
2. Modifiez le prompt selon vos besoins
3. Utilisez les variables disponibles :
   - `{userMessage}` : Message de l'utilisateur
   - `{dashboardData}` : Donnees du dashboard
   - `{currentTime}` : Heure actuelle
4. Sauvegardez vos modifications

##  Utilisation

### Chat avec Emma
1. Allez dans l'onglet " Ask Emma"
2. Tapez votre question dans le champ de saisie
3. Appuyez sur Entree ou cliquez sur le bouton d'envoi
4. Emma repondra en utilisant l'API Gemini

### Exemples de Questions
- "Quel est le cours de AAPL ?"
- "Peux-tu m'expliquer cette analyse ?"
- "Comment interpreter ces donnees financieres ?"
- "Quelles sont les tendances du marche ?"

### Gestion de la Conversation
- **Effacer** : Supprime toute la conversation
- **Exemple** : Insere une question d'exemple
- **Sauvegarde** : Les conversations sont conservees localement

##  Securite

- La cle API Gemini est stockee localement dans le navigateur
- Aucune donnee n'est envoyee a des serveurs tiers (sauf Gemini)
- Les conversations restent privees
- Possibilite d'effacer la cle API a tout moment

##  Developpement

### Structure du Code

#### EmmaFinancialProfile
```javascript
// Profil financier avec prompt personnalisable
const profile = {
  id: 'emma-financial-analysis',
  name: 'Emma - Analyse Financiere',
  prompt: 'Tu es Emma...',
  specialties: ['Analyse financiere', 'Investissements'],
  personalization: {
    style: 'Standard',
    level: 'Intermediaire',
    tone: 'Professionnelle'
  }
};
```

#### EmmaGeminiService
```javascript
// Service pour l'API Gemini
class EmmaGeminiService {
  async generateResponse(userMessage, customPrompt) {
    // Genere une reponse via l'API Gemini
  }
  
  async testConnection() {
    // Teste la connexion a l'API
  }
}
```

#### EmmaDashboardIntegration
```javascript
// Integration principale dans le dashboard
class EmmaDashboardIntegration {
  async initialize() {
    // Initialise Emma dans le dashboard
  }
  
  async sendMessage() {
    // Envoie un message et genere une reponse
  }
}
```

### Personnalisation

#### Modifier le Style
Editez `emma-styles.css` pour personnaliser l'apparence :
```css
.emma-chat-container {
  /* Styles du conteneur principal */
}

.emma-sidebar {
  /* Styles de la sidebar */
}
```

#### Ajouter des Specialites
Modifiez `emma-financial-profile.js` :
```javascript
specialties: [
  { id: 'financial-analysis', name: 'Analyse financiere', active: true },
  { id: 'new-specialty', name: 'Nouvelle specialite', active: false }
]
```

##  Depannage

### Problemes Courants

#### Emma ne repond pas
1. Verifiez que la cle API Gemini est configuree
2. Testez la connexion dans "Configuration Gemini"
3. Verifiez la console du navigateur pour les erreurs

#### Interface ne s'affiche pas
1. Verifiez que tous les fichiers CSS/JS sont charges
2. Actualisez la page
3. Verifiez la console pour les erreurs de chargement

#### Prompt non sauvegarde
1. Cliquez sur "Sauvegarder" apres modification
2. Verifiez que localStorage est active
3. Essayez de reinitialiser le prompt

### Logs de Debogage
Ouvrez la console du navigateur (F12) pour voir les logs :
-  Connexions reussies
-  Erreurs d'API
-  Evenements d'interface

##  Ameliorations Futures

- [ ] Support de plusieurs langues
- [ ] Integration avec d'autres APIs (OpenAI, Claude)
- [ ] Historique des conversations
- [ ] Export des conversations
- [ ] Themes personnalisables
- [ ] Integration avec les donnees du dashboard en temps reel

##  Support

Pour toute question ou probleme :
1. Verifiez cette documentation
2. Consultez la console du navigateur
3. Testez avec une cle API differente
4. Reinitialisez les parametres si necessaire

---

**Emma** - Votre assistante financiere intelligente 
