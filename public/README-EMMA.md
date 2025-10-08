# Emma - Assistante Financière Intégrée

## 🎯 Vue d'ensemble

Emma est une assistante virtuelle spécialisée en analyse financière, intégrée dans le dashboard GOB. Elle utilise l'API Gemini de Google pour fournir des réponses intelligentes et personnalisées.

## 🚀 Fonctionnalités

### 💬 Chat Intelligent
- Interface de chat moderne et intuitive
- Réponses en temps réel via l'API Gemini
- Support des conversations contextuelles
- Indicateur de frappe animé

### ⚙️ Personnalisation Avancée
- **Éditeur de prompt** : Personnalisez le comportement d'Emma
- **Configuration Gemini** : Gestion de la clé API
- **Paramètres de style** : Adaptez le ton et le niveau d'expertise
- **Sauvegarde automatique** : Vos paramètres sont conservés

### 🎨 Interface Utilisateur
- Design moderne inspiré de l'image fournie
- Sidebar avec spécialités et personnalisation
- Zone de chat principale avec avatar Emma
- Responsive design pour mobile et desktop

## 📁 Structure des Fichiers

```
GOB/public/
├── emma-financial-profile.js      # Profil financier d'Emma
├── emma-gemini-service.js         # Service d'intégration Gemini
├── emma-ui-components.js          # Composants d'interface
├── emma-styles.css               # Styles CSS
├── emma-dashboard-integration.js  # Intégration principale
└── README-EMMA.md               # Cette documentation
```

## 🔧 Configuration

### 1. Clé API Gemini

1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Créez une nouvelle clé API
4. Dans le dashboard, cliquez sur "⚙️ Configuration Gemini"
5. Collez votre clé API et testez la connexion

### 2. Personnalisation du Prompt

1. Cliquez sur "📝 Éditer le prompt"
2. Modifiez le prompt selon vos besoins
3. Utilisez les variables disponibles :
   - `{userMessage}` : Message de l'utilisateur
   - `{dashboardData}` : Données du dashboard
   - `{currentTime}` : Heure actuelle
4. Sauvegardez vos modifications

## 🎯 Utilisation

### Chat avec Emma
1. Allez dans l'onglet "🤖 Ask Emma"
2. Tapez votre question dans le champ de saisie
3. Appuyez sur Entrée ou cliquez sur le bouton d'envoi
4. Emma répondra en utilisant l'API Gemini

### Exemples de Questions
- "Quel est le cours de AAPL ?"
- "Peux-tu m'expliquer cette analyse ?"
- "Comment interpréter ces données financières ?"
- "Quelles sont les tendances du marché ?"

### Gestion de la Conversation
- **Effacer** : Supprime toute la conversation
- **Exemple** : Insère une question d'exemple
- **Sauvegarde** : Les conversations sont conservées localement

## 🔒 Sécurité

- La clé API Gemini est stockée localement dans le navigateur
- Aucune donnée n'est envoyée à des serveurs tiers (sauf Gemini)
- Les conversations restent privées
- Possibilité d'effacer la clé API à tout moment

## 🛠️ Développement

### Structure du Code

#### EmmaFinancialProfile
```javascript
// Profil financier avec prompt personnalisable
const profile = {
  id: 'emma-financial-analysis',
  name: 'Emma - Analyse Financière',
  prompt: 'Tu es Emma...',
  specialties: ['Analyse financière', 'Investissements'],
  personalization: {
    style: 'Standard',
    level: 'Intermédiaire',
    tone: 'Professionnelle'
  }
};
```

#### EmmaGeminiService
```javascript
// Service pour l'API Gemini
class EmmaGeminiService {
  async generateResponse(userMessage, customPrompt) {
    // Génère une réponse via l'API Gemini
  }
  
  async testConnection() {
    // Teste la connexion à l'API
  }
}
```

#### EmmaDashboardIntegration
```javascript
// Intégration principale dans le dashboard
class EmmaDashboardIntegration {
  async initialize() {
    // Initialise Emma dans le dashboard
  }
  
  async sendMessage() {
    // Envoie un message et génère une réponse
  }
}
```

### Personnalisation

#### Modifier le Style
Éditez `emma-styles.css` pour personnaliser l'apparence :
```css
.emma-chat-container {
  /* Styles du conteneur principal */
}

.emma-sidebar {
  /* Styles de la sidebar */
}
```

#### Ajouter des Spécialités
Modifiez `emma-financial-profile.js` :
```javascript
specialties: [
  { id: 'financial-analysis', name: 'Analyse financière', active: true },
  { id: 'new-specialty', name: 'Nouvelle spécialité', active: false }
]
```

## 🐛 Dépannage

### Problèmes Courants

#### Emma ne répond pas
1. Vérifiez que la clé API Gemini est configurée
2. Testez la connexion dans "Configuration Gemini"
3. Vérifiez la console du navigateur pour les erreurs

#### Interface ne s'affiche pas
1. Vérifiez que tous les fichiers CSS/JS sont chargés
2. Actualisez la page
3. Vérifiez la console pour les erreurs de chargement

#### Prompt non sauvegardé
1. Cliquez sur "Sauvegarder" après modification
2. Vérifiez que localStorage est activé
3. Essayez de réinitialiser le prompt

### Logs de Débogage
Ouvrez la console du navigateur (F12) pour voir les logs :
- ✅ Connexions réussies
- ❌ Erreurs d'API
- 🔧 Événements d'interface

## 📈 Améliorations Futures

- [ ] Support de plusieurs langues
- [ ] Intégration avec d'autres APIs (OpenAI, Claude)
- [ ] Historique des conversations
- [ ] Export des conversations
- [ ] Thèmes personnalisables
- [ ] Intégration avec les données du dashboard en temps réel

## 🤝 Support

Pour toute question ou problème :
1. Vérifiez cette documentation
2. Consultez la console du navigateur
3. Testez avec une clé API différente
4. Réinitialisez les paramètres si nécessaire

---

**Emma** - Votre assistante financière intelligente 🚀
