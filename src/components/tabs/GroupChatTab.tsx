import React, { useEffect, useMemo, useState } from 'react';
import type { TabProps } from '../../types';

interface ChatSessionSettings {
    sessionUrl: string;
    roomName: string;
    adminDisplayName: string;
    welcomeMessage: string;
    systemPrompt: string;
    defaultTone: string;
    temperature: number;
    maxMessages: number;
    allowGuests: boolean;
    autoJoin: boolean;
    pinnedResource: string;
}

const DEFAULT_CHAT_URL =
    'https://chatgpt.com/gg/v/692f1bec2e888196aa1036510bcecf81?token=aTookhJozWkSBy40JOR02w';

const LOCAL_STORAGE_KEY = 'gob-group-chat-settings-v1';

const defaultSettings: ChatSessionSettings = {
    sessionUrl: DEFAULT_CHAT_URL,
    roomName: 'GOB x ChatGPT — Salon équipe',
    adminDisplayName: 'Admin GOB',
    welcomeMessage: "Bienvenue dans le salon d'équipe ! On synchronise ici toutes les décisions.",
    systemPrompt:
        "Tu agis comme facilitateur de chat de groupe : résume, attribue des tâches et garde le contexte clair.",
    defaultTone: 'Professionnel & bienveillant',
    temperature: 0.35,
    maxMessages: 500,
    allowGuests: true,
    autoJoin: true,
    pinnedResource: 'https://chat.openai.com',
};

const formatTemperature = (value: number) => Math.max(0, Math.min(1, Number(value) || 0));

const GroupChatTab: React.FC<TabProps> = () => {
    const [settings, setSettings] = useState<ChatSessionSettings>(defaultSettings);
    const [copied, setCopied] = useState(false);
    const [iframeError, setIframeError] = useState<string | null>(null);
    const [accessSafety, setAccessSafety] = useState<'token' | 'needs-token'>('token');
    const [sessionOrigin, setSessionOrigin] = useState<string>('chatgpt.com');

    useEffect(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setSettings({ ...defaultSettings, ...parsed });
            }
        } catch (error) {
            console.warn('Impossible de charger les paramètres du clavardage', error);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.warn('Impossible de sauvegarder les paramètres du clavardage', error);
        }
    }, [settings]);

    useEffect(() => {
        setAccessSafety(settings.sessionUrl.includes('token=') ? 'token' : 'needs-token');
        try {
            const url = new URL(settings.sessionUrl);
            setSessionOrigin(url.hostname);
        } catch (error) {
            console.warn('URL de session invalide', error);
            setSessionOrigin('inconnue');
        }
    }, [settings.sessionUrl]);

    const handleChange = <K extends keyof ChatSessionSettings>(key: K, value: ChatSessionSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(settings.sessionUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Impossible de copier le lien', error);
        }
    };

    const handleOpenChat = () => {
        window.open(settings.sessionUrl, '_blank', 'noopener,noreferrer');
    };

    const handleReset = () => setSettings(defaultSettings);

    const chatGuardrails = useMemo(
        () => [
            'Confirmer l’objectif de la réunion en une phrase.',
            'Lister les décisions prises et les propriétaires.',
            'Vérifier que tout le monde dispose du lien ChatGPT et peut rejoindre.',
            'Garder un ton respectueux, synthétique, orienté action.',
        ],
        []
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <p className="text-sm text-blue-200 uppercase tracking-wide">Clavardage de groupe propulsé par ChatGPT</p>
                    <h2 className="text-2xl font-bold">Salon partagé — Session officielle</h2>
                    <p className="text-gray-300 mt-1">Lien unique vers la session : ajustez les paramètres et ouvrez le salon directement depuis le dashboard.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleCopyLink}
                        className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-blue-400 transition-colors"
                    >
                        {copied ? 'Lien copié ✅' : 'Copier le lien'}
                    </button>
                    <button
                        onClick={handleOpenChat}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                    >
                        Ouvrir le salon ChatGPT
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    <div className="p-4 rounded-xl bg-emerald-900/40 border border-emerald-700 text-emerald-50 shadow flex items-start gap-3">
                        <div className="text-emerald-200 font-semibold">⚙️ Accès auto</div>
                        <div className="text-sm leading-relaxed">
                            Aucun compte utilisateur n’est requis : on utilise uniquement le lien de session partagé avec jeton pour ouvrir le salon automatiquement depuis l’interface. Aucune authentification locale n’est demandée ni stockée.
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 shadow">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-xs uppercase text-blue-200 tracking-wide">Session live</p>
                                <h3 className="text-lg font-semibold">Prévisualisation intégrée</h3>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                {accessSafety === 'token' ? (
                                    <span className="px-3 py-1 rounded-full bg-emerald-900 text-emerald-100 border border-emerald-700">
                                        Lien partagé (auto-access)
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full bg-amber-900 text-amber-100 border border-amber-700">
                                        Ajoutez un token pour éviter toute demande de login
                                    </span>
                                )}
                                <span className="px-3 py-1 rounded-full bg-gray-900 text-gray-100 border border-gray-700">
                                    Source : {sessionOrigin === 'chatgpt.com' ? 'chatgpt.com (temps réel)' : sessionOrigin}
                                </span>
                                {iframeError ? (
                                    <span className="text-red-300">{iframeError}</span>
                                ) : (
                                    <span className="text-green-300">Connexion prête</span>
                                )}
                            </div>
                        </div>
                        <div className="aspect-video rounded-lg overflow-hidden border border-gray-700 bg-black relative">
                            <iframe
                                src={settings.sessionUrl}
                                title="Session de clavardage ChatGPT"
                                className="w-full h-full"
                                allow="clipboard-read; clipboard-write; fullscreen; accelerometer; camera; microphone"
                                referrerPolicy="no-referrer"
                                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
                                onError={() => setIframeError('La prévisualisation est bloquée. Ouvrez dans un nouvel onglet si nécessaire.')}
                            />
                            {iframeError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-center p-4">
                                    <div>
                                        <p className="font-semibold text-white">Prévisualisation indisponible</p>
                                        <p className="text-gray-300 text-sm mt-1">Le domaine externe peut bloquer l’iframe. Utilisez le bouton ci-dessus pour ouvrir le salon.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 shadow space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase text-blue-200 tracking-wide">Contrôles admin</p>
                                <h3 className="text-lg font-semibold">Paramétrage de la session</h3>
                                <p className="text-gray-300 text-sm">Tout est sauvegardé localement (dashboard only) pour ne jamais perdre la configuration.</p>
                            </div>
                            <button
                                onClick={handleReset}
                                className="px-3 py-2 rounded-lg border border-gray-600 text-sm hover:border-blue-400"
                            >
                                Réinitialiser
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="space-y-1">
                                <span className="text-sm text-gray-300">Lien du salon (ChatGPT group)</span>
                                <input
                                    type="url"
                                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-blue-400"
                                    value={settings.sessionUrl}
                                    onChange={e => handleChange('sessionUrl', e.target.value)}
                                    placeholder="https://chatgpt.com/gg/..."
                                />
                                <p className="text-xs text-gray-400">
                                    Le lien partagé par ChatGPT pour rejoindre la session. Utilisez un lien avec un « token » pour que les invités accèdent sans aucune connexion manuelle.
                                </p>
                                {accessSafety === 'needs-token' && (
                                    <p className="text-xs text-amber-300">⚠️ Ajoutez le paramètre token=… pour garantir l’accès automatique sans login.</p>
                                )}
                            </label>

                            <label className="space-y-1">
                                <span className="text-sm text-gray-300">Nom du salon</span>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-blue-400"
                                    value={settings.roomName}
                                    onChange={e => handleChange('roomName', e.target.value)}
                                />
                            </label>

                            <label className="space-y-1">
                                <span className="text-sm text-gray-300">Nom affiché (admin)</span>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-blue-400"
                                    value={settings.adminDisplayName}
                                    onChange={e => handleChange('adminDisplayName', e.target.value)}
                                />
                            </label>

                            <label className="space-y-1">
                                <span className="text-sm text-gray-300">Message d’accueil</span>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-blue-400"
                                    value={settings.welcomeMessage}
                                    onChange={e => handleChange('welcomeMessage', e.target.value)}
                                />
                            </label>

                            <label className="space-y-1 md:col-span-2">
                                <span className="text-sm text-gray-300">Système (prompt de session)</span>
                                <textarea
                                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-blue-400"
                                    rows={3}
                                    value={settings.systemPrompt}
                                    onChange={e => handleChange('systemPrompt', e.target.value)}
                                />
                                <p className="text-xs text-gray-400">Idéal pour verrouiller les règles d’animation (résumés, next steps, rôles).</p>
                            </label>

                            <label className="space-y-1">
                                <span className="text-sm text-gray-300">Ton / persona</span>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-blue-400"
                                    value={settings.defaultTone}
                                    onChange={e => handleChange('defaultTone', e.target.value)}
                                />
                            </label>

                            <label className="space-y-1">
                                <span className="text-sm text-gray-300">Température (0-1)</span>
                                <input
                                    type="number"
                                    step="0.05"
                                    min={0}
                                    max={1}
                                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-blue-400"
                                    value={settings.temperature}
                                    onChange={e => handleChange('temperature', formatTemperature(Number(e.target.value)))}
                                />
                            </label>

                            <label className="space-y-1">
                                <span className="text-sm text-gray-300">Historique conservé (messages)</span>
                                <input
                                    type="number"
                                    min={20}
                                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-blue-400"
                                    value={settings.maxMessages}
                                    onChange={e => handleChange('maxMessages', Number(e.target.value) || 0)}
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm text-gray-300">Options d’accès</span>
                                <div className="flex items-center gap-3 text-sm text-gray-200">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.allowGuests}
                                            onChange={e => handleChange('allowGuests', e.target.checked)}
                                        />
                                        Autoriser les invités
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.autoJoin}
                                            onChange={e => handleChange('autoJoin', e.target.checked)}
                                        />
                                        Auto-join à l’ouverture
                                    </label>
                                </div>
                            </label>

                            <label className="space-y-1 md:col-span-2">
                                <span className="text-sm text-gray-300">Ressource épinglée</span>
                                <input
                                    type="url"
                                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-blue-400"
                                    value={settings.pinnedResource}
                                    onChange={e => handleChange('pinnedResource', e.target.value)}
                                    placeholder="Lien vers un doc de synthèse ou un brief"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 shadow">
                        <p className="text-xs uppercase text-blue-200 tracking-wide">Checklist</p>
                        <h3 className="text-lg font-semibold mb-2">Règles d’or du salon</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-200 text-sm">
                            {chatGuardrails.map(item => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 shadow space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase text-blue-200 tracking-wide">Statut</p>
                                <h3 className="text-lg font-semibold">Configuration actuelle</h3>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-green-900 text-green-200 text-xs">Prête</span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-200">
                            <div className="flex items-center justify-between"><span>Nom</span><strong>{settings.roomName}</strong></div>
                            <div className="flex items-center justify-between"><span>Admin</span><strong>{settings.adminDisplayName}</strong></div>
                            <div className="flex items-center justify-between">
                                <span>Accès</span>
                                <strong className={accessSafety === 'token' ? 'text-emerald-200' : 'text-amber-200'}>
                                    {accessSafety === 'token' ? 'Lien partagé sans login' : 'Lien à sécuriser (token)'}
                                </strong>
                            </div>
                            <div className="flex items-center justify-between"><span>Température</span><strong>{settings.temperature}</strong></div>
                            <div className="flex items-center justify-between"><span>Historique</span><strong>{settings.maxMessages} msgs</strong></div>
                            <div className="flex items-center justify-between"><span>Accès invités</span><strong>{settings.allowGuests ? 'Oui' : 'Non'}</strong></div>
                            <div className="flex items-center justify-between"><span>Auto-join</span><strong>{settings.autoJoin ? 'Actif' : 'Off'}</strong></div>
                        </div>
                        <div className="pt-2 border-t border-gray-700 text-sm text-gray-300">
                            <p className="font-semibold text-gray-100">Message d’accueil</p>
                            <p>{settings.welcomeMessage}</p>
                        </div>
                        <div className="pt-2 border-t border-gray-700 text-sm text-gray-300">
                            <p className="font-semibold text-gray-100">Ressource épinglée</p>
                            <a
                                className="text-blue-300 hover:text-blue-200 break-all"
                                href={settings.pinnedResource}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {settings.pinnedResource}
                            </a>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 shadow space-y-3">
                        <p className="text-xs uppercase text-blue-200 tracking-wide">Mode opératoire</p>
                        <h3 className="text-lg font-semibold">Déploiement rapide</h3>
                        <ol className="list-decimal list-inside space-y-2 text-gray-200 text-sm">
                            <li>Valider/ajuster le lien de session ChatGPT ci-dessus.</li>
                            <li>Partager le lien avec l’équipe (bouton « Copier »).</li>
                            <li>Ouvrir le salon et lancer l’animation (bouton « Ouvrir »).</li>
                            <li>Utiliser le prompt système pour guider les résumés et décisions.</li>
                        </ol>
                        <p className="text-xs text-gray-400">Toutes les valeurs sont sauvegardées localement pour un relancement instantané.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupChatTab;
