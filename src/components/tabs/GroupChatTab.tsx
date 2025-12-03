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
    userAlias: string;
    userIcon: string;
}

const ENV_CHAT_URL = import.meta.env.VITE_GROUP_CHAT_URL;
const FALLBACK_CHAT_URL = 'https://chatgpt.com/gg/your-session-link?token=<token-partage>'; // URL fournie hors code; pas de secret embarqué
const DEFAULT_CHAT_URL = ENV_CHAT_URL || FALLBACK_CHAT_URL;

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
    userAlias: 'Analyste GOB',
    userIcon: '🧠',
};

const formatTemperature = (value: number) => Math.max(0, Math.min(1, Number(value) || 0));
const iconChoices = ['🧠', '🦉', '💹', '📊', '🚀', '🛡️', '🎯', '🗝️'];

const GroupChatTab: React.FC<TabProps> = () => {
    const [settings, setSettings] = useState<ChatSessionSettings>(defaultSettings);
    const [copied, setCopied] = useState(false);
    const [iframeError, setIframeError] = useState<string | null>(null);
    const [accessSafety, setAccessSafety] = useState<'token' | 'needs-token'>('token');
    const [sessionOrigin, setSessionOrigin] = useState<string>('chatgpt.com');
    const hasEnvChatUrl = Boolean(ENV_CHAT_URL && ENV_CHAT_URL.trim());
    const isUsingEnvDefault = settings.sessionUrl === DEFAULT_CHAT_URL;

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
                <div className="space-y-1">
                    <p className="text-xs text-blue-200 uppercase tracking-[0.2em]">Chat d’investissement sécurisé</p>
                    <h2 className="text-3xl font-bold flex items-center gap-2">
                        Salon partagé — Comité de placement
                        <span className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-blue-900 text-blue-100 border border-blue-500/50">Live</span>
                    </h2>
                    <p className="text-gray-300 mt-1 max-w-3xl">
                        Pilotez le salon ChatGPT du comité : alias, icônes, prompts, accès sans login et prévisualisation intégrée. Tout est optimisé pour des décisions en temps réel.
                    </p>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex gap-3">
                        <button
                            onClick={handleCopyLink}
                            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-blue-400 transition-colors"
                        >
                            {copied ? 'Lien copié ✅' : 'Copier le lien'}
                        </button>
                        <button
                            onClick={handleOpenChat}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                        >
                            Ouvrir dans un nouvel onglet
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-gray-900 via-gray-850 to-black border border-gray-700 shadow relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.1),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.08),transparent_30%)] pointer-events-none" />
                        <div className="flex items-center justify-between flex-wrap gap-3 mb-3 relative z-10">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded-md bg-blue-900/50 text-blue-100 text-xs border border-blue-700/50">Prévisualisation</span>
                                    <span className="px-2 py-1 rounded-md bg-gray-900/70 text-gray-200 text-xs border border-gray-700">{sessionOrigin}</span>
                                    {accessSafety === 'token' ? (
                                        <span className="px-2 py-1 rounded-md bg-emerald-900/60 text-emerald-100 text-xs border border-emerald-600/60">Lien partagé (auto-access)</span>
                                    ) : (
                                        <span className="px-2 py-1 rounded-md bg-amber-900/70 text-amber-100 text-xs border border-amber-700">Ajoutez un token pour éviter toute demande de login</span>
                                    )}
                                </div>
                                <h3 className="text-lg font-semibold">{settings.roomName}</h3>
                                <p className="text-sm text-gray-200">Admin : {settings.adminDisplayName}</p>
                            </div>
                        <div className="flex items-center gap-3 text-sm text-gray-200">
                            <span className="px-3 py-1 rounded-full bg-gray-900 text-gray-100 border border-gray-700">Source : {sessionOrigin === 'chatgpt.com' ? 'chatgpt.com (temps réel)' : sessionOrigin}</span>
                            <span
                                className={`px-3 py-1 rounded-full border ${
                                    hasEnvChatUrl
                                        ? 'bg-emerald-900/60 text-emerald-100 border-emerald-600/60'
                                        : 'bg-amber-900/60 text-amber-100 border-amber-700'
                                }`}
                            >
                                {hasEnvChatUrl
                                    ? 'URL par défaut chargée depuis .env/Vercel'
                                    : 'Ajoutez VITE_GROUP_CHAT_URL dans .env ou Vercel'}
                            </span>
                            {iframeError ? (
                                <span className="text-red-300">{iframeError}</span>
                            ) : (
                                    <span className="text-green-300">Connexion prête</span>
                                )}
                            </div>
                        </div>
                        <div className="aspect-video rounded-lg overflow-hidden border border-gray-700 bg-black relative z-10">
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
                                <p className="text-xs text-blue-200">
                                    Par défaut, le lien est chargé depuis la variable d’environnement <code className="px-1 py-0.5 rounded bg-gray-900 border border-gray-700">VITE_GROUP_CHAT_URL</code> (fichier <code className="px-1 py-0.5 rounded bg-gray-900 border border-gray-700">.env</code>). Vous pouvez la coller là pour éviter toute donnée sensible dans le code. {isUsingEnvDefault ? 'Valeur actuelle : lien par défaut.' : 'Valeur surchargée localement via le formulaire.'}
                                </p>
                                <p className="text-xs text-gray-300">
                                    Déploiement Vercel : renseignez <code className="px-1 py-0.5 rounded bg-gray-900 border border-gray-700">VITE_GROUP_CHAT_URL</code> dans <strong>Settings → Environment Variables</strong> (Production/Preview/Development), puis redéployez. Ainsi, le tableau de bord charge automatiquement le lien sécurisé sans l’inclure dans le code source.
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

                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <label className="space-y-1 md:col-span-2">
                                    <span className="text-sm text-gray-300">Alias dans le salon</span>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-blue-400"
                                        value={settings.userAlias}
                                        onChange={e => handleChange('userAlias', e.target.value)}
                                        placeholder="Ex. Stratège Macro, Analyste Tech, Risk Officer"
                                    />
                                    <p className="text-xs text-gray-400">Nom affiché pour vos interventions dans le salon partagé.</p>
                                </label>

                                <div className="space-y-2">
                                    <span className="text-sm text-gray-300">Icône</span>
                                    <div className="grid grid-cols-4 gap-2">
                                        {iconChoices.map(icon => (
                                            <button
                                                key={icon}
                                                onClick={() => handleChange('userIcon', icon)}
                                                className={`aspect-square rounded-lg border text-xl flex items-center justify-center transition ${
                                                    settings.userIcon === icon
                                                        ? 'border-blue-400 bg-blue-900/40'
                                                        : 'border-gray-700 bg-gray-900 hover:border-blue-400'
                                                }`}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400">Choisissez un repère visuel cohérent pour le comité.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/40 via-gray-900 to-black border border-blue-500/30 shadow space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-400 flex items-center justify-center text-2xl">
                                {settings.userIcon}
                            </div>
                            <div>
                                <p className="text-xs uppercase text-blue-200 tracking-wide">Carte identité</p>
                                <h3 className="text-lg font-semibold">{settings.userAlias}</h3>
                                <p className="text-sm text-gray-300">Votre empreinte dans le salon de comité.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-200">
                            <div className="p-3 rounded-lg bg-gray-900/70 border border-gray-700">
                                <p className="text-xs text-gray-400">Ton</p>
                                <p className="font-semibold text-white">{settings.defaultTone}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-900/70 border border-gray-700">
                                <p className="text-xs text-gray-400">Température</p>
                                <p className="font-semibold text-white">{settings.temperature}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-900/70 border border-gray-700">
                                <p className="text-xs text-gray-400">Historique</p>
                                <p className="font-semibold text-white">{settings.maxMessages} msgs</p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-900/70 border border-gray-700">
                                <p className="text-xs text-gray-400">Accès</p>
                                <p className="font-semibold text-white">{accessSafety === 'token' ? 'Auto-join sans login' : 'À sécuriser (token)'}</p>
                            </div>
                        </div>
                    </div>

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
