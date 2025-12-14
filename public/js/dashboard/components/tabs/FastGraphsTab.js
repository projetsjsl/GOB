/**
 * Component: FastGraphsTab
 * Onglet pour se connecter à FastGraphs.com via Browserless/Browserbase
 * 
 * Ce composant permet d'exécuter un workflow automatisé qui:
 * 1. Navigue vers fastgraphs.com
 * 2. Clique sur le bouton "Log In"
 */

const { useState, useEffect } = React;

const FastGraphsTab = ({ isDarkMode = true, activeTab, setActiveTab }) => {
    const [autoLogin, setAutoLogin] = useState(() => {
        return localStorage.getItem('fastgraphs_autologin') === 'true';
    });
    
    // Missing state definitions added
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [sessionUrl, setSessionUrl] = useState(null);
    const [useCredentials, setUseCredentials] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [debugMode, setDebugMode] = useState(false);
    const [automationSteps, setAutomationSteps] = useState([]);
    const [debugInfo, setDebugInfo] = useState(null);
    
    // Sauvegarder la préférence
    useEffect(() => {
        localStorage.setItem('fastgraphs_autologin', autoLogin);
    }, [autoLogin]);

    // Déclenchement automatique
    useEffect(() => {
        if (autoLogin && status === 'idle' && !sessionUrl) {
            console.log('🔄 FastGraphs: Auto-login déclenché');
            handleLogin();
        }
    }, [autoLogin]); // Dépendance sur autoLogin et mount

    const handleLogin = async () => {
        setIsLoading(true);
        setError(null);
        setStatus('loading');
        setAutomationSteps([]);
        setDebugInfo(null);

        try {
            // Utiliser les props ou l'état local, fallback sur variables d'environnement serveur
            // Si useCredentials est true mais champs vides, on laisse le backend gérer avec process.env
            const requestBody = { 
                email: useCredentials ? email : undefined,
                password: useCredentials ? password : undefined,
                debug: debugMode 
            };

            const response = await fetch('/api/fastgraphs-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (!response.ok) {
                // Afficher les infos de debug si disponibles
                if (data.debug) {
                    setDebugInfo(data.debug);
                }
                
                const errorMessage = data.error || data.details || 'Erreur lors de la connexion';
                const hint = data.hint ? `\n\n💡 ${data.hint}` : '';
                throw new Error(errorMessage + hint);
            }

            if (data.success && data.session) {
                setSessionUrl(data.session.url);
                setStatus('success');
                
                // Afficher les étapes d'automatisation
                if (data.automation?.steps) {
                    setAutomationSteps(data.automation.steps);
                }
                
                // Afficher les infos de debug si disponibles
                if (data.debug) {
                    setDebugInfo(data.debug);
                }
                
                // Ouvrir la session dans un nouvel onglet
                if (data.session.url) {
                    // Petit délai pour éviter le blocage popup si possible (bien que browser policy strict)
                    setTimeout(() => {
                         const newWindow = window.open(data.session.url, '_blank');
                         if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                             setError("⚠️ La fenêtre popup a été bloquée. Veuillez autoriser les popups pour ce site.");
                         }
                    }, 100);
                }
            } else {
                throw new Error('Réponse inattendue du serveur');
            }
        } catch (err) {
            console.error('Erreur FastGraphs Login:', err);
            setError(err.message);
            setStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>



            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <span className="iconoir-graph-up text-4xl"></span>
                        FastGraphs Login
                    </h1>
                    <p className="text-gray-400">
                        Connexion automatisée à FastGraphs.com via Browserbase
                    </p>
                </div>

                {/* Status Card */}
                <div className={`rounded-lg p-6 mb-6 ${
                    isDarkMode 
                        ? 'bg-gray-800 border border-gray-700' 
                        : 'bg-gray-50 border border-gray-200'
                }`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Statut de la connexion</h2>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            status === 'success' 
                                ? 'bg-green-500/20 text-green-400'
                                : status === 'error'
                                ? 'bg-red-500/20 text-red-400'
                                : status === 'loading'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-gray-500/20 text-gray-400'
                        }`}>
                            {status === 'success' && '✓ Connecté'}
                            {status === 'error' && '✗ Erreur'}
                            {status === 'loading' && '⏳ En cours...'}
                            {status === 'idle' && 'En attente'}
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 font-medium mb-2">Erreur:</p>
                            <p className="text-red-300 text-sm whitespace-pre-line">{error}</p>
                            {debugInfo && (
                                <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700">
                                    <p className="text-yellow-400 text-xs font-medium mb-2">🔍 Informations de débogage:</p>
                                    <pre className="text-xs text-gray-300 overflow-auto max-h-40">
                                        {JSON.stringify(debugInfo, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}

                    {sessionUrl && (
                        <div className="mt-4">
                            <p className="text-green-400 font-medium mb-2">✓ Session active (Vue en direct)</p>
                            <div className="w-full h-[600px] border border-gray-700 rounded-lg overflow-hidden bg-black relative">
                                <iframe 
                                    src={sessionUrl}
                                    className="w-full h-full"
                                    title="FastGraphs Remote Session"
                                    allow="clipboard-read; clipboard-write; fullscreen"
                                />
                            </div>
                            <div className="mt-2 text-right">
                                <a 
                                    href={sessionUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center justify-end gap-1"
                                >
                                    <span className="iconoir-open-new-window"></span>
                                    Ouvrir dans une nouvelle fenêtre
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Card */}
                <div className={`rounded-lg p-6 mb-6 ${
                    isDarkMode 
                        ? 'bg-gray-800 border border-gray-700' 
                        : 'bg-gray-50 border border-gray-200'
                }`}>
                    <h2 className="text-xl font-semibold mb-4">Actions</h2>
                    
                    {/* Options */}
                    <div className="mb-4 space-y-2">
                        {/* Toggle Connexion Auto */}
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-700/30 transition-colors">
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoLogin}
                                    onChange={(e) => setAutoLogin(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className={`w-11 h-6 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-800 ${
                                    isDarkMode ? 'bg-gray-700 peer-checked:bg-blue-600' : 'bg-gray-200 peer-checked:bg-blue-600'
                                } after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white`}></div>
                            </div>
                            <div>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Lancer automatiquement à l'ouverture
                                </span>
                                <p className="text-xs text-gray-400">
                                    ⚠️ Requiert l'autorisation des popups dans votre navigateur
                                </p>
                            </div>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useCredentials}
                                onChange={(e) => setUseCredentials(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600"
                            />
                            <span className="text-sm text-gray-300">
                                Automatiser la connexion complète (avec identifiants)
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={debugMode}
                                onChange={(e) => setDebugMode(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600"
                            />
                            <span className="text-sm text-gray-300">
                                Mode debug (affiche plus d'informations en cas d'erreur)
                            </span>
                        </label>
                    </div>

                    {/* Champs de saisie des identifiants */}
                    {useCredentials && (
                        <div className="mb-4 space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-300">
                                    Email / Username
                                </label>
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="votre@email.com"
                                    className={`w-full px-4 py-2 rounded-lg border ${
                                        isDarkMode
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-300">
                                    Mot de passe
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={`w-full px-4 py-2 rounded-lg border ${
                                        isDarkMode
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                            </div>
                            <p className="text-xs text-gray-400">
                                ⚠️ Laissez vide pour utiliser les identifiants stockés sur le serveur (.env), ou remplissez pour surcharger temporairement.
                            </p>
                        </div>
                    )}
                    
                    <button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                            isLoading
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                                <span>Connexion en cours...</span>
                            </>
                        ) : (
                            <>
                                <span className="iconoir-log-in text-2xl"></span>
                                <span>
                                    {useCredentials ? 'Connexion automatique complète' : 'Se connecter à FastGraphs'}
                                </span>
                            </>
                        )}
                    </button>

                    {sessionUrl && (
                        <button
                            onClick={() => window.open(sessionUrl, '_blank')}
                            className="w-full mt-4 py-3 px-6 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="iconoir-new-tab"></span>
                            Ouvrir la session dans un nouvel onglet
                        </button>
                    )}

                    {/* Affichage des étapes d'automatisation */}
                    {automationSteps.length > 0 && (
                        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-blue-400 font-medium mb-2">Étapes d'automatisation:</p>
                            <ul className="space-y-1 text-sm">
                                {automationSteps.map((step, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                        {step.success ? (
                                            <span className="text-green-400">✓</span>
                                        ) : (
                                            <span className="text-red-400">✗</span>
                                        )}
                                        <span className={step.success ? 'text-green-300' : 'text-red-300'}>
                                            {step.step === 'click_login' && 'Clic sur Log In'}
                                            {step.step === 'fill_credentials' && 'Remplissage des identifiants'}
                                            {step.step === 'submit_form' && 'Soumission du formulaire'}
                                            {step.message && ` - ${step.message}`}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Instructions Card */}
                <div className={`rounded-lg p-6 ${
                    isDarkMode 
                        ? 'bg-gray-800 border border-gray-700' 
                        : 'bg-gray-50 border border-gray-200'
                }`}>
                    <h2 className="text-xl font-semibold mb-4">Instructions</h2>
                    
                    {useCredentials ? (
                        <ol className="list-decimal list-inside space-y-2 text-gray-300">
                            <li>Cochez "Automatiser la connexion complète"</li>
                            <li>
                                Si vous avez configuré vos identifiants dans le fichier .env (FASTGRAPHS_EMAIL / FASTGRAPHS_PASSWORD),
                                laissez les champs vides. Sinon, entrez-les manuellement.
                            </li>
                            <li>Cliquez sur "Connexion automatique complète"</li>
                            <li>Le système va automatiquement :
                                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                    <li>Créer une session Browserbase</li>
                                    <li>Naviguer vers fastgraphs.com</li>
                                    <li>Cliquer sur "Log In"</li>
                                    <li>Remplir vos identifiants (env ou manuel)</li>
                                    <li>Soumettre le formulaire</li>
                                </ul>
                            </li>
                            <li>Vous serez connecté automatiquement !</li>
                        </ol>
                    ) : (
                        <ol className="list-decimal list-inside space-y-2 text-gray-300">
                            <li>Cliquez sur le bouton "Se connecter à FastGraphs"</li>
                            <li>Une session Browserbase sera créée et ouverte dans un nouvel onglet</li>
                            <li>Le bouton "Log In" sera cliqué automatiquement</li>
                            <li>Entrez manuellement vos identifiants FastGraphs dans le formulaire</li>
                            <li>Vous serez connecté et pourrez utiliser FastGraphs</li>
                        </ol>
                    )}
                    
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-green-400 text-sm">
                            <strong>✨ Automatisation complète disponible !</strong> Cochez l'option et entrez vos identifiants 
                            pour une connexion 100% automatisée. Vos identifiants sont envoyés de manière sécurisée 
                            et utilisés uniquement pour la connexion.
                        </p>
                    </div>
                </div>

                {/* Workflow Info */}
                <div className={`mt-6 rounded-lg p-6 ${
                    isDarkMode 
                        ? 'bg-gray-800 border border-gray-700' 
                        : 'bg-gray-50 border border-gray-200'
                }`}>
                    <h2 className="text-xl font-semibold mb-4">Informations sur le workflow</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                            <span className="iconoir-check text-green-400 mt-0.5"></span>
                            <span className="text-gray-300">
                                <strong>URL:</strong> https://www.fastgraphs.com/
                            </span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="iconoir-check text-green-400 mt-0.5"></span>
                            <span className="text-gray-300">
                                <strong>Action:</strong> Cliquer sur le bouton "Log In"
                            </span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="iconoir-check text-green-400 mt-0.5"></span>
                            <span className="text-gray-300">
                                <strong>Service:</strong> Browserbase (Browserless automation)
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.FastGraphsTab = FastGraphsTab;

