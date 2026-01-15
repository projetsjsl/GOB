// emma-ai.js - Logique complete du chatbot Emma IA

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
        const welcomeMsg = `Bonjour!  Je suis Emma, votre assistante IA. Je suis ici pour vous aider avec:

 **Les champs du formulaire** - Explications detaillees
 **Les fonctionnalites** - Comment utiliser l'app
 **Conseils pragmatiques** - Sans jugement, toujours!

**N'hesitez pas a poser vos questions!** Que voulez-vous savoir?`;

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

        // Simuler delai reseau et repondre
        // Utiliser requestAnimationFrame pour s'assurer que l'UI a update
        requestAnimationFrame(() => {
            setTimeout(() => {
                this.removeTypingIndicator();
                try {
                    const response = this.generateResponse(userMessage.toLowerCase());
                    this.addMessage(response, 'emma');

                    this.conversationHistory.push({
                        role: 'emma',
                        message: response,
                        timestamp: new Date()
                    });
                } catch (e) {
                    console.error("Emma Error:", e);
                    this.addMessage("Desolee, j'ai eu un petit probleme technique. Pouvez-vous repeter?", 'emma');
                }
            }, 800 + Math.random() * 400);
        });
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `emma-message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = `emma-avatar ${sender}`;
        avatar.textContent = sender === 'emma' ? '' : '';

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
        avatar.textContent = '';

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
            'prenom|nom|email|telephone|adresse': `**Informations d'Identite** 

Ces champs permettent de **collecter les informations de base du client**:

- **Prenom & Nom**: Identite complete du client
- **Email**: Contact electronique principal
- **Telephone**: Contact direct client
- **Adresse**: Localisation domicile
- **Ville, Province, Code Postal**: Completent l'adresse

** Conseil:** Assurez-vous que le client fournisse des coordonnees actualisees pour un suivi facile.`,

            'etat civil|date de naissance|nas|enfants|emploi|conjoint': `**Situation Personnelle** 

Cette section capture le **contexte personnel et professionnel**:

- **Etat Civil**: Marie, Celibataire, etc. -> Impact sur planification
- **Date de Naissance**: Pour calcul age, retraite
- **NAS**: Numero Assurance Sociale -> Identification client
- **Enfants a Charge**: Augmente les besoins financiers
- **Employeur & Poste**: Stabilite revenu, horizon carriere
- **Conjoint**: Revenus familiaux totaux

** Conseil:** Plus l'info est precise, meilleure sera la recommandation de placement!`,

            'revenu|actif|immobilier|liquide|horizon|tolerance|risque|reer': `**Situation Financiere** 

Les elements CRITIQUES pour les recommandations:

- **Revenu Annuel**: Capacite d'epargne et d'investissement
- **Actifs Immobiliers**: Patrimoine en propriete
- **Actifs Liquides**: Disponibilites immediates
- **Horizon de Placement**: 
  - Court terme (< 3 ans) -> Conservateur
  - Long terme (10+ ans) -> Croissance possible
- **Tolerance au Risque**: Aversion ou appetit client
- **REER**: Planification retraite

** Important:** Ces infos determinent votre strategie de placement. Soyez rigoureux!`,

            'export|excel|pdf|telecharger': `**Exports Disponibles** 

Une fois le formulaire complete, vous avez 3 options:

1. ** Exporter Excel**
   - Format: CSV (compatible Excel, Sheets)
   - Nom fichier: \`client_[NOM]_[DATE].csv\`
   - A utiliser: Pour archivage, analyses
   - Avantage: Facilement manipulable

2. ** Exporter PDF**
   - Format: Texte formate signable
   - Inclut: Tous les champs + zone signature
   - A utiliser: Pour dossier client officiel
   - Avantage: Pret a archiver legalement

3. ** Nouveau Dossier**
   - Reinitialise le formulaire
   - Pret pour prochain client
   - Auto-sauvegarde precedent

** Conseil:** Exportez en Excel pour analyses, en PDF pour archives legales.`,

            'admin|parametre|champ|template|utilisateur': `**Panneau Admin** 

Si vous etes **administrateur**, vous pouvez:

1. ** Gestion Utilisateurs**
   - Creer comptes pour adjointes
   - Assigner roles (Admin/User)
   - Gerer acces

2. ** Parametrer Champs**
   - Ajouter/supprimer champs
   - Changer libelles
   - Definir requis/optionnel
   - Modifier l'ordre

3. ** Templates Export**
   - Config colonnes Excel
   - Personnaliser PDF
   - Ajouter sections

4. ** Dossiers Clients**
   - Voir tous les clients collectes
   - Verifier donnees
   - Supprimer si necessaire

5. ** Import/Export**
   - Sauvegarder configuration
   - Restaurer settings
   - Exporter en ZIP

** Conseil:** Le panel Admin est votre centre de controle total!`,

            'sauvegarder|auto-save|donnees|perdre': `**Sauvegarde Automatique** 

**Bonne nouvelle:** Toutes vos donnees sont sauvegardees AUTOMATIQUEMENT!

- **Quand?** A chaque modification du formulaire
- **Ou?** Localement dans votre navigateur
- **Indicateur?** Voyez  en bas a droite
- **Si refresh?** Donnees recuperees auto

**Securite:**
 Pas de risque perte donnees
 Formulaire persistent meme si fermeture
 Historique conserve

** Attention:**
- Donnees en local a votre machine
- Changement navigateur = nouvelles donnees
- Synchronisation multi-device? A integrer avec API future

** Conseil:** N'hesitez pas a rafraichir - vos donnees sont sures!`,

            'login|connexion|authentification|mot de passe': `**Authentification** 

Pour acceder a l'application:

**Deux roles disponibles:**

1. ** Adjointe (User)**
   - Acces: Formulaire de collecte
   - Permissions: Remplir et exporter
   - Identifiant demo: \`user / user123\`

2. ** Admin**
   - Acces: Dashboard + tous les outils
   - Permissions: Parametrer tout
   - Identifiant demo: \`admin / admin123\`

**Processus:**
1. Ouvrez page login
2. Entrez utilisateur + mot de passe
3. Cliquez "Se Connecter"
4. Redirection automatique selon role

** Conseil:** L'admin peut creer des comptes pour chaque adjointe. Pas de partage de comptes!`,

            'probleme|erreur|ne fonctionne pas|bug': `**Troubleshooting** 

**Impossible de se connecter?**
- Verifiez utilisateur/mot de passe
- Console (F12) > Application > localStorage
- Essayez: Ctrl+Shift+Delete pour clear cache

**Donnees ne se sauvegardent pas?**
- Verifiez localStorage active (F12)
- Mode prive/incognito = pas de persistance
- Essayez navigateur different

**Export ne fonctionne pas?**
- Verifiez permissions telechargement
- Blocker popup? Autorisez
- Essayez Chrome

**Formulaire lent?**
- Normal en local (leger delai acceptable)
- Verifiez ressources navigateur
- Fermez autres onglets

** Conseil:** Ouvrez console (F12) pour voir logs detailles.`,

            'comment|utiliser|faire|etapes': `**Guide d'Utilisation** 

**4 Etapes Simples:**

**Etape 1 : Identite**
- Entrez prenom, nom, email, telephone
- Adresse complete
- Enregistre auto 

**Etape 2 : Situation**
- Etat civil, date naissance
- Info emploi
- Infos conjoint si marie

**Etape 3 : Finances**
- Revenus annuels
- Patrimoine
- Profil risque
- Infos REER/Comptable

**Etape 4 : Export**
- Verifiez recapitulatif
- Choisissez format (Excel/PDF)
- Telechargez
- Nouveau client? Reinitialisez!

** Conseil:** Pas de rush! Remplissez a votre rythme, tout est sauvegarde.`,

            'quoi|pourquoi|c\'est quoi|explain': `**A Propos du Collecteur** i

**Qu'est-ce que c'est?**
Une application web pour **collecter systematiquement les donnees de clients** en processus d'onboarding financier.

**Pourquoi?**
-  Standardiser la collecte
-  Ne rien oublier
-  Exports automatiques
-  Gestion centralisee

**Pour qui?**
- Gestionnaires de patrimoine
- Conseillers financiers
- Adjointes administratives
- Cabinets conseil

**Avantages:**
-  Rapide a mettre en place
-  Aucune configuration requise
-  Donnees securisees localement
-  Exports Excel/PDF
-  Multi-utilisateurs

** Conseil:** C'est fait pour pragmatisme et efficacite. Pas de complexite inutile!`,

            'palette|couleur|design|theme': `**Design & Couleurs** 

**Palette Utilisee:**

- **Teal (#208C8E)**: Couleur primaire, professionnelle
- **Teal Clair (#32B8C6)**: Accents, hover
- **Orange (#E67F61)**: Secondaire, chaleur
- **Vert (#15804D)**: Succes, validation
- **Creme (#FFFBF5)**: Fond, convivialite
- **Charcoal (#1F2121)**: Texte, lisibilite

**Approche Design:**
 Moderne mais pas tendance
 Accessible et lisible
 Responsive (desktop/mobile)
 Ultra-pragmatique

** Conseil:** Si vous voulez personnaliser, c'est facile - contactez admin!`,

            'securite|donnees|prive|confidentiel': `**Securite des Donnees** 

**Modele Actuel (Developpement):**
- Donnees en localStorage navigateur
- Une seule machine = une base de donnees
- Mots de passe en clair (dev mode)

**Avantages:**
 Aucune donnee en cloud
 Donnees restent en local
 Controle complet
 Pas de risque hack externe

**Limitations:**
 Changement navigateur = nouvelles donnees
 Pas de sync multi-device
 Pas de backup automatique cloud

**Pour Production:**
- Integrer Backend API securise
- Crypter mots de passe (bcrypt)
- HTTPS obligatoire
- Database professionnelle
- Audit trail complet

** Conseil:** Pour usage confidentiel, backup votre data regulierement!`,

            'default': `**Desolee!**  Je n'ai pas compris votre question.

Je peux vous aider avec:
-  **Champs du formulaire** (identite, situation, finances)
-  **Exports** (Excel, PDF)
-  **Admin** (parametres, utilisateurs)
-  **Sauvegarde** (auto-save, donnees)
-  **Securite** (authentification)
-  **Utilisation** (comment faire)

**Essayez de reformuler ou posez une question plus specifique!**`
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

    // Emma peut etre initialisee sur index.html, app.html, admin.html
    // Elle fonctionne partout!
});

// Fonction pour integrer Emma facilement dans les autres pages
function initEmmaAI() {
    if (!window.emmaInstance) {
        window.emmaInstance = new EmmaAI();
    }
    return window.emmaInstance;
}