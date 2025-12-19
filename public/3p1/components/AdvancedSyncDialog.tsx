import React, { useState, useMemo, useEffect } from 'react';
import { XMarkIcon, ArrowPathIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon, QuestionMarkCircleIcon, ChevronDownIcon, ChevronUpIcon, ClockIcon, BookmarkIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { storage } from '../utils/storage';

interface AdvancedSyncDialogProps {
    isOpen: boolean;
    ticker?: string; // Si défini, sync d'un seul ticker, sinon sync de tous
    hasManualData?: boolean;
    onCancel: () => void;
    onConfirm: (options: SyncOptions) => void;
    isSyncing?: boolean;
    totalTickers?: number; // Nombre total de tickers pour estimation du temps
}

export interface SyncOptions {
    saveBeforeSync: boolean;
    replaceOrangeData: boolean; // Remplacer les données oranges (assumptions manuelles)
    syncAllTickers: boolean; // Synchroniser tous les tickers
    syncData: boolean; // Synchroniser les données historiques
    syncAssumptions: boolean; // Synchroniser les assumptions
    syncInfo: boolean; // Synchroniser les infos (nom, secteur, etc.)
    forceReplace: boolean; // Forcer le remplacement même des données manuelles
    syncOnlyNewYears: boolean; // Synchroniser uniquement les nouvelles années
    syncOnlyMissingMetrics: boolean; // Synchroniser uniquement les métriques manquantes
    preserveExclusions: boolean; // Préserver les exclusions de métriques (EPS, CF, BV, DIV)
    recalculateOutliers: boolean; // Recalculer la détection d'outliers
    updateCurrentPrice: boolean; // Mettre à jour le prix actuel
    syncValueLineMetrics: boolean; // Synchroniser les métriques ValueLine depuis Supabase
}

// Métadonnées pour chaque option : temps approximatif et utilité
interface OptionMetadata {
    timePerTickerMs: number; // Temps approximatif par ticker en millisecondes
    timeDescription: string; // Description du temps
    utility: 'essentiel' | 'recommandé' | 'optionnel' | 'avancé'; // Utilité de l'option
    utilityDescription: string; // Description de l'utilité
}

export const OPTION_METADATA: Record<keyof SyncOptions, OptionMetadata> = {
    saveBeforeSync: {
        timePerTickerMs: 200,
        timeDescription: '~200ms par ticker (sauvegarde snapshot)',
        utility: 'recommandé',
        utilityDescription: 'Permet de restaurer l\'état précédent en cas d\'erreur'
    },
    replaceOrangeData: {
        timePerTickerMs: 0, // Pas de temps supplémentaire, juste un flag
        timeDescription: 'Aucun temps supplémentaire',
        utility: 'optionnel',
        utilityDescription: 'Utile si vous voulez remplacer vos hypothèses manuelles par des calculs automatiques'
    },
    syncAllTickers: {
        timePerTickerMs: 0, // Pas de temps par ticker, c'est juste le scope
        timeDescription: 'Détermine le nombre de tickers à synchroniser',
        utility: 'essentiel',
        utilityDescription: 'Définit si on synchronise un ticker ou tous les tickers'
    },
    syncData: {
        timePerTickerMs: 1500, // Appel API FMP + traitement
        timeDescription: '~1.5s par ticker (appel API FMP + traitement)',
        utility: 'essentiel',
        utilityDescription: 'Récupère les données financières historiques (EPS, CF, BV, DIV, prix) - Option la plus importante'
    },
    syncAssumptions: {
        timePerTickerMs: 100, // Calculs CAGR et moyennes
        timeDescription: '~100ms par ticker (calculs CAGR et moyennes)',
        utility: 'essentiel',
        utilityDescription: 'Calcule automatiquement les taux de croissance et ratios cibles basés sur l\'historique'
    },
    syncInfo: {
        timePerTickerMs: 50, // Mise à jour des infos de base
        timeDescription: '~50ms par ticker (mise à jour infos)',
        utility: 'recommandé',
        utilityDescription: 'Met à jour le nom, secteur, description de l\'entreprise'
    },
    forceReplace: {
        timePerTickerMs: 0, // Pas de temps supplémentaire, juste un flag
        timeDescription: 'Aucun temps supplémentaire',
        utility: 'avancé',
        utilityDescription: 'Force le remplacement même des données manuelles (utilisé avec précaution)'
    },
    syncOnlyNewYears: {
        timePerTickerMs: -200, // Économise du temps en évitant les mises à jour
        timeDescription: 'Économise ~200ms par ticker (évite mises à jour années existantes)',
        utility: 'recommandé',
        utilityDescription: 'Plus rapide et préserve vos modifications manuelles sur les années existantes'
    },
    syncOnlyMissingMetrics: {
        timePerTickerMs: -100, // Économise du temps en évitant les remplacements
        timeDescription: 'Économise ~100ms par ticker (évite remplacements valeurs existantes)',
        utility: 'recommandé',
        utilityDescription: 'Complète progressivement les données sans écraser ce qui existe'
    },
    preserveExclusions: {
        timePerTickerMs: 0, // Pas de temps supplémentaire
        timeDescription: 'Aucun temps supplémentaire',
        utility: 'recommandé',
        utilityDescription: 'Préserve vos choix d\'exclusion de métriques aberrantes'
    },
    recalculateOutliers: {
        timePerTickerMs: 150, // Détection d'outliers
        timeDescription: '~150ms par ticker (détection outliers)',
        utility: 'recommandé',
        utilityDescription: 'Détecte et exclut automatiquement les métriques aberrantes (améliore la qualité des données)'
    },
    updateCurrentPrice: {
        timePerTickerMs: 50, // Récupération prix actuel
        timeDescription: '~50ms par ticker (récupération prix)',
        utility: 'recommandé',
        utilityDescription: 'Met à jour le prix actuel de l\'action pour les calculs de valorisation'
    },
    syncValueLineMetrics: {
        timePerTickerMs: 0, // Utilise le cache, pas de temps supplémentaire
        timeDescription: 'Aucun temps supplémentaire (utilise cache)',
        utility: 'optionnel',
        utilityDescription: 'Synchronise les métriques ValueLine depuis Supabase (securityRank, earningsPredictability, etc.)'
    }
};

// Interface pour un profil de synchronisation
interface SyncProfile {
    id: string;
    name: string;
    options: SyncOptions;
    isPreset: boolean; // true pour les presets par défaut, false pour les profils personnalisés
    description?: string; // Description détaillée du preset
    details?: string[]; // Liste des détails ventilés
    createdAt?: number;
    updatedAt?: number;
}

// Presets par défaut
const DEFAULT_PRESETS: SyncProfile[] = [
    {
        id: 'preset-complete',
        name: '🔄 Synchronisation Complète',
        isPreset: true,
        description: 'Synchronisation complète avec toutes les fonctionnalités activées. Idéal pour une mise à jour exhaustive de tous les tickers.',
        details: [
            '💾 Sauvegarde snapshot avant sync (permettre restauration)',
            '📊 Récupération données historiques FMP (30 ans : EPS, CF, BV, DIV, prix)',
            '📈 Calcul automatique assumptions (taux croissance, ratios cibles)',
            'ℹ️ Mise à jour infos entreprise (nom, secteur, logo, beta)',
            '🛡️ Préservation exclusions métriques aberrantes',
            '🔍 Recalcul détection outliers (amélioration qualité données)',
            '💰 Mise à jour prix actuel',
            '⭐ Synchronisation métriques ValueLine (Security Rank, Earnings Predictability)',
            '⚠️ Ne remplace PAS les données oranges (assumptions manuelles préservées)',
            '⏱️ Temps estimé : ~2.5s par ticker'
        ],
        options: {
            saveBeforeSync: true,
            replaceOrangeData: false,
            syncAllTickers: false,
            syncData: true,
            syncAssumptions: true,
            syncInfo: true,
            forceReplace: false,
            syncOnlyNewYears: false,
            syncOnlyMissingMetrics: false,
            preserveExclusions: true,
            recalculateOutliers: true,
            updateCurrentPrice: true,
            syncValueLineMetrics: true
        }
    },
    {
        id: 'preset-fast',
        name: '⚡ Synchronisation Rapide',
        isPreset: true,
        description: 'Synchronisation optimisée pour la vitesse. Économise du temps en évitant les opérations non essentielles.',
        details: [
            '❌ Pas de sauvegarde snapshot (gain ~200ms/ticker)',
            '📊 Récupération données historiques FMP (essentiel)',
            '📈 Calcul automatique assumptions (essentiel)',
            '❌ Pas de mise à jour infos entreprise (gain ~50ms/ticker)',
            '✅ Ajoute uniquement nouvelles années (évite merges complexes, gain ~200ms/ticker)',
            '✅ Ajoute uniquement métriques manquantes (évite remplacements, gain ~100ms/ticker)',
            '🛡️ Préservation exclusions métriques aberrantes',
            '❌ Pas de recalcul outliers (gain ~150ms/ticker)',
            '💰 Mise à jour prix actuel',
            '❌ Pas de sync ValueLine (gain temps)',
            '⚠️ Ne remplace PAS les données oranges',
            '⏱️ Temps estimé : ~1.5s par ticker (40% plus rapide)'
        ],
        options: {
            saveBeforeSync: false,
            replaceOrangeData: false,
            syncAllTickers: false,
            syncData: true,
            syncAssumptions: true,
            syncInfo: false,
            forceReplace: false,
            syncOnlyNewYears: true,
            syncOnlyMissingMetrics: true,
            preserveExclusions: true,
            recalculateOutliers: false,
            updateCurrentPrice: true,
            syncValueLineMetrics: false
        }
    },
    {
        id: 'preset-safe',
        name: '🛡️ Synchronisation Sécurisée',
        isPreset: true,
        description: 'Synchronisation sécurisée avec sauvegarde et préservation maximale des données existantes. Recommandé pour les mises à jour régulières.',
        details: [
            '💾 Sauvegarde snapshot avant sync (sécurité)',
            '📊 Récupération données historiques FMP',
            '📈 Calcul automatique assumptions',
            'ℹ️ Mise à jour infos entreprise',
            '✅ Ajoute uniquement nouvelles années (préserve modifications manuelles années existantes)',
            '✅ Ajoute uniquement métriques manquantes (ne remplace pas valeurs existantes)',
            '🛡️ Préservation exclusions métriques aberrantes',
            '🔍 Recalcul détection outliers',
            '💰 Mise à jour prix actuel',
            '⭐ Synchronisation métriques ValueLine',
            '⚠️ Ne remplace PAS les données oranges',
            '⏱️ Temps estimé : ~2.2s par ticker'
        ],
        options: {
            saveBeforeSync: true,
            replaceOrangeData: false,
            syncAllTickers: false,
            syncData: true,
            syncAssumptions: true,
            syncInfo: true,
            forceReplace: false,
            syncOnlyNewYears: true,
            syncOnlyMissingMetrics: true,
            preserveExclusions: true,
            recalculateOutliers: true,
            updateCurrentPrice: true,
            syncValueLineMetrics: true
        }
    },
    {
        id: 'preset-replace-all',
        name: '🔄 Remplacer Tout (Avancé)',
        isPreset: true,
        description: '⚠️ ATTENTION : Remplace TOUTES les données, y compris les modifications manuelles. Utiliser avec précaution.',
        details: [
            '💾 Sauvegarde snapshot avant sync (sécurité)',
            '📊 Récupération données historiques FMP',
            '📈 Calcul automatique assumptions',
            'ℹ️ Mise à jour infos entreprise',
            '🔄 Remplace TOUTES les données (même années existantes)',
            '🔄 Remplace TOUTES les métriques (même valeurs existantes)',
            '🔄 Remplace données oranges (assumptions manuelles remplacées par calculs automatiques)',
            '❌ Ne préserve PAS les exclusions (toutes métriques réévaluées)',
            '🔍 Recalcul détection outliers',
            '💰 Mise à jour prix actuel',
            '⭐ Synchronisation métriques ValueLine',
            '⚠️ DESTRUCTIF : Perd toutes modifications manuelles',
            '⏱️ Temps estimé : ~2.5s par ticker'
        ],
        options: {
            saveBeforeSync: true,
            replaceOrangeData: true,
            syncAllTickers: false,
            syncData: true,
            syncAssumptions: true,
            syncInfo: true,
            forceReplace: true,
            syncOnlyNewYears: false,
            syncOnlyMissingMetrics: false,
            preserveExclusions: false,
            recalculateOutliers: true,
            updateCurrentPrice: true,
            syncValueLineMetrics: true
        }
    },
    {
        id: 'preset-info-only',
        name: 'ℹ️ Infos Uniquement',
        isPreset: true,
        description: 'Met à jour uniquement les informations de base (nom, secteur, logo, beta, prix). Aucune modification des données historiques.',
        details: [
            '❌ Pas de sauvegarde snapshot',
            '❌ Pas de récupération données historiques FMP',
            '❌ Pas de calcul assumptions',
            'ℹ️ Mise à jour infos entreprise uniquement (nom, secteur, logo, beta)',
            '💰 Mise à jour prix actuel',
            '⭐ Synchronisation métriques ValueLine',
            '🛡️ Préservation exclusions métriques aberrantes',
            '✅ Aucune modification données historiques',
            '✅ Aucune modification assumptions',
            '⏱️ Temps estimé : ~100ms par ticker (très rapide)'
        ],
        options: {
            saveBeforeSync: false,
            replaceOrangeData: false,
            syncAllTickers: false,
            syncData: false,
            syncAssumptions: false,
            syncInfo: true,
            forceReplace: false,
            syncOnlyNewYears: false,
            syncOnlyMissingMetrics: false,
            preserveExclusions: true,
            recalculateOutliers: false,
            updateCurrentPrice: true,
            syncValueLineMetrics: true
        }
    }
];

const STORAGE_KEY_SYNC_PROFILES = '3p1_sync_profiles';

// Composant d'aide pour chaque option
const HelpSection: React.FC<{ 
    id: string; 
    title: string; 
    children: React.ReactNode;
    showHelp: { [key: string]: boolean };
    setShowHelp: (prev: (prev: { [key: string]: boolean }) => { [key: string]: boolean }) => void;
}> = ({ id, title, children, showHelp, setShowHelp }) => {
    const isOpen = showHelp[id] || false;
    return (
        <div className="mt-2">
            <button
                onClick={() => setShowHelp(prev => ({ ...prev, [id]: !prev[id] }))}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
                <QuestionMarkCircleIcon className="w-4 h-4" />
                <span>En savoir plus</span>
                {isOpen ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
            </button>
            {isOpen && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-gray-700">
                    <h5 className="font-semibold text-blue-900 mb-2">{title}</h5>
                    {children}
                </div>
            )}
        </div>
    );
};

export const AdvancedSyncDialog: React.FC<AdvancedSyncDialogProps> = ({
    isOpen,
    ticker,
    hasManualData = false,
    onCancel,
    onConfirm,
    isSyncing = false,
    totalTickers = 1010 // Par défaut, estimation pour 1010 tickers
}) => {
    const [options, setOptions] = useState<SyncOptions>({
        saveBeforeSync: true,
        replaceOrangeData: false,
        syncAllTickers: !ticker, // Si pas de ticker spécifique, sync tous par défaut
        syncData: true,
        syncAssumptions: true,
        syncInfo: true,
        forceReplace: false,
        syncOnlyNewYears: false,
        syncOnlyMissingMetrics: false,
        preserveExclusions: true,
        recalculateOutliers: true,
        updateCurrentPrice: true,
        syncValueLineMetrics: true
    });

    const [showHelp, setShowHelp] = useState<{ [key: string]: boolean }>({});
    
    // ✅ États pour les profils de synchronisation
    const [selectedProfileId, setSelectedProfileId] = useState<string>('preset-complete');
    const [customProfiles, setCustomProfiles] = useState<SyncProfile[]>([]);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
    const [showSaveProfileDialog, setShowSaveProfileDialog] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');

    // ✅ Charger les profils personnalisés au montage
    useEffect(() => {
        const loadCustomProfiles = async () => {
            try {
                const saved = await storage.getItem(STORAGE_KEY_SYNC_PROFILES);
                if (saved && Array.isArray(saved)) {
                    setCustomProfiles(saved);
                }
            } catch (error) {
                console.warn('Erreur lors du chargement des profils:', error);
            } finally {
                setIsLoadingProfiles(false);
            }
        };
        loadCustomProfiles();
    }, []);

    // ✅ Tous les profils (presets + personnalisés)
    const allProfiles = useMemo(() => {
        return [...DEFAULT_PRESETS, ...customProfiles];
    }, [customProfiles]);

    // ✅ Charger un profil
    const loadProfile = (profileId: string) => {
        const profile = allProfiles.find(p => p.id === profileId);
        if (profile) {
            setOptions({
                ...profile.options,
                syncAllTickers: !ticker // Toujours respecter le contexte (ticker unique ou bulk)
            });
            setSelectedProfileId(profileId);
        }
    };

    // ✅ Sauvegarder un profil personnalisé
    const saveCustomProfile = async () => {
        if (!newProfileName.trim()) {
            alert('Veuillez entrer un nom pour le profil');
            return;
        }

        const newProfile: SyncProfile = {
            id: `custom-${Date.now()}`,
            name: newProfileName.trim(),
            options: { ...options },
            isPreset: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const updated = [...customProfiles, newProfile];
        setCustomProfiles(updated);
        
        try {
            await storage.setItem(STORAGE_KEY_SYNC_PROFILES, updated);
            setSelectedProfileId(newProfile.id);
            setShowSaveProfileDialog(false);
            setNewProfileName('');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du profil:', error);
            alert('Erreur lors de la sauvegarde du profil');
        }
    };

    // ✅ Supprimer un profil personnalisé
    const deleteCustomProfile = async (profileId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce profil ?')) {
            return;
        }

        const updated = customProfiles.filter(p => p.id !== profileId);
        setCustomProfiles(updated);
        
        try {
            await storage.setItem(STORAGE_KEY_SYNC_PROFILES, updated);
            if (selectedProfileId === profileId) {
                // Si le profil supprimé était sélectionné, charger le preset par défaut
                loadProfile('preset-complete');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du profil:', error);
            alert('Erreur lors de la suppression du profil');
        }
    };

    // ✅ Charger le profil sélectionné au changement
    useEffect(() => {
        if (!isLoadingProfiles && selectedProfileId && selectedProfileId !== 'custom') {
            loadProfile(selectedProfileId);
        }
    }, [selectedProfileId, isLoadingProfiles, ticker]);

    // ✅ Calcul du temps estimé basé sur les options sélectionnées
    const estimatedTime = useMemo(() => {
        const tickerCount = ticker ? 1 : (options.syncAllTickers ? totalTickers : 1);
        let totalMs = 0;
        
        // Temps de base (batch API + traitement)
        const baseTimePerTicker = 2000; // 2s par ticker (batch API + délais)
        totalMs += baseTimePerTicker * tickerCount;
        
        // Ajouter/soustraire le temps de chaque option activée
        Object.entries(options).forEach(([key, value]) => {
            if (value && OPTION_METADATA[key as keyof SyncOptions]) {
                const metadata = OPTION_METADATA[key as keyof SyncOptions];
                totalMs += metadata.timePerTickerMs * tickerCount;
            }
        });
        
        // Temps de batch (délai entre batches)
        const batchSize = 20;
        const batchCount = Math.ceil(tickerCount / batchSize);
        const delayBetweenBatches = 2000; // 2 secondes entre batches
        totalMs += (batchCount - 1) * delayBetweenBatches;
        
        return {
            totalMs,
            totalSeconds: Math.round(totalMs / 1000),
            totalMinutes: Math.round(totalMs / 60000 * 10) / 10, // Arrondi à 1 décimale
            perTickerMs: Math.round(totalMs / tickerCount)
        };
    }, [options, ticker, totalTickers]);

    // ✅ Fonction helper pour obtenir le badge d'utilité
    const getUtilityBadge = (utility: string) => {
        const badges = {
            essentiel: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Essentiel' },
            recommandé: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Recommandé' },
            optionnel: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Optionnel' },
            avancé: { color: 'bg-purple-100 text-purple-800 border-purple-300', label: 'Avancé' }
        };
        const badge = badges[utility as keyof typeof badges] || badges.optionnel;
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    if (!isOpen) return null;

    const isBulkSync = !ticker;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                            <ArrowPathIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                                Options de Synchronisation Avancées
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {isBulkSync ? (
                                    <>Synchronisation de <strong>tous les tickers</strong> ({totalTickers} tickers)</>
                                ) : (
                                    <>Ticker: <span className="font-mono font-semibold">{ticker}</span></>
                                )}
                            </p>
                            {/* ✅ Temps estimé */}
                            <div className="mt-2 flex items-center gap-2 text-xs">
                                <ClockIcon className="w-4 h-4 text-blue-600" />
                                <span className="text-gray-600">
                                    Temps estimé: <strong className="text-gray-900">
                                        {estimatedTime.totalMinutes >= 1 
                                            ? `${estimatedTime.totalMinutes} min` 
                                            : `${estimatedTime.totalSeconds} sec`}
                                    </strong>
                                    {isBulkSync && (
                                        <span className="text-gray-500 ml-1">
                                            (~{Math.round(estimatedTime.perTickerMs)}ms/ticker)
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isSyncing}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* ✅ Sélecteur de Profil de Synchronisation */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                                <BookmarkIcon className="w-5 h-5" />
                                Profil de Synchronisation
                            </h4>
                            <button
                                onClick={() => setShowSaveProfileDialog(true)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-md transition-colors"
                                title="Sauvegarder la configuration actuelle comme nouveau profil"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Sauvegarder
                            </button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <select
                                value={selectedProfileId}
                                onChange={(e) => setSelectedProfileId(e.target.value)}
                                disabled={isSyncing || isLoadingProfiles}
                                className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-purple-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {DEFAULT_PRESETS.map(profile => (
                                    <option key={profile.id} value={profile.id}>
                                        {profile.name}
                                    </option>
                                ))}
                                {customProfiles.length > 0 && (
                                    <>
                                        <option disabled>──────────</option>
                                        {customProfiles.map(profile => (
                                            <option key={profile.id} value={profile.id}>
                                                {profile.name}
                                            </option>
                                        ))}
                                    </>
                                )}
                                <option value="custom">✏️ Personnalisé</option>
                            </select>
                            {selectedProfileId.startsWith('custom-') && (
                                <button
                                    onClick={() => deleteCustomProfile(selectedProfileId)}
                                    className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Supprimer ce profil personnalisé"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {selectedProfileId === 'custom' && (
                            <p className="mt-2 text-xs text-purple-700 italic">
                                ✏️ Mode personnalisé : Modifiez les options ci-dessous manuellement
                            </p>
                        )}
                        
                        {/* ✅ Détails ventilés du preset sélectionné */}
                        {selectedProfileId !== 'custom' && !selectedProfileId.startsWith('custom-') && (() => {
                            const selectedPreset = DEFAULT_PRESETS.find(p => p.id === selectedProfileId);
                            if (!selectedPreset || !selectedPreset.description) return null;
                            
                            return (
                                <div className="mt-4 p-4 bg-white border border-purple-200 rounded-lg">
                                    <h5 className="text-sm font-semibold text-purple-900 mb-2">
                                        📋 Ce que ce profil implique :
                                    </h5>
                                    <p className="text-xs text-gray-700 mb-3">
                                        {selectedPreset.description}
                                    </p>
                                    {selectedPreset.details && selectedPreset.details.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-semibold text-gray-700 mb-2">
                                                Détails ventilés :
                                            </p>
                                            <ul className="space-y-1.5">
                                                {selectedPreset.details.map((detail, index) => (
                                                    <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                                                        <span className="text-purple-500 mt-0.5">•</span>
                                                        <span>{detail}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* ✅ Dialog pour sauvegarder un profil */}
                    {showSaveProfileDialog && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4">
                            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Sauvegarder un Profil
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nom du profil
                                        </label>
                                        <input
                                            type="text"
                                            value={newProfileName}
                                            onChange={(e) => setNewProfileName(e.target.value)}
                                            placeholder="Ex: Ma configuration personnalisée"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            autoFocus
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    saveCustomProfile();
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            onClick={() => {
                                                setShowSaveProfileDialog(false);
                                                setNewProfileName('');
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={saveCustomProfile}
                                            disabled={!newProfileName.trim()}
                                            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Sauvegarder
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section d'information générale */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                                    🔄 Processus de Synchronisation
                                </h4>
                                <div className="text-xs text-blue-800 space-y-2">
                                    <p><strong>Séquence d'exécution :</strong></p>
                                    <ol className="list-decimal list-inside ml-2 space-y-1">
                                        <li><strong>Sauvegarde</strong> : Création d'un snapshot (si activé)</li>
                                        <li><strong>Récupération FMP</strong> : Appel API FMP Premium pour données historiques (30 ans)</li>
                                        <li><strong>Merge intelligent</strong> : Fusion des nouvelles données avec les existantes</li>
                                        <li><strong>Calcul assumptions</strong> : Recalcul des taux de croissance et ratios cibles</li>
                                        <li><strong>Détection outliers</strong> : Identification des métriques aberrantes</li>
                                        <li><strong>Mise à jour Supabase</strong> : Synchronisation des métriques ValueLine (si activé)</li>
                                        <li><strong>Sauvegarde finale</strong> : Création d'un snapshot post-sync</li>
                                    </ol>
                                    <p className="mt-2"><strong>Outils utilisés :</strong> FMP API Premium, Supabase, Algorithmes de détection d'outliers, Calculs CAGR</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Avertissement si données manuelles */}
                    {hasManualData && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <div className="flex items-start gap-3">
                                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-yellow-800 font-medium">
                                        ⚠️ Données manuelles détectées
                                    </p>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Vous avez modifié des données manuellement (cases oranges).
                                        Choisissez si vous souhaitez les préserver ou les remplacer.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Options principales */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                            Options de Synchronisation Principales
                        </h4>

                        {/* Sauvegarder avant sync */}
                        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={options.saveBeforeSync}
                                    onChange={(e) => setOptions(prev => ({ ...prev, saveBeforeSync: e.target.checked }))}
                                    disabled={isSyncing}
                                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-medium text-gray-900">
                                            💾 Sauvegarder la version actuelle avant synchronisation
                                        </p>
                                        {getUtilityBadge(OPTION_METADATA.saveBeforeSync.utility)}
                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <ClockIcon className="w-3 h-3" />
                                            {OPTION_METADATA.saveBeforeSync.timeDescription}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Crée un snapshot de sauvegarde avant de synchroniser. Recommandé pour pouvoir restaurer en cas de problème.
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1 italic">
                                        💡 {OPTION_METADATA.saveBeforeSync.utilityDescription}
                                    </p>
                                    <HelpSection 
                                        id="saveBeforeSync" 
                                        title="Sauvegarde avant synchronisation"
                                        showHelp={showHelp}
                                        setShowHelp={setShowHelp}
                                    >
                                        <div className="space-y-2">
                                            <p><strong>Comportement :</strong> Un snapshot complet est créé dans Supabase avec toutes les données actuelles (historiques, assumptions, infos).</p>
                                            <p><strong>Exemple concret :</strong> Si vous avez modifié manuellement le taux de croissance EPS à 12% et que la sync le recalcule à 8.5%, vous pourrez restaurer la version avec 12%.</p>
                                            <p><strong>Outil :</strong> API Supabase Snapshots</p>
                                            <p><strong>Recommandation :</strong> Toujours activer cette option, surtout avant de remplacer les données oranges.</p>
                                        </div>
                                    </HelpSection>
                                </div>
                            </label>
                        </div>

                        {/* Remplacer données oranges */}
                        <div className="p-4 bg-orange-50 rounded-md border border-orange-200">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={options.replaceOrangeData}
                                    onChange={(e) => setOptions(prev => ({ ...prev, replaceOrangeData: e.target.checked }))}
                                    disabled={isSyncing}
                                    className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-medium text-orange-900">
                                            🟠 Remplacer les données oranges (assumptions manuelles)
                                        </p>
                                        {getUtilityBadge(OPTION_METADATA.replaceOrangeData.utility)}
                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <ClockIcon className="w-3 h-3" />
                                            {OPTION_METADATA.replaceOrangeData.timeDescription}
                                        </span>
                                    </div>
                                    <p className="text-xs text-orange-700 mt-1">
                                        <strong>Attention:</strong> Si coché, toutes les valeurs manuelles (taux de croissance, ratios cibles) seront recalculées et remplacées par les valeurs calculées depuis FMP. Cette action est irréversible.
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1 italic">
                                        💡 {OPTION_METADATA.replaceOrangeData.utilityDescription}
                                    </p>
                                    <HelpSection 
                                        id="replaceOrangeData" 
                                        title="Remplacement des données oranges"
                                        showHelp={showHelp}
                                        setShowHelp={setShowHelp}
                                    >
                                        <div className="space-y-2">
                                            <p><strong>Comportement :</strong> Les assumptions modifiées manuellement (affichées en orange) seront recalculées depuis les données FMP historiques.</p>
                                            <p><strong>Exemple concret :</strong></p>
                                            <ul className="list-disc list-inside ml-2 space-y-1">
                                                <li>Vous aviez modifié <code className="bg-white px-1 rounded">growthRateEPS</code> à 10% manuellement</li>
                                                <li>FMP calcule un CAGR de 8.5% sur 5 ans</li>
                                                <li>Avec cette option : 10% → 8.5% (remplacé)</li>
                                                <li>Sans cette option : 10% → 10% (préservé)</li>
                                            </ul>
                                            <p><strong>Champs affectés :</strong> growthRateEPS, growthRateCF, growthRateBV, growthRateDiv, targetPE, targetPCF, targetPBV, targetYield</p>
                                            <p><strong>Outil :</strong> Fonction <code className="bg-white px-1 rounded">autoFillAssumptionsFromFMPData()</code> avec <code className="bg-white px-1 rounded">existingAssumptions = undefined</code></p>
                                            <p><strong>Recommandation :</strong> Utiliser uniquement si vous voulez réinitialiser toutes vos hypothèses manuelles avec les valeurs calculées.</p>
                                        </div>
                                    </HelpSection>
                                </div>
                            </label>
                        </div>

                        {/* Forcer remplacement même données manuelles */}
                        {options.replaceOrangeData && (
                            <div className="p-4 bg-red-50 rounded-md border border-red-200">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={options.forceReplace}
                                        onChange={(e) => setOptions(prev => ({ ...prev, forceReplace: e.target.checked }))}
                                        disabled={isSyncing}
                                        className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-medium text-red-900">
                                                ⚠️ Forcer le remplacement de TOUTES les données manuelles
                                            </p>
                                            {getUtilityBadge(OPTION_METADATA.forceReplace.utility)}
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <ClockIcon className="w-3 h-3" />
                                                {OPTION_METADATA.forceReplace.timeDescription}
                                            </span>
                                        </div>
                                        <p className="text-xs text-red-700 mt-1">
                                            <strong>Danger:</strong> Remplace également les données historiques manuelles (pas seulement les assumptions). Utilisez avec précaution.
                                        </p>
                                        <p className="text-xs text-blue-700 mt-1 italic">
                                            💡 {OPTION_METADATA.forceReplace.utilityDescription}
                                        </p>
                                        <HelpSection 
                                            id="forceReplace" 
                                            title="Remplacement forcé de toutes les données"
                                            showHelp={showHelp}
                                            setShowHelp={setShowHelp}
                                        >
                                            <div className="space-y-2">
                                                <p><strong>Comportement :</strong> Ignore complètement le flag <code className="bg-white px-1 rounded">autoFetched: false</code> et remplace TOUTES les données, même celles modifiées manuellement dans le tableau historique.</p>
                                                <p><strong>Exemple concret :</strong></p>
                                                <ul className="list-disc list-inside ml-2 space-y-1">
                                                    <li>Vous aviez modifié manuellement l'EPS de 2020 de 2.50$ à 2.75$</li>
                                                    <li>FMP retourne 2.50$ pour 2020</li>
                                                    <li>Avec cette option : 2.75$ → 2.50$ (remplacé, même si manuel)</li>
                                                    <li>Sans cette option : 2.75$ → 2.75$ (préservé car manuel)</li>
                                                </ul>
                                                <p><strong>Champs affectés :</strong> Toutes les données historiques (EPS, CF, BV, Dividendes, Prix High/Low) pour toutes les années</p>
                                                <p><strong>Outil :</strong> Merge intelligent avec <code className="bg-white px-1 rounded">forceReplace = true</code></p>
                                                <p><strong>⚠️ Attention :</strong> Cette option est destructive et ne peut pas être annulée facilement. Assurez-vous d'avoir activé la sauvegarde avant sync.</p>
                                            </div>
                                        </HelpSection>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Options détaillées */}
                        <div className="border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <InformationCircleIcon className="w-5 h-5 text-gray-600" />
                                Options Détaillées de Synchronisation
                            </h4>

                            <div className="space-y-3">
                                {/* Synchroniser données historiques */}
                                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={options.syncData}
                                            onChange={(e) => setOptions(prev => ({ ...prev, syncData: e.target.checked }))}
                                            disabled={isSyncing}
                                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                📊 Synchroniser les données historiques
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                États financiers, prix historiques, métriques (30 ans d'historique)
                                            </p>
                                            <HelpSection 
                                                id="syncData" 
                                                title="Synchronisation des données historiques"
                                                showHelp={showHelp}
                                                setShowHelp={setShowHelp}
                                            >
                                                <div className="space-y-2">
                                                    <p><strong>Comportement :</strong> Récupère les données financières historiques depuis FMP API (30 ans d'historique) et les fusionne avec les données existantes.</p>
                                                    <p><strong>Données synchronisées :</strong></p>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li><strong>EPS (Earnings Per Share)</strong> : Bénéfices par action par année</li>
                                                        <li><strong>CF (Cash Flow Per Share)</strong> : Flux de trésorerie par action</li>
                                                        <li><strong>BV (Book Value Per Share)</strong> : Valeur comptable par action</li>
                                                        <li><strong>Dividendes</strong> : Dividendes par action</li>
                                                        <li><strong>Prix High/Low</strong> : Prix maximum et minimum par année</li>
                                                    </ul>
                                                    <p><strong>Exemple concret :</strong> Si vous avez des données jusqu'en 2020 et que FMP a des données jusqu'en 2024, les années 2021-2024 seront ajoutées automatiquement.</p>
                                                    <p><strong>Outil :</strong> FMP API Premium - Endpoint <code className="bg-white px-1 rounded">/api/v3/income-statement</code>, <code className="bg-white px-1 rounded">/api/v3/cash-flow-statement</code>, <code className="bg-white px-1 rounded">/api/v3/balance-sheet-statement</code></p>
                                                    <p><strong>Séquence :</strong> Appel API → Parse JSON → Merge avec données existantes → Tri par année</p>
                                                </div>
                                            </HelpSection>
                                        </div>
                                    </label>
                                </div>

                                {/* Synchroniser uniquement nouvelles années */}
                                {options.syncData && (
                                    <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200 ml-6">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={options.syncOnlyNewYears}
                                                onChange={(e) => setOptions(prev => ({ ...prev, syncOnlyNewYears: e.target.checked }))}
                                                disabled={isSyncing}
                                                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        🆕 Synchroniser uniquement les nouvelles années
                                                    </p>
                                                    {getUtilityBadge(OPTION_METADATA.syncOnlyNewYears.utility)}
                                                    <span className="flex items-center gap-1 text-xs text-green-600">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {OPTION_METADATA.syncOnlyNewYears.timeDescription}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    N'ajoute que les années manquantes, ne modifie pas les années existantes
                                                </p>
                                                <p className="text-xs text-blue-700 mt-1 italic">
                                                    💡 {OPTION_METADATA.syncOnlyNewYears.utilityDescription}
                                                </p>
                                                <HelpSection 
                                                    id="syncOnlyNewYears" 
                                                    title="Synchronisation uniquement des nouvelles années"
                                                    showHelp={showHelp}
                                                    setShowHelp={setShowHelp}
                                                >
                                                    <div className="space-y-2">
                                                        <p><strong>Comportement :</strong> Compare les années existantes avec les années disponibles dans FMP et n'ajoute que les années manquantes. Les années existantes ne sont pas modifiées, même si les données FMP sont différentes.</p>
                                                        <p><strong>Exemple concret :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Vous avez des données pour 2015-2020</li>
                                                            <li>FMP a des données pour 2010-2024</li>
                                                            <li>Avec cette option : Ajoute uniquement 2010-2014 et 2021-2024</li>
                                                            <li>Sans cette option : Met à jour toutes les années 2015-2020 aussi</li>
                                                        </ul>
                                                        <p><strong>Avantage :</strong> Plus rapide, préserve toutes vos modifications manuelles sur les années existantes</p>
                                                          <p><strong>Outil :</strong> Algorithme de comparaison d'années avec <code className="bg-white px-1 rounded">{'mergedData.some(row => row.year === newRow.year)'}</code></p>
                                                    </div>
                                                </HelpSection>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {/* Synchroniser uniquement métriques manquantes */}
                                {options.syncData && (
                                    <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200 ml-6">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={options.syncOnlyMissingMetrics}
                                                onChange={(e) => setOptions(prev => ({ ...prev, syncOnlyMissingMetrics: e.target.checked }))}
                                                disabled={isSyncing}
                                                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        🔍 Synchroniser uniquement les métriques manquantes
                                                    </p>
                                                    {getUtilityBadge(OPTION_METADATA.syncOnlyMissingMetrics.utility)}
                                                    <span className="flex items-center gap-1 text-xs text-green-600">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {OPTION_METADATA.syncOnlyMissingMetrics.timeDescription}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Ne remplit que les champs vides (0 ou null), préserve les valeurs existantes
                                                </p>
                                                <p className="text-xs text-blue-700 mt-1 italic">
                                                    💡 {OPTION_METADATA.syncOnlyMissingMetrics.utilityDescription}
                                                </p>
                                                <HelpSection 
                                                    id="syncOnlyMissingMetrics" 
                                                    title="Synchronisation uniquement des métriques manquantes"
                                                    showHelp={showHelp}
                                                    setShowHelp={setShowHelp}
                                                >
                                                    <div className="space-y-2">
                                                        <p><strong>Comportement :</strong> Pour chaque année, ne remplit que les champs qui sont actuellement vides (0, null, ou undefined). Les champs avec des valeurs existantes sont préservés.</p>
                                                        <p><strong>Exemple concret :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Année 2020 : EPS = 2.50$ (existant), CF = 0 (manquant)</li>
                                                            <li>FMP retourne : EPS = 2.50$, CF = 3.20$</li>
                                                            <li>Avec cette option : EPS reste 2.50$, CF devient 3.20$</li>
                                                            <li>Sans cette option : EPS devient 2.50$, CF devient 3.20$ (même si identique)</li>
                                                        </ul>
                                                        <p><strong>Avantage :</strong> Permet de compléter progressivement les données sans écraser ce qui existe déjà</p>
                                                        <p><strong>Outil :</strong> Condition <code className="bg-white px-1 rounded">existingValue === 0 || existingValue === null || existingValue === undefined</code></p>
                                                    </div>
                                                </HelpSection>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {/* Synchroniser assumptions */}
                                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={options.syncAssumptions}
                                            onChange={(e) => setOptions(prev => ({ ...prev, syncAssumptions: e.target.checked }))}
                                            disabled={isSyncing}
                                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-medium text-gray-900">
                                                    🎯 Synchroniser les assumptions (hypothèses)
                                                </p>
                                                {getUtilityBadge(OPTION_METADATA.syncAssumptions.utility)}
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <ClockIcon className="w-3 h-3" />
                                                    {OPTION_METADATA.syncAssumptions.timeDescription}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Taux de croissance, ratios cibles, année de base, dividende actuel
                                            </p>
                                            <p className="text-xs text-blue-700 mt-1 italic">
                                                💡 {OPTION_METADATA.syncAssumptions.utilityDescription}
                                            </p>
                                            <HelpSection 
                                                id="syncAssumptions" 
                                                title="Synchronisation des assumptions"
                                                showHelp={showHelp}
                                                setShowHelp={setShowHelp}
                                            >
                                                <div className="space-y-2">
                                                    <p><strong>Comportement :</strong> Recalcule les hypothèses de valorisation basées sur les données historiques FMP.</p>
                                                    <p><strong>Assumptions calculées :</strong></p>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li><strong>Taux de croissance (CAGR 5 ans) :</strong> growthRateEPS, growthRateCF, growthRateBV, growthRateDiv</li>
                                                        <li><strong>Ratios cibles (moyenne 5 ans) :</strong> targetPE, targetPCF, targetPBV, targetYield</li>
                                                        <li><strong>Année de base :</strong> Dernière année avec EPS valide</li>
                                                        <li><strong>Dividende actuel :</strong> Dernier dividende par action</li>
                                                    </ul>
                                                    <p><strong>Exemple concret :</strong></p>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li>Données FMP : EPS 2019=2.00$, EPS 2024=2.80$</li>
                                                        <li>Calcul CAGR : ((2.80/2.00)^(1/5) - 1) * 100 = 6.96%</li>
                                                        <li>Résultat : growthRateEPS = 6.96%</li>
                                                    </ul>
                                                    <p><strong>Outil :</strong> Fonction <code className="bg-white px-1 rounded">autoFillAssumptionsFromFMPData()</code> avec calculs CAGR et moyennes</p>
                                                    <p><strong>Formule CAGR :</strong> <code className="bg-white px-1 rounded">((ValeurFinale/ValeurInitiale)^(1/Années) - 1) * 100</code></p>
                                                </div>
                                            </HelpSection>
                                        </div>
                                    </label>
                                </div>

                                {/* Préserver exclusions */}
                                {options.syncAssumptions && (
                                    <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200 ml-6">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={options.preserveExclusions}
                                                onChange={(e) => setOptions(prev => ({ ...prev, preserveExclusions: e.target.checked }))}
                                                disabled={isSyncing}
                                                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        🚫 Préserver les exclusions de métriques
                                                    </p>
                                                    {getUtilityBadge(OPTION_METADATA.preserveExclusions.utility)}
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {OPTION_METADATA.preserveExclusions.timeDescription}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Maintient les checkboxes d'exclusion (EPS, CF, BV, DIV) même après recalcul
                                                </p>
                                                <p className="text-xs text-blue-700 mt-1 italic">
                                                    💡 {OPTION_METADATA.preserveExclusions.utilityDescription}
                                                </p>
                                                <HelpSection 
                                                    id="preserveExclusions" 
                                                    title="Préservation des exclusions de métriques"
                                                    showHelp={showHelp}
                                                    setShowHelp={setShowHelp}
                                                >
                                                    <div className="space-y-2">
                                                        <p><strong>Comportement :</strong> Les flags d'exclusion (excludeEPS, excludeCF, excludeBV, excludeDIV) sont préservés même si la détection d'outliers les recalculerait différemment.</p>
                                                        <p><strong>Exemple concret :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Vous avez exclu EPS manuellement (excludeEPS = true)</li>
                                                            <li>La détection d'outliers recalcule et trouve que EPS n'est plus aberrant</li>
                                                            <li>Avec cette option : excludeEPS reste true (préservé)</li>
                                                            <li>Sans cette option : excludeEPS devient false (recalculé)</li>
                                                        </ul>
                                                        <p><strong>Avantage :</strong> Vous gardez le contrôle sur quelles métriques utiliser pour la valorisation</p>
                                                        <p><strong>Outil :</strong> Préservation des flags <code className="bg-white px-1 rounded">excludeEPS</code>, <code className="bg-white px-1 rounded">excludeCF</code>, etc. dans <code className="bg-white px-1 rounded">finalAssumptions</code></p>
                                                    </div>
                                                </HelpSection>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {/* Recalculer outliers */}
                                {options.syncAssumptions && (
                                    <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200 ml-6">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={options.recalculateOutliers}
                                                onChange={(e) => setOptions(prev => ({ ...prev, recalculateOutliers: e.target.checked }))}
                                                disabled={isSyncing}
                                                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        📊 Recalculer la détection d'outliers
                                                    </p>
                                                    {getUtilityBadge(OPTION_METADATA.recalculateOutliers.utility)}
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {OPTION_METADATA.recalculateOutliers.timeDescription}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Identifie automatiquement les métriques qui produisent des prix cibles aberrants
                                                </p>
                                                <p className="text-xs text-blue-700 mt-1 italic">
                                                    💡 {OPTION_METADATA.recalculateOutliers.utilityDescription}
                                                </p>
                                                <HelpSection 
                                                    id="recalculateOutliers" 
                                                    title="Recalcul de la détection d'outliers"
                                                    showHelp={showHelp}
                                                    setShowHelp={setShowHelp}
                                                >
                                                    <div className="space-y-2">
                                                          <p><strong>Comportement :</strong> Analyse chaque métrique (EPS, CF, BV, DIV) et calcule le prix cible. Si le prix cible est aberrant (négatif, {'>'} 10x le prix actuel, etc.), la métrique est automatiquement exclue.</p>
                                                        <p><strong>Exemple concret :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Prix actuel : 100$</li>
                                                            <li>Calcul prix cible EPS : -50$ (aberrant, EPS négatif ou croissance impossible)</li>
                                                            <li>Résultat : excludeEPS = true (métrique exclue automatiquement)</li>
                                                            <li>Calcul prix cible CF : 150$ (normal)</li>
                                                            <li>Résultat : excludeCF = false (métrique utilisée)</li>
                                                        </ul>
                                                        <p><strong>Critères d'aberration :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Prix cible négatif</li>
                                                              <li>Prix cible {'>'} 10x le prix actuel</li>
                                                              <li>Prix cible {'<'} 0.1x le prix actuel</li>
                                                            <li>Données insuffisantes pour calculer</li>
                                                        </ul>
                                                        <p><strong>Outil :</strong> Fonction <code className="bg-white px-1 rounded">detectOutlierMetrics()</code> avec seuils configurables</p>
                                                    </div>
                                                </HelpSection>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {/* Mettre à jour prix actuel */}
                                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={options.updateCurrentPrice}
                                            onChange={(e) => setOptions(prev => ({ ...prev, updateCurrentPrice: e.target.checked }))}
                                            disabled={isSyncing}
                                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-medium text-gray-900">
                                                    💰 Mettre à jour le prix actuel
                                                </p>
                                                {getUtilityBadge(OPTION_METADATA.updateCurrentPrice.utility)}
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <ClockIcon className="w-3 h-3" />
                                                    {OPTION_METADATA.updateCurrentPrice.timeDescription}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Met à jour le prix actuel depuis FMP (toujours activé par défaut)
                                            </p>
                                            <p className="text-xs text-blue-700 mt-1 italic">
                                                💡 {OPTION_METADATA.updateCurrentPrice.utilityDescription}
                                            </p>
                                            <HelpSection 
                                                id="updateCurrentPrice" 
                                                title="Mise à jour du prix actuel"
                                                showHelp={showHelp}
                                                setShowHelp={setShowHelp}
                                            >
                                                <div className="space-y-2">
                                                    <p><strong>Comportement :</strong> Récupère le prix actuel depuis FMP API et met à jour l'assumption <code className="bg-white px-1 rounded">currentPrice</code>.</p>
                                                    <p><strong>Exemple concret :</strong></p>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li>Prix actuel dans l'app : 150.00$</li>
                                                        <li>Prix FMP : 152.50$</li>
                                                        <li>Avec cette option : 150.00$ → 152.50$ (mis à jour)</li>
                                                        <li>Sans cette option : 150.00$ → 150.00$ (préservé)</li>
                                                    </ul>
                                                    <p><strong>Outil :</strong> FMP API - Endpoint <code className="bg-white px-1 rounded">/api/v3/quote</code> ou <code className="bg-white px-1 rounded">/api/v3/profile</code></p>
                                                    <p><strong>Recommandation :</strong> Toujours activer pour avoir les prix à jour</p>
                                                </div>
                                            </HelpSection>
                                        </div>
                                    </label>
                                </div>

                                {/* Synchroniser infos */}
                                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={options.syncInfo}
                                            onChange={(e) => setOptions(prev => ({ ...prev, syncInfo: e.target.checked }))}
                                            disabled={isSyncing}
                                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-medium text-gray-900">
                                                    ℹ️ Synchroniser les informations de profil
                                                </p>
                                                {getUtilityBadge(OPTION_METADATA.syncInfo.utility)}
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <ClockIcon className="w-3 h-3" />
                                                    {OPTION_METADATA.syncInfo.timeDescription}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Nom de l'entreprise, secteur, logo, beta, capitalisation boursière
                                            </p>
                                            <p className="text-xs text-blue-700 mt-1 italic">
                                                💡 {OPTION_METADATA.syncInfo.utilityDescription}
                                            </p>
                                            <HelpSection 
                                                id="syncInfo" 
                                                title="Synchronisation des informations de profil"
                                                showHelp={showHelp}
                                                setShowHelp={setShowHelp}
                                            >
                                                <div className="space-y-2">
                                                    <p><strong>Comportement :</strong> Met à jour les informations générales de l'entreprise depuis FMP API.</p>
                                                    <p><strong>Informations synchronisées :</strong></p>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li><strong>Nom de l'entreprise</strong> : Nom complet (ex: "Apple Inc.")</li>
                                                        <li><strong>Secteur</strong> : Secteur d'activité (ex: "Technology")</li>
                                                        <li><strong>Logo</strong> : URL du logo de l'entreprise</li>
                                                        <li><strong>Beta</strong> : Coefficient bêta (volatilité relative au marché)</li>
                                                        <li><strong>Capitalisation</strong> : Market Cap en USD</li>
                                                        <li><strong>Pays/Bourse</strong> : Localisation et bourse principale</li>
                                                    </ul>
                                                    <p><strong>Outil :</strong> FMP API - Endpoint <code className="bg-white px-1 rounded">/api/v3/profile</code></p>
                                                    <p><strong>Note :</strong> Les métriques ValueLine (Security Rank, Earnings Predictability) sont préservées et rechargées depuis Supabase séparément.</p>
                                                </div>
                                            </HelpSection>
                                        </div>
                                    </label>
                                </div>

                                {/* Synchroniser métriques ValueLine */}
                                {options.syncInfo && (
                                    <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200 ml-6">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={options.syncValueLineMetrics}
                                                onChange={(e) => setOptions(prev => ({ ...prev, syncValueLineMetrics: e.target.checked }))}
                                                disabled={isSyncing}
                                                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        ⭐ Synchroniser les métriques ValueLine depuis Supabase
                                                    </p>
                                                    {getUtilityBadge(OPTION_METADATA.syncValueLineMetrics.utility)}
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {OPTION_METADATA.syncValueLineMetrics.timeDescription}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Recharge Security Rank, Earnings Predictability, etc. depuis la base de données
                                                </p>
                                                <p className="text-xs text-blue-700 mt-1 italic">
                                                    💡 {OPTION_METADATA.syncValueLineMetrics.utilityDescription}
                                                </p>
                                                <HelpSection 
                                                    id="syncValueLineMetrics" 
                                                    title="Synchronisation des métriques ValueLine"
                                                    showHelp={showHelp}
                                                    setShowHelp={setShowHelp}
                                                >
                                                    <div className="space-y-2">
                                                        <p><strong>Comportement :</strong> Recharge les métriques ValueLine depuis Supabase pour garantir la cohérence multi-utilisateurs. Ces métriques ne sont pas disponibles dans FMP.</p>
                                                        <p><strong>Métriques ValueLine :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li><strong>Security Rank</strong> : Classement de sécurité (1-5, 1 = meilleur)</li>
                                                            <li><strong>Earnings Predictability</strong> : Prédictibilité des bénéfices (A-E, A = meilleur)</li>
                                                            <li><strong>Price Growth Persistence</strong> : Persistance de la croissance du prix</li>
                                                            <li><strong>Price Stability</strong> : Stabilité du prix</li>
                                                        </ul>
                                                        <p><strong>Exemple concret :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Valeur locale : Security Rank = "2"</li>
                                                            <li>Valeur Supabase : Security Rank = "1" (mise à jour par un autre utilisateur)</li>
                                                            <li>Avec cette option : Security Rank devient "1" (synchronisé)</li>
                                                            <li>Sans cette option : Security Rank reste "2" (local)</li>
                                                        </ul>
                                                        <p><strong>Outil :</strong> API Supabase - Table <code className="bg-white px-1 rounded">tickers</code> avec colonnes <code className="bg-white px-1 rounded">security_rank</code>, <code className="bg-white px-1 rounded">earnings_predictability</code>, etc.</p>
                                                        <p><strong>Recommandation :</strong> Toujours activer pour avoir les dernières métriques ValueLine partagées</p>
                                                    </div>
                                                </HelpSection>
                                            </div>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info sur synchronisation tous tickers */}
                        {isBulkSync && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <div className="flex items-start gap-3">
                                    <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-blue-800 font-medium">
                                            Synchronisation en masse
                                        </p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Cette synchronisation traitera tous les tickers de votre portefeuille et watchlist.
                                            Le processus peut prendre plusieurs minutes selon le nombre de tickers.
                                        </p>
                                        <HelpSection 
                                            id="bulkSync" 
                                            title="Synchronisation en masse - Détails techniques"
                                            showHelp={showHelp}
                                            setShowHelp={setShowHelp}
                                        >
                                            <div className="space-y-2">
                                                <p><strong>Processus :</strong></p>
                                                <ol className="list-decimal list-inside ml-2 space-y-1">
                                                    <li>Traitement par batch de 5 tickers en parallèle</li>
                                                    <li>Délai de 500ms entre chaque batch</li>
                                                    <li>Timeout de 30 secondes par ticker</li>
                                                    <li>Sauvegarde snapshot avant chaque sync (si activé)</li>
                                                    <li>Appel FMP API pour chaque ticker</li>
                                                    <li>Merge intelligent des données</li>
                                                    <li>Recalcul des assumptions</li>
                                                    <li>Détection d'outliers</li>
                                                    <li>Sauvegarde snapshot après sync</li>
                                                </ol>
                                                <p><strong>Exemple de timing :</strong></p>
                                                <ul className="list-disc list-inside ml-2 space-y-1">
                                                    <li>10 tickers : ~2-3 minutes</li>
                                                    <li>50 tickers : ~10-15 minutes</li>
                                                    <li>100 tickers : ~20-30 minutes</li>
                                                </ul>
                                                <p><strong>Contrôles disponibles :</strong> Pause, Resume, Stop pendant la synchronisation</p>
                                            </div>
                                        </HelpSection>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                    <button
                        onClick={onCancel}
                        disabled={isSyncing}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Annuler
                    </button>

                    <div className="flex gap-2">
                        {/* Bouton sync rapide (sans options) */}
                        <button
                            onClick={() => onConfirm({
                                saveBeforeSync: true,
                                replaceOrangeData: false,
                                syncAllTickers: isBulkSync,
                                syncData: true,
                                syncAssumptions: true,
                                syncInfo: true,
                                forceReplace: false,
                                syncOnlyNewYears: false,
                                syncOnlyMissingMetrics: false,
                                preserveExclusions: true,
                                recalculateOutliers: true,
                                updateCurrentPrice: true,
                                syncValueLineMetrics: true
                            })}
                            disabled={isSyncing}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Sync Rapide
                        </button>

                        {/* Bouton sync avec options */}
                        <button
                            onClick={() => onConfirm(options)}
                            disabled={isSyncing || (!options.syncData && !options.syncAssumptions && !options.syncInfo)}
                            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSyncing ? (
                                <>
                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                    Synchronisation...
                                </>
                            ) : (
                                <>
                                    <ArrowPathIcon className="w-4 h-4" />
                                    Synchroniser avec Options
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
