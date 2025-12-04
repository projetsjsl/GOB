// emma-ai.js - Logique complète du chatbot Emma IA

class EmmaAI {
    constructor() {
        this.messagesContainer = document.getElementById('emmaMessages');
        this.inputField = document.getElementById('emmaInput');
        this.sendButton = document.getElementById('emmaSend');
        this.toggleButton = document.getElementById('emmaToggle');
        this.closeButton = document.getElementById('emmaClose');
        this.windowElement = document.getElementById('emmaWindow');
        this.isOpen = false;
        this.conversationHistory = [];

        this.initializeEventListeners();
        this.showWelcomeMessage();
    }

    initializeEventListeners() {
        this.toggleButton.addEventListener('click', () => this.toggleWindow());
        this.closeButton.addEventListener('click', () => this.closeWindow());
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    toggleWindow() {
        this.isOpen ? this.closeWindow() : this.openWindow();
    }

    openWindow() {
        this.isOpen = true;
        this.windowElement.classList.add('active');
        this.toggleButton.classList.add('active');
        this.inputField.focus();
    }

    closeWindow() {
        this.isOpen = false;
        this.windowElement.classList.remove('active');
        this.toggleButton.classList.remove('active');
    }

    showWelcomeMessage() {
        const welcomeMsg = `Bonjour! 👋 Je suis Emma, votre assistante IA. Je suis ici pour vous aider avec:

📋 **Les champs du formulaire** - Explications détaillées
⚙️ **Les fonctionnalités** - Comment utiliser l'app
🔍 **Conseils pragmatiques** - Sans jugement, toujours!

**N'hésitez pas à poser vos questions!** Que voulez-vous savoir?`;

        this.addMessage(welcomeMsg, 'emma');
    }

    sendMessage() {
        const userMessage = this.inputField.value.trim();
        
        if (!userMessage) return;

        // Afficher le message utilisateur
        this.addMessage(userMessage, 'user');
        this.inputField.value = '';
        this.inputField.focus();

        // Stocker dans l'historique
        this.conversationHistory.push({
            role: 'user',
            message: userMessage,
            timestamp: new Date()
        });

        // Afficher l'indicateur de typing
        this.showTypingIndicator();

        // Simuler délai réseau et répondre
        setTimeout(() => {
            this.removeTypingIndicator();
            const response = this.generateResponse(userMessage.toLowerCase());
            this.addMessage(response, 'emma');

            this.conversationHistory.push({
                role: 'emma',
                message: response,
                timestamp: new Date()
            });
        }, 800 + Math.random() * 400);
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `emma-message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = `emma-avatar ${sender}`;
        avatar.textContent = sender === 'emma' ? '🤖' : '👤';

        const bubble = document.createElement('div');
        bubble.className = `emma-bubble ${sender}`;
        bubble.innerHTML = this.formatMessageText(text);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessageText(text) {
        // Convertir markdown-like formatting en HTML
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
        
        return formatted;
    }

    showTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'emma-message emma';
        messageDiv.id = 'typing-indicator';

        const avatar = document.createElement('div');
        avatar.className = 'emma-avatar emma';
        avatar.textContent = '🤖';

        const bubble = document.createElement('div');
        bubble.className = 'emma-bubble emma';
        bubble.innerHTML = '<div class="emma-typing"><span></span><span></span><span></span></div>';

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 0);
    }

    generateResponse(userMessage) {
        // Base de connaissances pour Emma
        const knowledgeBase = {
            // Questions sur les CHAMPS
            'prénom|nom|email|telephone|adresse': `**Informations d'Identité** 📋

Ces champs permettent de **collecter les informations de base du client**:

- **Prénom & Nom**: Identité complète du client
- **Email**: Contact électronique principal
- **Téléphone**: Contact direct client
- **Adresse**: Localisation domicile
- **Ville, Province, Code Postal**: Complètent l'adresse

**💡 Conseil:** Assurez-vous que le client fournisse des coordonnées actualisées pour un suivi facile.`,

            'état civil|date de naissance|nas|enfants|emploi|conjoint': `**Situation Personnelle** 👨‍👩‍👧

Cette section capture le **contexte personnel et professionnel**:

- **État Civil**: Marié, Célibataire, etc. → Impact sur planification
- **Date de Naissance**: Pour calcul âge, retraite
- **NAS**: Numéro Assurance Sociale → Identification client
- **Enfants à Charge**: Augmente les besoins financiers
- **Employeur & Poste**: Stabilité revenu, horizon carrière
- **Conjoint**: Revenus familiaux totaux

**💡 Conseil:** Plus l'info est précise, meilleure sera la recommandation de placement!`,

            'revenu|actif|immobilier|liquide|horizon|tolerance|risque|reer': `**Situation Financière** 💰

Les éléments CRITIQUES pour les recommandations:

- **Revenu Annuel**: Capacité d'épargne et d'investissement
- **Actifs Immobiliers**: Patrimoine en propriété
- **Actifs Liquides**: Disponibilités immédiates
- **Horizon de Placement**: 
  - Court terme (< 3 ans) → Conservateur
  - Long terme (10+ ans) → Croissance possible
- **Tolérance au Risque**: Aversion ou appétit client
- **REER**: Planification retraite

**⚠️ Important:** Ces infos déterminent votre stratégie de placement. Soyez rigoureux!`,

            'export|excel|pdf|telecharger': `**Exports Disponibles** 📤

Une fois le formulaire complété, vous avez 3 options:

1. **📊 Exporter Excel**
   - Format: CSV (compatible Excel, Sheets)
   - Nom fichier: \`client_[NOM]_[DATE].csv\`
   - À utiliser: Pour archivage, analyses
   - Avantage: Facilement manipulable

2. **📄 Exporter PDF**
   - Format: Texte formaté signable
   - Inclut: Tous les champs + zone signature
   - À utiliser: Pour dossier client officiel
   - Avantage: Prêt à archiver légalement

3. **💾 Nouveau Dossier**
   - Réinitialise le formulaire
   - Prêt pour prochain client
   - Auto-sauvegarde précédent

**💡 Conseil:** Exportez en Excel pour analyses, en PDF pour archives legales.`,

            'admin|parametre|champ|template|utilisateur': `**Panneau Admin** 🔧

Si vous êtes **administrateur**, vous pouvez:

1. **👥 Gestion Utilisateurs**
   - Créer comptes pour adjointes
   - Assigner rôles (Admin/User)
   - Gérer accès

2. **📝 Paramétrer Champs**
   - Ajouter/supprimer champs
   - Changer libellés
   - Définir requis/optionnel
   - Modifier l'ordre

3. **📋 Templates Export**
   - Config colonnes Excel
   - Personnaliser PDF
   - Ajouter sections

4. **📁 Dossiers Clients**
   - Voir tous les clients collectés
   - Vérifier données
   - Supprimer si nécessaire

5. **📤 Import/Export**
   - Sauvegarder configuration
   - Restaurer settings
   - Exporter en ZIP

**💡 Conseil:** Le panel Admin est votre centre de contrôle total!`,

            'sauvegarder|auto-save|donnees|perdre': `**Sauvegarde Automatique** 💾

**Bonne nouvelle:** Toutes vos données sont sauvegardées AUTOMATIQUEMENT!

- **Quand?** À chaque modification du formulaire
- **Où?** Localement dans votre navigateur
- **Indicateur?** Voyez 💾 en bas à droite
- **Si refresh?** Données récupérées auto

**Sécurité:**
✅ Pas de risque perte données
✅ Formulaire persistent même si fermeture
✅ Historique conservé

**⚠️ Attention:**
- Données en local à votre machine
- Changement navigateur = nouvelles données
- Synchronisation multi-device? À intégrer avec API future

**💡 Conseil:** N'hésitez pas à rafraîchir - vos données sont sûres!`,

            'login|connexion|authentification|mot de passe': `**Authentification** 🔐

Pour accéder à l'application:

**Deux rôles disponibles:**

1. **👤 Adjointe (User)**
   - Accès: Formulaire de collecte
   - Permissions: Remplir et exporter
   - Identifiant demo: \`user / user123\`

2. **🔧 Admin**
   - Accès: Dashboard + tous les outils
   - Permissions: Paramétrer tout
   - Identifiant demo: \`admin / admin123\`

**Processus:**
1. Ouvrez page login
2. Entrez utilisateur + mot de passe
3. Cliquez "Se Connecter"
4. Redirection automatique selon rôle

**💡 Conseil:** L'admin peut créer des comptes pour chaque adjointe. Pas de partage de comptes!`,

            'probleme|erreur|ne fonctionne pas|bug': `**Troubleshooting** 🔧

**Impossible de se connecter?**
- Vérifiez utilisateur/mot de passe
- Console (F12) > Application > localStorage
- Essayez: Ctrl+Shift+Delete pour clear cache

**Données ne se sauvegardent pas?**
- Vérifiez localStorage activé (F12)
- Mode privé/incognito = pas de persistance
- Essayez navigateur différent

**Export ne fonctionne pas?**
- Vérifiez permissions téléchargement
- Blocker popup? Autorisez
- Essayez Chrome

**Formulaire lent?**
- Normal en local (léger délai acceptable)
- Vérifiez ressources navigateur
- Fermez autres onglets

**💡 Conseil:** Ouvrez console (F12) pour voir logs détaillés.`,

            'comment|utiliser|faire|etapes': `**Guide d'Utilisation** 📖

**4 Étapes Simples:**

**Étape 1️⃣ : Identité**
- Entrez prénom, nom, email, téléphone
- Adresse complète
- Enregistre auto ✓

**Étape 2️⃣ : Situation**
- État civil, date naissance
- Info emploi
- Infos conjoint si marié

**Étape 3️⃣ : Finances**
- Revenus annuels
- Patrimoine
- Profil risque
- Infos REER/Comptable

**Étape 4️⃣ : Export**
- Vérifiez récapitulatif
- Choisissez format (Excel/PDF)
- Téléchargez
- Nouveau client? Réinitialisez!

**💡 Conseil:** Pas de rush! Remplissez à votre rythme, tout est sauvegardé.`,

            'quoi|pourquoi|c\'est quoi|explain': `**À Propos du Collecteur** ℹ️

**Qu'est-ce que c'est?**
Une application web pour **collecter systématiquement les données de clients** en processus d'onboarding financier.

**Pourquoi?**
- ✅ Standardiser la collecte
- ✅ Ne rien oublier
- ✅ Exports automatiques
- ✅ Gestion centralisée

**Pour qui?**
- Gestionnaires de patrimoine
- Conseillers financiers
- Adjointes administratives
- Cabinets conseil

**Avantages:**
- 🚀 Rapide à mettre en place
- 🎯 Aucune configuration requise
- 💾 Données sécurisées localement
- 📊 Exports Excel/PDF
- 👥 Multi-utilisateurs

**💡 Conseil:** C'est fait pour pragmatisme et efficacité. Pas de complexité inutile!`,

            'palette|couleur|design|theme': `**Design & Couleurs** 🎨

**Palette Utilisée:**

- **Teal (#208C8E)**: Couleur primaire, professionnelle
- **Teal Clair (#32B8C6)**: Accents, hover
- **Orange (#E67F61)**: Secondaire, chaleur
- **Vert (#15804D)**: Succès, validation
- **Crème (#FFFBF5)**: Fond, convivialité
- **Charcoal (#1F2121)**: Texte, lisibilité

**Approche Design:**
✅ Moderne mais pas tendance
✅ Accessible et lisible
✅ Responsive (desktop/mobile)
✅ Ultra-pragmatique

**💡 Conseil:** Si vous voulez personnaliser, c'est facile - contactez admin!`,

            'securite|donnees|prive|confidentiel': `**Sécurité des Données** 🔐

**Modèle Actuel (Développement):**
- Données en localStorage navigateur
- Une seule machine = une base de données
- Mots de passe en clair (dev mode)

**Avantages:**
✅ Aucune donnée en cloud
✅ Données restent en local
✅ Contrôle complet
✅ Pas de risque hack externe

**Limitations:**
⚠️ Changement navigateur = nouvelles données
⚠️ Pas de sync multi-device
⚠️ Pas de backup automatique cloud

**Pour Production:**
- Intégrer Backend API sécurisé
- Crypter mots de passe (bcrypt)
- HTTPS obligatoire
- Database professionnelle
- Audit trail complet

**💡 Conseil:** Pour usage confidentiel, backup votre data régulièrement!`,

            'default': `**Désolée!** 😅 Je n'ai pas compris votre question.

Je peux vous aider avec:
- 📋 **Champs du formulaire** (identité, situation, finances)
- 📊 **Exports** (Excel, PDF)
- 🔧 **Admin** (paramètres, utilisateurs)
- 💾 **Sauvegarde** (auto-save, données)
- 🔐 **Sécurité** (authentification)
- 📖 **Utilisation** (comment faire)

**Essayez de reformuler ou posez une question plus spécifique!**`
        };

        // Chercher la meilleure correspondance
        let response = knowledgeBase['default'];

        for (const [keywords, answer] of Object.entries(knowledgeBase)) {
            if (keywords === 'default') continue;

            const keywordList = keywords.split('|');
            if (keywordList.some(kw => userMessage.includes(kw))) {
                response = answer;
                break;
            }
        }

        return response;
    }
}

// Initialiser Emma au chargement
document.addEventListener('DOMContentLoaded', () => {
    // Charger Emma dans toutes les pages
    const emma = new EmmaAI();

    // Emma peut être initialisée sur index.html, app.html, admin.html
    // Elle fonctionne partout!
});

// Fonction pour intégrer Emma facilement dans les autres pages
function initEmmaAI() {
    if (!window.emmaInstance) {
        window.emmaInstance = new EmmaAI();
    }
    return window.emmaInstance;
}