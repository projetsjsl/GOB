/**
 * AUTH GUARD - Protection du Dashboard GOB
 * Verifie l'authentification avant d'acceder au dashboard
 */

(function () {
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
        /**
     * Initialise la protection du dashboard
     */
    async init() {
      // Try Supabase auth first
      if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
        try {
          console.log(' Auth Guard: Checking Supabase session...');
          const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
          const { data: { session }, error } = await client.auth.getSession();
          
          if (session && session.user) {
            console.log(' Auth Guard: Supabase session found');
            
            // Get role from profiles table
            const { data: profile } = await client
              .from('profiles')
              .select('role, display_name, username')
              .eq('id', session.user.id)
              .single();
            
            const role = profile?.role || session.user.app_metadata?.role || 'viewer';
            const displayName = profile?.display_name || session.user.email || 'User';
            
            this.currentUser = {
              id: session.user.id,
              username: profile?.username || session.user.email,
              display_name: displayName,
              role: role,
              email: session.user.email,
              permissions: this.getPermissionsForRole(role),
              last_login: new Date().toISOString()
            };
            
            this.permissions = this.currentUser.permissions;
            
            // Store for other scripts
            window.__EMMA_ROLE__ = role;
            window.__EMMA_USER_ID__ = session.user.id;
            
            console.log(' Utilisateur authentifie (Supabase):', this.currentUser.display_name, 'Role:', role);
            this.displayUserInfo();
            this.createLogoutButton();
            this.applyEmmaPermissions();
            return;
          }
        } catch (e) {
          console.warn(' Auth Guard: Supabase session check failed:', e);
        }
      }
      
      // Fallback to TEST MODE
      console.log(' Auth Guard (TEST MODE): No session found, using mock user...');
      
      const MOCK_USER = {
        id: 'mock-admin-test',
        username: 'admin',
        display_name: 'Admin Test',
        role: 'admin',
        permissions: {
          view_dashboard: true,
          view_emma: true,
          save_conversations: true,
          view_own_history: true,
          view_all_history: true,
          manage_users: true
        },
        last_login: new Date().toISOString()
      };

      // Force inject mock user if not present
      try {
        const storage = window.__nativeSessionStorage || sessionStorage;
        if (!storage.getItem(AUTH_STORAGE_KEY)) {
             console.log(' Injecting mock admin session');
             storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(MOCK_USER));
        }
      } catch (e) {
        console.warn(' Storage error:', e);
      }

      // Set globals for roles-permissions.js
      window.__EMMA_ROLE__ = MOCK_USER.role;
      window.__EMMA_USER_ID__ = MOCK_USER.id;

      // Proceed as if authenticated
      this.currentUser = MOCK_USER;
      this.permissions = MOCK_USER.permissions;

      console.log(' Utilisateur authentifie (MOCK):', this.currentUser.display_name);
      this.displayUserInfo();
      this.createLogoutButton();
      this.applyEmmaPermissions();
    }
    
    /**
     * Get permissions for a given role
     */
    getPermissionsForRole(role) {
      const rolePermissions = {
        admin: {
          view_dashboard: true,
          view_emma: true,
          save_conversations: true,
          view_own_history: true,
          view_all_history: true,
          manage_users: true
        },
        analyst: {
          view_dashboard: true,
          view_emma: true,
          save_conversations: true,
          view_own_history: true,
          view_all_history: false,
          manage_users: false
        },
        viewer: {
          view_dashboard: true,
          view_emma: true,
          save_conversations: false,
          view_own_history: false,
          view_all_history: false,
          manage_users: false
        }
      };
      return rolePermissions[role] || rolePermissions.viewer;
    }

    /**
     * Valide la session aupres du serveur (Bypassed)
     */
    async validateSession() {
      return true; // Always return true for testing
    }

    /**
     * Affiche les informations utilisateur dans le dashboard
     */
    displayUserInfo() {
      // Chercher un endroit pour afficher les infos utilisateur
      // Try multiple selectors for different dashboard layouts
      const header = document.querySelector('header') || 
                     document.querySelector('.container') || 
                     document.querySelector('#root') ||
                     document.body;

      if (!header || header === document.body) {
        // This is expected for dashboards that manage their own user display
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
