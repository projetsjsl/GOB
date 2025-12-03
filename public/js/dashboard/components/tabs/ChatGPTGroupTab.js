/**
 * Component: ChatGPTGroupTab
 * Intégration complète du chat de groupe ChatGPT avec configuration avancée
 * 
 * Converti depuis TypeScript pour intégration dans app-inline.js
 * Source: codex/add-group-chat-tab-to-dashboard-s7z4sd
 */

const { useState, useEffect, useMemo } = React;

const ChatGPTGroupTab = ({ isDarkMode = true }) => {
    // ============================================
    // CONFIGURATION INITIALE
    // ============================================
    // Récupérer VITE_GROUP_CHAT_URL depuis l'environnement
    // Note: En Babel inline, on utilise une variable globale ou window
    const [envChatUrl, setEnvChatUrl] = useState('');
    const [envLoaded, setEnvLoaded] = useState(false);

    // Charger la variable d'environnement depuis l'API
    useEffect(() => {
        const loadEnvUrl = async () => {
            try {
                // Essayer d'abord window.importMetaEnv (si défini par script)
                if (typeof window !== 'undefined' && window.importMetaEnv && window.importMetaEnv.VITE_GROUP_CHAT_URL) {
                    const url = window.importMetaEnv.VITE_GROUP_CHAT_URL.trim();
                    setEnvChatUrl(url);
                    setEnvLoaded(true);
                    return;
                }

                // Essayer le meta tag
                const metaTag = document.querySelector('meta[name="vite-group-chat-url"]');
                if (metaTag && metaTag.getAttribute('content')) {
                    const url = metaTag.getAttribute('content').trim();
                    setEnvChatUrl(url);
                    setEnvLoaded(true);
                    return;
                }

                // Fallback: récupérer depuis l'API
                const response = await fetch('/api/groupchat-env');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.url) {
                        setEnvChatUrl(data.url.trim());
                        setEnvLoaded(true);
                    } else {
                        setEnvLoaded(true);
                    }
                } else {
                    setEnvLoaded(true);
                }
            } catch (error) {
                console.warn('⚠️ ChatGPTGroupTab: Impossible de charger VITE_GROUP_CHAT_URL', error);
                setEnvLoaded(true);
            }
        };

        loadEnvUrl();
    }, []);

    const PLACEHOLDER_CHAT_URL = 'https://chatgpt.com/gg/your-session-link?token=<token-partage>';
    const LOCAL_STORAGE_KEY = 'gob-group-chat-settings-v1';

    // ============================================
    // VALEURS PAR DÉFAUT
    // ============================================
    // Utiliser envChatUrl une fois chargé, sinon chaîne vide
    const getDefaultSettings = () => ({
        sessionUrl: envChatUrl || '',
        roomName: 'GOB x ChatGPT — Salon équipe',
        adminDisplayName: 'Admin GOB',
        welcomeMessage: "Bienvenue dans le salon d'équipe ! On synchronise ici toutes les décisions.",
        systemPrompt: "Tu agis comme facilitateur de chat de groupe : résume, attribue des tâches et garde le contexte clair.",
        defaultTone: 'Professionnel & bienveillant',
        temperature: 0.35,
        maxMessages: 500,
        allowGuests: true,
        autoJoin: true,
        pinnedResource: 'https://chat.openai.com',
        userAlias: 'Analyste GOB',
        userIcon: '🧠',
    });

    const defaultSettings = getDefaultSettings();

    const formatTemperature = (value) => Math.max(0, Math.min(1, Number(value) || 0));
    const iconChoices = ['🧠', '🦉', '💹', '📊', '🚀', '🛡️', '🎯', '🗝️'];

    // ============================================
    // ÉTATS REACT
    // ============================================
    // Mode de chat: 'shared' (partagé ChatGPT) ou 'integrated' (intégré avec API)
    const [chatMode, setChatMode] = useState(() => {
        try {
            const saved = localStorage.getItem('gob-chat-mode');
            return saved || 'shared'; // Par défaut: mode partagé
        } catch {
            return 'shared';
        }
    });
    
    const [settings, setSettings] = useState(defaultSettings);
    const [copied, setCopied] = useState(false);
    const [iframeError, setIframeError] = useState(null);
    const [cspBlocked, setCspBlocked] = useState(false);
    const [accessSafety, setAccessSafety] = useState('needs-token');
    const [sessionOrigin, setSessionOrigin] = useState('non configuré');
    
    // États pour le chat intégré
    const [integratedRoom, setIntegratedRoom] = useState(null);
    const [integratedMessages, setIntegratedMessages] = useState([]);
    const [integratedParticipants, setIntegratedParticipants] = useState([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [pollingInterval, setPollingInterval] = useState(null);
    
    // Contrôle des interventions LLM
    const [llmAutoReply, setLlmAutoReply] = useState(() => {
        try {
            const saved = localStorage.getItem('gob-llm-auto-reply');
            return saved === 'true';
        } catch {
            return false; // Par défaut: désactivé pour éviter de "pourrir" la conversation
        }
    });
    const [llmReplyOnMention, setLlmReplyOnMention] = useState(true); // Répondre si @chatgpt ou @assistant
    const [llmReplyOnQuestion, setLlmReplyOnQuestion] = useState(false); // Répondre automatiquement aux questions
    const [isCallingLlm, setIsCallingLlm] = useState(false);
    
    const hasEnvChatUrl = Boolean(envChatUrl);
    const isUsingEnvDefault = Boolean(envChatUrl) && settings.sessionUrl === envChatUrl;

    // ============================================
    // CHARGEMENT DES PARAMÈTRES SAUVEGARDÉS
    // ============================================
    useEffect(() => {
        if (!envLoaded) return; // Attendre que l'URL d'environnement soit chargée
        
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            const currentDefaultSettings = getDefaultSettings();
            
            if (saved) {
                const parsed = JSON.parse(saved);
                // Si l'URL d'environnement est disponible et qu'aucune URL n'est sauvegardée, l'utiliser
                const mergedSettings = {
                    ...currentDefaultSettings,
                    ...parsed,
                    // Si aucune URL sauvegardée et qu'on a une URL d'environnement, l'utiliser
                    sessionUrl: parsed.sessionUrl || envChatUrl || ''
                };
                setSettings(mergedSettings);
            } else if (envChatUrl) {
                // Si pas de sauvegarde mais qu'on a une URL d'environnement, l'utiliser
                setSettings({ ...currentDefaultSettings, sessionUrl: envChatUrl });
            } else {
                setSettings(currentDefaultSettings);
            }
        } catch (error) {
            console.warn('⚠️ ChatGPTGroupTab: Impossible de charger les paramètres du clavardage', error);
            setSettings(getDefaultSettings());
        }
    }, [envLoaded, envChatUrl]);

    // ============================================
    // SAUVEGARDE AUTOMATIQUE DES PARAMÈTRES
    // ============================================
    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.warn('⚠️ ChatGPTGroupTab: Impossible de sauvegarder les paramètres du clavardage', error);
        }
    }, [settings]);

    // ============================================
    // VALIDATION DE L'URL ET SÉCURITÉ
    // ============================================
    useEffect(() => {
        if (!settings.sessionUrl) {
            setAccessSafety('needs-token');
            setSessionOrigin('non configuré');
            return;
        }

        // Vérifier si l'URL contient un token pour l'accès automatique
        setAccessSafety(settings.sessionUrl.includes('token=') ? 'token' : 'needs-token');

        try {
            const url = new URL(settings.sessionUrl);
            setSessionOrigin(url.hostname);
        } catch (error) {
            console.warn('⚠️ ChatGPTGroupTab: URL de session invalide', error);
            setSessionOrigin('inconnue');
        }
    }, [settings.sessionUrl]);

    // ============================================
    // HANDLERS
    // ============================================
    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleCopyLink = async () => {
        if (!settings.sessionUrl) return;

        try {
            await navigator.clipboard.writeText(settings.sessionUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('❌ ChatGPTGroupTab: Impossible de copier le lien', error);
        }
    };

    const handleOpenChat = () => {
        if (!settings.sessionUrl) return;
        window.open(settings.sessionUrl, '_blank', 'noopener,noreferrer');
    };

    const handleReset = () => setSettings(defaultSettings);

    // ============================================
    // GESTION DU MODE DE CHAT
    // ============================================
    const handleModeChange = (mode) => {
        setChatMode(mode);
        try {
            localStorage.setItem('gob-chat-mode', mode);
        } catch (e) {
            console.warn('Impossible de sauvegarder le mode:', e);
        }
        
        // Si on passe en mode intégré et qu'on n'a pas de salon, en créer un
        if (mode === 'integrated' && !integratedRoom) {
            handleCreateIntegratedRoom();
        }
    };

    // ============================================
    // GESTION DU CHAT INTÉGRÉ
    // ============================================
    const handleCreateIntegratedRoom = async () => {
        try {
            setIsLoadingMessages(true);
            const response = await fetch('/api/groupchat/integrated/create-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomName: settings.roomName,
                    adminUserId: settings.userAlias || 'admin',
                    adminDisplayName: settings.adminDisplayName,
                    systemPrompt: settings.systemPrompt,
                    welcomeMessage: settings.welcomeMessage,
                    temperature: settings.temperature,
                    maxMessages: settings.maxMessages,
                    allowGuests: settings.allowGuests
                })
            });

            const data = await response.json();
            if (data.success && data.room) {
                setIntegratedRoom(data.room);
                // Charger les messages initiaux
                await loadIntegratedMessages(data.room.id);
                // Démarrer la synchronisation
                startPolling(data.room.id);
                // Mettre à jour la présence
                updatePresence(data.room.id);
            } else {
                console.error('Erreur création salon:', data.error);
                alert('Erreur création salon: ' + (data.error || 'Erreur inconnue'));
            }
        } catch (error) {
            console.error('Erreur création salon intégré:', error);
            alert('Erreur création salon: ' + error.message);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const loadIntegratedMessages = async (roomId) => {
        try {
            const response = await fetch(`/api/groupchat/integrated/get-messages?roomId=${roomId}&limit=100`);
            const data = await response.json();
            if (data.success && data.messages) {
                setIntegratedMessages(data.messages);
            }
        } catch (error) {
            console.error('Erreur chargement messages:', error);
        }
    };

    const loadIntegratedParticipants = async (roomId) => {
        try {
            const response = await fetch(`/api/groupchat/integrated/get-participants?roomId=${roomId}`);
            const data = await response.json();
            if (data.success && data.participants) {
                setIntegratedParticipants(data.participants);
            }
        } catch (error) {
            console.error('Erreur chargement participants:', error);
        }
    };

    const updatePresence = async (roomId) => {
        try {
            await fetch('/api/groupchat/integrated/update-presence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: roomId,
                    userId: settings.userAlias || 'user',
                    userDisplayName: settings.userAlias || settings.adminDisplayName,
                    userIcon: settings.userIcon,
                    isOnline: true
                })
            });
        } catch (error) {
            console.error('Erreur mise à jour présence:', error);
        }
    };

    const startPolling = (roomId) => {
        // Arrêter le polling existant
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }

        // Polling toutes les 2 secondes pour synchronisation live
        const interval = setInterval(async () => {
            await loadIntegratedMessages(roomId);
            await loadIntegratedParticipants(roomId);
            await updatePresence(roomId);
        }, 2000);

        setPollingInterval(interval);
    };

    // Détecter si le message contient une mention ou une question
    const shouldCallLlm = (message) => {
        const msg = message.toLowerCase().trim();
        
        // Mention explicite (@chatgpt, @assistant, etc.)
        if (llmReplyOnMention && (msg.includes('@chatgpt') || msg.includes('@assistant') || msg.includes('@ai'))) {
            return true;
        }
        
        // Question (se termine par ?)
        if (llmReplyOnQuestion && msg.endsWith('?')) {
            return true;
        }
        
        // Auto-reply activé
        if (llmAutoReply) {
            return true;
        }
        
        return false;
    };

    const handleSendIntegratedMessage = async (skipAssistant = false) => {
        if (!newMessage.trim() || !integratedRoom || isSendingMessage) return;

        const messageText = newMessage.trim();
        const shouldCallAssistant = !skipAssistant && shouldCallLlm(messageText);

        try {
            setIsSendingMessage(true);
            const response = await fetch('/api/groupchat/integrated/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: integratedRoom.id,
                    userId: settings.userAlias || 'user',
                    userDisplayName: settings.userAlias || settings.adminDisplayName,
                    userIcon: settings.userIcon,
                    message: messageText,
                    skipAssistant: skipAssistant || !shouldCallAssistant // Ne pas appeler le LLM si skipAssistant ou si conditions non remplies
                })
            });

            const data = await response.json();
            if (data.success) {
                setNewMessage('');
                // Recharger les messages pour avoir la réponse de l'assistant (si appelé)
                await loadIntegratedMessages(integratedRoom.id);
            } else {
                alert('Erreur envoi message: ' + (data.error || 'Erreur inconnue'));
            }
        } catch (error) {
            console.error('Erreur envoi message:', error);
            alert('Erreur envoi message: ' + error.message);
        } finally {
            setIsSendingMessage(false);
        }
    };

    // Appeler le LLM manuellement sur le dernier message
    const handleCallLlmManually = async () => {
        if (!integratedRoom || isCallingLlm) return;

        try {
            setIsCallingLlm(true);
            
            // Récupérer le dernier message utilisateur
            const lastUserMessage = [...integratedMessages]
                .reverse()
                .find(msg => msg.role === 'user');
            
            if (!lastUserMessage) {
                alert('Aucun message utilisateur récent pour appeler le LLM');
                return;
            }

            // Appeler l'API pour générer une réponse
            const response = await fetch('/api/groupchat/integrated/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: integratedRoom.id,
                    userId: 'assistant',
                    userDisplayName: 'ChatGPT',
                    userIcon: '🤖',
                    message: lastUserMessage.content,
                    forceAssistant: true // Forcer la génération d'une réponse
                })
            });

            const data = await response.json();
            if (data.success) {
                // Recharger les messages pour voir la réponse
                await loadIntegratedMessages(integratedRoom.id);
            } else {
                alert('Erreur appel LLM: ' + (data.error || 'Erreur inconnue'));
            }
        } catch (error) {
            console.error('Erreur appel LLM manuel:', error);
            alert('Erreur appel LLM: ' + error.message);
        } finally {
            setIsCallingLlm(false);
        }
    };

    // Nettoyer le polling à la fermeture
    useEffect(() => {
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [pollingInterval]);

    // ============================================
    // RÈGLES D'OR DU SALON (MÉMOISÉ)
    // ============================================
    const chatGuardrails = useMemo(() => [
        'Confirmer l\'objectif de la réunion en une phrase.',
        'Lister les décisions prises et les propriétaires.',
        'Vérifier que tout le monde dispose du lien ChatGPT et peut rejoindre.',
        'Garder un ton respectueux, synthétique, orienté action.',
    ], []);

    // ============================================
    // STYLES ADAPTATIFS SELON LE MODE SOMBRE/CLAIR
    // ============================================
    const themeStyles = {
        bg: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
        surface: isDarkMode ? 'bg-gray-800' : 'bg-white',
        border: isDarkMode ? 'border-gray-700' : 'border-gray-300',
        text: isDarkMode ? 'text-white' : 'text-gray-900',
        textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
        textMuted: isDarkMode ? 'text-gray-400' : 'text-gray-500',
        input: isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300',
        buttonPrimary: isDarkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-400',
        buttonSecondary: isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-400' : 'bg-gray-100 border-gray-300 hover:border-blue-400',
    };

    // ============================================
    // RENDU DU COMPOSANT
    // ============================================
    return React.createElement('div', { className: 'space-y-6 p-6' },
        // Sélecteur de mode (Partagé vs Intégré)
        React.createElement('div', { 
            className: `p-4 rounded-xl ${themeStyles.surface} border ${themeStyles.border} shadow` 
        },
            React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                React.createElement('div', {},
                    React.createElement('h3', { className: `text-lg font-semibold ${themeStyles.text} mb-1` }, 'Mode de Chat'),
                    React.createElement('p', { className: `text-sm ${themeStyles.textSecondary}` }, 
                        'Choisissez entre le chat de groupe partagé ChatGPT ou un chat intégré avec historique'
                    )
                )
            ),
            React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
                // Mode Partagé
                React.createElement('button', {
                    onClick: () => handleModeChange('shared'),
                    className: `p-4 rounded-lg border-2 transition-all ${
                        chatMode === 'shared'
                            ? 'border-blue-500 bg-blue-900/20'
                            : `${themeStyles.border} ${themeStyles.surface} hover:border-blue-400`
                    }` 
                },
                    React.createElement('div', { className: 'text-center space-y-2' },
                        React.createElement('div', { className: 'text-3xl mb-2' }, '🔗'),
                        React.createElement('h4', { className: `font-semibold ${themeStyles.text}` }, 'Chat Partagé'),
                        React.createElement('p', { className: `text-xs ${themeStyles.textSecondary}` }, 
                            'Lien ChatGPT partagé (ouvre dans nouvel onglet)'
                        ),
                        chatMode === 'shared' && (
                            React.createElement('span', { className: 'text-xs text-blue-400 mt-2 block' }, '✓ Actif')
                        )
                    )
                ),
                // Mode Intégré
                React.createElement('button', {
                    onClick: () => handleModeChange('integrated'),
                    className: `p-4 rounded-lg border-2 transition-all ${
                        chatMode === 'integrated'
                            ? 'border-green-500 bg-green-900/20'
                            : `${themeStyles.border} ${themeStyles.surface} hover:border-green-400`
                    }` 
                },
                    React.createElement('div', { className: 'text-center space-y-2' },
                        React.createElement('div', { className: 'text-3xl mb-2' }, '💬'),
                        React.createElement('h4', { className: `font-semibold ${themeStyles.text}` }, 'Chat Intégré'),
                        React.createElement('p', { className: `text-xs ${themeStyles.textSecondary}` }, 
                            'Chat avec historique, contexte et visibilité live'
                        ),
                        chatMode === 'integrated' && (
                            React.createElement('span', { className: 'text-xs text-green-400 mt-2 block' }, '✓ Actif')
                        )
                    )
                )
            )
        ),

        // Contenu selon le mode choisi
        chatMode === 'shared' ? (
            // ============================================
            // MODE PARTAGÉ (ChatGPT Group Chat Partagé)
            // ============================================
            React.createElement('div', { key: 'shared-mode' },
                // Header avec titre et actions
        React.createElement('div', { 
            className: `flex items-center justify-between flex-wrap gap-3 ${themeStyles.bg} p-4 rounded-xl border ${themeStyles.border}`
        },
            React.createElement('div', { className: 'space-y-1' },
                React.createElement('p', { 
                    className: 'text-xs text-blue-200 uppercase tracking-[0.2em]' 
                }, 'Chat d\'investissement sécurisé'),
                React.createElement('h2', { 
                    className: 'text-3xl font-bold flex items-center gap-2' 
                },
                    'Salon partagé — Comité de placement',
                    React.createElement('span', { 
                        className: 'inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-blue-900 text-blue-100 border border-blue-500/50' 
                    }, 'Live')
                ),
                React.createElement('p', { 
                    className: `${themeStyles.textSecondary} mt-1 max-w-3xl` 
                }, 'Pilotez le salon ChatGPT du comité : alias, icônes, prompts, accès sans login et prévisualisation intégrée. Tout est optimisé pour des décisions en temps réel.')
            ),
            React.createElement('div', { className: 'flex items-center justify-between flex-wrap gap-3' },
                React.createElement('div', { className: 'flex gap-3' },
                    React.createElement('button', {
                        onClick: handleCopyLink,
                        disabled: !settings.sessionUrl,
                        className: `px-4 py-2 rounded-lg border transition-colors ${
                            settings.sessionUrl
                                ? `${themeStyles.buttonSecondary} text-white`
                                : `${themeStyles.surface} ${themeStyles.border} ${themeStyles.textMuted} cursor-not-allowed`
                        }`
                    }, copied ? 'Lien copié ✅' : 'Copier le lien'),
                    React.createElement('button', {
                        onClick: handleOpenChat,
                        disabled: !settings.sessionUrl,
                        className: `px-4 py-2 rounded-lg shadow-lg shadow-blue-500/30 ${
                            settings.sessionUrl
                                ? `${themeStyles.buttonPrimary} text-white`
                                : `${themeStyles.surface} ${themeStyles.textMuted} cursor-not-allowed shadow-none`
                        }`
                    }, 'Ouvrir dans un nouvel onglet')
                )
            )
        ),

        // Grille principale: Prévisualisation + Configuration
        React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
            // Colonne gauche: Prévisualisation et Configuration (2/3)
            React.createElement('div', { className: 'lg:col-span-2 space-y-4' },
                // Section Prévisualisation iframe
                React.createElement('div', { 
                    className: `p-4 rounded-xl bg-gradient-to-br from-gray-900 via-gray-850 to-black border ${themeStyles.border} shadow relative overflow-hidden`
                },
                    React.createElement('div', { 
                        className: 'absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.1),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.08),transparent_30%)] pointer-events-none' 
                    }),
                    React.createElement('div', { className: 'flex items-center justify-between flex-wrap gap-3 mb-3 relative z-10' },
                        React.createElement('div', { className: 'space-y-2' },
                            React.createElement('div', { className: 'flex items-center gap-2' },
                                React.createElement('span', { 
                                    className: 'px-2 py-1 rounded-md bg-blue-900/50 text-blue-100 text-xs border border-blue-700/50' 
                                }, 'Prévisualisation'),
                                React.createElement('span', { 
                                    className: `px-2 py-1 rounded-md ${themeStyles.surface} ${themeStyles.textSecondary} text-xs border ${themeStyles.border}` 
                                }, sessionOrigin),
                                settings.sessionUrl ? (
                                    accessSafety === 'token' ? (
                                        React.createElement('span', { 
                                            className: 'px-2 py-1 rounded-md bg-emerald-900/60 text-emerald-100 text-xs border border-emerald-600/60' 
                                        }, 'Lien partagé (auto-access)')
                                    ) : (
                                        React.createElement('span', { 
                                            className: 'px-2 py-1 rounded-md bg-amber-900/70 text-amber-100 text-xs border border-amber-700' 
                                        }, 'Ajoutez un token pour éviter toute demande de login')
                                    )
                                ) : (
                                    React.createElement('span', { 
                                        className: `px-2 py-1 rounded-md ${themeStyles.surface} ${themeStyles.textSecondary} text-xs border ${themeStyles.border}` 
                                    }, 'Lien à renseigner')
                                )
                            ),
                            React.createElement('h3', { className: `text-lg font-semibold ${themeStyles.text}` }, settings.roomName),
                            React.createElement('p', { className: `text-sm ${themeStyles.textSecondary}` }, `Admin : ${settings.adminDisplayName}`)
                        ),
                        React.createElement('div', { className: `flex items-center gap-3 text-sm ${themeStyles.textSecondary}` },
                            React.createElement('span', { 
                                className: `px-3 py-1 rounded-full ${themeStyles.surface} ${themeStyles.text} border ${themeStyles.border}` 
                            }, `Source : ${sessionOrigin === 'chatgpt.com' ? 'chatgpt.com (temps réel)' : sessionOrigin}`),
                            React.createElement('span', {
                                className: `px-3 py-1 rounded-full border ${
                                    hasEnvChatUrl
                                        ? 'bg-emerald-900/60 text-emerald-100 border-emerald-600/60'
                                        : 'bg-amber-900/60 text-amber-100 border-amber-700'
                                }`
                            }, hasEnvChatUrl
                                ? 'URL par défaut chargée depuis .env/Vercel'
                                : 'Ajoutez VITE_GROUP_CHAT_URL dans .env ou Vercel'),
                            React.createElement('span', { 
                                className: 'px-3 py-1 rounded-full bg-blue-900/60 text-blue-100 text-xs border border-blue-700/50' 
                            }, '💡 Ouvrir dans un nouvel onglet (CSP bloque iframe)')
                        )
                    ),
                    // Zone de prévisualisation (iframe remplacé par bouton d'ouverture)
                    // ⚠️ NOTE: ChatGPT bloque les iframes via CSP (Content Security Policy)
                    // Solution: Afficher un bouton d'ouverture au lieu d'un iframe
                    React.createElement('div', { 
                        className: 'aspect-video rounded-lg overflow-hidden border bg-gradient-to-br from-gray-900 via-gray-800 to-black relative z-10 flex items-center justify-center',
                        style: { borderColor: isDarkMode ? '#374151' : '#d1d5db', minHeight: '400px' }
                    },
                        settings.sessionUrl ? (
                            // ChatGPT bloque les iframes - Afficher un bouton d'ouverture
                            React.createElement('div', { 
                                className: 'absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-6' 
                            },
                                React.createElement('div', { className: 'space-y-4' },
                                    // Icône ou illustration
                                    React.createElement('div', { className: 'text-6xl mb-4' }, '💬'),
                                    React.createElement('h3', { className: `text-2xl font-bold ${themeStyles.text} mb-2` }, settings.roomName),
                                    React.createElement('p', { className: `${themeStyles.textSecondary} text-sm mb-6` }, 
                                        'ChatGPT bloque l\'intégration en iframe pour des raisons de sécurité.'
                                    ),
                                    React.createElement('p', { className: `${themeStyles.textMuted} text-xs mb-8` },
                                        'Utilisez le bouton ci-dessous pour ouvrir le salon dans un nouvel onglet.'
                                    ),
                                    // Bouton principal d'ouverture
                                    React.createElement('button', {
                                        onClick: handleOpenChat,
                                        className: `px-8 py-4 rounded-xl shadow-2xl shadow-blue-500/30 text-lg font-semibold transition-all duration-200 transform hover:scale-105 ${
                                            settings.sessionUrl
                                                ? `${themeStyles.buttonPrimary} text-white`
                                                : `${themeStyles.surface} ${themeStyles.textMuted} cursor-not-allowed`
                                        }`
                                    }, 
                                        React.createElement('span', { className: 'mr-2' }, '🚀'),
                                        'Ouvrir le salon ChatGPT'
                                    ),
                                    // Bouton secondaire pour copier le lien
                                    React.createElement('button', {
                                        onClick: handleCopyLink,
                                        className: `px-6 py-3 rounded-lg border transition-colors ${
                                            settings.sessionUrl
                                                ? `${themeStyles.buttonSecondary} text-white`
                                                : `${themeStyles.surface} ${themeStyles.border} ${themeStyles.textMuted} cursor-not-allowed`
                                        }`
                                    }, copied ? '✅ Lien copié' : '📋 Copier le lien')
                                ),
                                // Badge d'information CSP
                                React.createElement('div', { 
                                    className: `mt-6 px-4 py-2 rounded-lg ${themeStyles.surface} border ${themeStyles.border} text-xs ${themeStyles.textMuted}` 
                                },
                                    React.createElement('p', { className: 'mb-2' }, 'ℹ️ Information'),
                                    React.createElement('p', { className: 'mb-1' }, 'ChatGPT bloque les iframes via CSP (Content Security Policy).'),
                                    React.createElement('p', { className: 'mb-2' }, 'Les chats de groupe partagés n\'ont pas d\'API officielle.'),
                                    React.createElement('p', {}, '💡 Alternative: Utiliser l\'API OpenAI pour créer un chat intégré (voir documentation).')
                                )
                            )
                        ) : (
                            React.createElement('div', { 
                                className: 'absolute inset-0 flex items-center justify-center text-center p-6' 
                            },
                                React.createElement('div', { className: 'space-y-2 max-w-xl' },
                                    React.createElement('p', { className: `font-semibold ${themeStyles.text}` }, 'Configurez le lien du salon'),
                                    React.createElement('p', { className: `${themeStyles.textSecondary} text-sm` },
                                        'Ajoutez l\'URL de clavardage partagée dans le formulaire ou via la variable d\'environnement ',
                                        React.createElement('code', { 
                                            className: `px-1 py-0.5 rounded ${themeStyles.surface} border ${themeStyles.border}` 
                                        }, 'VITE_GROUP_CHAT_URL'),
                                        ' pour activer la prévisualisation.'
                                    )
                                )
                            )
                        ),
                    )
                ),

                // Section Configuration
                React.createElement('div', { 
                    className: `p-4 rounded-xl ${themeStyles.surface} border ${themeStyles.border} shadow space-y-4` 
                },
                    React.createElement('div', { className: 'flex items-center justify-between' },
                        React.createElement('div', {},
                            React.createElement('p', { className: 'text-xs uppercase text-blue-200 tracking-wide' }, 'Contrôles admin'),
                            React.createElement('h3', { className: `text-lg font-semibold ${themeStyles.text}` }, 'Paramétrage de la session'),
                            React.createElement('p', { className: `${themeStyles.textSecondary} text-sm` }, 'Tout est sauvegardé localement (dashboard only) pour ne jamais perdre la configuration.')
                        ),
                        React.createElement('button', {
                            onClick: handleReset,
                            className: `px-3 py-2 rounded-lg border ${themeStyles.border} text-sm hover:border-blue-400 ${themeStyles.textSecondary}`
                        }, 'Réinitialiser')
                    ),

                    // Formulaire de configuration
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
                        // Lien du salon
                        React.createElement('label', { className: 'space-y-1' },
                            React.createElement('span', { className: `text-sm ${themeStyles.textSecondary}` }, 'Lien du salon (ChatGPT group)'),
                            React.createElement('input', {
                                type: 'url',
                                className: `w-full px-3 py-2 rounded-lg ${themeStyles.input} focus:border-blue-400 ${themeStyles.text}`,
                                value: settings.sessionUrl,
                                onChange: (e) => handleChange('sessionUrl', e.target.value),
                                placeholder: PLACEHOLDER_CHAT_URL
                            }),
                            React.createElement('p', { className: `text-xs ${themeStyles.textMuted}` },
                                'Le lien partagé par ChatGPT pour rejoindre la session. Utilisez un lien avec un « token » pour que les invités accèdent sans aucune connexion manuelle.'
                            ),
                            React.createElement('p', { className: 'text-xs text-blue-200' },
                                'Source par défaut : variable d\'environnement ',
                                React.createElement('code', { 
                                    className: `px-1 py-0.5 rounded ${themeStyles.surface} border ${themeStyles.border}` 
                                }, 'VITE_GROUP_CHAT_URL'),
                                ' (',
                                React.createElement('code', { 
                                    className: `px-1 py-0.5 rounded ${themeStyles.surface} border ${themeStyles.border}` 
                                }, '.env'),
                                ' ou Vercel). ',
                                hasEnvChatUrl
                                    ? (isUsingEnvDefault
                                        ? 'Valeur chargée automatiquement.'
                                        : 'Valeur surchargée localement via le formulaire.')
                                    : 'Aucune valeur détectée : collez le lien ici ou configurez la variable.'
                            ),
                            accessSafety === 'needs-token' && (
                                React.createElement('p', { className: 'text-xs text-amber-300' }, '⚠️ Ajoutez le paramètre token=… pour garantir l\'accès automatique sans login.')
                            )
                        ),

                        // Nom du salon
                        React.createElement('label', { className: 'space-y-1' },
                            React.createElement('span', { className: `text-sm ${themeStyles.textSecondary}` }, 'Nom du salon'),
                            React.createElement('input', {
                                type: 'text',
                                className: `w-full px-3 py-2 rounded-lg ${themeStyles.input} focus:border-blue-400 ${themeStyles.text}`,
                                value: settings.roomName,
                                onChange: (e) => handleChange('roomName', e.target.value)
                            })
                        ),

                        // Nom affiché (admin)
                        React.createElement('label', { className: 'space-y-1' },
                            React.createElement('span', { className: `text-sm ${themeStyles.textSecondary}` }, 'Nom affiché (admin)'),
                            React.createElement('input', {
                                type: 'text',
                                className: `w-full px-3 py-2 rounded-lg ${themeStyles.input} focus:border-blue-400 ${themeStyles.text}`,
                                value: settings.adminDisplayName,
                                onChange: (e) => handleChange('adminDisplayName', e.target.value)
                            })
                        ),

                        // Message d'accueil
                        React.createElement('label', { className: 'space-y-1' },
                            React.createElement('span', { className: `text-sm ${themeStyles.textSecondary}` }, 'Message d\'accueil'),
                            React.createElement('input', {
                                type: 'text',
                                className: `w-full px-3 py-2 rounded-lg ${themeStyles.input} focus:border-blue-400 ${themeStyles.text}`,
                                value: settings.welcomeMessage,
                                onChange: (e) => handleChange('welcomeMessage', e.target.value)
                            })
                        ),

                        // Système (prompt de session)
                        React.createElement('label', { className: 'space-y-1 md:col-span-2' },
                            React.createElement('span', { className: `text-sm ${themeStyles.textSecondary}` }, 'Système (prompt de session)'),
                            React.createElement('textarea', {
                                className: `w-full px-3 py-2 rounded-lg ${themeStyles.input} focus:border-blue-400 ${themeStyles.text}`,
                                rows: 3,
                                value: settings.systemPrompt,
                                onChange: (e) => handleChange('systemPrompt', e.target.value)
                            }),
                            React.createElement('p', { className: `text-xs ${themeStyles.textMuted}` }, 'Idéal pour verrouiller les règles d\'animation (résumés, next steps, rôles).')
                        ),

                        // Ton / persona
                        React.createElement('label', { className: 'space-y-1' },
                            React.createElement('span', { className: `text-sm ${themeStyles.textSecondary}` }, 'Ton / persona'),
                            React.createElement('input', {
                                type: 'text',
                                className: `w-full px-3 py-2 rounded-lg ${themeStyles.input} focus:border-blue-400 ${themeStyles.text}`,
                                value: settings.defaultTone,
                                onChange: (e) => handleChange('defaultTone', e.target.value)
                            })
                        ),

                        // Température
                        React.createElement('label', { className: 'space-y-1' },
                            React.createElement('span', { className: `text-sm ${themeStyles.textSecondary}` }, 'Température (0-1)'),
                            React.createElement('input', {
                                type: 'number',
                                step: '0.05',
                                min: 0,
                                max: 1,
                                className: `w-full px-3 py-2 rounded-lg ${themeStyles.input} focus:border-blue-400 ${themeStyles.text}`,
                                value: settings.temperature,
                                onChange: (e) => handleChange('temperature', formatTemperature(Number(e.target.value)))
                            })
                        ),

                        // Historique conservé
                        React.createElement('label', { className: 'space-y-1' },
                            React.createElement('span', { className: `text-sm ${themeStyles.textSecondary}` }, 'Historique conservé (messages)'),
                            React.createElement('input', {
                                type: 'number',
                                min: 20,
                                className: `w-full px-3 py-2 rounded-lg ${themeStyles.input} focus:border-blue-400 ${themeStyles.text}`,
                                value: settings.maxMessages,
                                onChange: (e) => handleChange('maxMessages', Number(e.target.value) || 0)
                            })
                        ),

                        // Options d'accès
                        React.createElement('label', { className: 'space-y-2' },
                            React.createElement('span', { className: `text-sm ${themeStyles.textSecondary}` }, 'Options d\'accès'),
                            React.createElement('div', { className: `flex items-center gap-3 text-sm ${themeStyles.textSecondary}` },
                                React.createElement('label', { className: 'flex items-center gap-2' },
                                    React.createElement('input', {
                                        type: 'checkbox',
                                        checked: settings.allowGuests,
                                        onChange: (e) => handleChange('allowGuests', e.target.checked)
                                    }),
                                    'Autoriser les invités'
                                ),
                                React.createElement('label', { className: 'flex items-center gap-2' },
                                    React.createElement('input', {
                                        type: 'checkbox',
                                        checked: settings.autoJoin,
                                        onChange: (e) => handleChange('autoJoin', e.target.checked)
                                    }),
                                    'Auto-join à l\'ouverture'
                                )
                            )
                        ),

                        // Ressource épinglée
                        React.createElement('label', { className: 'space-y-1 md:col-span-2' },
                            React.createElement('span', { className: `text-sm ${themeStyles.textSecondary}` }, 'Ressource épinglée'),
                            React.createElement('input', {
                                type: 'url',
                                className: `w-full px-3 py-2 rounded-lg ${themeStyles.input} focus:border-blue-400 ${themeStyles.text}`,
                                value: settings.pinnedResource,
                                onChange: (e) => handleChange('pinnedResource', e.target.value),
                                placeholder: 'Lien vers un doc de synthèse ou un brief'
                            })
                        ),

                        // Alias et Icône
                        React.createElement('div', { className: 'md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4' },
                            React.createElement('label', { className: 'space-y-1 md:col-span-2' },
                                React.createElement('span', { className: `text-sm ${themeStyles.textSecondary}` }, 'Alias dans le salon'),
                                React.createElement('input', {
                                    type: 'text',
                                    className: `w-full px-3 py-2 rounded-lg ${themeStyles.input} focus:border-blue-400 ${themeStyles.text}`,
                                    value: settings.userAlias,
                                    onChange: (e) => handleChange('userAlias', e.target.value),
                                    placeholder: 'Ex. Stratège Macro, Analyste Tech, Risk Officer'
                                }),
                                React.createElement('p', { className: `text-xs ${themeStyles.textMuted}` }, 'Nom affiché pour vos interventions dans le salon partagé.')
                            ),
                            React.createElement('div', { className: 'space-y-2' },
                                React.createElement('span', { className: `text-sm ${themeStyles.textSecondary}` }, 'Icône'),
                                React.createElement('div', { className: 'grid grid-cols-4 gap-2' },
                                    iconChoices.map(icon => 
                                        React.createElement('button', {
                                            key: icon,
                                            onClick: () => handleChange('userIcon', icon),
                                            className: `aspect-square rounded-lg border text-xl flex items-center justify-center transition ${
                                                settings.userIcon === icon
                                                    ? 'border-blue-400 bg-blue-900/40'
                                                    : `${themeStyles.border} ${themeStyles.surface} hover:border-blue-400`
                                            }`
                                        }, icon)
                                    )
                                ),
                                React.createElement('p', { className: `text-xs ${themeStyles.textMuted}` }, 'Choisissez un repère visuel cohérent pour le comité.')
                            )
                        )
                    )
                )
            ),

            // Colonne droite: Panneaux d'information (1/3)
            React.createElement('div', { className: 'space-y-4' },
                // Carte identité
                React.createElement('div', { 
                    className: `p-4 rounded-xl bg-gradient-to-br from-blue-900/40 via-gray-900 to-black border border-blue-500/30 shadow space-y-3` 
                },
                    React.createElement('div', { className: 'flex items-center gap-3' },
                        React.createElement('div', { 
                            className: 'h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-400 flex items-center justify-center text-2xl' 
                        }, settings.userIcon),
                        React.createElement('div', {},
                            React.createElement('p', { className: 'text-xs uppercase text-blue-200 tracking-wide' }, 'Carte identité'),
                            React.createElement('h3', { className: `text-lg font-semibold ${themeStyles.text}` }, settings.userAlias),
                            React.createElement('p', { className: `text-sm ${themeStyles.textSecondary}` }, 'Votre empreinte dans le salon de comité.')
                        )
                    ),
                    React.createElement('div', { className: 'grid grid-cols-2 gap-3 text-sm' },
                        React.createElement('div', { className: `p-3 rounded-lg ${themeStyles.surface} border ${themeStyles.border}` },
                            React.createElement('p', { className: `text-xs ${themeStyles.textMuted}` }, 'Ton'),
                            React.createElement('p', { className: `font-semibold ${themeStyles.text}` }, settings.defaultTone)
                        ),
                        React.createElement('div', { className: `p-3 rounded-lg ${themeStyles.surface} border ${themeStyles.border}` },
                            React.createElement('p', { className: `text-xs ${themeStyles.textMuted}` }, 'Température'),
                            React.createElement('p', { className: `font-semibold ${themeStyles.text}` }, settings.temperature)
                        ),
                        React.createElement('div', { className: `p-3 rounded-lg ${themeStyles.surface} border ${themeStyles.border}` },
                            React.createElement('p', { className: `text-xs ${themeStyles.textMuted}` }, 'Historique'),
                            React.createElement('p', { className: `font-semibold ${themeStyles.text}` }, `${settings.maxMessages} msgs`)
                        ),
                        React.createElement('div', { className: `p-3 rounded-lg ${themeStyles.surface} border ${themeStyles.border}` },
                            React.createElement('p', { className: `text-xs ${themeStyles.textMuted}` }, 'Accès'),
                            React.createElement('p', { className: `font-semibold ${themeStyles.text}` },
                                !settings.sessionUrl
                                    ? 'Lien manquant (ajoutez .env ou formulaire)'
                                    : accessSafety === 'token'
                                        ? 'Auto-join sans login'
                                        : 'À sécuriser (token)'
                            )
                        )
                    )
                ),

                // Checklist règles d'or
                React.createElement('div', { 
                    className: `p-4 rounded-xl ${themeStyles.surface} border ${themeStyles.border} shadow` 
                },
                    React.createElement('p', { className: 'text-xs uppercase text-blue-200 tracking-wide' }, 'Checklist'),
                    React.createElement('h3', { className: `text-lg font-semibold mb-2 ${themeStyles.text}` }, 'Règles d\'or du salon'),
                    React.createElement('ul', { className: `list-disc list-inside space-y-1 ${themeStyles.textSecondary} text-sm` },
                        chatGuardrails.map(item => 
                            React.createElement('li', { key: item }, item)
                        )
                    )
                ),

                // Statut configuration
                React.createElement('div', { 
                    className: `p-4 rounded-xl ${themeStyles.surface} border ${themeStyles.border} shadow space-y-3` 
                },
                    React.createElement('div', { className: 'flex items-center justify-between' },
                        React.createElement('div', {},
                            React.createElement('p', { className: 'text-xs uppercase text-blue-200 tracking-wide' }, 'Statut'),
                            React.createElement('h3', { className: `text-lg font-semibold ${themeStyles.text}` }, 'Configuration actuelle')
                        ),
                        React.createElement('span', { 
                            className: 'px-3 py-1 rounded-full bg-green-900 text-green-200 text-xs' 
                        }, 'Prête')
                    ),
                    React.createElement('div', { className: `space-y-2 text-sm ${themeStyles.textSecondary}` },
                        React.createElement('div', { className: 'flex items-center justify-between' },
                            React.createElement('span', {}, 'Nom'),
                            React.createElement('strong', { className: themeStyles.text }, settings.roomName)
                        ),
                        React.createElement('div', { className: 'flex items-center justify-between' },
                            React.createElement('span', {}, 'Admin'),
                            React.createElement('strong', { className: themeStyles.text }, settings.adminDisplayName)
                        ),
                        React.createElement('div', { className: 'flex items-center justify-between' },
                            React.createElement('span', {}, 'Accès'),
                            React.createElement('strong', {
                                className: !settings.sessionUrl
                                    ? themeStyles.textSecondary
                                    : accessSafety === 'token'
                                        ? 'text-emerald-200'
                                        : 'text-amber-200'
                            }, !settings.sessionUrl
                                ? 'Lien à configurer (.env ou formulaire)'
                                : accessSafety === 'token'
                                    ? 'Lien partagé sans login'
                                    : 'Lien à sécuriser (token)')
                        ),
                        React.createElement('div', { className: 'flex items-center justify-between' },
                            React.createElement('span', {}, 'Température'),
                            React.createElement('strong', { className: themeStyles.text }, settings.temperature)
                        ),
                        React.createElement('div', { className: 'flex items-center justify-between' },
                            React.createElement('span', {}, 'Historique'),
                            React.createElement('strong', { className: themeStyles.text }, `${settings.maxMessages} msgs`)
                        ),
                        React.createElement('div', { className: 'flex items-center justify-between' },
                            React.createElement('span', {}, 'Accès invités'),
                            React.createElement('strong', { className: themeStyles.text }, settings.allowGuests ? 'Oui' : 'Non')
                        ),
                        React.createElement('div', { className: 'flex items-center justify-between' },
                            React.createElement('span', {}, 'Auto-join'),
                            React.createElement('strong', { className: themeStyles.text }, settings.autoJoin ? 'Actif' : 'Off')
                        )
                    ),
                    React.createElement('div', { className: `pt-2 border-t ${themeStyles.border} text-sm ${themeStyles.textSecondary}` },
                        React.createElement('p', { className: `font-semibold ${themeStyles.text}` }, 'Message d\'accueil'),
                        React.createElement('p', {}, settings.welcomeMessage)
                    ),
                    React.createElement('div', { className: `pt-2 border-t ${themeStyles.border} text-sm ${themeStyles.textSecondary}` },
                        React.createElement('p', { className: `font-semibold ${themeStyles.text}` }, 'Ressource épinglée'),
                        React.createElement('a', {
                            className: 'text-blue-300 hover:text-blue-200 break-all',
                            href: settings.pinnedResource,
                            target: '_blank',
                            rel: 'noreferrer'
                        }, settings.pinnedResource)
                    )
                ),

                // Mode opératoire
                React.createElement('div', { 
                    className: `p-4 rounded-xl ${themeStyles.surface} border ${themeStyles.border} shadow space-y-3` 
                },
                    React.createElement('p', { className: 'text-xs uppercase text-blue-200 tracking-wide' }, 'Mode opératoire'),
                    React.createElement('h3', { className: `text-lg font-semibold ${themeStyles.text}` }, 'Déploiement rapide'),
                    React.createElement('ol', { className: `list-decimal list-inside space-y-2 ${themeStyles.textSecondary} text-sm` },
                        React.createElement('li', {}, 'Valider/ajuster le lien de session ChatGPT ci-dessus.'),
                        React.createElement('li', {}, 'Partager le lien avec l\'équipe (bouton « Copier »).'),
                        React.createElement('li', {}, 'Ouvrir le salon et lancer l\'animation (bouton « Ouvrir »).'),
                        React.createElement('li', {}, 'Utiliser le prompt système pour guider les résumés et décisions.')
                    ),
                    React.createElement('p', { className: `text-xs ${themeStyles.textMuted}` }, 'Toutes les valeurs sont sauvegardées localement pour un relancement instantané.')
                )
            )
        ) : (
            // ============================================
            // MODE INTÉGRÉ (Chat Intégré avec Historique)
            // ============================================
            React.createElement('div', { key: 'integrated-mode' },
                // Header avec titre et actions
                React.createElement('div', { 
                    className: `flex items-center justify-between flex-wrap gap-3 ${themeStyles.bg} p-4 rounded-xl border ${themeStyles.border}`
                },
                    React.createElement('div', { className: 'space-y-1' },
                        React.createElement('p', { 
                            className: 'text-xs text-green-200 uppercase tracking-[0.2em]' 
                        }, 'Chat intégré avec historique'),
                        React.createElement('h2', { 
                            className: 'text-3xl font-bold flex items-center gap-2' 
                        },
                            integratedRoom ? integratedRoom.roomName : settings.roomName,
                            React.createElement('span', { 
                                className: 'inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-green-900 text-green-100 border border-green-500/50' 
                            }, 'Live')
                        ),
                        React.createElement('p', { 
                            className: `${themeStyles.textSecondary} mt-1 max-w-3xl` 
                        }, 'Chat intégré avec historique complet, contexte partagé et visibilité en temps réel pour tous les utilisateurs.')
                    ),
                    integratedRoom && (
                        React.createElement('div', { className: 'flex items-center gap-3' },
                            React.createElement('div', { 
                                className: `px-4 py-2 rounded-lg ${themeStyles.surface} border ${themeStyles.border}` 
                            },
                                React.createElement('p', { className: `text-xs ${themeStyles.textMuted}` }, 'Code du salon'),
                                React.createElement('p', { className: `text-lg font-mono font-bold ${themeStyles.text}` }, integratedRoom.roomCode)
                            ),
                            React.createElement('button', {
                                onClick: () => {
                                    navigator.clipboard.writeText(integratedRoom.roomCode);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                },
                                className: `px-4 py-2 rounded-lg border transition-colors ${themeStyles.buttonSecondary} text-white`
                            }, copied ? 'Code copié ✅' : '📋 Copier le code')
                        )
                    )
                ),

                // Zone de chat intégré
                React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
                    // Colonne principale: Chat (2/3)
                    React.createElement('div', { className: 'lg:col-span-2 space-y-4' },
                        // Zone de messages
                        React.createElement('div', { 
                            className: `rounded-xl ${themeStyles.surface} border ${themeStyles.border} shadow`,
                            style: { height: '600px', display: 'flex', flexDirection: 'column' }
                        },
                            // Header du chat
                            React.createElement('div', { 
                                className: `p-4 border-b ${themeStyles.border} flex items-center justify-between` 
                            },
                                React.createElement('div', {},
                                    React.createElement('h3', { className: `text-lg font-semibold ${themeStyles.text}` }, 
                                        integratedRoom ? integratedRoom.roomName : 'Salon de chat'
                                    ),
                                    React.createElement('p', { className: `text-sm ${themeStyles.textSecondary}` }, 
                                        `${integratedParticipants.length} participant${integratedParticipants.length > 1 ? 's' : ''} en ligne`
                                    )
                                ),
                                integratedRoom && integratedParticipants.length > 0 && (
                                    React.createElement('div', { className: 'flex items-center gap-2' },
                                        integratedParticipants.map((p, idx) => 
                                            React.createElement('span', { 
                                                key: idx,
                                                className: 'text-2xl',
                                                title: `${p.user_display_name} (en ligne)`
                                            }, p.user_icon || '🧠')
                                        )
                                    )
                                )
                            ),

                            // Zone de messages scrollable
                            React.createElement('div', { 
                                className: 'flex-1 overflow-y-auto p-4 space-y-4',
                                style: { maxHeight: '500px' }
                            },
                                isLoadingMessages ? (
                                    React.createElement('div', { className: 'flex items-center justify-center h-full' },
                                        React.createElement('div', { className: 'text-center' },
                                            React.createElement('div', { className: 'inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4' }),
                                            React.createElement('p', { className: `${themeStyles.textSecondary}` }, 'Chargement des messages...')
                                        )
                                    )
                                ) : integratedRoom ? (
                                    integratedMessages.length > 0 ? (
                                        integratedMessages.map((msg, idx) => 
                                            React.createElement('div', {
                                                key: msg.id || idx,
                                                className: `flex items-start gap-3 p-3 rounded-lg ${
                                                    msg.role === 'user' 
                                                        ? `${themeStyles.surface}` 
                                                        : msg.role === 'assistant'
                                                            ? 'bg-green-900/20 border border-green-700/30'
                                                            : 'bg-gray-800/50'
                                                }`
                                            },
                                                React.createElement('div', { className: 'text-2xl flex-shrink-0' }, 
                                                    msg.user_icon || (msg.role === 'assistant' ? '🤖' : '🧠')
                                                ),
                                                React.createElement('div', { className: 'flex-1 min-w-0' },
                                                    React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                                        React.createElement('span', { className: `font-semibold ${themeStyles.text}` }, 
                                                            msg.user_display_name || (msg.role === 'assistant' ? 'ChatGPT' : 'Utilisateur')
                                                        ),
                                                        React.createElement('span', { className: `text-xs ${themeStyles.textMuted}` }, 
                                                            new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                                        )
                                                    ),
                                                    React.createElement('p', { className: `${themeStyles.textSecondary} whitespace-pre-wrap break-words` }, 
                                                        msg.content
                                                    )
                                                )
                                            )
                                        )
                                    ) : (
                                        React.createElement('div', { className: 'flex items-center justify-center h-full text-center p-8' },
                                            React.createElement('div', {},
                                                React.createElement('p', { className: `text-4xl mb-4` }, '💬'),
                                                React.createElement('p', { className: `${themeStyles.textSecondary}` }, 'Aucun message pour le moment'),
                                                React.createElement('p', { className: `text-sm ${themeStyles.textMuted} mt-2` }, 'Envoyez le premier message pour commencer la conversation')
                                            )
                                        )
                                    )
                                ) : (
                                    React.createElement('div', { className: 'flex items-center justify-center h-full text-center p-8' },
                                        React.createElement('div', {},
                                            React.createElement('p', { className: `text-4xl mb-4` }, '🚀'),
                                            React.createElement('p', { className: `${themeStyles.textSecondary} mb-4` }, 'Créer un nouveau salon de chat intégré'),
                                            React.createElement('button', {
                                                onClick: handleCreateIntegratedRoom,
                                                disabled: isLoadingMessages,
                                                className: `px-6 py-3 rounded-lg shadow-lg ${themeStyles.buttonPrimary} text-white font-semibold`
                                            }, isLoadingMessages ? 'Création...' : 'Créer le salon')
                                        )
                                    )
                                )
                            ),

                            // Zone de saisie avec contrôle LLM
                            integratedRoom && (
                                React.createElement('div', { 
                                    className: `p-4 border-t ${themeStyles.border}` 
                                },
                                    // Indicateur de mode LLM
                                    React.createElement('div', { 
                                        className: 'mb-2 flex items-center justify-between text-xs' 
                                    },
                                        React.createElement('div', { className: 'flex items-center gap-2' },
                                            shouldCallLlm(newMessage) ? (
                                                React.createElement('div', {},
                                                    React.createElement('span', { className: 'text-green-400' }, '🤖 LLM répondra'),
                                                    React.createElement('span', { className: `${themeStyles.textMuted}` }, 
                                                        llmAutoReply ? '(auto)' : 
                                                        llmReplyOnMention && newMessage.toLowerCase().includes('@') ? '(mention)' :
                                                        llmReplyOnQuestion && newMessage.endsWith('?') ? '(question)' : ''
                                                    )
                                                )
                                            ) : (
                                                React.createElement('span', { className: `${themeStyles.textMuted}` }, '💬 Message uniquement (pas de LLM)')
                                            )
                                        ),
                                        React.createElement('button', {
                                            onClick: () => {
                                                const lastUserMsg = [...integratedMessages].reverse().find(m => m.role === 'user');
                                                if (lastUserMsg) {
                                                    handleCallLlmManually();
                                                } else {
                                                    alert('Aucun message utilisateur récent');
                                                }
                                            },
                                            disabled: isCallingLlm || integratedMessages.filter(m => m.role === 'user').length === 0,
                                            className: `px-3 py-1 rounded text-xs transition-all ${
                                                isCallingLlm || integratedMessages.filter(m => m.role === 'user').length === 0
                                                    ? `${themeStyles.surface} ${themeStyles.textMuted} cursor-not-allowed`
                                                    : 'bg-blue-900/30 text-blue-200 hover:bg-blue-900/50 border border-blue-700/30'
                                            }`,
                                            title: 'Appeler le LLM sur le dernier message'
                                        }, isCallingLlm ? '⏳ Appel...' : '🤖 Appeler LLM')
                                    ),
                                    React.createElement('div', { className: 'flex items-center gap-3' },
                                        React.createElement('input', {
                                            type: 'text',
                                            value: newMessage,
                                            onChange: (e) => setNewMessage(e.target.value),
                                            onKeyPress: (e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendIntegratedMessage(false); // Utiliser la logique automatique
                                                }
                                            },
                                            placeholder: shouldCallLlm(newMessage) 
                                                ? 'Tapez votre message (LLM répondra)...' 
                                                : 'Tapez votre message...',
                                            disabled: isSendingMessage,
                                            className: `flex-1 px-4 py-2 rounded-lg ${themeStyles.input} focus:border-green-400 ${themeStyles.text}`,
                                            style: { outline: 'none' }
                                        }),
                                        // Bouton envoyer SANS LLM
                                        React.createElement('button', {
                                            onClick: () => handleSendIntegratedMessage(true), // skipAssistant = true
                                            disabled: !newMessage.trim() || isSendingMessage,
                                            className: `px-3 py-2 rounded-lg transition-all text-xs ${
                                                newMessage.trim() && !isSendingMessage
                                                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
                                                    : `${themeStyles.surface} ${themeStyles.textMuted} cursor-not-allowed`
                                            }`,
                                            title: 'Envoyer sans appeler le LLM'
                                        }, '💬'),
                                        // Bouton envoyer AVEC LLM (si conditions remplies)
                                        React.createElement('button', {
                                            onClick: () => handleSendIntegratedMessage(false), // Utiliser la logique automatique
                                            disabled: !newMessage.trim() || isSendingMessage,
                                            className: `px-4 py-2 rounded-lg shadow-lg transition-all ${
                                                newMessage.trim() && !isSendingMessage
                                                    ? shouldCallLlm(newMessage)
                                                        ? `${themeStyles.buttonPrimary} text-white`
                                                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                    : `${themeStyles.surface} ${themeStyles.textMuted} cursor-not-allowed`
                                            }`
                                        }, isSendingMessage ? '⏳' : shouldCallLlm(newMessage) ? '📤 Envoyer' : '📤')
                                    )
                                )
                            )
                        )
                    ),

                    // Colonne latérale: Configuration et Participants (1/3)
                    React.createElement('div', { className: 'space-y-4' },
                        // Participants en ligne
                        integratedRoom && (
                            React.createElement('div', { 
                                className: `p-4 rounded-xl ${themeStyles.surface} border ${themeStyles.border} shadow` 
                            },
                                React.createElement('p', { className: 'text-xs uppercase text-green-200 tracking-wide mb-3' }, 'Participants'),
                                React.createElement('div', { className: 'space-y-2' },
                                    integratedParticipants.length > 0 ? (
                                        integratedParticipants.map((p, idx) => 
                                            React.createElement('div', {
                                                key: idx,
                                                className: `flex items-center gap-3 p-2 rounded-lg ${themeStyles.bg}`
                                            },
                                                React.createElement('span', { className: 'text-2xl' }, p.user_icon || '🧠'),
                                                React.createElement('div', { className: 'flex-1' },
                                                    React.createElement('p', { className: `${themeStyles.text} font-medium` }, p.user_display_name),
                                                    React.createElement('p', { className: `text-xs ${themeStyles.textMuted}` }, 
                                                        'En ligne'
                                                    )
                                                ),
                                                React.createElement('div', { 
                                                    className: 'w-2 h-2 rounded-full bg-green-500'
                                                })
                                            )
                                        )
                                    ) : (
                                        React.createElement('p', { className: `${themeStyles.textSecondary} text-sm` }, 'Aucun participant en ligne')
                                    )
                                )
                            )
                        ),

                        // Contrôle des interventions LLM
                        integratedRoom && (
                            React.createElement('div', { 
                                className: `p-4 rounded-xl ${themeStyles.surface} border ${themeStyles.border} shadow space-y-4` 
                            },
                                React.createElement('div', { className: 'flex items-center justify-between' },
                                    React.createElement('div', {},
                                        React.createElement('p', { className: 'text-xs uppercase text-purple-200 tracking-wide' }, 'Contrôle LLM'),
                                        React.createElement('h3', { className: `text-lg font-semibold ${themeStyles.text}` }, 'Interventions ChatGPT')
                                    )
                                ),
                                React.createElement('div', { className: 'space-y-3' },
                                    React.createElement('p', { className: `text-sm ${themeStyles.textSecondary}` }, 
                                        'Contrôlez quand ChatGPT répond pour éviter de "pourrir" la conversation tout en bénéficiant de sa valeur ajoutée.'
                                    ),
                                    // Auto-reply
                                    React.createElement('label', { className: 'flex items-center justify-between cursor-pointer' },
                                        React.createElement('div', { className: 'flex-1' },
                                            React.createElement('span', { className: `${themeStyles.text} font-medium` }, 'Réponse automatique'),
                                            React.createElement('p', { className: `text-xs ${themeStyles.textMuted}` }, 
                                                'ChatGPT répond à chaque message (peut être envahissant)'
                                            )
                                        ),
                                        React.createElement('button', {
                                            onClick: () => setLlmAutoReply(!llmAutoReply),
                                            className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                llmAutoReply ? 'bg-green-600' : 'bg-gray-600'
                                            }`
                                        },
                                            React.createElement('span', {
                                                className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    llmAutoReply ? 'translate-x-6' : 'translate-x-1'
                                                }`
                                            })
                                        )
                                    ),
                                    // Répondre aux mentions
                                    React.createElement('label', { className: 'flex items-center justify-between cursor-pointer' },
                                        React.createElement('div', { className: 'flex-1' },
                                            React.createElement('span', { className: `${themeStyles.text} font-medium` }, 'Répondre aux mentions'),
                                            React.createElement('p', { className: `text-xs ${themeStyles.textMuted}` }, 
                                                'Répondre si @chatgpt, @assistant ou @ai dans le message'
                                            )
                                        ),
                                        React.createElement('button', {
                                            onClick: () => setLlmReplyOnMention(!llmReplyOnMention),
                                            className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                llmReplyOnMention ? 'bg-green-600' : 'bg-gray-600'
                                            }`
                                        },
                                            React.createElement('span', {
                                                className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    llmReplyOnMention ? 'translate-x-6' : 'translate-x-1'
                                                }`
                                            })
                                        )
                                    ),
                                    // Répondre aux questions
                                    React.createElement('label', { className: 'flex items-center justify-between cursor-pointer' },
                                        React.createElement('div', { className: 'flex-1' },
                                            React.createElement('span', { className: `${themeStyles.text} font-medium` }, 'Répondre aux questions'),
                                            React.createElement('p', { className: `text-xs ${themeStyles.textMuted}` }, 
                                                'Répondre automatiquement si le message se termine par ?'
                                            )
                                        ),
                                        React.createElement('button', {
                                            onClick: () => setLlmReplyOnQuestion(!llmReplyOnQuestion),
                                            className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                llmReplyOnQuestion ? 'bg-green-600' : 'bg-gray-600'
                                            }`
                                        },
                                            React.createElement('span', {
                                                className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    llmReplyOnQuestion ? 'translate-x-6' : 'translate-x-1'
                                                }`
                                            })
                                        )
                                    ),
                                    React.createElement('div', { className: `p-3 rounded-lg bg-blue-900/20 border border-blue-700/30 mt-3` },
                                        React.createElement('p', { className: `text-xs ${themeStyles.textMuted} mb-1` }, '💡 Astuce'),
                                        React.createElement('p', { className: `text-xs ${themeStyles.textSecondary}` }, 
                                            'Utilisez le bouton "🤖 Appeler LLM" pour demander une réponse manuellement sur n\'importe quel message.'
                                        )
                                    )
                                )
                            )
                        ),

                        // Configuration (même que mode partagé mais adapté)
                        React.createElement('div', { 
                            className: `p-4 rounded-xl ${themeStyles.surface} border ${themeStyles.border} shadow space-y-4` 
                        },
                            React.createElement('div', { className: 'flex items-center justify-between' },
                                React.createElement('div', {},
                                    React.createElement('p', { className: 'text-xs uppercase text-green-200 tracking-wide' }, 'Configuration'),
                                    React.createElement('h3', { className: `text-lg font-semibold ${themeStyles.text}` }, 'Paramètres du salon')
                                )
                            ),

                            // Formulaire de configuration (simplifié pour mode intégré)
                            React.createElement('div', { className: 'space-y-4' },
                                React.createElement('label', { className: 'space-y-1' },
                                    React.createElement('span', { className: `text-sm ${themeStyles.textSecondary}` }, 'Nom du salon'),
                                    React.createElement('input', {
                                        type: 'text',
                                        className: `w-full px-3 py-2 rounded-lg ${themeStyles.input} focus:border-green-400 ${themeStyles.text}`,
                                        value: settings.roomName,
                                        onChange: (e) => handleChange('roomName', e.target.value),
                                        disabled: !!integratedRoom
                                    })
                                ),

                                React.createElement('label', { className: 'space-y-1' },
                                    React.createElement('span', { className: `text-sm ${themeStyles.textSecondary}` }, 'Système (prompt)'),
                                    React.createElement('textarea', {
                                        className: `w-full px-3 py-2 rounded-lg ${themeStyles.input} focus:border-green-400 ${themeStyles.text}`,
                                        rows: 3,
                                        value: settings.systemPrompt,
                                        onChange: (e) => handleChange('systemPrompt', e.target.value),
                                        disabled: !!integratedRoom
                                    })
                                ),

                                React.createElement('label', { className: 'space-y-1' },
                                    React.createElement('span', { className: `text-sm ${themeStyles.textSecondary}` }, 'Température (0-1)'),
                                    React.createElement('input', {
                                        type: 'number',
                                        step: '0.05',
                                        min: 0,
                                        max: 1,
                                        className: `w-full px-3 py-2 rounded-lg ${themeStyles.input} focus:border-green-400 ${themeStyles.text}`,
                                        value: settings.temperature,
                                        onChange: (e) => handleChange('temperature', formatTemperature(Number(e.target.value))),
                                        disabled: !!integratedRoom
                                    })
                                ),

                                integratedRoom && (
                                    React.createElement('div', { className: `p-3 rounded-lg bg-blue-900/20 border border-blue-700/30` },
                                        React.createElement('p', { className: `text-xs ${themeStyles.textMuted} mb-2` }, 'ℹ️ Information'),
                                        React.createElement('p', { className: `text-sm ${themeStyles.textSecondary}` }, 
                                            'Les paramètres ne peuvent être modifiés qu\'à la création du salon. Créez un nouveau salon pour changer ces paramètres.'
                                        )
                                    )
                                )
                            )
                        ),

                        // Statut du salon
                        integratedRoom && (
                            React.createElement('div', { 
                                className: `p-4 rounded-xl ${themeStyles.surface} border ${themeStyles.border} shadow space-y-3` 
                            },
                                React.createElement('div', { className: 'flex items-center justify-between' },
                                    React.createElement('div', {},
                                        React.createElement('p', { className: 'text-xs uppercase text-green-200 tracking-wide' }, 'Statut'),
                                        React.createElement('h3', { className: `text-lg font-semibold ${themeStyles.text}` }, 'Salon actif')
                                    ),
                                    React.createElement('span', { 
                                        className: 'px-3 py-1 rounded-full bg-green-900 text-green-200 text-xs' 
                                    }, 'Live')
                                ),
                                React.createElement('div', { className: `space-y-2 text-sm ${themeStyles.textSecondary}` },
                                    React.createElement('div', { className: 'flex items-center justify-between' },
                                        React.createElement('span', {}, 'Messages'),
                                        React.createElement('strong', { className: themeStyles.text }, `${integratedMessages.length}`)
                                    ),
                                    React.createElement('div', { className: 'flex items-center justify-between' },
                                        React.createElement('span', {}, 'Participants'),
                                        React.createElement('strong', { className: themeStyles.text }, `${integratedParticipants.length}`)
                                    ),
                                    React.createElement('div', { className: 'flex items-center justify-between' },
                                        React.createElement('span', {}, 'Code'),
                                        React.createElement('strong', { className: `font-mono ${themeStyles.text}` }, integratedRoom.roomCode)
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    );
};

// Exposer globalement pour app-inline.js
window.ChatGPTGroupTab = ChatGPTGroupTab;

