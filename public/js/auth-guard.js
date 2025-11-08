/**
 * AUTH GUARD - Protection du Dashboard GOB
 * Vérifie l'authentification avant d'accéder au dashboard
 */

(function() {
  'use strict';

  // Configuration
  const AUTH_STORAGE_KEY = 'gob-user';
  const LOGIN_PAGE = '/login.html';

  /**
   * Classe de gestion de l'authentification
   */
  class AuthGuard {
    constructor() {
      this.currentUser = null;
      this.permissions = null;
    }

    /**
     * Initialise la protection du dashboard
     */
    async init() {
      console.log('🔐 Auth Guard: Vérification de l\'authentification...');

      // Vérifier si on est sur la page de login (ne pas rediriger)
      if (window.location.pathname.includes('login.html')) {
        console.log('📝 Page de login détectée - pas de vérification nécessaire');
        return;
      }

      // Vérifier si le dashboard est déjà en train de se charger (éviter les redirections conflictuelles)
      if (window.dashboardRendered || window.dashboardLoading) {
        console.log('📊 Dashboard déjà en cours de chargement - vérification rapide de session');
        // Attendre un peu et vérifier à nouveau
        await new Promise(resolve => setTimeout(resolve, 300));
        const userJson = sessionStorage.getItem(AUTH_STORAGE_KEY);
        if (userJson) {
          try {
            this.currentUser = JSON.parse(userJson);
            this.permissions = this.currentUser.permissions;
            this.applyEmmaPermissions();
            console.log('✅ Session trouvée pendant chargement dashboard');
            // NE PAS retourner ici - continuer pour que signalAuthGuardReady soit appelé
            // Le code continuera et signalAuthGuardReady sera appelé avec currentUser défini
          } catch (e) {
            console.warn('Erreur parsing session:', e);
            // Continuer la vérification normale si parsing échoue
          }
        } else {
          // Si pas de session trouvée, continuer la vérification normale
          console.log('⚠️ Pas de session trouvée pendant chargement dashboard - vérification normale');
        }
      }

      // Récupérer l'utilisateur depuis sessionStorage (seulement si pas déjà chargé)
      let userJson = null;
      if (!this.currentUser) {
        userJson = sessionStorage.getItem(AUTH_STORAGE_KEY);

        if (!userJson) {
          console.warn('❌ Aucun utilisateur connecté - attente avant redirection...');
          // Attendre un court instant au cas où la session serait en train d'être écrite
          await new Promise(resolve => setTimeout(resolve, 200));
          userJson = sessionStorage.getItem(AUTH_STORAGE_KEY);
          if (!userJson) {
            console.warn('❌ Aucune session trouvée après attente - redirection vers login');
            this.redirectToLogin();
            return;
          }
          console.log('✅ Session trouvée après attente');
        }
      } else {
        console.log('✅ Utilisateur déjà chargé depuis vérification précédente');
        userJson = null; // Pas besoin de recharger
      }

      try {
        // Parser seulement si on a récupéré une nouvelle session
        if (userJson && !this.currentUser) {
          this.currentUser = JSON.parse(userJson);
          this.permissions = this.currentUser.permissions;
        }

        // Valider la session auprès du serveur avec gestion d'erreur améliorée
        // Seulement si currentUser est défini (sinon on a déjà échoué plus haut)
        if (this.currentUser) {
          let isValid = false;
          try {
            isValid = await this.validateSession();
          } catch (validationError) {
            console.warn('⚠️ Erreur lors de la validation de session (non bloquant):', validationError);
            // En cas d'erreur réseau ou serveur, permettre l'accès avec les données en session
            // pour éviter une page blanche
            isValid = true; // Permettre l'accès basé sur sessionStorage uniquement
          }

          if (!isValid) {
            console.warn('❌ Session invalide - redirection vers login');
            this.logout();
            return;
          }
        } else {
          // Si currentUser n'est toujours pas défini à ce stade, c'est une erreur
          console.error('❌ Erreur: currentUser non défini après toutes les vérifications');
          // Ne pas rediriger pour éviter une boucle, laisser le dashboard gérer
          return; // Sortir ici pour éviter d'accéder à currentUser.display_name
        }

        // À ce stade, currentUser est garanti d'être défini
        console.log('✅ Utilisateur authentifié:', this.currentUser?.display_name || 'Utilisateur');
        console.log('🔑 Permissions:', this.permissions);

        // Afficher les infos utilisateur dans le dashboard (DÉSACTIVÉ)
        // this.displayUserInfo();

        // Créer le bouton de déconnexion (DÉSACTIVÉ)
        // this.createLogoutButton();

        // Supprimer les éléments flottants s'ils existent déjà
        this.removeFloatingElements();

        // Appliquer les permissions Emma
        this.applyEmmaPermissions();

      } catch (error) {
        console.error('❌ Erreur lors de la vérification de l\'authentification:', error);
        // Ne pas rediriger immédiatement en cas d'erreur pour éviter une page blanche
        // Laisser le dashboard se charger et afficher un message d'erreur si nécessaire
        console.warn('⚠️ Erreur non bloquante - le dashboard peut continuer à se charger');
        
        // Essayer d'appliquer les permissions même en cas d'erreur si on a les données utilisateur
        if (this.currentUser && this.permissions) {
          try {
            this.applyEmmaPermissions();
          } catch (permError) {
            console.error('Erreur lors de l\'application des permissions:', permError);
          }
        }
      }
    }

    /**
     * Valide la session auprès du serveur
     */
    async validateSession() {
      // Protection: ne pas valider si currentUser n'est pas défini
      if (!this.currentUser || !this.currentUser.username) {
        console.warn('⚠️ validateSession appelé sans currentUser - retour false');
        return false;
      }
      
      try {
        // Timeout pour éviter que la validation bloque indéfiniment
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes max

        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'validate',
            username: this.currentUser.username
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.success === true;

      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('⚠️ Timeout lors de la validation de session');
        } else {
          console.error('Erreur validation session:', error);
        }
        // Propager l'erreur pour que le code appelant puisse décider
        throw error;
      }
    }

    /**
     * Affiche les informations utilisateur dans le dashboard
     */
    displayUserInfo() {
      // Chercher un endroit pour afficher les infos utilisateur
      const header = document.querySelector('header') || document.querySelector('.container');

      if (!header) {
        console.warn('Impossible de trouver le header pour afficher les infos utilisateur');
        return;
      }

      // Créer l'élément d'affichage utilisateur
      const userInfoDiv = document.createElement('div');
      userInfoDiv.id = 'user-info-display';
      userInfoDiv.className = 'fixed top-4 right-4 bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-3 z-50';

      // Icône selon le rôle
      const roleIcons = {
        invite: '👤',
        client: '💼',
        daniel: '👨‍💼',
        gob: '🏢',
        admin: '⚙️'
      };

      const icon = roleIcons[this.currentUser.role] || '👤';

      userInfoDiv.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="text-2xl">${icon}</span>
          <div>
            <div class="font-semibold text-sm">${this.currentUser.display_name}</div>
            <div class="text-xs text-gray-500">${this.currentUser.role}</div>
          </div>
        </div>
      `;

      document.body.appendChild(userInfoDiv);
    }

    /**
     * Crée le bouton de déconnexion
     */
    createLogoutButton() {
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logout-btn';
      logoutBtn.className = 'fixed top-4 right-52 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg transition-all z-50 flex items-center gap-2';
      logoutBtn.innerHTML = `
        <i class="iconoir-log-out"></i>
        <span>Déconnexion</span>
      `;

      logoutBtn.addEventListener('click', () => {
        if (confirm('Voulez-vous vraiment vous déconnecter?')) {
          this.logout();
        }
      });

      document.body.appendChild(logoutBtn);
    }

    /**
     * Supprime les éléments flottants (déconnexion et GOB)
     */
    removeFloatingElements() {
      // Supprimer l'élément d'info utilisateur (GOB)
      const userInfoDisplay = document.getElementById('user-info-display');
      if (userInfoDisplay) {
        userInfoDisplay.remove();
        console.log('🗑️ Élément flottant GOB supprimé');
      }

      // Supprimer le bouton de déconnexion
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.remove();
        console.log('🗑️ Bouton de déconnexion flottant supprimé');
      }

      // Supprimer le badge admin s'il existe
      const adminBadges = document.querySelectorAll('.fixed.bottom-4.right-4');
      adminBadges.forEach(badge => {
        if (badge.textContent.includes('Mode Admin')) {
          badge.remove();
          console.log('🗑️ Badge admin flottant supprimé');
        }
      });
    }

    /**
     * Applique les permissions Emma selon le rôle
     */
    applyEmmaPermissions() {
      try {
        // Vérifier que les permissions existent avant de les utiliser
        if (!this.permissions) {
          console.warn('⚠️ Permissions non disponibles - utilisation de permissions par défaut');
          this.permissions = {
            save_conversations: false,
            view_own_history: false,
            view_all_history: false
          };
        }

        // Stocker les permissions pour Emma
        window.GOB_AUTH = {
          user: this.currentUser,
          permissions: this.permissions,
          canSaveConversations: this.permissions?.save_conversations || false,
          canViewHistory: this.permissions?.view_own_history || false,
          canViewAllHistory: this.permissions?.view_all_history || false
        };

        console.log('📋 Permissions Emma configurées:', window.GOB_AUTH);

        // Si l'utilisateur ne peut pas sauvegarder les conversations
        if (!this.permissions.save_conversations) {
          console.log('⚠️ Utilisateur en mode lecture seule (conversations non sauvegardées)');
        }

        // Si admin, afficher un indicateur (DÉSACTIVÉ)
        if (this.permissions.view_all_history) {
          console.log('🔓 Mode Admin: Accès à tous les historiques');
          // this.showAdminIndicator(); // Désactivé - élément flottant retiré
        }
      } catch (error) {
        console.error('Erreur lors de l\'application des permissions Emma:', error);
        // Créer un objet de permissions par défaut en cas d'erreur
        window.GOB_AUTH = {
          user: this.currentUser || null,
          permissions: {},
          canSaveConversations: false,
          canViewHistory: false,
          canViewAllHistory: false
        };
      }
    }

    /**
     * Affiche un indicateur pour les admins
     */
    showAdminIndicator() {
      const adminBadge = document.createElement('div');
      adminBadge.className = 'fixed bottom-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-50';
      adminBadge.textContent = '🔓 Mode Admin';
      document.body.appendChild(adminBadge);
    }

    /**
     * Déconnexion
     */
    logout() {
      console.log('👋 Déconnexion...');

      // ✅ SÉCURITÉ: Vider tous les storages Emma pour éviter les fuites de données
      // entre utilisateurs (admin → gob, etc.)
      console.log('🧹 Nettoyage des données Emma...');

      // 1. Vider sessionStorage Emma
      sessionStorage.removeItem('emma-chat-history');
      sessionStorage.removeItem('emma-intro-shown');

      // 2. Vider localStorage Emma et données user-specific
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Supprimer toutes les clés Emma et watchlist (données user-specific)
        if (key && (key.startsWith('emma-') || key.startsWith('dans-') || key.startsWith('jslai'))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        console.log(`  🗑️ Suppression: ${key}`);
        localStorage.removeItem(key);
      });

      console.log(`✅ ${keysToRemove.length} clés nettoyées`);

      // 3. Supprimer la session user
      sessionStorage.removeItem(AUTH_STORAGE_KEY);

      this.redirectToLogin();
    }

    /**
     * Redirige vers la page de login
     */
    redirectToLogin() {
      window.location.href = LOGIN_PAGE;
    }

    /**
     * Récupère l'utilisateur courant
     */
    getCurrentUser() {
      return this.currentUser;
    }

    /**
     * Récupère les permissions
     */
    getPermissions() {
      return this.permissions;
    }

    /**
     * Vérifie si l'utilisateur a une permission
     */
    hasPermission(permission) {
      return this.permissions && this.permissions[permission] === true;
    }
  }

  // Créer l'instance globale
  window.authGuard = new AuthGuard();
  
  // État d'initialisation
  window.authGuardInitialized = false;
  window.authGuardReady = false;

  // Fonction pour signaler que l'initialisation est terminée
  function signalAuthGuardReady(authenticated, user, error) {
    if (window.authGuardInitialized) {
      return; // Éviter les doubles signaux
    }
    
    window.authGuardInitialized = true;
    window.authGuardReady = true;
    
    // Créer l'objet détail de l'événement
    const eventDetail = { 
      authenticated: authenticated,
      user: user || null,
      error: error || null
    };
    
    // Stocker l'événement dans window pour les cas de race condition
    window.lastAuthGuardEvent = eventDetail;
    
    // Déclencher l'événement
    window.dispatchEvent(new CustomEvent('authGuardInitialized', { 
      detail: eventDetail
    }));
    
    console.log('🔐 Auth Guard: Initialisation terminée', { authenticated, hasUser: !!user });
  }

  // Initialiser automatiquement quand le DOM est prêt
  // Utiliser un try-catch global pour éviter que les erreurs bloquent le chargement
  try {
    const initAuthGuard = async () => {
      try {
        await window.authGuard.init();
        
        // Vérifier si on a été redirigé vers login
        if (window.location.pathname.includes('login.html')) {
          console.log('🔐 Auth Guard: Redirection vers login détectée');
          signalAuthGuardReady(false, null, 'Redirected to login');
          return;
        }
        
        // Vérifier l'état d'authentification
        // Si currentUser n'est pas défini mais qu'on a une session, la charger
        if (!window.authGuard.currentUser) {
          const userJson = sessionStorage.getItem(AUTH_STORAGE_KEY);
          if (userJson) {
            try {
              window.authGuard.currentUser = JSON.parse(userJson);
              window.authGuard.permissions = window.authGuard.currentUser.permissions;
              window.authGuard.applyEmmaPermissions();
            } catch (e) {
              console.warn('Erreur chargement session dans initAuthGuard:', e);
            }
          }
        }
        
        const isAuthenticated = window.authGuard.currentUser !== null;
        signalAuthGuardReady(isAuthenticated, window.authGuard.currentUser, null);
        
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de Auth Guard:', error);
        
        // Vérifier si on a été redirigé vers login pendant l'erreur
        if (window.location.pathname.includes('login.html')) {
          signalAuthGuardReady(false, null, 'Redirected to login');
          return;
        }
        
        // En cas d'erreur, vérifier si on a quand même une session
        const userJson = sessionStorage.getItem(AUTH_STORAGE_KEY);
        if (userJson) {
          try {
            const user = JSON.parse(userJson);
            signalAuthGuardReady(true, user, error.message);
          } catch (parseError) {
            signalAuthGuardReady(false, null, error.message);
          }
        } else {
          signalAuthGuardReady(false, null, error.message);
        }
      }
    };

    // Initialiser immédiatement si le DOM est déjà chargé, sinon attendre
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initAuthGuard();
      });
    } else {
      // DOM déjà chargé, initialiser immédiatement
      initAuthGuard();
    }
  } catch (error) {
    console.error('❌ Erreur critique lors de l\'initialisation de Auth Guard:', error);
    
    // En cas d'erreur critique, vérifier si on a quand même une session
    const userJson = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (userJson && !window.location.pathname.includes('login.html')) {
      try {
        const user = JSON.parse(userJson);
        signalAuthGuardReady(true, user, error.message);
      } catch (parseError) {
        signalAuthGuardReady(false, null, error.message);
      }
    } else {
      signalAuthGuardReady(false, null, error.message);
    }
  }

})();
