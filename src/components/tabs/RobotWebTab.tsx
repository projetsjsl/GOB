import React, { useState } from 'react';

const DEFAULT_CHAT_URL =
    'https://chatgpt.com/gg/v/692f1bec2e888196aa1036510bcecf81?token=aTookhJozWkSBy40JOR02w';

const RobotWebTab: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(DEFAULT_CHAT_URL);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (error) {
            console.warn('Impossible de copier le lien ChatGPT', error);
        }
    };

    const handleOpen = () => {
        window.open(DEFAULT_CHAT_URL, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 border border-gray-700 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.06),transparent_30%)] pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm text-blue-100 uppercase tracking-[0.15em]">
                        <span className="px-2 py-1 rounded-full border border-blue-500/40 bg-blue-900/30">RobotWeb</span>
                        <span className="px-2 py-1 rounded-full border border-emerald-500/40 bg-emerald-900/30">Accès direct</span>
                        <span className="px-2 py-1 rounded-full border border-gray-600 bg-gray-800">Sans login</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Raccourci RobotWeb → Salon ChatGPT</h2>
                            <p className="text-gray-200 max-w-2xl mt-1">
                                Retrouvez l’accès instantané au salon de clavardage partagé directement depuis la zone RobotWeb, sans authentification requise.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCopy}
                                className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 hover:border-blue-400 transition-colors"
                            >
                                {copied ? 'Lien copié ✅' : 'Copier le lien'}
                            </button>
                            <button
                                onClick={handleOpen}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                            >
                                Ouvrir le salon
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 p-4 rounded-xl bg-black/40 border border-gray-700 text-sm text-gray-200 flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded-md bg-emerald-900/60 text-emerald-100 border border-emerald-700/60 text-xs">Auto-access</span>
                            <span className="text-gray-300">Lien tokenisé prêt à l’emploi pour le comité.</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                            <span className="px-2 py-1 rounded-md bg-gray-800 border border-gray-700">chatgpt.com</span>
                            <span className="text-gray-400">Prévu pour être ouvert dans un nouvel onglet sécurisé (noopener).</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 shadow">
                <h3 className="text-lg font-semibold mb-2">Pourquoi à côté de RobotWeb ?</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                    Le comité peut ainsi passer des automatisations RobotWeb au clavardage collectif en un clic. L’onglet « ChatGPT Groupe » suit immédiatement dans la barre de navigation pour rester accessible à tout moment.
                </p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-200">
                    <div className="p-3 rounded-lg bg-gray-900 border border-gray-700">
                        <p className="font-semibold mb-1">Raccourci immédiat</p>
                        <p className="text-gray-300">Bouton direct vers le salon partagé, sans imposer de compte aux invités.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-900 border border-gray-700">
                        <p className="font-semibold mb-1">Aligné sur la nav</p>
                        <p className="text-gray-300">Placée juste avant l’onglet « ChatGPT Groupe » pour garder la cohérence de parcours.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RobotWebTab;
