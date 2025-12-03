import React, { useMemo, useState } from 'react';

interface AutomationPlan {
    targetUrl: string;
    journey: string;
    runHeadless: boolean;
    captureScreenshots: boolean;
    waitStrategy: 'auto' | 'custom';
    customDelay: number;
}

const defaultPlan: AutomationPlan = {
    targetUrl: 'https://example.com',
    journey: 'Ouvrir la page, attendre le rendu complet, puis prendre une capture et extraire le titre.',
    runHeadless: true,
    captureScreenshots: true,
    waitStrategy: 'auto',
    customDelay: 5,
};

const RobotWebTab: React.FC = () => {
    const [plan, setPlan] = useState<AutomationPlan>(defaultPlan);
    const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
    const [log, setLog] = useState<string[]>(['Prêt à lancer une navigation automatisée.']);

    const updatePlan = <K extends keyof AutomationPlan>(key: K, value: AutomationPlan[K]) => {
        setPlan(prev => ({ ...prev, [key]: value }));
    };

    const handleStart = () => {
        setStatus('running');
        setLog(prev => [
            ...prev,
            `▶️ Lancement RobotWeb sur ${plan.targetUrl}`,
            plan.runHeadless ? 'Mode headless activé' : 'Mode visuel (non-headless)',
            plan.captureScreenshots ? 'Captures activées' : 'Captures désactivées',
            plan.waitStrategy === 'auto'
                ? 'Attente auto (chargement complet du DOM)'
                : `Attente personnalisée ${plan.customDelay}s`,
        ]);

        setTimeout(() => {
            setStatus('done');
            setLog(prev => [...prev, '✅ Parcours terminé (simulation locale).']);
        }, 400);
    };

    const handleReset = () => {
        setPlan(defaultPlan);
        setStatus('idle');
        setLog(['Prêt à lancer une navigation automatisée.']);
    };

    const statusBadge = useMemo(() => {
        switch (status) {
            case 'running':
                return <span className="px-3 py-1 rounded-full bg-blue-900 text-blue-100 border border-blue-500/60">En cours</span>;
            case 'done':
                return <span className="px-3 py-1 rounded-full bg-emerald-900 text-emerald-100 border border-emerald-600/60">Terminé</span>;
            default:
                return <span className="px-3 py-1 rounded-full bg-gray-900 text-gray-100 border border-gray-600">Prêt</span>;
        }
    }, [status]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-1">
                    <p className="text-xs text-emerald-200 uppercase tracking-[0.2em]">Navigation automatisée</p>
                    <h2 className="text-3xl font-bold">RobotWeb — Automated Browser</h2>
                    <p className="text-gray-300 max-w-3xl">
                        Configurez un parcours web automatisé (headless) sans mélanger les flux ChatGPT. Les paramètres ci-dessous
                        sont dédiés au navigateur robotisé uniquement.
                    </p>
                </div>
                <div className="flex items-center gap-2">{statusBadge}</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-gray-900 via-gray-850 to-black border border-gray-700 shadow relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.09),transparent_30%)] pointer-events-none" />
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="space-y-1">
                                    <p className="text-xs uppercase text-emerald-200 tracking-[0.15em]">Plan de navigation</p>
                                    <h3 className="text-lg font-semibold">Définir le parcours</h3>
                                    <p className="text-gray-300 text-sm">URL, scénario et options d’attente/capture.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleReset}
                                        className="px-3 py-2 rounded-lg border border-gray-600 text-sm hover:border-emerald-400"
                                    >
                                        Réinitialiser
                                    </button>
                                    <button
                                        onClick={handleStart}
                                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                    >
                                        Lancer RobotWeb
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="space-y-1 md:col-span-2">
                                    <span className="text-sm text-gray-300">URL cible</span>
                                    <input
                                        type="url"
                                        className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-emerald-400"
                                        value={plan.targetUrl}
                                        onChange={e => updatePlan('targetUrl', e.target.value)}
                                        placeholder="https://..."
                                    />
                                    <p className="text-xs text-gray-400">Adresse que le navigateur automatisé doit charger.</p>
                                </label>

                                <label className="space-y-1 md:col-span-2">
                                    <span className="text-sm text-gray-300">Scénario</span>
                                    <textarea
                                        className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-emerald-400"
                                        rows={3}
                                        value={plan.journey}
                                        onChange={e => updatePlan('journey', e.target.value)}
                                    />
                                    <p className="text-xs text-gray-400">Décrivez les étapes (clics, extractions, captures) à exécuter.</p>
                                </label>

                                <label className="inline-flex items-center gap-2 text-sm text-gray-200">
                                    <input
                                        type="checkbox"
                                        checked={plan.runHeadless}
                                        onChange={e => updatePlan('runHeadless', e.target.checked)}
                                    />
                                    Exécuter en headless (sans fenêtre)
                                </label>

                                <label className="inline-flex items-center gap-2 text-sm text-gray-200">
                                    <input
                                        type="checkbox"
                                        checked={plan.captureScreenshots}
                                        onChange={e => updatePlan('captureScreenshots', e.target.checked)}
                                    />
                                    Captures d’écran automatiques
                                </label>

                                <label className="space-y-1">
                                    <span className="text-sm text-gray-300">Stratégie d’attente</span>
                                    <select
                                        className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-emerald-400"
                                        value={plan.waitStrategy}
                                        onChange={e => updatePlan('waitStrategy', e.target.value as AutomationPlan['waitStrategy'])}
                                    >
                                        <option value="auto">Auto (DOMContentLoaded)</option>
                                        <option value="custom">Personnalisée (delay)</option>
                                    </select>
                                </label>

                                <label className="space-y-1">
                                    <span className="text-sm text-gray-300">Délai custom (s)</span>
                                    <input
                                        type="number"
                                        min={0}
                                        className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-emerald-400"
                                        value={plan.customDelay}
                                        onChange={e => updatePlan('customDelay', Number(e.target.value) || 0)}
                                        disabled={plan.waitStrategy === 'auto'}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gray-900 border border-gray-700 shadow space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase text-emerald-200 tracking-[0.15em]">Sécurité</p>
                                <h3 className="text-lg font-semibold">Isolation RobotWeb</h3>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-200 text-xs border border-gray-700">
                                Sans ChatGPT
                            </span>
                        </div>
                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-200">
                            <li>Les flux ChatGPT/GroupChat sont exclus de cet onglet.</li>
                            <li>Utilisez uniquement des URLs publiques ou tokenisées fournies ailleurs.</li>
                            <li>Aucune donnée sensible n’est stockée dans le code; configurez les liens dans l’UI.</li>
                        </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 shadow space-y-3">
                        <p className="text-xs uppercase text-emerald-200 tracking-wide">Journal</p>
                        <h3 className="text-lg font-semibold">Activité</h3>
                        <div className="space-y-1 text-sm text-gray-200">
                            {log.map((entry, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                    <span className="text-emerald-300">•</span>
                                    <span>{entry}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 shadow space-y-3">
                        <p className="text-xs uppercase text-emerald-200 tracking-wide">Guide express</p>
                        <h3 className="text-lg font-semibold">Comment l’utiliser</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-200">
                            <li>Coller l’URL cible de l’automatisation.</li>
                            <li>Décrire le scénario (navigation, extraction, capture).</li>
                            <li>Choisir headless/visuel et la stratégie d’attente.</li>
                            <li>Lancer et suivre le log. Ajuster si besoin.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RobotWebTab;
