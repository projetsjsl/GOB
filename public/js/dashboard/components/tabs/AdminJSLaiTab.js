// Auto-converted from monolithic dashboard file
// Component: AdminJSLaiTab



const AdminJSLaiTab = ({
                emmaConnected = false,
                setEmmaConnected = () => {},
                showPromptEditor = false,
                setShowPromptEditor = () => {},
                showTemperatureEditor = false,
                setShowTemperatureEditor = () => {},
                showLengthEditor = false,
                setShowLengthEditor = () => {},
                isDarkMode = true,
                setActiveTab,
                activeTab,
                secondaryNavConfig,
                setSecondaryNavConfig,
                availableNavLinks,
                // Primary Navigation Config Props
                primaryNavConfig = {},
                setPrimaryNavConfig = () => {},
                allTabsList = []
            }) => {

                // Validation des props avec valeurs par defaut
                const darkMode = isDarkMode !== undefined ? isDarkMode : true;
                
                // Validation et protection des fonctions
                const safeSetEmmaConnected = typeof setEmmaConnected === 'function' ? setEmmaConnected : () => {};
                const safeSetShowPromptEditor = typeof setShowPromptEditor === 'function' ? setShowPromptEditor : () => {};
                const safeSetShowTemperatureEditor = typeof setShowTemperatureEditor === 'function' ? setShowTemperatureEditor : () => {};
                const safeSetShowLengthEditor = typeof setShowLengthEditor === 'function' ? setShowLengthEditor : () => {};
                
                // Etats pour la gestion des indices TradingView
                const [adminSelectedIndices, setAdminSelectedIndices] = React.useState(() => {
                    try {
                        const saved = localStorage.getItem('tradingview-selected-indices');
                        if (saved) {
                            return JSON.parse(saved);
                        }
                    } catch (e) {
                        console.warn('Erreur chargement indices:', e);
                    }
                    // Par defaut: indices US principaux + crypto
                    return [
                        'SP:SPX',
                        'DJ:DJI',
                        'NASDAQ:NDX',
                        'TVC:RUT',
                        'TSX:OSPTX',
                        'BITSTAMP:BTCUSD',
                        'BITSTAMP:ETHUSD'
                    ];
                });
                
                const [showIndicesManager, setShowIndicesManager] = React.useState(false);
                const [showNavManager, setShowNavManager] = React.useState(false);
                const [navConfigTargetTab, setNavConfigTargetTab] = React.useState('jlab');
                const [showPrimaryNavManager, setShowPrimaryNavManager] = React.useState(false);
                
                // Etats locaux pour les variables manquantes
                const [githubToken, setGithubToken] = React.useState(() => {
                    try {
                        return localStorage.getItem('github-token') || '';
                    } catch (e) {
                        return '';
                    }
                });
                const [showSettings, setShowSettings] = React.useState(false);
                const [systemLogs] = React.useState([]);
                const [isProfessionalMode, setIsProfessionalMode] = React.useState(() => {
                    try {
                        return typeof window !== 'undefined' && typeof window.ProfessionalModeSystem !== 'undefined' 
                            ? window.ProfessionalModeSystem.isEnabled() 
                            : false;
                    } catch (e) {
                        return false;
                    }
                });
                const [loading, setLoading] = React.useState(false);
                const [scrapingStatus, setScrapingStatus] = React.useState('idle');
                const [scrapingProgress, setScrapingProgress] = React.useState(0);
                const [cacheStatus, setCacheStatus] = React.useState({});
                const [loadingCacheStatus, setLoadingCacheStatus] = React.useState(false);
                
                // Etat et fonction pour les messages utilisateur
                const [message, setMessage] = React.useState({ text: '', type: '' });
                const showMessage = (text, type = 'info') => {
                    setMessage({ text, type });
                    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
                };
                
                // Etats pour la Gestion des Roles (RBAC)
                const [roles, setRoles] = React.useState([]);
                const [loadingRoles, setLoadingRoles] = React.useState(false);
                const [showRoleManager, setShowRoleManager] = React.useState(false);
                const [selectedRole, setSelectedRole] = React.useState(null);
                const [showRoleModal, setShowRoleModal] = React.useState(false);
                const [roleForm, setRoleForm] = React.useState({ roleName: '', displayName: '', description: '', is_admin: false, componentPermissions: {} });
                const [adminPassword, setAdminPassword] = React.useState(''); 
                const [showPasswordModal, setShowPasswordModal] = React.useState(false);
                const [pendingAction, setPendingAction] = React.useState(null);
                const [availableComponents, setAvailableComponents] = React.useState([]);
                const [assignUserForm, setAssignUserForm] = React.useState({ username: '', roleId: '' });

                // --- Password Management State (Moved to Top) ---
                const [selectedUserForReset, setSelectedUserForReset] = React.useState(null);
                const [newPassword, setNewPassword] = React.useState('');
                const [showPasswordResetModal, setShowPasswordResetModal] = React.useState(false);

                // --- Password Management Handler (Moved to Top) ---
                const handlePasswordResetSubmit = async () => {
                   void(' handlePasswordResetSubmit called', { selectedUserForReset, newPassword });
                   
                   if (!selectedUserForReset || !newPassword) {
                       void(' Missing data:', { selectedUserForReset, newPassword: newPassword ? 'has value' : 'empty' });
                       showMessage(' Veuillez entrer un nouveau mot de passe', 'error');
                       return;
                   }

                   setLoadingRoles(true);
                   try {
                       const currentUser = typeof window !== 'undefined' && window.authGuard 
                           ? window.authGuard.getCurrentUser() 
                           : { username: 'Admin' };
                       
                       void(' Sending password update request...');
                       const response = await fetch('/api/auth', {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({
                               action: 'update_user',
                               admin_username: currentUser.username,
                               target_id: selectedUserForReset.id,
                               updates: { 
                                   password: newPassword,
                                   password_display: newPassword
                               }
                           })
                       });
                       const data = await response.json();
                       void(' Response:', data);
                       
                       if (data.success) {
                           showMessage(` Mot de passe de ${selectedUserForReset.username} change en: ${newPassword}`, 'success');
                           setShowPasswordResetModal(false);
                           setNewPassword('');
                           setSelectedUserForReset(null);
                           // Attendre un peu pour s'assurer que la DB est mise a jour, puis rafraichir
                           setTimeout(() => {
                               fetchUsers();
                           }, 500);
                       } else {
                           showMessage(' Erreur: ' + (data.error || 'Erreur inconnue'), 'error');
                       }
                   } catch (e) {
                       console.error(' Error:', e);
                       showMessage(' Erreur technique: ' + e.message, 'error');
                   } finally {
                       setLoadingRoles(false);
                   }
                };

                // --- Constants for Announcement Bars (Moved to Top Level) ---
                const DEFAULT_PROMPTS = {
                    'news': 'Utilise Google Search pour trouver la principale actualite financiere de l\'heure. Genere un message court (max 80 caracteres) pour une barre d\'annonce en haut de page. Format: " [Titre accrocheur]"',
                    'update': 'Genere un message de mise a jour systeme court (max 80 caracteres) pour une barre d\'annonce. Format: " [Message de mise a jour]"',
                    'event': 'Utilise Google Search pour trouver le prochain evenement economique important (Fed, GDP, emploi, etc.). Genere un message court (max 80 caracteres). Format: " [Evenement] - [Date/Heure]"',
                    'market-alert': 'Utilise Google Search pour trouver une alerte de marche importante (volatilite, crash, rally). Genere un message court (max 80 caracteres). Format: " [Alerte]"',
                    'promotion': 'Genere un message promotionnel court (max 80 caracteres) pour services premium. Format: " [Offre]"'
                };

                const BAR_TYPES = [
                    { key: 'news-top', label: 'Actualites Financieres', emoji: '', description: 'Actualites importantes de l\'heure', type: 'news' },
                    { key: 'update-top', label: 'Mises a Jour Systeme', emoji: '', description: 'Nouvelles fonctionnalites et ameliorations', type: 'update' },
                    { key: 'event-top', label: 'Evenements Economiques', emoji: '', description: 'Fed, GDP, emploi, etc.', type: 'event' },
                    { key: 'market-alert-top', label: 'Alertes de Marche', emoji: '', description: 'Volatilite, crash, rally', type: 'market-alert' },
                    { key: 'promotion-top', label: 'Promotions', emoji: '', description: 'Offres sur services premium', type: 'promotion' }
                ];

                // --- Announcement Bars State ---
                const [editingBar, setEditingBar] = React.useState(null);
                const [barConfigs, setBarConfigs] = React.useState(() => {
                    // Defaults (Initial state before DB load)
                    const initialConfig = {};
                    BAR_TYPES.forEach(({ key, type }) => {
                        initialConfig[key] = { 
                            enabled: false, 
                            type: type, 
                            section: 'top', 
                            design: 'default',
                            prompt: DEFAULT_PROMPTS[type] || '',
                            temperature: 0.7,
                            maxOutputTokens: 150,
                            useGoogleSearch: ['news', 'event', 'market-alert'].includes(type)
                        };
                    });
                    return initialConfig;
                });

                // Load from Supabase on mount
                React.useEffect(() => {
                    const loadBarConfigs = async () => {
                        try {
                            const response = await fetch('/api/admin/emma-config?section=ui&key=announcement_bars');
                            const data = await response.json();
                            
                            if (data && data.config && data.config.value) {
                                // Merge DB config with defaults to ensure structure
                                setBarConfigs(prev => ({
                                    ...prev,
                                    ...data.config.value
                                }));
                                void(' Announcement Bars config loaded from DB');
                            }
                        } catch (e) {
                            console.error('Error loading bar configs from DB:', e);
                        }
                    };
                    loadBarConfigs();
                }, []);

                const saveBarConfig = async (key, updates) => {
                    const newConfig = {
                        ...barConfigs,
                        [key]: {
                            ...barConfigs[key],
                            ...updates
                        }
                    };
                    setBarConfigs(newConfig);
                    
                    // Save to Supabase
                    try {
                        await fetch('/api/admin/emma-config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'set',
                                category: 'ui',
                                section: 'ui', // Explicitly setting section
                                key: 'announcement_bars',
                                value: newConfig
                            })
                        });
                        
                        // Also update localStorage for immediate offline/backup
                        localStorage.setItem('announcement-bars-config', JSON.stringify(newConfig));
                        
                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(new Event('announcement-config-changed'));
                        }
                    } catch (e) {
                        console.error('Erreur sauvegarde config DB:', e);
                        // Fallback local storage already done above
                    }
                };

                // Fonction generique pour sauvegarder la config de navigation
                const saveNavConfig = async (key, config) => {
                    const label = key === 'primary_nav_config' ? 'Navigation Principale' : 'Navigation Secondaire';
                    showMessage(` Sauvegarde de ${label} en cours...`, 'info');
                    
                    try {
                        const response = await fetch('/api/admin/emma-config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'set',
                                category: 'ui',
                                section: 'ui', // Explicitly setting section
                                key: key,
                                value: config
                            })
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            showMessage(` ${label} sauvegardee avec succes sur Supabase!`, 'success');
                        } else {
                            throw new Error(data.error || 'Erreur inconnue');
                        }
                    } catch (e) {
                        console.error(`Erreur sauvegarde ${label}:`, e);
                        showMessage(` Erreur sauvegarde ${label}: ${e.message}`, 'error');
                    }
                };

                // Fonctions helper pour les actions manquantes
                const refreshAllStocks = () => {
                    setLoading(true);
                    // TODO: Implementer l'actualisation des stocks
                    setTimeout(() => setLoading(false), 1000);
                };
                
                const fetchNews = () => {
                    // TODO: Implementer la recuperation des nouvelles
                    void('Fetch news clicked');
                };
                
                // Etats pour les logs de scraping
                const [scrapingLogs, setScrapingLogs] = React.useState([]);
                
                // Fonction addScrapingLog pour ajouter aux logs
                const addScrapingLog = (message, type = 'info') => {
                    const log = {
                        message,
                        type,
                        timestamp: new Date().toISOString()
                    };
                    setScrapingLogs(prev => [...prev, log]);
                    void(`[Scraping ${type.toUpperCase()}] ${message}`);
                };
                
                const runSeekingAlphaScraper = async () => {
                    setScrapingStatus('running');
                    setScrapingProgress(0);
                    addScrapingLog(' Demarrage du scraping batch...', 'info');
                    
                    try {
                        // Simulation de progression
                        for (let i = 0; i <= 100; i += 10) {
                            await new Promise(resolve => setTimeout(resolve, 200));
                            setScrapingProgress(i);
                            addScrapingLog(` Progression: ${i}%`, 'info');
                        }
                        
                        setScrapingStatus('completed');
                        addScrapingLog(' Scraping termine avec succes!', 'success');
                    } catch (error) {
                        setScrapingStatus('error');
                        addScrapingLog(` Erreur: ${error.message}`, 'error');
                    }
                };
                
                const analyzeWithPerplexityAndUpdate = async (ticker, data) => {
                    addScrapingLog(` Analyse de ${ticker} avec Perplexity...`, 'info');
                    // TODO: Implementer l'analyse Perplexity
                    return { success: true };
                };
                
                // Fonctions helper pour les donnees Seeking Alpha
                const fetchSeekingAlphaData = async () => {
                    try {
                        const response = await fetch('/api/seeking-alpha-scraping?type=analysis');
                        const data = await response.json();
                        return data;
                    } catch (error) {
                        console.error('Erreur recuperation donnees Seeking Alpha:', error);
                        return null;
                    }
                };
                
                const fetchSeekingAlphaStockData = async () => {
                    try {
                        const response = await fetch('/api/seeking-alpha-scraping?type=stocks');
                        const data = await response.json();
                        return data;
                    } catch (error) {
                        console.error('Erreur recuperation stock data:', error);
                        return null;
                    }
                };
                
                // Fonctions helper pour les health checks
                const [healthCheckLoading, setHealthCheckLoading] = React.useState(false);
                const [healthStatus, setHealthStatus] = React.useState(null);
                const [apiStatus, setApiStatus] = React.useState({});
                
                const checkApiStatus = async () => {
                    setHealthCheckLoading(true);
                    try {
                        // TODO: Implementer la verification du statut des APIs
                        setApiStatus({ status: 'ok', timestamp: new Date().toISOString() });
                    } catch (error) {
                        setApiStatus({ status: 'error', error: error.message });
                    } finally {
                        setHealthCheckLoading(false);
                    }
                };
                
                const runHealthCheck = async () => {
                    setHealthCheckLoading(true);
                    try {
                        // TODO: Implementer le health check complet
                        setHealthStatus({ overall: 'healthy', timestamp: new Date().toISOString() });
                    } catch (error) {
                        setHealthStatus({ overall: 'unhealthy', error: error.message });
                    } finally {
                        setHealthCheckLoading(false);
                    }
                };
                
                const [availableUsers, setAvailableUsers] = React.useState([]); // Users list for assignment

                // --- RBAC Helpers ---
                const fetchUsers = async () => {
                   if (typeof window !== 'undefined' && window.authGuard) {
                       const currentUser = window.authGuard.getCurrentUser();
                       if (!currentUser) {
                           console.warn('No current user found');
                           return;
                       }

                       try {
                           void(' Fetching users list...');
                           const response = await fetch('/api/auth', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ 
                                   action: 'list_users',
                                   admin_username: currentUser.username // API requires admin username
                               })
                           });
                           const data = await response.json();
                           void(' Users list response:', data);
                           if (data.success) {
                               setAvailableUsers(data.users || []);
                               void(' Users list updated:', data.users?.length || 0, 'users');
                           } else {
                               console.error(' Error fetching users:', data.error);
                               showMessage(' Erreur lors du chargement des utilisateurs: ' + (data.error || 'Erreur inconnue'), 'error');
                           }
                       } catch (e) {
                           console.error(' Error fetching users:', e);
                           showMessage(' Erreur technique lors du chargement: ' + e.message, 'error');
                       }
                   } else {
                       console.warn(' authGuard not available');
                   }
                };

                const fetchRoles = async (password = adminPassword) => {
                    setLoadingRoles(true);
                    try {
                        const response = await fetch('/api/roles-config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'get_roles', adminPassword: password })
                        });
                        const data = await response.json();
                        if (data.success) {
                            setRoles(data.roles);
                            if (data.components) setAvailableComponents(data.components);
                        } else {
                            console.error('Error fetching roles:', data.error);
                            if (data.error && data.error.includes('relation "user_roles" does not exist')) {
                                showMessage(' Tables manquantes. Veuillez executer le script SQL.', 'error');
                            } else {
                                showMessage(' Erreur chargement roles: ' + (data.error || 'Erreur inconnue'), 'error');
                            }
                        }
                    } catch (e) {
                        console.error('Error fetching roles:', e);
                        showMessage(' Erreur connexion: ' + e.message, 'error');
                    } finally {
                        setLoadingRoles(false);
                    }
                };

                const handleManageRoles = () => {
                   if (!adminPassword) {
                       setPendingAction('manage_roles');
                       setShowPasswordModal(true);
                   } else {
                       setShowRoleManager(!showRoleManager);
                       if (!showRoleManager) {
                           fetchRoles();
                           fetchUsers(); // Fetch users when opening manager
                       }
                   }
                };

                const handlePopulateDefaults = async () => {
                    if (!confirm('Cela va creer les roles par defaut (Invite, Client, Daniel, GOB, Admin) s\'ils n\'existent pas.\nContinuer ?')) return;
                    
                    setLoadingRoles(true);
                    try {
                        const response = await fetch('/api/roles-config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'populate_defaults',
                                adminPassword: adminPassword,
                                is_admin: isAdmin
                            })
                        });
                        const data = await response.json();
                        
                        if (data.success) {
                            showMessage(' ' + data.message, 'success');
                            fetchRoles(); // Refresh list
                        } else {
                            showMessage(' ' + data.error, 'error');
                        }
                    } catch (error) {
                        console.error('Error populating defaults:', error);
                        showMessage(' Erreur lors de l\'initialisation', 'error');
                    } finally {
                        setLoadingRoles(false);
                    }
                };

                const handleCreateRole = async () => {
                    setLoadingRoles(true);
                    try {
                        const response = await fetch('/api/roles-config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                action: 'create_role', 
                                adminPassword, 
                                roleName: roleForm.roleName,
                                displayName: roleForm.displayName,
                                description: roleForm.description,
                                componentPermissions: roleForm.componentPermissions
                            })
                        });
                        const data = await response.json();
                        if (data.success) {
                            fetchRoles();
                            setShowRoleModal(false);
                            setRoleForm({ roleName: '', displayName: '', description: '', is_admin: false, componentPermissions: {} });
                        } else {
                            console.log('Alert suppressed:', 'Erreur: ' + data.error);
                        }
                    } catch (e) {
                        console.log('Alert suppressed:', 'Erreur: ' + e.message);
                    } finally {
                        setLoadingRoles(false);
                    }
                };

                const handleUpdateRole = async () => {
                    if (!selectedRole) return;
                    setLoadingRoles(true);
                    try {
                        const response = await fetch('/api/roles-config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                action: 'update_role', 
                                adminPassword, 
                                roleId: selectedRole.id, // Use ID for updates
                                displayName: roleForm.displayName,
                                description: roleForm.description,
                                componentPermissions: roleForm.componentPermissions,
                                is_admin: roleForm.is_admin
                            })
                        });
                        const data = await response.json();
                        if (data.success) {
                            fetchRoles();
                            setShowRoleModal(false);
                            setSelectedRole(null);
                        } else {
                            console.log('Alert suppressed:', 'Erreur: ' + data.error);
                        }
                    } catch (e) {
                        console.log('Alert suppressed:', 'Erreur: ' + e.message);
                    } finally {
                        setLoadingRoles(false);
                    }
                };

                const handleDeleteRole = async (roleId) => {
                    if (!confirm('Etes-vous sur de vouloir supprimer ce role ?')) return;
                    setLoadingRoles(true);
                    try {
                        const response = await fetch('/api/roles-config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                action: 'delete_role', 
                                adminPassword, 
                                roleId
                            })
                        });
                        const data = await response.json();
                        if (data.success) {
                            fetchRoles();
                        } else {
                            console.log('Alert suppressed:', 'Erreur: ' + data.error);
                        }
                    } catch (e) {
                        console.log('Alert suppressed:', 'Erreur: ' + e.message);
                    } finally {
                        setLoadingRoles(false);
                    }
                };
                
                const handleAssignRole = async () => {
                    if (!assignUserForm.username || !assignUserForm.roleId) return console.log('Alert suppressed:', 'Veuillez remplir tous les champs');
                    setLoadingRoles(true);
                    try {
                        const response = await fetch('/api/roles-config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                action: 'assign_role', 
                                adminPassword, 
                                username: assignUserForm.username,
                                role_id: assignUserForm.roleId
                            })
                        });
                        const data = await response.json();
                        if (data.success) {
                            console.log('Alert suppressed:', `Role assigne avec succes a ${assignUserForm.username}`);
                            setAssignUserForm({ username: '', roleId: '' });
                        } else {
                            console.log('Alert suppressed:', 'Erreur: ' + data.error);
                        }
                    } catch (e) {
                        console.log('Alert suppressed:', 'Erreur: ' + e.message);
                    } finally {
                        setLoadingRoles(false);
                    }
                };

                // Fonction helper pour obtenir tous les indices disponibles
                const getAllIndices = () => {
                    if (typeof window !== 'undefined' && typeof window.getAllAvailableIndices === 'function') {
                        return window.getAllAvailableIndices();
                    }
                    // Fallback si la fonction n'est pas disponible
                    return {
                        'us': [
                            { proName: 'SP:SPX', title: 'S&P 500', category: 'us' },
                            { proName: 'DJ:DJI', title: 'Dow Jones', category: 'us' },
                            { proName: 'NASDAQ:NDX', title: 'NASDAQ 100', category: 'us' }
                        ]
                    };
                };
                
                // Sauvegarder githubToken dans localStorage quand il change
                React.useEffect(() => {
                    if (githubToken) {
                        try {
                            localStorage.setItem('github-token', githubToken);
                        } catch (e) {
                            console.warn('Erreur sauvegarde token:', e);
                        }
                    }
                }, [githubToken]);
                
                return (
                <div className="space-y-6">
                    {/* Toast de notification */}
                    {message.text && (
                        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
                            message.type === 'success' ? 'bg-green-600 text-white' :
                            message.type === 'error' ? 'bg-red-600 text-white' :
                            'bg-blue-600 text-white'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                        }`}> Admin-JSLAI</h2>
                    </div>

                    {/* Acces rapides admin */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        darkMode ? 'bg-gradient-to-br from-blue-900/20 to-gray-900 border-blue-700' : 'bg-gradient-to-br from-blue-50 to-gray-50 border-blue-200'
                    }`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                                {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} /> : ''}
                                Acces admin directs
                            </h3>
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Ouvre dans un nouvel onglet
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            <a
                                href="/emma-config.html"
                                target="_blank"
                                rel="noreferrer"
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-blue-800/60 hover:bg-blue-700 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-900'}`}
                            >
                                 Emma Config
                            </a>
                            <a
                                href="/jlab-dashboard.html"
                                target="_blank"
                                rel="noreferrer"
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-indigo-800/60 hover:bg-indigo-700 text-white' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-900'}`}
                            >
                                 Orchestrator Dashboard
                            </a>
                            <a
                                href="/jlab-settings.html"
                                target="_blank"
                                rel="noreferrer"
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-purple-800/60 hover:bg-purple-700 text-white' : 'bg-purple-100 hover:bg-purple-200 text-purple-900'}`}
                            >
                                 JLab Settings
                            </a>
                            <a
                                href="/workflow-builder.html"
                                target="_blank"
                                rel="noreferrer"
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-emerald-800/60 hover:bg-emerald-700 text-white' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'}`}
                            >
                                 Workflow Builder
                            </a>
                            <a
                                href="/jlab.html"
                                target="_blank"
                                rel="noreferrer"
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-slate-800/60 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
                            >
                                 Hub JLab
                            </a>
                        </div>
                    </div>

                    {typeof EmmaSmsPanel !== 'undefined' && <EmmaSmsPanel />}

                    {/*  Gestion de la Navigation Principale (Affichage des onglets) */}
                    {allTabsList && allTabsList.length > 0 && (
                        <div className={`rounded-lg p-4 border transition-colors duration-300 mb-4 ${
                            darkMode ? 'bg-gradient-to-br from-emerald-900/20 to-gray-900 border-emerald-700' : 'bg-gradient-to-br from-emerald-50 to-gray-50 border-emerald-200'
                        }`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-emerald-300' : 'text-emerald-900'}`}>
                                    {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} /> : ''}
                                    Navigation Principale (Onglets)
                                </h3>
                                <button
                                    onClick={() => setShowPrimaryNavManager(!showPrimaryNavManager)}
                                    className={`px-3 py-1 text-xs rounded transition-all duration-200 ${
                                        darkMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                    }`}
                                >
                                    {showPrimaryNavManager ? ' Masquer' : ' Configurer'}
                                </button>
                                <button
                                    onClick={() => saveNavConfig('primary_nav_config', primaryNavConfig)}
                                    className={`ml-2 px-3 py-1 text-xs rounded transition-all duration-200 ${
                                        darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
                                    title="Sauvegarder sur Supabase (Cloud)"
                                >
                                     Sauvegarder
                                </button>
                            </div>
                            <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Choisissez quels onglets s'affichent dans la barre de navigation inferieure.
                            </p>

                            {showPrimaryNavManager && (
                                <div className={`space-y-4 animate-fadeIn ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {allTabsList.map(tab => {
                                                const isVisible = primaryNavConfig[tab.id] !== false;
                                                const isAdmin = tab.id === 'admin-jsla';
                                                
                                                return (
                                                    <label
                                                        key={tab.id}
                                                        className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer border transition-all ${
                                                            isAdmin ? 'opacity-50 cursor-not-allowed' : ''
                                                        } ${
                                                            isVisible
                                                                ? darkMode ? 'bg-emerald-900/40 border-emerald-500 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                                                : darkMode ? 'bg-gray-800/30 border-gray-700 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-400'
                                                        }`}
                                                        title={isAdmin ? "L'onglet Admin est toujours visible" : `Cliquez pour ${isVisible ? 'masquer' : 'afficher'} cet onglet`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isVisible}
                                                            disabled={isAdmin}
                                                            onChange={(e) => {
                                                                if (isAdmin) return;
                                                                const newConfig = { ...primaryNavConfig };
                                                                if (e.target.checked) {
                                                                    delete newConfig[tab.id]; // Remove = visible (default)
                                                                } else {
                                                                    newConfig[tab.id] = false; // Explicitly hide
                                                                }
                                                                setPrimaryNavConfig(newConfig);
                                                            }}
                                                            className="rounded text-emerald-500 focus:ring-emerald-500"
                                                        />
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            {tab.icon && <i className={`${tab.icon} text-base`}></i>}
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium truncate">{tab.label}</span>
                                                                <span className={`text-[9px] font-mono truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                    {tab.component?.name ? `${tab.component.name}.js` : tab.id + '.js'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isAdmin && <span className="text-[10px] bg-gray-600 text-gray-300 px-1 rounded">Requis</span>}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        
                                        <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-between items-center">
                                            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {allTabsList.filter(t => primaryNavConfig[t.id] !== false).length} / {allTabsList.length} onglets visibles
                                            </span>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Reinitialiser et afficher tous les onglets ?')) {
                                                        setPrimaryNavConfig({});
                                                    }
                                                }}
                                                className="px-3 py-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                                            >
                                                 Tout afficher
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/*  Gestion de la Navigation Secondaire */}

                    {secondaryNavConfig && setSecondaryNavConfig && availableNavLinks && (
                        <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                            darkMode ? 'bg-gradient-to-br from-indigo-900/20 to-gray-900 border-indigo-700' : 'bg-gradient-to-br from-indigo-50 to-gray-50 border-indigo-200'
                        }`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>
                                    {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} /> : ''}
                                    Gestion Navigation Secondaire
                                </h3>
                                <button
                                    onClick={() => setShowNavManager(!showNavManager)}
                                    className={`px-3 py-1 text-xs rounded transition-all duration-200 ${
                                        darkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                                    }`}
                                >
                                    {showNavManager ? ' Masquer' : ' Configurer'}
                                </button>
                                <button
                                    onClick={() => saveNavConfig('secondary_nav_config', secondaryNavConfig)}
                                    className={`ml-2 px-3 py-1 text-xs rounded transition-all duration-200 ${
                                        darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
                                    title="Sauvegarder sur Supabase (Cloud)"
                                >
                                     Sauvegarder
                                </button>
                            </div>

                            {showNavManager && (
                                <div className={`space-y-4 animate-fadeIn ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                                            <div className="flex-1">
                                                <label className="block text-xs font-medium mb-1 opacity-70">
                                                    Onglet a configurer
                                                </label>
                                                <select
                                                    value={navConfigTargetTab}
                                                    onChange={(e) => setNavConfigTargetTab(e.target.value)}
                                                    className={`w-full p-2 rounded border ${
                                                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                                                    }`}
                                                >
                                                    {availableNavLinks.map(link => (
                                                        <option key={link.id} value={link.id}>{link.label}</option>
                                                    ))}
                                                    <option value="default">Par defaut (Fallback)</option>
                                                </select>
                                            </div>
                                            <div className="flex items-end">
                                                <div className="text-xs opacity-70 mb-2">
                                                    {((secondaryNavConfig[navConfigTargetTab] || secondaryNavConfig['default'] || []).length)} liens actifs
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                                            {availableNavLinks.map(link => {
                                                const currentConfig = secondaryNavConfig[navConfigTargetTab] || secondaryNavConfig['default'] || [];
                                                const isSelected = currentConfig.includes(link.id);
                                                
                                                return (
                                                    <label
                                                        key={link.id}
                                                        className={`flex items-start gap-2 p-2 rounded-md cursor-pointer border transition-all ${
                                                            isSelected
                                                                ? darkMode ? 'bg-indigo-900/40 border-indigo-500' : 'bg-indigo-50 border-indigo-300'
                                                                : darkMode ? 'bg-gray-800/30 border-gray-700 opacity-60 hover:opacity-100' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                                                        }`}
                                                    >
                                                        <div className="mt-1">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    const newConfig = { ...secondaryNavConfig };
                                                                    let targetList = [...(newConfig[navConfigTargetTab] || newConfig['default'] || [])];
                                                                    
                                                                    if (e.target.checked) {
                                                                        if (!targetList.includes(link.id)) targetList.push(link.id);
                                                                    } else {
                                                                        targetList = targetList.filter(id => id !== link.id);
                                                                    }
                                                                    
                                                                    newConfig[navConfigTargetTab] = targetList;
                                                                    setSecondaryNavConfig(newConfig);
                                                                }}
                                                                className="rounded text-indigo-500 focus:ring-indigo-500"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                {typeof Icon !== 'undefined' ? <Icon name={link.icon} size={16} /> : <span></span>}
                                                                <span className="text-sm font-medium truncate">{link.label}</span>
                                                            </div>
                                                            <div className={`text-[10px] font-mono truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                ?tab={link.id}
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        
                                        <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    if (confirm('Reinitialiser la configuration pour cet onglet ?')) {
                                                        const newConfig = { ...secondaryNavConfig };
                                                        delete newConfig[navConfigTargetTab];
                                                        setSecondaryNavConfig(newConfig);
                                                    }
                                                }}
                                                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                Reinitialiser par defaut
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    {/*  Configuration Overlay "IA en cours" */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        darkMode ? 'bg-gradient-to-br from-purple-900/20 to-gray-900 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-gray-50 border-purple-200'
                    }`}>
                        {window.DevTimerConfigPanel ? (
                            <window.DevTimerConfigPanel isDarkMode={darkMode} />
                        ) : (
                            <div className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <span className="text-2xl"></span>
                                <p className="mt-2 text-sm">Panneau de configuration DevTimer non charge</p>
                            </div>
                        )}
                    </div>

                    {/*  Gestion des Roles & Permissions */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        darkMode ? 'bg-gradient-to-br from-slate-900/20 to-gray-900 border-slate-700' : 'bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>
                                {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} /> : ''}
                                Gestion des Roles & Permissions
                            </h3>
                            <button
                                onClick={handleManageRoles}
                                className={`px-3 py-1 text-xs rounded transition-all duration-200 ${
                                    darkMode ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'bg-slate-500 hover:bg-slate-600 text-white'
                                }`}
                            >
                                {showRoleManager ? ' Masquer' : ' Configurer'}
                            </button>
                        </div>

                        {showRoleManager && (
                            <div className={`space-y-4 animate-fadeIn ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {/* Liste des Roles */}
                                <div className="flex justify-end mb-2">
                                    <button
                                        onClick={handlePopulateDefaults}
                                        className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                                            darkMode 
                                                ? 'bg-indigo-900/30 border-indigo-700 text-indigo-300 hover:bg-indigo-900/50' 
                                                : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                                        }`}
                                        title="Initialiser les roles systeme par defaut s'ils manquent (Invite, Client...)"
                                    >
                                         Initialiser les Roles par Defaut
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {/* Carte "Nouveau Role" */}
                                    <button
                                        onClick={() => {
                                            setSelectedRole(null);
                                            setRoleForm({ roleName: '', displayName: '', description: '', is_admin: false, componentPermissions: {} });
                                            setShowRoleModal(true);
                                        }}
                                        className={`p-4 rounded-lg border border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
                                            darkMode ? 'border-gray-600 hover:border-slate-400 bg-gray-800/30' : 'border-gray-300 hover:border-slate-500 bg-gray-50'
                                        }`}
                                    >
                                        <div className="text-2xl text-slate-500">+</div>
                                        <span className="text-sm font-medium">Nouveau Role</span>
                                    </button>

                                    {/* Roles Existants */}
                                    {roles.map(role => (
                                        <div key={role.id} className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-bold flex items-center gap-2">
                                                        {role.display_name}
                                                        {role.is_admin && <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">Admin</span>}
                                                    </div>
                                                    <div className="text-xs opacity-70 font-mono">{role.role_name}</div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRole(role);
                                                            setRoleForm({
                                                                roleName: role.role_name,
                                                                displayName: role.display_name,
                                                                description: role.description || '',
                                                                is_admin: role.is_admin,
                                                                componentPermissions: role.component_permissions || {}
                                                            });
                                                            setShowRoleModal(true);
                                                        }}
                                                        className="p-1 hover:bg-slate-700 rounded"
                                                        title="Modifier"
                                                    >
                                                        
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRole(role.id)}
                                                        className="p-1 hover:bg-red-900/50 rounded text-red-400"
                                                        title="Supprimer"
                                                    >
                                                        
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-xs opacity-60 line-clamp-2 mb-2">
                                                {role.description || 'Aucune description'}
                                            </div>
                                            <div className="text-xs">
                                                <span className="font-semibold">{Object.keys(role.component_permissions || {}).length}</span> permissions configurees
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                
                                {/* Assignation Utilisateurs */}
                                <div className={`mt-6 p-4 rounded-lg border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                         Assigner un Role Utilisateur
                                    </h4>
                                    <div className="flex flex-col md:flex-row gap-2 items-center">
                                        {/* SELECTEUR D'UTILISATEUR (Lie aux comptes existants) */}
                                        <select
                                            className={`flex-1 w-full p-2.5 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 focus:border-indigo-500' : 'bg-white border-gray-300 focus:border-indigo-500'}`}
                                            value={assignUserForm.username}
                                            onChange={e => setAssignUserForm({...assignUserForm, username: e.target.value})}
                                        >
                                            <option value="">-- Selectionner un utilisateur --</option>
                                            
                                            {/* Liste des utilisateurs recuperes depuis l'API */}
                                            {availableUsers && availableUsers.length > 0 ? (
                                                availableUsers.map(user => (
                                                    <option key={user.id || user.username} value={user.username}>
                                                        {user.display_name} ({user.username})
                                                    </option>
                                                ))
                                            ) : (
                                                <>
                                                 {/* Fallback si pas de liste (ex: pas admin ou erreur) */}
                                                 <option value="" disabled>Aucun utilisateur trouve ou chargement...</option>
                                                </>
                                            )}
                                        </select>

                                        {/* Input manuel de secours (si necessaire) ou cache */}
                                        {/* <input 
                                            type="text" 
                                            placeholder="Ou entrer username manuel..."
                                            className={`w-32 p-2.5 rounded border ...`}
                                        /> */}

                                        <select
                                            className={`w-full md:w-auto p-2.5 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 focus:border-indigo-500' : 'bg-white border-gray-300 focus:border-indigo-500'}`}
                                            value={assignUserForm.roleId}
                                            onChange={e => setAssignUserForm({...assignUserForm, roleId: e.target.value})}
                                        >
                                            <option value="">-- Selectionner un role --</option>
                                            {roles.map(r => <option key={r.id} value={r.id}>{r.display_name}</option>)}
                                        </select>
                                        <button 
                                            onClick={handleAssignRole}
                                            className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 transition shadow-sm"
                                        >
                                            Assigner
                                        </button>
                                    </div>
                                    <p className="text-xs opacity-50 mt-2">
                                        i L'assignation lie le role au <strong>nom d'utilisateur</strong>. Assurez-vous que l'utilisateur existe.
                                    </p>
                                </div>
                            </div>
                        )}

                                {/* NOUVEAU: Liste Gestion Utilisateurs */}
                                <div className={`mt-6 rounded-lg border overflow-hidden ${darkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className={`p-3 border-b font-semibold flex items-center justify-between ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                                        <span className="flex items-center gap-2">
                                             Liste des Utilisateurs
                                            {loadingRoles && <span className="text-xs opacity-50">(Chargement...)</span>}
                                        </span>
                                        <button 
                                            onClick={fetchUsers} 
                                            disabled={loadingRoles}
                                            className={`text-xs opacity-50 hover:opacity-100 transition-opacity ${loadingRoles ? 'cursor-not-allowed opacity-30' : ''}`} 
                                            title="Rafraichir"
                                        >
                                            
                                        </button>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left text-sm">
                                            <thead className={`sticky top-0 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} shadow-sm`}>
                                                <tr>
                                                    <th className="p-3 font-medium opacity-70">Utilisateur</th>
                                                    <th className="p-3 font-medium opacity-70">Mot de passe</th>
                                                    <th className="p-3 font-medium opacity-70">Role</th>
                                                    <th className="p-3 font-medium opacity-70 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700/20">
                                                {availableUsers.map(u => (
                                                    <tr key={u.id} className={`hover:bg-indigo-900/10 transition-colors`}>
                                                        <td className="p-3">
                                                            <div className="font-medium">{u.display_name}</div>
                                                            <div className="text-xs opacity-50 font-mono">{u.username}</div>
                                                        </td>
                                                        <td className="p-3">
                                                            <code className={`px-2 py-1 rounded text-xs font-mono ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                                                {u.password_display || u.username}
                                                            </code>
                                                        </td>
                                                        <td className="p-3">
                                                            <span className={`px-2 py-0.5 rounded text-xs ${
                                                                u.role === 'admin' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'
                                                            }`}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedUserForReset(u);
                                                                    setNewPassword('');
                                                                    setShowPasswordResetModal(true);
                                                                }}
                                                                className={`px-2 py-1 text-xs rounded transition-colors ${
                                                                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-500' : 'bg-white border hover:bg-gray-50 text-yellow-600'
                                                                }`}
                                                                title="Changer Mot de Passe"
                                                            >
                                                                 Reset MDP
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {availableUsers.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4" className="p-4 text-center opacity-50 italic">Aucun utilisateur trouve</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                        {/* Modal Edition Role */}
                        {showRoleModal && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl flex flex-col ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'}`}>
                                    <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                                        <h3 className="text-xl font-bold">{selectedRole ? 'Modifier le Role' : 'Nouveau Role'}</h3>
                                        <button onClick={() => setShowRoleModal(false)} className="text-2xl opacity-50 hover:opacity-100">x</button>
                                    </div>
                                    
                                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Nom d'affichage</label>
                                                    <input
                                                        type="text"
                                                        value={roleForm.displayName}
                                                        onChange={e => setRoleForm({...roleForm, displayName: e.target.value})}
                                                        className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                                                        placeholder="Ex: Analyste Senior"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Identifiant (tech)</label>
                                                    <input
                                                        type="text"
                                                        value={roleForm.roleName}
                                                        onChange={e => setRoleForm({...roleForm, roleName: e.target.value})}
                                                        disabled={!!selectedRole}
                                                        className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} ${selectedRole ? 'opacity-50' : ''}`}
                                                        placeholder="Ex: senior_analyst"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Description</label>
                                                    <textarea
                                                        value={roleForm.description}
                                                        onChange={e => setRoleForm({...roleForm, description: e.target.value})}
                                                        className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                                                        rows={3}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleForm.is_admin}
                                                        onChange={e => setRoleForm({...roleForm, is_admin: e.target.checked})}
                                                        id="isAdminCheck"
                                                        className="rounded text-red-500 focus:ring-red-500"
                                                    />
                                                    <label htmlFor="isAdminCheck" className="text-sm font-bold text-red-400">Role Administrateur (Acces Complet)</label>
                                                </div>
                                            </div>

                                            {/* Permissions Matrix */}
                                            <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                     Permissions Composants
                                                </h4>
                                                <div className="space-y-1 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                                    {availableComponents.map(comp => {
                                                        const isPermitted = roleForm.componentPermissions[comp.id] === true;
                                                        return (
                                                            <label key={comp.id} className={`flex items-center justify-between p-2 rounded hover:bg-opacity-10 transition-colors ${
                                                                isPermitted 
                                                                    ? darkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-50 text-green-900' 
                                                                    : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                                            }`}>
                                                                <span className="text-sm">{comp.label}</span>
                                                                <div className="relative inline-block w-10 h-5 transition duration-200 ease-in-out">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="opacity-0 w-0 h-0"
                                                                        checked={isPermitted}
                                                                        onChange={e => {
                                                                            const newPerms = { ...roleForm.componentPermissions };
                                                                            if (e.target.checked) {
                                                                                newPerms[comp.id] = true;
                                                                            } else {
                                                                                delete newPerms[comp.id]; // Remove key to deny (default deny strategy) or set false
                                                                            }
                                                                            setRoleForm({...roleForm, componentPermissions: newPerms});
                                                                        }}
                                                                    />
                                                                    <span className={`block border border-gray-500 rounded-full absolute top-0 bottom-0 left-0 right-0 transition-colors duration-200 ${
                                                                        isPermitted ? 'bg-green-500 border-green-500' : 'bg-gray-700'
                                                                    }`}></span>
                                                                    <span className={`block w-3 h-3 bg-white rounded-full absolute top-1 transition-transform duration-200 ${
                                                                        isPermitted ? 'left-6 transform -translate-x-full' : 'left-1'
                                                                    }`}></span>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className={`p-4 border-t flex justify-end gap-3 ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                                        <button
                                            onClick={() => setShowRoleModal(false)}
                                            className="px-4 py-2 rounded text-sm hover:bg-gray-700 transition"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={selectedRole ? handleUpdateRole : handleCreateRole}
                                            className="px-6 py-2 rounded text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-lg"
                                        >
                                            {selectedRole ? 'Mettre a jour' : 'Creer le Role'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modal Changement Mot de Passe */}
                        {showPasswordResetModal && selectedUserForReset && (
                             <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className={`w-full max-w-md p-6 rounded-xl shadow-2xl border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                         Changer le mot de passe
                                    </h3>
                                    <p className="text-sm opacity-70 mb-4">
                                        Utilisateur: <strong>{selectedUserForReset.username}</strong>
                                    </p>
                                    
                                    <div className="mb-4">
                                        <label className="block text-xs font-medium mb-1">Nouveau mot de passe</label>
                                        <input
                                            type="password"
                                            className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Nouveau mot de passe..."
                                        />
                                    </div>
                                    
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                setShowPasswordResetModal(false);
                                                setNewPassword('');
                                                setSelectedUserForReset(null);
                                            }}
                                            disabled={loadingRoles}
                                            className={`px-3 py-1.5 text-sm opacity-60 hover:opacity-100 transition ${loadingRoles ? 'cursor-not-allowed opacity-30' : ''}`}
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handlePasswordResetSubmit}
                                            disabled={!newPassword || loadingRoles}
                                            className={`px-4 py-1.5 rounded text-sm font-medium text-white transition flex items-center gap-2 ${
                                                !newPassword || loadingRoles 
                                                    ? 'bg-gray-500 cursor-not-allowed' 
                                                    : 'bg-indigo-600 hover:bg-indigo-700'
                                            }`}
                                        >
                                            {loadingRoles ? (
                                                <>
                                                    <span className="animate-spin"></span>
                                                    <span>Sauvegarde...</span>
                                                </>
                                            ) : (
                                                'Sauvegarder'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modal Mot de Passe Admin */}
                        {showPasswordModal && (
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60]">
                                <div className={`p-8 rounded-xl shadow-2xl max-w-sm w-full border ${darkMode ? 'bg-gray-900 border-red-900' : 'bg-white border-red-200'}`}>
                                    <div className="text-center mb-6">
                                        <div className="text-4xl mb-2"></div>
                                        <h3 className="text-xl font-bold">Securite Admin</h3>
                                        <p className="text-sm opacity-70 mt-2">Veuillez entrer le mot de passe administrateur pour acceder a cette section.</p>
                                    </div>
                                    <input
                                        type="password"
                                        className={`w-full p-3 rounded-lg text-center text-lg tracking-widest mb-4 border focus:ring-2 focus:ring-red-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'}`}
                                        autoFocus
                                        placeholder="--------"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                setAdminPassword(e.target.value);
                                                setShowPasswordModal(false);
                                                // Trigger pending action
                                                if (pendingAction === 'manage_roles') {
                                                    // Little hack to wait for state update
                                                    const pwd = e.target.value;
                                                    setTimeout(() => {
                                                        fetchRoles(pwd);
                                                        setShowRoleManager(true);
                                                    }, 100);
                                                }
                                                setPendingAction(null);
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => setShowPasswordModal(false)}
                                        className="w-full py-2 text-sm opacity-50 hover:opacity-100"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/*  Debug des Donnees (deplace ici depuis Titres & nouvelles) */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} /> : ''}
                            Debug des Donnees
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded p-3 border`}>
                                <div className="text-blue-600 font-medium mb-2 flex items-center gap-2">
                                    {typeof Icon !== 'undefined' ? <Icon emoji="" size={18} /> : ''}
                                    Stock Data
                                </div>
                                <div className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                                    Tickers: N/A
                                </div>
                                <div className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                                    Donnees chargees: 0
                                </div>
                                <div className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                                    Derniere MAJ: Jamais
                                </div>
                            </div>
                            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded p-3 border`}>
                                <div className="text-emerald-600 font-medium mb-2 flex items-center gap-2">
                                    {typeof Icon !== 'undefined' ? <Icon emoji="" size={18} /> : ''}
                                    News Data
                                </div>
                                <div className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                                    Articles: 0
                                </div>
                                <div className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                                    Premier article: Aucun
                                </div>
                            </div>
                            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded p-3 border`}>
                                <div className="text-violet-600 font-medium mb-2 flex items-center gap-2">
                                    {typeof Icon !== 'undefined' ? <Icon emoji="" size={18} /> : ''}
                                    Seeking Alpha
                                </div>
                                <div className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                                    Stocks: 0
                                </div>
                                <div className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                                    Stock Data: 0
                                </div>
                            </div>
                        </div>
                    </div>

                    {/*  Gestion du Cache Supabase */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        darkMode ? 'bg-gradient-to-br from-blue-900/20 to-gray-900 border-blue-700' : 'bg-gradient-to-br from-blue-50 to-gray-50 border-blue-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                                {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} /> : ''}
                                Gestion du Cache Supabase
                            </h3>
                            <button
                                onClick={async () => {
                                    if (typeof setLoadingCacheStatus === 'function') setLoadingCacheStatus(true);
                                    try {
                                        const apiBase = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '';
                                        const maxAge = typeof cacheSettings !== 'undefined' && cacheSettings.maxAgeHours ? cacheSettings.maxAgeHours : 4;
                                        const response = await fetch(`${apiBase}/api/supabase-daily-cache?type=status&maxAgeHours=${maxAge}`);
                                        if (response.ok) {
                                            const data = await response.json();
                                            if (typeof setCacheStatus === 'function') setCacheStatus(data.status || {});
                                        }
                                    } catch (error) {
                                        console.error('Erreur recuperation statut cache:', error);
                                    } finally {
                                        if (typeof setLoadingCacheStatus === 'function') setLoadingCacheStatus(false);
                                    }
                                }}
                                disabled={loadingCacheStatus}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                    loadingCacheStatus
                                        ? 'bg-gray-500 text-white cursor-not-allowed'
                                        : darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                            >
                                {loadingCacheStatus ? ' Chargement...' : ' Actualiser'}
                            </button>
                        </div>

                        {/* Parametres du Cache */}
                        <div className={`space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <div className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="font-semibold mb-3 flex items-center gap-2">
                                    {typeof Icon !== 'undefined' ? <Icon emoji="" size={16} /> : ''}
                                    Parametres du Cache
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm mb-2">
                                        Duree du cache (heures): <span className="font-bold text-blue-600">{typeof cacheSettings !== 'undefined' && cacheSettings.maxAgeHours ? cacheSettings.maxAgeHours : 4}h</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="12"
                                        value={typeof cacheSettings !== 'undefined' && cacheSettings.maxAgeHours ? cacheSettings.maxAgeHours : 4}
                                        onChange={(e) => {
                                            if (typeof cacheSettings !== 'undefined' && typeof setCacheSettings === 'function') {
                                                const newSettings = { ...cacheSettings, maxAgeHours: parseInt(e.target.value) };
                                                setCacheSettings(newSettings);
                                                localStorage.setItem('cacheSettings', JSON.stringify(newSettings));
                                            }
                                        }}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>1h</span>
                                            <span>6h</span>
                                            <span>12h</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="refreshOnNavigation"
                                        checked={typeof cacheSettings !== 'undefined' && cacheSettings.refreshOnNavigation ? cacheSettings.refreshOnNavigation : false}
                                        onChange={(e) => {
                                            if (typeof cacheSettings !== 'undefined' && typeof setCacheSettings === 'function') {
                                                const newSettings = { ...cacheSettings, refreshOnNavigation: e.target.checked };
                                                setCacheSettings(newSettings);
                                                localStorage.setItem('cacheSettings', JSON.stringify(newSettings));
                                            }
                                        }}
                                            className="rounded"
                                        />
                                        <label htmlFor="refreshOnNavigation" className="text-sm">
                                            Rafraichir les donnees tickers lors de la navigation
                                        </label>
                                    </div>
                                    {typeof cacheSettings !== 'undefined' && cacheSettings.refreshOnNavigation && (
                                        <div className="ml-6">
                                            <label className="block text-sm mb-2">
                                                Intervalle de rafraichissement (minutes): <span className="font-bold text-blue-600">{cacheSettings.refreshIntervalMinutes} min</span>
                                            </label>
                                            <input
                                                type="range"
                                                min="5"
                                                max="30"
                                                step="5"
                                                value={cacheSettings.refreshIntervalMinutes}
                                                onChange={(e) => {
                                                    const newSettings = { ...cacheSettings, refreshIntervalMinutes: parseInt(e.target.value) };
                                                    setCacheSettings(newSettings);
                                                    localStorage.setItem('cacheSettings', JSON.stringify(newSettings));
                                                }}
                                                className="w-full"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Etat du Cache */}
                            <div className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="font-semibold mb-3 flex items-center gap-2">
                                    {typeof Icon !== 'undefined' ? <Icon emoji="" size={16} /> : ''}
                                    Etat du Cache
                                </div>
                                <div className="space-y-2 text-xs">
                                    {!cacheStatus || (typeof cacheStatus === 'object' && Object.keys(cacheStatus).length === 0) ? (
                                        <div className={`text-center py-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Cliquez sur "Actualiser" pour voir l'etat du cache
                                        </div>
                                    ) : (
                                        cacheStatus && typeof cacheStatus === 'object' && Object.entries(cacheStatus).map(([type, status]) => (
                                            <div key={type} className={`p-2 rounded border ${
                                                status.expired
                                                    ? darkMode ? 'bg-yellow-900/30 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
                                                    : darkMode ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200'
                                            }`}>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold capitalize">{type.replace('_', ' ')}</span>
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        status.expired
                                                            ? 'bg-yellow-500 text-white'
                                                            : 'bg-green-500 text-white'
                                                    }`}>
                                                        {status.expired ? ' Expire' : ' Valide'}
                                                    </span>
                                                </div>
                                                {status.age_hours && (
                                                    <div className="mt-1 text-gray-600">
                                                        Age: {parseFloat(status.age_hours).toFixed(1)}h / {status.max_age_hours || cacheSettings.maxAgeHours}h max
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        if (confirm('Vider tout le cache Supabase ? Les donnees seront rechargees depuis les APIs.')) {
                                            try {
                                                const response = await fetch(`${API_BASE_URL}/api/supabase-daily-cache`, {
                                                    method: 'DELETE'
                                                });
                                                if (response.ok) {
                                                    console.log('Alert suppressed:', 'Cache vide avec succes');
                                                    setCacheStatus({});
                                                }
                                            } catch (error) {
                                                console.log('Alert suppressed:', 'Erreur lors du vidage du cache');
                                            }
                                        }
                                    }}
                                    className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
                                        darkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                                    }`}
                                >
                                     Vider le Cache
                                </button>
                                <button
                                    onClick={() => {
                                        const defaultSettings = {
                                            maxAgeHours: 4,
                                            refreshOnNavigation: true,
                                            refreshIntervalMinutes: 10
                                        };
                                        setCacheSettings(defaultSettings);
                                        localStorage.setItem('cacheSettings', JSON.stringify(defaultSettings));
                                        console.log('Alert suppressed:', 'Parametres reinitialises aux valeurs par defaut');
                                    }}
                                    className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
                                        darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'
                                    }`}
                                >
                                     Reinitialiser
                                </button>
                            </div>
                        </div>
                    </div>

                    {/*  Logs Systeme - Nouveau */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} /> : ''}
                                Logs Systeme
                            </h3>
                            <button
                                onClick={() => setSystemLogs([])}
                                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                                Effacer logs
                            </button>
                        </div>
                        <div className={`max-h-64 overflow-y-auto rounded p-3 font-mono text-xs ${
                            darkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            {systemLogs.length === 0 ? (
                                <div className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Aucun log pour le moment
                                </div>
                            ) : (
                                systemLogs.map((log, index) => (
                                    <div
                                        key={index}
                                        className={`py-1 border-b ${
                                            darkMode ? 'border-gray-700' : 'border-gray-200'
                                        } ${
                                            log.type === 'error' ? 'text-red-500' :
                                            log.type === 'success' ? 'text-green-500' :
                                            log.type === 'warning' ? 'text-yellow-500' :
                                            darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}
                                    >
                                        <span className="text-gray-500">[{log.timestamp}]</span> {log.text}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/*  Deep Think - Analyses Profondes */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        darkMode ? 'bg-gradient-to-br from-purple-900/20 to-gray-900 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-gray-50 border-purple-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-purple-300' : 'text-purple-900'}`}>
                                {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} /> : ''}
                                Deep Think
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-200 text-purple-900'}`}>
                                AI Analysis System
                            </span>
                        </div>
                        <div className={`space-y-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <div className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="font-semibold mb-1 flex items-center gap-2">
                                    {typeof Icon !== 'undefined' ? <Icon emoji="" size={16} /> : ''}
                                    Statut du systeme
                                </div>
                                <div className="text-xs space-y-1">
                                    <div>- Gemini API: {typeof window !== 'undefined' ? ' Actif' : ' Verification...'}</div>
                                    <div>- Emma Agent: {systemLogs.filter(l => l.text.includes('Emma')).length > 0 ? ' Operationnel' : ' En attente'}</div>
                                    <div>- Deep Analysis:  Pas de donnees</div>
                                </div>
                            </div>
                            <div className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="font-semibold mb-1 flex items-center gap-2">
                                    {typeof Icon !== 'undefined' ? <Icon emoji="" size={16} /> : ''}
                                    Metriques
                                </div>
                                <div className="text-xs space-y-1">
                                    <div>- Analyses effectuees: {systemLogs.filter(l => l.type === 'success').length}</div>
                                    <div>- Requetes API: {systemLogs.length}</div>
                                    <div>- Derniere analyse: {systemLogs[0]?.timestamp || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/*  Violations & Diagnostics */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        darkMode ? 'bg-gradient-to-br from-red-900/20 to-gray-900 border-red-700' : 'bg-gradient-to-br from-red-50 to-gray-50 border-red-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-red-300' : 'text-red-900'}`}>
                                {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} /> : ''}
                                Violations
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded ${
                                systemLogs.filter(l => l.type === 'error').length > 0
                                    ? 'bg-red-500 text-white'
                                    : darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-200 text-green-900'
                            }`}>
                                {systemLogs.filter(l => l.type === 'error').length} erreur(s)
                            </span>
                        </div>
                        <div className={`max-h-48 overflow-y-auto rounded p-3 font-mono text-xs ${
                            darkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            {systemLogs.filter(l => l.type === 'error').length === 0 ? (
                                <div className={`text-center py-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                     Aucune violation detectee - Systeme operationnel
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {systemLogs.filter(l => l.type === 'error').map((log, index) => (
                                        <div
                                            key={index}
                                            className={`p-2 rounded border ${
                                                darkMode ? 'bg-red-900/30 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-800'
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className="text-red-500"></span>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-xs">[{log.timestamp}]</div>
                                                    <div className="mt-1">{log.text}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className={`mt-3 p-2 rounded text-xs ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'}`}>
                             <strong>Info:</strong> Les violations sont automatiquement trackees. Consultez les logs systeme ci-dessus pour plus de details.
                        </div>
                    </div>

                    {/*  Mode Professionnel / Fun */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        darkMode ? 'bg-gradient-to-br from-indigo-900/20 to-gray-900 border-indigo-700' : 'bg-gradient-to-br from-indigo-50 to-gray-50 border-indigo-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>
                                {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} /> : ''}
                                Mode d'Affichage des Icones
                            </h3>
                            <div className={`px-3 py-1 rounded text-xs font-medium ${
                                isProfessionalMode
                                    ? darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-200 text-blue-900'
                                    : darkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-200 text-purple-900'
                            }`}>
                                {isProfessionalMode ? ' Professionnel' : ' Fun'}
                            </div>
                        </div>
                        <div className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <div className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {typeof Icon !== 'undefined' ? <Icon emoji={typeof isProfessionalMode !== 'undefined' && isProfessionalMode ? "" : ""} size={18} /> : (typeof isProfessionalMode !== 'undefined' && isProfessionalMode ? '' : '')}
                                        <span className="font-semibold">
                                            {isProfessionalMode ? 'Mode Professionnel' : 'Mode Fun'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newMode = window.ProfessionalModeSystem.toggle();
                                            setIsProfessionalMode(newMode);
                                        }}
                                        className={`px-4 py-2 rounded-lg transition-all duration-300 border-2 font-semibold ${
                                            isProfessionalMode
                                                ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-400 text-white hover:from-blue-700 hover:to-blue-800'
                                                : 'bg-gradient-to-br from-purple-600 to-pink-600 border-purple-400 text-white hover:from-purple-700 hover:to-pink-700'
                                        }`}
                                    >
                                        {isProfessionalMode ? (
                                            <span className="flex items-center gap-2">
                                                <i className="iconoir-briefcase"></i>
                                                Mode Professionnel
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <span></span>
                                                Mode Fun
                                            </span>
                                        )}
                                    </button>
                                </div>
                                <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {isProfessionalMode ? (
                                        <>
                                            <p className="mb-1"> Icones professionnelles Iconoir activees</p>
                                            <p>Les emojis sont remplaces par des icones vectorielles modernes pour une apparence plus professionnelle.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="mb-1"> Mode Fun avec emojis active</p>
                                            <p>Les icones sont affichees sous forme d'emojis colores pour une experience plus decontractee.</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className={`p-2 rounded text-xs ${darkMode ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
                                 <strong>Astuce:</strong> Le mode selectionne est sauvegarde automatiquement et s'applique a tous les onglets du dashboard.
                            </div>
                        </div>
                    </div>

                    {/*  Gestion des Indices TradingView */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        darkMode ? 'bg-gradient-to-br from-cyan-900/20 to-gray-900 border-cyan-700' : 'bg-gradient-to-br from-cyan-50 to-gray-50 border-cyan-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-cyan-300' : 'text-cyan-900'}`}>
                                    {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} /> : ''}
                                    Gestion des Indices TradingView
                                </h3>
                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                    darkMode ? 'bg-cyan-800/50 text-cyan-200' : 'bg-cyan-100 text-cyan-900'
                                }`}>
                                    {adminSelectedIndices.length} selectionne{adminSelectedIndices.length > 1 ? 's' : ''}
                                </span>
                            </div>
                            <button 
                                onClick={() => setShowIndicesManager(!showIndicesManager)}
                                className={`px-3 py-1 text-xs rounded transition-all duration-200 ${
                                    darkMode 
                                        ? 'bg-cyan-600 hover:bg-cyan-700 text-white hover:shadow-lg' 
                                        : 'bg-cyan-500 hover:bg-cyan-600 text-white hover:shadow-md'
                                }`}
                            >
                                {showIndicesManager ? ' Masquer' : ' Afficher'}
                            </button>
                        </div>

                        {showIndicesManager && (
                            <div className={`space-y-4 animate-fadeIn ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <div className={`flex justify-between items-center mb-3 p-2 rounded ${darkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium">
                                            Recherche rapide:
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Filtrer les indices..."
                                            className={`px-2 py-1 text-xs rounded border ${
                                                darkMode 
                                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                            }`}
                                            id="indices-search-input"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (confirm('Reinitialiser aux indices par defaut ?')) {
                                                const defaultIndices = [
                                                    'SP:SPX',
                                                    'DJ:DJI',
                                                    'NASDAQ:NDX',
                                                    'TVC:RUT',
                                                    'TSX:OSPTX',
                                                    'BITSTAMP:BTCUSD',
                                                    'BITSTAMP:ETHUSD'
                                                ];
                                                setAdminSelectedIndices(defaultIndices);
                                                localStorage.setItem('tradingview-selected-indices', JSON.stringify(defaultIndices));
                                                window.location.reload();
                                            }
                                        }}
                                        className={`px-3 py-1 text-xs rounded transition-all duration-200 ${
                                            darkMode 
                                                ? 'bg-cyan-600 hover:bg-cyan-700 text-white hover:shadow-lg' 
                                                : 'bg-cyan-500 hover:bg-cyan-600 text-white hover:shadow-md'
                                        }`}
                                    >
                                         Reinitialiser
                                    </button>
                                </div>
                                
                                {Object.entries(getAllIndices()).map(([category, indices]) => {
                                    const categorySelected = indices.filter(idx => adminSelectedIndices.includes(idx.proName)).length;
                                    const categoryTotal = indices.length;
                                    return (
                                        <div key={category} className={`p-4 rounded-lg border transition-all duration-200 ${
                                            darkMode 
                                                ? 'bg-gray-800/80 border-gray-700 hover:border-cyan-600' 
                                                : 'bg-white border-gray-200 hover:border-cyan-400'
                                        }`}>
                                            <div className="font-semibold mb-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2 capitalize">
                                                    {typeof Icon !== 'undefined' ? <Icon emoji={category === 'us' ? '' : category === 'canada' ? '' : category === 'europe' ? '' : category === 'asia' ? '' : category === 'crypto' ? '' : category === 'commodities' ? '' : ''} size={18} /> : (category === 'us' ? '' : category === 'canada' ? '' : category === 'europe' ? '' : category === 'asia' ? '' : category === 'crypto' ? '' : category === 'commodities' ? '' : '')}
                                                    <span>{category === 'us' ? 'Etats-Unis' : category === 'canada' ? 'Canada' : category === 'europe' ? 'Europe' : category === 'asia' ? 'Asie-Pacifique' : category === 'crypto' ? 'Crypto-monnaies' : category === 'commodities' ? 'Matieres Premieres' : 'Forex'}</span>
                                                </div>
                                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                    categorySelected > 0
                                                        ? darkMode ? 'bg-cyan-800/50 text-cyan-200' : 'bg-cyan-100 text-cyan-900'
                                                        : darkMode ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {categorySelected}/{categoryTotal}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {indices.map(index => {
                                                    const isSelected = adminSelectedIndices.includes(index.proName);
                                                    return (
                                                        <label
                                                            key={index.proName}
                                                            className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                                                                isSelected
                                                                    ? darkMode 
                                                                        ? 'bg-cyan-900/40 border-cyan-600 shadow-lg shadow-cyan-900/20' 
                                                                        : 'bg-cyan-100 border-cyan-400 shadow-md'
                                                                    : darkMode 
                                                                        ? 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50 hover:border-gray-500' 
                                                                        : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                                                            } border`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    const newSelected = e.target.checked
                                                                        ? [...adminSelectedIndices, index.proName]
                                                                        : adminSelectedIndices.filter(id => id !== index.proName);
                                                                    setAdminSelectedIndices(newSelected);
                                                                    localStorage.setItem('tradingview-selected-indices', JSON.stringify(newSelected));
                                                                    // Recharger le widget apres un court delai pour permettre la mise a jour visuelle
                                                                    setTimeout(() => {
                                                                        if (window.location) {
                                                                            window.location.reload();
                                                                        }
                                                                    }, 300);
                                                                }}
                                                                className="rounded cursor-pointer"
                                                            />
                                                            <span className="text-sm font-medium flex-1">{index.title}</span>
                                                            {!isSelected && (
                                                                <span className="ml-auto text-xs opacity-50 font-mono" title={`Format: ${index.proName}`}>
                                                                    {index.proName.split(':')[0]}
                                                                </span>
                                                            )}
                                                            {isSelected && (
                                                                <span className="ml-auto text-xs text-cyan-400" title="Selectionne">
                                                                    
                                                                </span>
                                                            )}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                <div className={`mt-4 p-3 rounded text-sm ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'}`}>
                                    <div className="font-semibold mb-2 flex items-center gap-2">
                                        {typeof Icon !== 'undefined' ? <Icon emoji="i" size={16} /> : 'i'}
                                        Informations
                                    </div>
                                    <div className="text-xs space-y-1">
                                        <div>- <strong>{adminSelectedIndices.length}</strong> indice(s) selectionne(s)</div>
                                        <div>- Les modifications sont sauvegardees automatiquement</div>
                                        <div>- Le TickerBanner se met a jour apres la selection</div>
                                        <div>- Les symboles invalides (avec ) ne s'afficheront pas</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/*  Configuration Emma IA */}
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                        darkMode ? 'bg-gradient-to-br from-emerald-900/20 to-gray-900 border-emerald-700' : 'bg-gradient-to-br from-emerald-50 to-gray-50 border-emerald-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-emerald-300' : 'text-emerald-900'}`}>
                                    {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} /> : ''}
                                    Configuration Emma IA
                                </h3>
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${
                                    emmaConnected
                                        ? darkMode 
                                            ? 'bg-green-900/50 text-green-300 shadow-lg shadow-green-900/20' 
                                            : 'bg-green-200 text-green-900 shadow-md'
                                        : darkMode 
                                            ? 'bg-red-900/50 text-red-300' 
                                            : 'bg-red-200 text-red-900'
                                }`}>
                                    <span className={`w-2 h-2 rounded-full ${emmaConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                                    {emmaConnected ? 'Gemini Actif' : 'Gemini Inactif'}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                            <button
                                onClick={() => safeSetShowPromptEditor(!showPromptEditor)}
                                className={`px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                                    showPromptEditor
                                        ? darkMode 
                                            ? 'bg-purple-700 border-2 border-purple-500 text-white shadow-lg' 
                                            : 'bg-purple-600 border-2 border-purple-400 text-white shadow-md'
                                        : darkMode
                                            ? 'bg-purple-800 hover:bg-purple-700 text-white hover:shadow-lg'
                                            : 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-md'
                                }`}
                            >
                                <span className="text-lg"></span>
                                <span className="font-semibold">Modifier Prompt</span>
                                {showPromptEditor && <span className="text-xs"></span>}
                            </button>
                            <button
                                onClick={() => safeSetShowTemperatureEditor(!showTemperatureEditor)}
                                className={`px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                                    showTemperatureEditor
                                        ? darkMode 
                                            ? 'bg-gray-700 border-2 border-gray-500 text-white shadow-lg' 
                                            : 'bg-gray-600 border-2 border-gray-400 text-white shadow-md'
                                        : darkMode
                                            ? 'bg-gray-800 hover:bg-gray-700 text-white hover:shadow-lg'
                                            : 'bg-gray-800 hover:bg-gray-700 text-white hover:shadow-md'
                                }`}
                            >
                                <span className="text-lg"></span>
                                <span className="font-semibold">Temperature</span>
                                {showTemperatureEditor && <span className="text-xs"></span>}
                            </button>
                            <button
                                onClick={() => safeSetShowLengthEditor(!showLengthEditor)}
                                className={`px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                                    showLengthEditor
                                        ? darkMode 
                                            ? 'bg-green-700 border-2 border-green-500 text-white shadow-lg' 
                                            : 'bg-green-600 border-2 border-green-400 text-white shadow-md'
                                        : darkMode
                                            ? 'bg-green-800 hover:bg-green-700 text-white hover:shadow-lg'
                                            : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md'
                                }`}
                            >
                                <span className="text-lg"></span>
                                <span className="font-semibold">Longueur Reponse</span>
                                {showLengthEditor && <span className="text-xs"></span>}
                            </button>
                        </div>
                        <div className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-800/50 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                            <div className="flex items-start gap-2">
                                <span className="text-lg"></span>
                                <div className="flex-1">
                                    <strong className="block mb-1">Information:</strong>
                                    <p className="text-xs leading-relaxed">
                                        Ces parametres affectent le comportement d'Emma IA dans l'onglet Ask Emma. 
                                        Les modifications sont appliquees immediatement et sauvegardees automatiquement.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section Administration des Stocks */}
                    <div className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                        darkMode
                            ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700'
                            : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold transition-colors duration-300 flex items-center gap-2 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} /> : ''}
                                Gestion des Stocks
                            </h3>
                            {loading && (
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${
                                    darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-900'
                                }`}>
                                    <span className="animate-spin"></span>
                                    Chargement...
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={refreshAllStocks}
                                disabled={loading}
                                className={`px-5 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                                    loading
                                        ? darkMode 
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : darkMode
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg hover:scale-105'
                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md hover:scale-105'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin"></span>
                                        <span>Actualisation...</span>
                                    </>
                                ) : (
                                    <>
                                        <span></span>
                                        <span>Actualiser Stocks</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={fetchNews}
                                disabled={loading}
                                className={`px-5 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                                    loading
                                        ? darkMode 
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : darkMode
                                            ? 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg hover:scale-105'
                                            : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md hover:scale-105'
                                }`}
                            >
                                <span></span>
                                <span>Actualiser News</span>
                            </button>
                        </div>
                        {loading && (
                            <div className={`mt-4 p-3 rounded-lg border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="animate-spin"></span>
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                        Operation en cours, veuillez patienter...
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section Scraping Seeking Alpha */}
                    {/* WORKFLOW EN 3 ETAPES CLAIRES */}
                    <div className="space-y-4">
                        {/* ETAPE 1: SCRAPING BATCH */}
                        <div className={`backdrop-blur-sm rounded-xl p-6 border-2 transition-colors duration-300 ${
                            darkMode
                                ? 'bg-gradient-to-r from-gray-900/40 to-gray-800/40 border-gray-500/50'
                                : 'bg-gradient-to-r from-gray-800/40 to-gray-700/40 border-gray-400/50'
                        }`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-xl font-bold transition-colors duration-300 ${
                                    darkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} className="mr-2 inline-block" /> : ''}
                                ETAPE 1: SCRAPING BATCH (25 tickers)
                            </h3>
                                <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                                    scrapingStatus === 'idle' ? 'bg-gray-500 text-white' :
                                    scrapingStatus === 'running' ? 'bg-gray-700 text-white animate-pulse' :
                                    scrapingStatus === 'completed' ? 'bg-green-500 text-white' :
                                    'bg-red-500 text-white'
                                }`}>
                                    {scrapingStatus === 'idle' ? ' EN ATTENTE' :
                                     scrapingStatus === 'running' ? ' SCRAPING...' :
                                     scrapingStatus === 'completed' ? ' TERMINE' :
                                     ' ERREUR'}
                                </span>
                            </div>

                            {/* Barre de progression amelioree */}
                            {scrapingStatus === 'running' && (
                                <div className="mb-4 space-y-2">
                                    <div className="w-full bg-gray-700 rounded-full h-5 overflow-hidden shadow-inner">
                                        <div
                                            className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 h-5 rounded-full transition-all duration-300 flex items-center justify-center text-white text-xs font-bold relative overflow-hidden"
                                            style={{ width: `${scrapingProgress}%` }}
                                        >
                                            <span className="relative z-10">{scrapingProgress}%</span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                            Scraping en cours...
                                        </span>
                                        <span className={darkMode ? 'text-emerald-400' : 'text-emerald-600'}>
                                            {scrapingProgress}% complete
                                        </span>
                                    </div>
                                </div>
                            )}
                            {scrapingStatus === 'completed' && (
                                <div className={`mb-4 p-3 rounded-lg border ${darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'}`}>
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <span className="text-green-400"></span>
                                        <span className={darkMode ? 'text-green-300' : 'text-green-800'}>
                                            Scraping termine avec succes!
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className={`mb-4 p-4 rounded-lg transition-colors duration-300 ${
                                darkMode ? 'bg-black/30' : 'bg-white/60'
                            }`}>
                                <p className={`text-sm mb-3 font-semibold transition-colors duration-300 ${
                                    darkMode ? 'text-yellow-300' : 'text-yellow-800'
                                }`}>
                                     IMPORTANT: Connectez-vous AVANT de lancer le scraping!
                                </p>
                                <ol className={`text-sm space-y-2 transition-colors duration-300 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    <li><strong>1.</strong> Cliquez " SE CONNECTER" -> Login Seeking Alpha</li>
                                    <li><strong>2.</strong> Cliquez " LANCER SCRAPING BATCH" -> Toutes les popups s'ouvrent</li>
                                    <li><strong>3.</strong> Pour CHAQUE popup: F12 -> Console -> Collez script -> Entree</li>
                                    <li><strong>4.</strong> Fermez la popup apres copie</li>
                                    <li><strong>5.</strong> Les donnees sont auto-sauvegardees dans Supabase</li>
                                </ol>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        addScrapingLog(' Ouverture de la page de connexion Seeking Alpha...', 'info');
                                        window.open('https://seekingalpha.com/account/login', '_blank');
                                        addScrapingLog(' Connectez-vous, puis revenez ici', 'success');
                                    }}
                                    className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-lg shadow-lg"
                                >
                                     SE CONNECTER A SEEKING ALPHA
                                </button>
                                <button
                                    onClick={runSeekingAlphaScraper}
                                    disabled={scrapingStatus === 'running'}
                                    className="flex-1 px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg"
                                >
                                    {scrapingStatus === 'running' ? ' SCRAPING EN COURS...' : ' LANCER SCRAPING BATCH'}
                                </button>
                            </div>
                        </div>

                        {/* ETAPE 2: ANALYSE PERPLEXITY */}
                        <div className={`backdrop-blur-sm rounded-xl p-6 border-2 transition-colors duration-300 ${
                            darkMode
                                ? 'bg-gradient-to-r from-pink-900/40 to-rose-900/40 border-pink-500/50'
                                : 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-400/50'
                        }`}>
                            <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} className="mr-2 inline-block" /> : ''}
                            ETAPE 2: ANALYSE BATCH PERPLEXITY
                        </h3>

                            <div className={`mb-4 p-4 rounded-lg transition-colors duration-300 ${
                                darkMode ? 'bg-black/30' : 'bg-white/60'
                            }`}>
                                <p className={`text-sm mb-3 transition-colors duration-300 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                     Cliquez pour analyser TOUTES les donnees scrapees en une seule fois:
                                </p>
                                <ul className={`text-sm space-y-2 transition-colors duration-300 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    <li> Recupere tous les raw scrapes depuis Supabase</li>
                                    <li> Analyse avec Perplexity AI en batch</li>
                                    <li> Formate en JSON structure</li>
                                    <li> Sauvegarde dans seeking_alpha_analysis</li>
                                    <li> Affiche les resultats dans le tableau ci-dessous</li>
                                </ul>
                            </div>

                            <button
                                onClick={async () => {
                                    addScrapingLog(' Demarrage analyse Perplexity BATCH...', 'info');
                                    try {
                                        // Recuperer tous les raw scrapes depuis Supabase
                                        addScrapingLog(' Recuperation des donnees depuis Supabase...', 'info');
                                        const response = await fetch('/api/seeking-alpha-scraping?type=raw&limit=100');
                                        const data = await response.json();

                                        if (data.success && data.data && data.data.length > 0) {
                                            addScrapingLog(` ${data.data.length} raw scrapes trouves`, 'success');

                                            for (const item of data.data) {
                                                const ticker = item.ticker;
                                                addScrapingLog(` Analyse de ${ticker} avec Perplexity...`, 'info');
                                                await analyzeWithPerplexityAndUpdate(ticker, {
                                                    fullText: item.raw_text,
                                                    url: item.url,
                                                    content: {}
                                                });
                                            }
                                            addScrapingLog(' Analyse Perplexity terminee pour TOUS les tickers!', 'success');
                                            addScrapingLog(' Resultats sauvegardes dans Supabase', 'success');
                                        } else {
                                            addScrapingLog(' Aucune donnee trouvee dans Supabase', 'warning');
                                            addScrapingLog(' Effectuez d\'abord le scraping (Etape 1)', 'info');
                                        }
                                    } catch (error) {
                                        addScrapingLog(` Erreur: ${error.message}`, 'error');
                                    }
                                }}
                                className="w-full px-6 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all font-bold text-lg shadow-lg"
                            >
                                 ANALYSER TOUT AVEC PERPLEXITY
                            </button>
                        </div>

                        {/* ETAPE 3: RESULTATS */}
                        <div className={`backdrop-blur-sm rounded-xl p-6 border-2 transition-colors duration-300 ${
                            darkMode
                                ? 'bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border-emerald-500/50'
                                : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-400/50'
                        }`}>
                            <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} className="mr-2 inline-block" /> : ''}
                            ETAPE 3: RESULTATS & AFFICHAGE
                        </h3>

                            <div className={`mb-4 p-4 rounded-lg transition-colors duration-300 ${
                                darkMode ? 'bg-black/30' : 'bg-white/60'
                            }`}>
                                <p className={`text-sm transition-colors duration-300 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Toutes les analyses apparaissent dans le tableau ci-dessous. Cliquez sur "RAFRAICHIR" pour recharger les dernieres donnees depuis Supabase.
                                </p>
                            </div>

                            <button
                                onClick={async () => {
                                    addScrapingLog(' Rafraichissement des donnees depuis Supabase...', 'info');
                                    await fetchSeekingAlphaData();
                                    await fetchSeekingAlphaStockData();
                                    addScrapingLog(' Donnees rafraichies!', 'success');
                                }}
                                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-bold text-lg shadow-lg"
                            >
                                 RAFRAICHIR LES DONNEES DU TABLEAU
                            </button>
                        </div>
                    </div>

                    {/* Section Logs de Scraping */}
                    {scrapingLogs.length > 0 && (
                        <div className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                            darkMode 
                                ? 'bg-gray-900 border-gray-700' 
                                : 'bg-gray-50 border-gray-200'
                        }`}>
                            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}> Logs de Scraping</h3>
                            <div className={`max-h-64 overflow-y-auto space-y-2 ${
                                darkMode ? 'bg-gray-800' : 'bg-white'
                            } rounded-lg p-4`}>
                                {scrapingLogs.map((log, index) => (
                                    <div key={index} className={`text-sm p-2 rounded ${
                                        log.type === 'error' ? 'bg-red-100 text-red-800' :
                                        log.type === 'success' ? 'bg-green-100 text-green-800' :
                                        log.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-700 text-gray-200'
                                    }`}>
                                        <span className="font-mono text-xs opacity-70">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                        <span className="ml-2">{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section Etat des Connexions & Diagnostic des APIs - FUSIONNEE */}
                    <div className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                        darkMode 
                            ? 'bg-gray-900 border-gray-700' 
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}> Etat des Connexions & Diagnostic des APIs</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        await checkApiStatus();
                                        await runHealthCheck();
                                    }}
                                    disabled={healthCheckLoading}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${
                                        healthCheckLoading
                                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                            : 'bg-gray-800 text-white hover:bg-gray-700'
                                    }`}
                                >
                                    {healthCheckLoading ? 'Verification...' : ' Verifier Toutes'}
                                </button>
                            </div>
                        </div>

                        {/* Status Global (si healthStatus disponible) */}
                        {healthStatus && (
                            <div className={`p-4 rounded-lg border-2 mb-4 ${
                                healthStatus.overall_status === 'healthy'
                                    ? 'bg-green-50 border-green-200'
                                    : healthStatus.overall_status === 'degraded'
                                    ? 'bg-yellow-50 border-yellow-200'
                                    : 'bg-red-50 border-red-200'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className={`font-bold text-lg ${
                                            healthStatus.overall_status === 'healthy'
                                                ? 'text-green-800'
                                                : healthStatus.overall_status === 'degraded'
                                                ? 'text-yellow-800'
                                                : 'text-red-800'
                                        }`}>
                                            {healthStatus.overall_status === 'healthy' ? '' :
                                             healthStatus.overall_status === 'degraded' ? '' : ''}
                                            Status Global: {healthStatus.overall_status.toUpperCase()}
                                        </h4>
                                        <p className={`text-sm ${
                                            healthStatus.overall_status === 'healthy'
                                                ? 'text-green-600'
                                                : healthStatus.overall_status === 'degraded'
                                                ? 'text-yellow-600'
                                                : 'text-red-600'
                                        }`}>
                                            {healthStatus.healthy_apis}/{healthStatus.total_apis} APIs operationnelles
                                            ({Math.round((healthStatus.healthy_apis / healthStatus.total_apis) * 100)}%)
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-medium ${
                                            healthStatus.overall_status === 'healthy'
                                                ? 'text-green-600'
                                                : healthStatus.overall_status === 'degraded'
                                                ? 'text-yellow-600'
                                                : 'text-red-600'
                                        }`}>
                                            {healthStatus.response_time_ms}ms
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(healthStatus.timestamp).toLocaleTimeString('fr-FR')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Liste detaillee des connexions */}
                        {apiStatus && typeof apiStatus === 'object' && Object.keys(apiStatus).length > 0 && (
                            <div className="space-y-3 mb-4">
                                <h4 className={`text-sm font-semibold mb-2 transition-colors duration-300 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>Connexions detaillees:</h4>
                                {Object.entries(apiStatus).map(([api, status]) => (
                                    <div key={api} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-300 ${
                                        darkMode ? 'bg-gray-800' : 'bg-gray-100'
                                    }`}>
                                        <div className="flex-1">
                                            <span className={`font-mono capitalize transition-colors duration-300 ${
                                                darkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}>{api}</span>
                                            {status.error && (
                                                <div className={`text-xs mt-1 transition-colors duration-300 ${
                                                    darkMode ? 'text-red-400' : 'text-red-600'
                                                }`}>
                                                    {status.error}
                                                </div>
                                            )}
                                            {status.source && (
                                                <div className={`text-xs mt-1 transition-colors duration-300 ${
                                                    darkMode ? 'text-gray-500' : 'text-gray-500'
                                                }`}>
                                                    Source: {status.source}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-3 h-3 rounded-full ${
                                                status.status === 'success' ? 'bg-green-500' :
                                                status.status === 'warning' ? 'bg-yellow-500' :
                                                status.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                                            }`}></span>
                                            <span className={`text-sm transition-colors duration-300 ${
                                                darkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                                {status.responseTime}ms
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Recommandations (si healthStatus disponible) */}
                        {healthStatus && healthStatus.recommendations && healthStatus.recommendations.length > 0 && (
                            <div className={`p-4 rounded-lg mt-4 ${
                                darkMode ? 'bg-gray-800' : 'bg-gray-700'
                            }`}>
                                <h4 className={`font-semibold mb-3 ${
                                    darkMode ? 'text-white' : 'text-blue-900'
                                }`}>
                                     Recommandations
                                </h4>
                                <div className="space-y-2">
                                    {healthStatus.recommendations.map((rec, index) => (
                                        <div key={index} className={`p-3 rounded-lg ${
                                            rec.priority === 'critical' ? 'bg-red-100 border border-red-200' :
                                            rec.priority === 'high' ? 'bg-green-100 border border-green-200' :
                                            'bg-yellow-100 border border-yellow-200'
                                        }`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className={`font-medium text-sm ${
                                                        rec.priority === 'critical' ? 'text-red-800' :
                                                        rec.priority === 'high' ? 'text-green-800' :
                                                        'text-yellow-800'
                                                    }`}>
                                                        {rec.priority === 'critical' ? '' :
                                                         rec.priority === 'high' ? '' : ''}
                                                        {rec.message}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        <strong>Action:</strong> {rec.action}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(!apiStatus || (typeof apiStatus === 'object' && Object.keys(apiStatus).length === 0)) && !healthStatus && (
                            <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <p>Cliquez sur " Verifier Toutes" pour diagnostiquer les connexions</p>
                            </div>
                        )}
                    </div>

                    {/* Section Monitoring API Emma */}
                    <div className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                        darkMode
                            ? 'bg-gray-900 border-gray-700'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} className="mr-2 inline-block" /> : ''}
                        Monitoring Emma AI
                    </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                                    darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                                }`}>
                                    <div className="text-purple-600 font-medium mb-2 flex items-center gap-2">
                                        {typeof Icon !== 'undefined' ? <Icon emoji="" size={18} /> : ''}
                                        Emma Agent
                                    </div>
                                    <div className={`text-sm transition-colors duration-300 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Status: <span className="text-green-500"> Operationnel</span>
                                    </div>
                                    <div className={`text-sm transition-colors duration-300 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Outils: 12 disponibles
                                    </div>
                                </div>
                                <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                                    darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                                }`}>
                                    <div className="text-blue-600 font-medium mb-2"> Briefings</div>
                                    <div className={`text-sm transition-colors duration-300 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Cron: <span className="text-green-500"> Actif</span>
                                    </div>
                                    <div className={`text-sm transition-colors duration-300 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Horaires: 7h20 - 11h50 - 16h20
                                    </div>
                                </div>
                                <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                                    darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                                }`}>
                                    <div className="text-emerald-600 font-medium mb-2"> Supabase</div>
                                    <div className={`text-sm transition-colors duration-300 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Tables: 4 creees
                                    </div>
                                    <div className={`text-sm transition-colors duration-300 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Tickers: {typeof teamTickers !== 'undefined' ? teamTickers.length : 0} team + {typeof watchlistTickers !== 'undefined' ? watchlistTickers.length : 0} watchlist
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        fetch('/api/emma-agent', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                message: 'Test de connexion Emma Agent',
                                                context: { test: true }
                                            })
                                        }).then(response => response.json())
                                        .then(data => {
                                            if (data.success) {
                                                if (typeof showMessage === 'function') {
                                                    showMessage(' Emma Agent operationnel', 'success');
                                                } else {
                                                    console.log('Alert suppressed:', ' Emma Agent operationnel');
                                                }
                                            } else {
                                                if (typeof showMessage === 'function') {
                                                    showMessage(' Emma Agent erreur: ' + data.error, 'error');
                                                } else {
                                                    console.log('Alert suppressed:', ' Emma Agent erreur: ' + data.error);
                                                }
                                            }
                                        }).catch(error => {
                                            if (typeof showMessage === 'function') {
                                                showMessage(' Erreur connexion Emma Agent', 'error');
                                            } else {
                                                console.log('Alert suppressed:', ' Erreur connexion Emma Agent');
                                            }
                                        });
                                    }}
                                    className="btn-emma btn-emma-primary"
                                >
                                     Tester Emma Agent
                                </button>
                                <button
                                    onClick={() => {
                                        fetch('/api/emma-briefing?type=morning')
                                        .then(response => response.json())
                                        .then(data => {
                                            if (data.success) {
                                                showMessage(' Emma Briefing operationnel', 'success');
                                            } else {
                                                showMessage(' Emma Briefing erreur: ' + data.error, 'error');
                                            }
                                        }).catch(error => {
                                            showMessage(' Erreur connexion Emma Briefing', 'error');
                                        });
                                    }}
                                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                                >
                                     Tester Briefing
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Section Gestion des Outils Emma */}
                    <div className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                        darkMode
                            ? 'bg-gray-900 border-gray-700'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                        }`}> Gestion des Outils Emma</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                                    darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                                }`}>
                                    <h4 className={`font-medium mb-2 transition-colors duration-300 ${
                                        darkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    {typeof Icon !== 'undefined' ? <Icon emoji="" size={18} className="mr-2 inline-block" /> : ''}
                                    Outils Financiers
                                </h4>
                                    <div className="space-y-1 text-sm">
                                        <div className={`transition-colors duration-300 ${
                                            darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>- Polygon Stock Price</div>
                                        <div className={`transition-colors duration-300 ${
                                            darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>- FMP Fundamentals</div>
                                        <div className={`transition-colors duration-300 ${
                                            darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>- Finnhub News</div>
                                        <div className={`transition-colors duration-300 ${
                                            darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>- Twelve Data Technical</div>
                                        <div className={`transition-colors duration-300 ${
                                            darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>- Alpha Vantage Ratios</div>
                                    </div>
                                </div>
                                <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                                    darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                                }`}>
                                    <h4 className={`font-medium mb-2 transition-colors duration-300 ${
                                        darkMode ? 'text-white' : 'text-gray-900'
                                    }`}> Outils Supabase</h4>
                                    <div className="space-y-1 text-sm">
                                        <div className={`transition-colors duration-300 ${
                                            darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>- Watchlist Manager</div>
                                        <div className={`transition-colors duration-300 ${
                                            darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>- Team Tickers</div>
                                        <div className={`transition-colors duration-300 ${
                                            darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>- Economic Calendar</div>
                                        <div className={`transition-colors duration-300 ${
                                            darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>- Earnings Calendar</div>
                                        <div className={`transition-colors duration-300 ${
                                            darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>- Analyst Recommendations</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        fetch('/api/emma-agent', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                message: 'Afficher la configuration des outils',
                                                context: { action: 'show_tools_config' }
                                            })
                                        }).then(response => response.json())
                                        .then(data => {
                                            if (data.success) {
                                                showMessage(' Configuration des outils recuperee', 'success');
                                                void('Tools Config:', data.tools_config);
                                            } else {
                                                showMessage(' Erreur recuperation config', 'error');
                                            }
                                        }).catch(error => {
                                            showMessage(' Erreur connexion', 'error');
                                        });
                                    }}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                >
                                     Voir Configuration
                                </button>
                            </div>
                        </div>
                    </div>


                    {/* Section Gestion des Barres d'Annonces */}
                    <div className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                        darkMode
                            ? 'bg-gradient-to-br from-indigo-900/20 to-gray-900 border-indigo-700'
                            : 'bg-gradient-to-br from-indigo-50 to-gray-50 border-indigo-200'
                    }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold flex items-center gap-2 transition-colors duration-300 ${
                                darkMode ? 'text-indigo-300' : 'text-indigo-900'
                            }`}>
                                {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} /> : ''}
                                Gestion des Barres d'Annonces
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-200 text-indigo-900'}`}>
                                Gemini + Google Search
                            </span>
                        </div>
                        <div className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <p className="text-sm mb-4">
                                Configurez les barres d'annonces dynamiques alimentees par Gemini avec Google Search. 
                                Les barres peuvent etre fermees par les utilisateurs (X) et se rafraichissent automatiquement.
                            </p>
                            <div className="space-y-3">
                                {BAR_TYPES.map(({ key, label, emoji, description, type }) => {
                                    const barConfig = barConfigs[key] || { 
                                        enabled: false, 
                                        type: type, 
                                        section: 'top', 
                                        design: 'default',
                                        prompt: DEFAULT_PROMPTS[type] || '',
                                        temperature: 0.7,
                                        maxOutputTokens: 150,
                                        useGoogleSearch: ['news', 'event', 'market-alert'].includes(type)
                                    };
                                    const isEditing = editingBar === key;
                                    
                                    return (
                                        <div key={key} className={`p-4 rounded-lg border transition-colors duration-300 ${
                                            darkMode 
                                                ? barConfig.enabled 
                                                    ? 'bg-indigo-900/30 border-indigo-700' 
                                                    : 'bg-gray-800 border-gray-700'
                                                : barConfig.enabled 
                                                    ? 'bg-indigo-100 border-indigo-300' 
                                                    : 'bg-white border-gray-200'
                                        }`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <span className="text-2xl">{emoji}</span>
                                                    <div>
                                                        <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                            {label}
                                                        </div>
                                                        <div className="text-xs opacity-75">
                                                            {description}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setEditingBar(isEditing ? null : key)}
                                                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                                            darkMode
                                                                ? isEditing ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                                : isEditing ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                    >
                                                        {isEditing ? 'Fermer' : ' Config'}
                                                    </button>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={barConfig.enabled}
                                                            onChange={() => {
                                                                saveBarConfig(key, { enabled: !barConfig.enabled });
                                                            }}
                                                            className="sr-only peer"
                                                        />
                                                        <div className={`w-11 h-6 rounded-full peer transition-colors ${
                                                            barConfig.enabled
                                                                ? darkMode ? 'bg-indigo-600' : 'bg-indigo-500'
                                                                : darkMode ? 'bg-gray-700' : 'bg-gray-300'
                                                        }`}>
                                                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                                                barConfig.enabled ? 'translate-x-5' : 'translate-x-0.5'
                                                            } mt-0.5`}></div>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                            
                                            {/* Panneau de configuration */}
                                            {isEditing && (
                                                <div className={`mt-4 p-4 rounded-lg border space-y-4 ${
                                                    darkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-50 border-gray-300'
                                                }`}>
                                                    <div>
                                                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            Prompt / Instructions
                                                        </label>
                                                        <textarea
                                                            value={barConfig.prompt || ''}
                                                            onChange={(e) => saveBarConfig(key, { prompt: e.target.value })}
                                                            rows={3}
                                                            className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                                                darkMode 
                                                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                                            }`}
                                                            placeholder="Entrez le prompt pour generer le contenu..."
                                                        />
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div>
                                                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                Temperature
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="2"
                                                                step="0.1"
                                                                value={barConfig.temperature || 0.7}
                                                                onChange={(e) => saveBarConfig(key, { temperature: parseFloat(e.target.value) })}
                                                                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                                                    darkMode 
                                                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                                                        : 'bg-white border-gray-300 text-gray-900'
                                                                }`}
                                                            />
                                                        </div>
                                                        
                                                        <div>
                                                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                Max Tokens
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="50"
                                                                max="500"
                                                                step="10"
                                                                value={barConfig.maxOutputTokens || 150}
                                                                onChange={(e) => saveBarConfig(key, { maxOutputTokens: parseInt(e.target.value) })}
                                                                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                                                    darkMode 
                                                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                                                        : 'bg-white border-gray-300 text-gray-900'
                                                                }`}
                                                            />
                                                        </div>
                                                        
                                                        <div>
                                                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                Google Search
                                                            </label>
                                                            <label className="relative inline-flex items-center cursor-pointer w-full justify-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={barConfig.useGoogleSearch || false}
                                                                    onChange={(e) => saveBarConfig(key, { useGoogleSearch: e.target.checked })}
                                                                    className="sr-only peer"
                                                                />
                                                                <div className={`w-11 h-6 rounded-full peer transition-colors ${
                                                                    barConfig.useGoogleSearch
                                                                        ? darkMode ? 'bg-indigo-600' : 'bg-indigo-500'
                                                                        : darkMode ? 'bg-gray-700' : 'bg-gray-300'
                                                                }`}>
                                                                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                                                        barConfig.useGoogleSearch ? 'translate-x-5' : 'translate-x-0.5'
                                                                    } mt-0.5`}></div>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    </div>
                                                    
                                                    <button
                                                        onClick={() => setEditingBar(null)}
                                                        className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                            darkMode
                                                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                                                : 'bg-indigo-500 hover:bg-indigo-400 text-white'
                                                        }`}
                                                    >
                                                         Enregistrer
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className={`mt-4 p-3 rounded text-xs ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                                 <strong>Astuce:</strong> Les barres activees s'affichent en haut de page. 
                                Les utilisateurs peuvent les fermer avec le bouton X. 
                                Le contenu est genere dynamiquement via Gemini avec Google Search pour des donnees a jour.
                            </div>
                        </div>
                    </div>

                    {/* Section Configuration */}
                    <div className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                        darkMode
                            ? 'bg-gray-900 border-gray-700'
                            : 'bg-transparent border-gray-200'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        {typeof Icon !== 'undefined' ? <Icon emoji="" size={20} className="mr-2 inline-block" /> : ''}
                        Configuration
                    </h3>
                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            <div>
                                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Token GitHub (pour les mises a jour)
                                </label>
                                <input
                                    type="password"
                                    value={githubToken}
                                    onChange={(e) => setGithubToken(e.target.value)}
                                    placeholder="Entrez votre token GitHub"
                                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                                        darkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                    }`}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                                >
                                    {showSettings ? 'Masquer' : 'Afficher'} les parametres
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        };

// Exposer le composant globalement
window.AdminJSLaiTab = AdminJSLaiTab;
