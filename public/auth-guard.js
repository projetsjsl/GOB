/**
 * AUTH GUARD - Protection du Dashboard GOB
 * Verifie l'authentification avant d'acceder au dashboard
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
      console.log(' Auth Guard: Verification de l\'authentification...');

      // Mode developpement: bypass auth si flag defini
      if (window.__AUTH_GUARD_DISABLED || window.location.search.includes('dev=true')) {
        console.log(' Auth Guard desactive (mode developpement)');
        return;
      }

      // Verifier si on est sur la page de login (ne pas rediriger)
      if (window.location.pathname.includes('login.html')) {
        console.log(' Page de login detectee - pas de verification necessaire');
        return;
      }

      // Recuperer l'utilisateur depuis sessionStorage
      // CRITIQUE: Utiliser le storage NATIF (pas le wrapper avec fallback memoire)
      // pour pouvoir lire les donnees apres redirection depuis login.html
      let userJson = null;
      try {
        if (window.__nativeSessionStorage) {
          userJson = window.__nativeSessionStorage.getItem(AUTH_STORAGE_KEY);
        } else {
          userJson = sessionStorage.getItem(AUTH_STORAGE_KEY);
        }
      } catch (e) {
        console.error(' Impossible de lire sessionStorage:', e);
      }

      if (!userJson) {
        console.warn(' Aucun utilisateur connecte - redirection vers login');
        this.redirectToLogin();
        return;
      }

      try {
        this.currentUser = JSON.parse(userJson);
        this.permissions = this.currentUser.permissions;

        // Valider la session aupres du serveur
        const isValid = await this.validateSession();

        if (!isValid) {
          console.warn(' Session invalide - redirection vers login');
          this.logout();
          return;
        }

        console.log(' Utilisateur authentifie:', this.currentUser.display_name);
        console.log(' Permissions:', this.permissions);

        // Afficher les infos utilisateur dans le dashboard
        this.displayUserInfo();

        // Creer le bouton de deconnexion
        this.createLogoutButton();

        // Appliquer les permissions Emma
        this.applyEmmaPermissions();

      } catch (error) {
        console.error(' Erreur lors de la verification de l\'authentification:', error);
        this.redirectToLogin();
      }
    }

    /**
     * Valide la session aupres du serveur
     */
    async validateSession() {
      try {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'validate',
            username: this.currentUser.username
          })
        });

        const data = await response.json();
        return data.success;

      } catch (error) {
        console.error('Erreur validation session:', error);
        return false;
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

      // Creer l'element d'affichage utilisateur
      const userInfoDiv = document.createElement('div');
      userInfoDiv.id = 'user-info-display';
      userInfoDiv.className = 'fixed top-4 right-4 bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-3 z-50';
      userInfoDiv.style.display = 'none'; // Rendre invisible

      // Icone selon le role
      const roleIcons = {
        invite: '',
        client: '',
        daniel: '',
        gob: '',
        admin: ''
      };

      const icon = roleIcons[this.currentUser.role] || '';

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
     * Cree le bouton de deconnexion
     */
    createLogoutButton() {
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logout-btn';
      logoutBtn.className = 'fixed top-4 right-52 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg transition-all z-50 flex items-center gap-2';
      logoutBtn.style.display = 'none'; // Rendre invisible
      logoutBtn.innerHTML = `
        <i class="iconoir-log-out"></i>
        <span>Deconnexion</span>
      `;

      logoutBtn.addEventListener('click', () => {
        if (confirm('Voulez-vous vraiment vous deconnecter?')) {
          this.logout();
        }
      });

      document.body.appendChild(logoutBtn);
    }

    /**
     * Applique les permissions Emma selon le role
     */
    applyEmmaPermissions() {
      // Stocker les permissions pour Emma
      window.GOB_AUTH = {
        user: this.currentUser,
        permissions: this.permissions,
        canSaveConversations: this.permissions.save_conversations,
        canViewHistory: this.permissions.view_own_history,
        canViewAllHistory: this.permissions.view_all_history
      };

      console.log(' Permissions Emma configurees:', window.GOB_AUTH);

      // Si l'utilisateur ne peut pas sauvegarder les conversations
      if (!this.permissions.save_conversations) {
        console.log(' Utilisateur en mode lecture seule (conversations non sauvegardees)');
      }

      // Si admin, afficher un indicateur
      if (this.permissions.view_all_history) {
        console.log(' Mode Admin: Acces a tous les historiques');
        this.showAdminIndicator();
      }
    }

    /**
     * Affiche un indicateur pour les admins
     */
    showAdminIndicator() {
      const adminBadge = document.createElement('div');
      adminBadge.className = 'fixed bottom-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-50';
      adminBadge.textContent = ' Mode Admin';
      document.body.appendChild(adminBadge);
    }

    /**
     * Deconnexion
     */
    logout() {
      console.log(' Deconnexion...');

      //  SECURITE: Vider tous les storages Emma pour eviter les fuites de donnees
      // entre utilisateurs (admin -> gob, etc.)
      console.log(' Nettoyage des donnees Emma...');

      // 1. Vider sessionStorage Emma (utiliser storage natif si disponible)
      const session = window.__nativeSessionStorage || sessionStorage;
      const local = window.__nativeLocalStorage || localStorage;

      try {
        session.removeItem('emma-chat-history');
        session.removeItem('emma-intro-shown');
      } catch (e) {
        console.warn(' Impossible de vider sessionStorage:', e);
      }

      // 2. Vider localStorage Emma et donnees user-specific
      const keysToRemove = [];
      try {
        for (let i = 0; i < local.length; i++) {
          const key = local.key(i);
          // Supprimer toutes les cles Emma et watchlist (donnees user-specific)
          if (key && (key.startsWith('emma-') || key.startsWith('dans-') || key.startsWith('jslai'))) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach(key => {
          console.log(`   Suppression: ${key}`);
          local.removeItem(key);
        });

        console.log(` ${keysToRemove.length} cles nettoyees`);
      } catch (e) {
        console.warn(' Impossible de nettoyer localStorage:', e);
      }

      // 3. Supprimer la session user (utiliser storage natif)
      try {
        session.removeItem(AUTH_STORAGE_KEY);
      } catch (e) {
        console.warn(' Impossible de supprimer session:', e);
      }

      this.redirectToLogin();
    }

    /**
     * Redirige vers la page de login
     */
    redirectToLogin() {
      window.location.href = LOGIN_PAGE;
    }

    /**
     * Recupere l'utilisateur courant
     */
    getCurrentUser() {
      return this.currentUser;
    }

    /**
     * Recupere les permissions
     */
    getPermissions() {
      return this.permissions;
    }

    /**
     * Verifie si l'utilisateur a une permission
     */
    hasPermission(permission) {
      return this.permissions && this.permissions[permission] === true;
    }
  }

  // Creer l'instance globale
  window.authGuard = new AuthGuard();

  // Initialiser automatiquement quand le DOM est pret
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.authGuard.init();
    });
  } else {
    window.authGuard.init();
  }

})();
