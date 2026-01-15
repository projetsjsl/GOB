import React, { useState, useMemo, useEffect } from 'react';
import { XMarkIcon, ArrowPathIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon, QuestionMarkCircleIcon, ChevronDownIcon, ChevronUpIcon, ClockIcon, BookmarkIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { storage } from '../utils/storage';

interface AdvancedSyncDialogProps {
    isOpen: boolean;
    ticker?: string; // Si defini, sync d'un seul ticker, sinon sync de tous
    hasManualData?: boolean;
    onCancel: () => void;
    onConfirm: (options: SyncOptions) => void;
    isSyncing?: boolean;
    totalTickers?: number; // Nombre total de tickers pour estimation du temps
}

export interface SyncOptions {
    saveBeforeSync: boolean;
    replaceOrangeData: boolean; // Remplacer les donnees oranges (assumptions manuelles)
    syncAllTickers: boolean; // Synchroniser tous les tickers
    syncData: boolean; // Synchroniser les donnees historiques
    syncAssumptions: boolean; // Synchroniser les assumptions
    syncInfo: boolean; // Synchroniser les infos (nom, secteur, etc.)
    forceReplace: boolean; // Forcer le remplacement meme des donnees manuelles
    syncOnlyNewYears: boolean; // Synchroniser uniquement les nouvelles annees
    syncOnlyMissingMetrics: boolean; // Synchroniser uniquement les metriques manquantes
    preserveExclusions: boolean; // Preserver les exclusions de metriques (EPS, CF, BV, DIV)
    recalculateOutliers: boolean; // Recalculer la detection d'outliers
    updateCurrentPrice: boolean; // Mettre a jour le prix actuel
    syncValueLineMetrics: boolean; // Synchroniser les metriques ValueLine depuis Supabase
}

// Metadonnees pour chaque option : temps approximatif et utilite
interface OptionMetadata {
    timePerTickerMs: number; // Temps approximatif par ticker en millisecondes
    timeDescription: string; // Description du temps
    utility: 'essentiel' | 'recommande' | 'optionnel' | 'avance'; // Utilite de l'option
    utilityDescription: string; // Description de l'utilite
}

export const OPTION_METADATA: Record<keyof SyncOptions, OptionMetadata> = {
    saveBeforeSync: {
        timePerTickerMs: 200,
        timeDescription: '~200ms par ticker (sauvegarde snapshot)',
        utility: 'recommande',
        utilityDescription: 'Permet de restaurer l\'etat precedent en cas d\'erreur'
    },
    replaceOrangeData: {
        timePerTickerMs: 0, // Pas de temps supplementaire, juste un flag
        timeDescription: 'Aucun temps supplementaire',
        utility: 'optionnel',
        utilityDescription: 'Utile si vous voulez remplacer vos hypotheses manuelles par des calculs automatiques'
    },
    syncAllTickers: {
        timePerTickerMs: 0, // Pas de temps par ticker, c'est juste le scope
        timeDescription: 'Determine le nombre de tickers a synchroniser',
        utility: 'essentiel',
        utilityDescription: 'Definit si on synchronise un ticker ou tous les tickers'
    },
    syncData: {
        timePerTickerMs: 1500, // Appel API FMP + traitement
        timeDescription: '~1.5s par ticker (appel API FMP + traitement)',
        utility: 'essentiel',
        utilityDescription: 'Recupere les donnees financieres historiques (EPS, CF, BV, DIV, prix) - Option la plus importante'
    },
    syncAssumptions: {
        timePerTickerMs: 100, // Calculs CAGR et moyennes
        timeDescription: '~100ms par ticker (calculs CAGR et moyennes)',
        utility: 'essentiel',
        utilityDescription: 'Calcule automatiquement les taux de croissance et ratios cibles bases sur l\'historique'
    },
    syncInfo: {
        timePerTickerMs: 50, // Mise a jour des infos de base
        timeDescription: '~50ms par ticker (mise a jour infos)',
        utility: 'recommande',
        utilityDescription: 'Met a jour le nom, secteur, description de l\'entreprise'
    },
    forceReplace: {
        timePerTickerMs: 0, // Pas de temps supplementaire, juste un flag
        timeDescription: 'Aucun temps supplementaire',
        utility: 'avance',
        utilityDescription: 'Force le remplacement meme des donnees manuelles (utilise avec precaution)'
    },
    syncOnlyNewYears: {
        timePerTickerMs: -200, // Economise du temps en evitant les mises a jour
        timeDescription: 'Economise ~200ms par ticker (evite mises a jour annees existantes)',
        utility: 'recommande',
        utilityDescription: 'Plus rapide et preserve vos modifications manuelles sur les annees existantes'
    },
    syncOnlyMissingMetrics: {
        timePerTickerMs: -100, // Economise du temps en evitant les remplacements
        timeDescription: 'Economise ~100ms par ticker (evite remplacements valeurs existantes)',
        utility: 'recommande',
        utilityDescription: 'Complete progressivement les donnees sans ecraser ce qui existe'
    },
    preserveExclusions: {
        timePerTickerMs: 0, // Pas de temps supplementaire
        timeDescription: 'Aucun temps supplementaire',
        utility: 'recommande',
        utilityDescription: 'Preserve vos choix d\'exclusion de metriques aberrantes'
    },
    recalculateOutliers: {
        timePerTickerMs: 150, // Detection d'outliers
        timeDescription: '~150ms par ticker (detection outliers)',
        utility: 'recommande',
        utilityDescription: 'Detecte et exclut automatiquement les metriques aberrantes (ameliore la qualite des donnees)'
    },
    updateCurrentPrice: {
        timePerTickerMs: 50, // Recuperation prix actuel
        timeDescription: '~50ms par ticker (recuperation prix)',
        utility: 'recommande',
        utilityDescription: 'Met a jour le prix actuel de l\'action pour les calculs de valorisation'
    },
    syncValueLineMetrics: {
        timePerTickerMs: 0, // Utilise le cache, pas de temps supplementaire
        timeDescription: 'Aucun temps supplementaire (utilise cache)',
        utility: 'optionnel',
        utilityDescription: 'Synchronise les metriques ValueLine depuis Supabase (securityRank, earningsPredictability, etc.)'
    }
};

// Interface pour un profil de synchronisation
interface SyncProfile {
    id: string;
    name: string;
    options: SyncOptions;
    isPreset: boolean; // true pour les presets par defaut, false pour les profils personnalises
    description?: string; // Description detaillee du preset
    details?: string[]; // Liste des details ventiles
    createdAt?: number;
    updatedAt?: number;
}

// Presets par defaut
const DEFAULT_PRESETS: SyncProfile[] = [
    {
        id: 'preset-complete',
        name: ' Synchronisation Complete',
        isPreset: true,
        description: 'Synchronisation complete avec toutes les fonctionnalites activees. Ideal pour une mise a jour exhaustive de tous les tickers.',
        details: [
            ' Sauvegarde snapshot avant sync (permettre restauration)',
            ' Recuperation donnees historiques FMP (30 ans : EPS, CF, BV, DIV, prix)',
            ' Calcul automatique assumptions (taux croissance, ratios cibles)',
            'i Mise a jour infos entreprise (nom, secteur, logo, beta)',
            ' Preservation exclusions metriques aberrantes',
            ' Recalcul detection outliers (amelioration qualite donnees)',
            ' Mise a jour prix actuel',
            ' Synchronisation metriques ValueLine (Security Rank, Earnings Predictability)',
            ' Ne remplace PAS les donnees oranges (assumptions manuelles preservees)',
            ' Temps estime : ~2.5s par ticker'
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
        name: ' Synchronisation Rapide',
        isPreset: true,
        description: 'Synchronisation optimisee pour la vitesse. Economise du temps en evitant les operations non essentielles.',
        details: [
            ' Pas de sauvegarde snapshot (gain ~200ms/ticker)',
            ' Recuperation donnees historiques FMP (essentiel)',
            ' Calcul automatique assumptions (essentiel)',
            ' Pas de mise a jour infos entreprise (gain ~50ms/ticker)',
            ' Ajoute uniquement nouvelles annees (evite merges complexes, gain ~200ms/ticker)',
            ' Ajoute uniquement metriques manquantes (evite remplacements, gain ~100ms/ticker)',
            ' Preservation exclusions metriques aberrantes',
            ' Pas de recalcul outliers (gain ~150ms/ticker)',
            ' Mise a jour prix actuel',
            ' Pas de sync ValueLine (gain temps)',
            ' Ne remplace PAS les donnees oranges',
            ' Temps estime : ~1.5s par ticker (40% plus rapide)'
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
        name: ' Synchronisation Securisee',
        isPreset: true,
        description: 'Synchronisation securisee avec sauvegarde et preservation maximale des donnees existantes. Recommande pour les mises a jour regulieres.',
        details: [
            ' Sauvegarde snapshot avant sync (securite)',
            ' Recuperation donnees historiques FMP',
            ' Calcul automatique assumptions',
            'i Mise a jour infos entreprise',
            ' Ajoute uniquement nouvelles annees (preserve modifications manuelles annees existantes)',
            ' Ajoute uniquement metriques manquantes (ne remplace pas valeurs existantes)',
            ' Preservation exclusions metriques aberrantes',
            ' Recalcul detection outliers',
            ' Mise a jour prix actuel',
            ' Synchronisation metriques ValueLine',
            ' Ne remplace PAS les donnees oranges',
            ' Temps estime : ~2.2s par ticker'
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
        name: ' Remplacer Tout (Avance)',
        isPreset: true,
        description: ' ATTENTION : Remplace TOUTES les donnees, y compris les modifications manuelles. Utiliser avec precaution.',
        details: [
            ' Sauvegarde snapshot avant sync (securite)',
            ' Recuperation donnees historiques FMP',
            ' Calcul automatique assumptions',
            'i Mise a jour infos entreprise',
            ' Remplace TOUTES les donnees (meme annees existantes)',
            ' Remplace TOUTES les metriques (meme valeurs existantes)',
            ' Remplace donnees oranges (assumptions manuelles remplacees par calculs automatiques)',
            ' Ne preserve PAS les exclusions (toutes metriques reevaluees)',
            ' Recalcul detection outliers',
            ' Mise a jour prix actuel',
            ' Synchronisation metriques ValueLine',
            ' DESTRUCTIF : Perd toutes modifications manuelles',
            ' Temps estime : ~2.5s par ticker'
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
        name: 'i Infos Uniquement',
        isPreset: true,
        description: 'Met a jour uniquement les informations de base (nom, secteur, logo, beta, prix). Aucune modification des donnees historiques.',
        details: [
            ' Pas de sauvegarde snapshot',
            ' Pas de recuperation donnees historiques FMP',
            ' Pas de calcul assumptions',
            'i Mise a jour infos entreprise uniquement (nom, secteur, logo, beta)',
            ' Mise a jour prix actuel',
            ' Synchronisation metriques ValueLine',
            ' Preservation exclusions metriques aberrantes',
            ' Aucune modification donnees historiques',
            ' Aucune modification assumptions',
            ' Temps estime : ~100ms par ticker (tres rapide)'
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
    totalTickers = 1010 // Par defaut, estimation pour 1010 tickers
}) => {
    const [options, setOptions] = useState<SyncOptions>({
        saveBeforeSync: true,
        replaceOrangeData: false,
        syncAllTickers: !ticker, // Si pas de ticker specifique, sync tous par defaut
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
    
    //  Etats pour les profils de synchronisation
    const [selectedProfileId, setSelectedProfileId] = useState<string>('preset-complete');
    const [customProfiles, setCustomProfiles] = useState<SyncProfile[]>([]);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
    const [showSaveProfileDialog, setShowSaveProfileDialog] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');

    //  Charger les profils personnalises au montage
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

    //  Tous les profils (presets + personnalises)
    const allProfiles = useMemo(() => {
        return [...DEFAULT_PRESETS, ...customProfiles];
    }, [customProfiles]);

    //  Charger un profil
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

    //  Sauvegarder un profil personnalise
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

    //  Supprimer un profil personnalise
    const deleteCustomProfile = async (profileId: string) => {
        if (!confirm('Etes-vous sur de vouloir supprimer ce profil ?')) {
            return;
        }

        const updated = customProfiles.filter(p => p.id !== profileId);
        setCustomProfiles(updated);
        
        try {
            await storage.setItem(STORAGE_KEY_SYNC_PROFILES, updated);
            if (selectedProfileId === profileId) {
                // Si le profil supprime etait selectionne, charger le preset par defaut
                loadProfile('preset-complete');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du profil:', error);
            alert('Erreur lors de la suppression du profil');
        }
    };

    //  Charger le profil selectionne au changement
    useEffect(() => {
        if (!isLoadingProfiles && selectedProfileId && selectedProfileId !== 'custom') {
            loadProfile(selectedProfileId);
        }
    }, [selectedProfileId, isLoadingProfiles, ticker]);

    //  Calcul du temps estime base sur les options selectionnees
    const estimatedTime = useMemo(() => {
        const tickerCount = ticker ? 1 : (options.syncAllTickers ? totalTickers : 1);
        let totalMs = 0;
        
        // Temps de base (batch API + traitement)
        const baseTimePerTicker = 2000; // 2s par ticker (batch API + delais)
        totalMs += baseTimePerTicker * tickerCount;
        
        // Ajouter/soustraire le temps de chaque option activee
        Object.entries(options).forEach(([key, value]) => {
            if (value && OPTION_METADATA[key as keyof SyncOptions]) {
                const metadata = OPTION_METADATA[key as keyof SyncOptions];
                totalMs += metadata.timePerTickerMs * tickerCount;
            }
        });
        
        // Temps de batch (delai entre batches)
        const batchSize = 20;
        const batchCount = Math.ceil(tickerCount / batchSize);
        const delayBetweenBatches = 2000; // 2 secondes entre batches
        totalMs += (batchCount - 1) * delayBetweenBatches;
        
        return {
            totalMs,
            totalSeconds: Math.round(totalMs / 1000),
            totalMinutes: Math.round(totalMs / 60000 * 10) / 10, // Arrondi a 1 decimale
            perTickerMs: Math.round(totalMs / tickerCount)
        };
    }, [options, ticker, totalTickers]);

    //  Fonction helper pour obtenir le badge d'utilite
    const getUtilityBadge = (utility: string) => {
        const badges = {
            essentiel: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Essentiel' },
            recommande: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Recommande' },
            optionnel: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Optionnel' },
            avance: { color: 'bg-purple-100 text-purple-800 border-purple-300', label: 'Avance' }
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
                                Options de Synchronisation Avancees
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {isBulkSync ? (
                                    <>Synchronisation de <strong>tous les tickers</strong> ({totalTickers} tickers)</>
                                ) : (
                                    <>Ticker: <span className="font-mono font-semibold">{ticker}</span></>
                                )}
                            </p>
                            {/*  Temps estime */}
                            <div className="mt-2 flex items-center gap-2 text-xs">
                                <ClockIcon className="w-4 h-4 text-blue-600" />
                                <span className="text-gray-600">
                                    Temps estime: <strong className="text-gray-900">
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
                    {/*  Selecteur de Profil de Synchronisation */}
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
                                        <option disabled></option>
                                        {customProfiles.map(profile => (
                                            <option key={profile.id} value={profile.id}>
                                                {profile.name}
                                            </option>
                                        ))}
                                    </>
                                )}
                                <option value="custom"> Personnalise</option>
                            </select>
                            {selectedProfileId.startsWith('custom-') && (
                                <button
                                    onClick={() => deleteCustomProfile(selectedProfileId)}
                                    className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Supprimer ce profil personnalise"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {selectedProfileId === 'custom' && (
                            <p className="mt-2 text-xs text-purple-700 italic">
                                 Mode personnalise : Modifiez les options ci-dessous manuellement
                            </p>
                        )}
                        
                        {/*  Details ventiles du preset selectionne */}
                        {selectedProfileId !== 'custom' && !selectedProfileId.startsWith('custom-') && (() => {
                            const selectedPreset = DEFAULT_PRESETS.find(p => p.id === selectedProfileId);
                            if (!selectedPreset) return null;
                            
                            return (
                                <div className="mt-4 p-4 bg-white border-2 border-purple-300 rounded-lg shadow-sm">
                                    <h5 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                                        <InformationCircleIcon className="w-5 h-5 text-purple-600" />
                                         Ce que ce profil implique :
                                    </h5>
                                    {selectedPreset.description && (
                                        <p className="text-sm text-gray-800 mb-4 font-medium bg-purple-50 p-3 rounded border border-purple-100">
                                            {selectedPreset.description}
                                        </p>
                                    )}
                                    {selectedPreset.details && selectedPreset.details.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wide">
                                                Details ventiles :
                                            </p>
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-[300px] overflow-y-auto">
                                                <ul className="space-y-2">
                                                    {selectedPreset.details.map((detail, index) => (
                                                        <li key={index} className="text-xs text-gray-700 flex items-start gap-2 leading-relaxed">
                                                            <span className="text-purple-600 font-bold mt-0.5 flex-shrink-0">-</span>
                                                            <span className="flex-1">{detail}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/*  Dialog pour sauvegarder un profil */}
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
                                            placeholder="Ex: Ma configuration personnalisee"
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

                    {/* Section d'information generale */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                                     Processus de Synchronisation
                                </h4>
                                <div className="text-xs text-blue-800 space-y-2">
                                    <p><strong>Sequence d'execution :</strong></p>
                                    <ol className="list-decimal list-inside ml-2 space-y-1">
                                        <li><strong>Sauvegarde</strong> : Creation d'un snapshot (si active)</li>
                                        <li><strong>Recuperation FMP</strong> : Appel API FMP Premium pour donnees historiques (30 ans)</li>
                                        <li><strong>Merge intelligent</strong> : Fusion des nouvelles donnees avec les existantes</li>
                                        <li><strong>Calcul assumptions</strong> : Recalcul des taux de croissance et ratios cibles</li>
                                        <li><strong>Detection outliers</strong> : Identification des metriques aberrantes</li>
                                        <li><strong>Mise a jour Supabase</strong> : Synchronisation des metriques ValueLine (si active)</li>
                                        <li><strong>Sauvegarde finale</strong> : Creation d'un snapshot post-sync</li>
                                    </ol>
                                    <p className="mt-2"><strong>Outils utilises :</strong> FMP API Premium, Supabase, Algorithmes de detection d'outliers, Calculs CAGR</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Avertissement si donnees manuelles */}
                    {hasManualData && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <div className="flex items-start gap-3">
                                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-yellow-800 font-medium">
                                         Donnees manuelles detectees
                                    </p>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Vous avez modifie des donnees manuellement (cases oranges).
                                        Choisissez si vous souhaitez les preserver ou les remplacer.
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
                                             Sauvegarder la version actuelle avant synchronisation
                                        </p>
                                        {getUtilityBadge(OPTION_METADATA.saveBeforeSync.utility)}
                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <ClockIcon className="w-3 h-3" />
                                            {OPTION_METADATA.saveBeforeSync.timeDescription}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Cree un snapshot de sauvegarde avant de synchroniser. Recommande pour pouvoir restaurer en cas de probleme.
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1 italic">
                                         {OPTION_METADATA.saveBeforeSync.utilityDescription}
                                    </p>
                                    <HelpSection 
                                        id="saveBeforeSync" 
                                        title="Sauvegarde avant synchronisation"
                                        showHelp={showHelp}
                                        setShowHelp={setShowHelp}
                                    >
                                        <div className="space-y-2">
                                            <p><strong>Comportement :</strong> Un snapshot complet est cree dans Supabase avec toutes les donnees actuelles (historiques, assumptions, infos).</p>
                                            <p><strong>Exemple concret :</strong> Si vous avez modifie manuellement le taux de croissance EPS a 12% et que la sync le recalcule a 8.5%, vous pourrez restaurer la version avec 12%.</p>
                                            <p><strong>Outil :</strong> API Supabase Snapshots</p>
                                            <p><strong>Recommandation :</strong> Toujours activer cette option, surtout avant de remplacer les donnees oranges.</p>
                                        </div>
                                    </HelpSection>
                                </div>
                            </label>
                        </div>

                        {/* Remplacer donnees oranges */}
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
                                             Remplacer les donnees oranges (assumptions manuelles)
                                        </p>
                                        {getUtilityBadge(OPTION_METADATA.replaceOrangeData.utility)}
                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <ClockIcon className="w-3 h-3" />
                                            {OPTION_METADATA.replaceOrangeData.timeDescription}
                                        </span>
                                    </div>
                                    <p className="text-xs text-orange-700 mt-1">
                                        <strong>Attention:</strong> Si coche, toutes les valeurs manuelles (taux de croissance, ratios cibles) seront recalculees et remplacees par les valeurs calculees depuis FMP. Cette action est irreversible.
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1 italic">
                                         {OPTION_METADATA.replaceOrangeData.utilityDescription}
                                    </p>
                                    <HelpSection 
                                        id="replaceOrangeData" 
                                        title="Remplacement des donnees oranges"
                                        showHelp={showHelp}
                                        setShowHelp={setShowHelp}
                                    >
                                        <div className="space-y-2">
                                            <p><strong>Comportement :</strong> Les assumptions modifiees manuellement (affichees en orange) seront recalculees depuis les donnees FMP historiques.</p>
                                            <p><strong>Exemple concret :</strong></p>
                                            <ul className="list-disc list-inside ml-2 space-y-1">
                                                <li>Vous aviez modifie <code className="bg-white px-1 rounded">growthRateEPS</code> a 10% manuellement</li>
                                                <li>FMP calcule un CAGR de 8.5% sur 5 ans</li>
                                                <li>Avec cette option : 10% -> 8.5% (remplace)</li>
                                                <li>Sans cette option : 10% -> 10% (preserve)</li>
                                            </ul>
                                            <p><strong>Champs affectes :</strong> growthRateEPS, growthRateCF, growthRateBV, growthRateDiv, targetPE, targetPCF, targetPBV, targetYield</p>
                                            <p><strong>Outil :</strong> Fonction <code className="bg-white px-1 rounded">autoFillAssumptionsFromFMPData()</code> avec <code className="bg-white px-1 rounded">existingAssumptions = undefined</code></p>
                                            <p><strong>Recommandation :</strong> Utiliser uniquement si vous voulez reinitialiser toutes vos hypotheses manuelles avec les valeurs calculees.</p>
                                        </div>
                                    </HelpSection>
                                </div>
                            </label>
                        </div>

                        {/* Forcer remplacement meme donnees manuelles */}
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
                                                 Forcer le remplacement de TOUTES les donnees manuelles
                                            </p>
                                            {getUtilityBadge(OPTION_METADATA.forceReplace.utility)}
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <ClockIcon className="w-3 h-3" />
                                                {OPTION_METADATA.forceReplace.timeDescription}
                                            </span>
                                        </div>
                                        <p className="text-xs text-red-700 mt-1">
                                            <strong>Danger:</strong> Remplace egalement les donnees historiques manuelles (pas seulement les assumptions). Utilisez avec precaution.
                                        </p>
                                        <p className="text-xs text-blue-700 mt-1 italic">
                                             {OPTION_METADATA.forceReplace.utilityDescription}
                                        </p>
                                        <HelpSection 
                                            id="forceReplace" 
                                            title="Remplacement force de toutes les donnees"
                                            showHelp={showHelp}
                                            setShowHelp={setShowHelp}
                                        >
                                            <div className="space-y-2">
                                                <p><strong>Comportement :</strong> Ignore completement le flag <code className="bg-white px-1 rounded">autoFetched: false</code> et remplace TOUTES les donnees, meme celles modifiees manuellement dans le tableau historique.</p>
                                                <p><strong>Exemple concret :</strong></p>
                                                <ul className="list-disc list-inside ml-2 space-y-1">
                                                    <li>Vous aviez modifie manuellement l'EPS de 2020 de 2.50$ a 2.75$</li>
                                                    <li>FMP retourne 2.50$ pour 2020</li>
                                                    <li>Avec cette option : 2.75$ -> 2.50$ (remplace, meme si manuel)</li>
                                                    <li>Sans cette option : 2.75$ -> 2.75$ (preserve car manuel)</li>
                                                </ul>
                                                <p><strong>Champs affectes :</strong> Toutes les donnees historiques (EPS, CF, BV, Dividendes, Prix High/Low) pour toutes les annees</p>
                                                <p><strong>Outil :</strong> Merge intelligent avec <code className="bg-white px-1 rounded">forceReplace = true</code></p>
                                                <p><strong> Attention :</strong> Cette option est destructive et ne peut pas etre annulee facilement. Assurez-vous d'avoir active la sauvegarde avant sync.</p>
                                            </div>
                                        </HelpSection>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Options detaillees */}
                        <div className="border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <InformationCircleIcon className="w-5 h-5 text-gray-600" />
                                Options Detaillees de Synchronisation
                            </h4>

                            <div className="space-y-3">
                                {/* Synchroniser donnees historiques */}
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
                                                 Synchroniser les donnees historiques
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Etats financiers, prix historiques, metriques (30 ans d'historique)
                                            </p>
                                            <HelpSection 
                                                id="syncData" 
                                                title="Synchronisation des donnees historiques"
                                                showHelp={showHelp}
                                                setShowHelp={setShowHelp}
                                            >
                                                <div className="space-y-2">
                                                    <p><strong>Comportement :</strong> Recupere les donnees financieres historiques depuis FMP API (30 ans d'historique) et les fusionne avec les donnees existantes.</p>
                                                    <p><strong>Donnees synchronisees :</strong></p>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li><strong>EPS (Earnings Per Share)</strong> : Benefices par action par annee</li>
                                                        <li><strong>CF (Cash Flow Per Share)</strong> : Flux de tresorerie par action</li>
                                                        <li><strong>BV (Book Value Per Share)</strong> : Valeur comptable par action</li>
                                                        <li><strong>Dividendes</strong> : Dividendes par action</li>
                                                        <li><strong>Prix High/Low</strong> : Prix maximum et minimum par annee</li>
                                                    </ul>
                                                    <p><strong>Exemple concret :</strong> Si vous avez des donnees jusqu'en 2020 et que FMP a des donnees jusqu'en 2024, les annees 2021-2024 seront ajoutees automatiquement.</p>
                                                    <p><strong>Outil :</strong> FMP API Premium - Endpoint <code className="bg-white px-1 rounded">/api/v3/income-statement</code>, <code className="bg-white px-1 rounded">/api/v3/cash-flow-statement</code>, <code className="bg-white px-1 rounded">/api/v3/balance-sheet-statement</code></p>
                                                    <p><strong>Sequence :</strong> Appel API -> Parse JSON -> Merge avec donnees existantes -> Tri par annee</p>
                                                </div>
                                            </HelpSection>
                                        </div>
                                    </label>
                                </div>

                                {/* Synchroniser uniquement nouvelles annees */}
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
                                                         Synchroniser uniquement les nouvelles annees
                                                    </p>
                                                    {getUtilityBadge(OPTION_METADATA.syncOnlyNewYears.utility)}
                                                    <span className="flex items-center gap-1 text-xs text-green-600">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {OPTION_METADATA.syncOnlyNewYears.timeDescription}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    N'ajoute que les annees manquantes, ne modifie pas les annees existantes
                                                </p>
                                                <p className="text-xs text-blue-700 mt-1 italic">
                                                     {OPTION_METADATA.syncOnlyNewYears.utilityDescription}
                                                </p>
                                                <HelpSection 
                                                    id="syncOnlyNewYears" 
                                                    title="Synchronisation uniquement des nouvelles annees"
                                                    showHelp={showHelp}
                                                    setShowHelp={setShowHelp}
                                                >
                                                    <div className="space-y-2">
                                                        <p><strong>Comportement :</strong> Compare les annees existantes avec les annees disponibles dans FMP et n'ajoute que les annees manquantes. Les annees existantes ne sont pas modifiees, meme si les donnees FMP sont differentes.</p>
                                                        <p><strong>Exemple concret :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Vous avez des donnees pour 2015-2020</li>
                                                            <li>FMP a des donnees pour 2010-2024</li>
                                                            <li>Avec cette option : Ajoute uniquement 2010-2014 et 2021-2024</li>
                                                            <li>Sans cette option : Met a jour toutes les annees 2015-2020 aussi</li>
                                                        </ul>
                                                        <p><strong>Avantage :</strong> Plus rapide, preserve toutes vos modifications manuelles sur les annees existantes</p>
                                                          <p><strong>Outil :</strong> Algorithme de comparaison d'annees avec <code className="bg-white px-1 rounded">{'mergedData.some(row => row.year === newRow.year)'}</code></p>
                                                    </div>
                                                </HelpSection>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {/* Synchroniser uniquement metriques manquantes */}
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
                                                         Synchroniser uniquement les metriques manquantes
                                                    </p>
                                                    {getUtilityBadge(OPTION_METADATA.syncOnlyMissingMetrics.utility)}
                                                    <span className="flex items-center gap-1 text-xs text-green-600">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {OPTION_METADATA.syncOnlyMissingMetrics.timeDescription}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Ne remplit que les champs vides (0 ou null), preserve les valeurs existantes
                                                </p>
                                                <p className="text-xs text-blue-700 mt-1 italic">
                                                     {OPTION_METADATA.syncOnlyMissingMetrics.utilityDescription}
                                                </p>
                                                <HelpSection 
                                                    id="syncOnlyMissingMetrics" 
                                                    title="Synchronisation uniquement des metriques manquantes"
                                                    showHelp={showHelp}
                                                    setShowHelp={setShowHelp}
                                                >
                                                    <div className="space-y-2">
                                                        <p><strong>Comportement :</strong> Pour chaque annee, ne remplit que les champs qui sont actuellement vides (0, null, ou undefined). Les champs avec des valeurs existantes sont preserves.</p>
                                                        <p><strong>Exemple concret :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Annee 2020 : EPS = 2.50$ (existant), CF = 0 (manquant)</li>
                                                            <li>FMP retourne : EPS = 2.50$, CF = 3.20$</li>
                                                            <li>Avec cette option : EPS reste 2.50$, CF devient 3.20$</li>
                                                            <li>Sans cette option : EPS devient 2.50$, CF devient 3.20$ (meme si identique)</li>
                                                        </ul>
                                                        <p><strong>Avantage :</strong> Permet de completer progressivement les donnees sans ecraser ce qui existe deja</p>
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
                                                     Synchroniser les assumptions (hypotheses)
                                                </p>
                                                {getUtilityBadge(OPTION_METADATA.syncAssumptions.utility)}
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <ClockIcon className="w-3 h-3" />
                                                    {OPTION_METADATA.syncAssumptions.timeDescription}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Taux de croissance, ratios cibles, annee de base, dividende actuel
                                            </p>
                                            <p className="text-xs text-blue-700 mt-1 italic">
                                                 {OPTION_METADATA.syncAssumptions.utilityDescription}
                                            </p>
                                            <HelpSection 
                                                id="syncAssumptions" 
                                                title="Synchronisation des assumptions"
                                                showHelp={showHelp}
                                                setShowHelp={setShowHelp}
                                            >
                                                <div className="space-y-2">
                                                    <p><strong>Comportement :</strong> Recalcule les hypotheses de valorisation basees sur les donnees historiques FMP.</p>
                                                    <p><strong>Assumptions calculees :</strong></p>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li><strong>Taux de croissance (CAGR 5 ans) :</strong> growthRateEPS, growthRateCF, growthRateBV, growthRateDiv</li>
                                                        <li><strong>Ratios cibles (moyenne 5 ans) :</strong> targetPE, targetPCF, targetPBV, targetYield</li>
                                                        <li><strong>Annee de base :</strong> Derniere annee avec EPS valide</li>
                                                        <li><strong>Dividende actuel :</strong> Dernier dividende par action</li>
                                                    </ul>
                                                    <p><strong>Exemple concret :</strong></p>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li>Donnees FMP : EPS 2019=2.00$, EPS 2024=2.80$</li>
                                                        <li>Calcul CAGR : ((2.80/2.00)^(1/5) - 1) * 100 = 6.96%</li>
                                                        <li>Resultat : growthRateEPS = 6.96%</li>
                                                    </ul>
                                                    <p><strong>Outil :</strong> Fonction <code className="bg-white px-1 rounded">autoFillAssumptionsFromFMPData()</code> avec calculs CAGR et moyennes</p>
                                                    <p><strong>Formule CAGR :</strong> <code className="bg-white px-1 rounded">((ValeurFinale/ValeurInitiale)^(1/Annees) - 1) * 100</code></p>
                                                </div>
                                            </HelpSection>
                                        </div>
                                    </label>
                                </div>

                                {/* Preserver exclusions */}
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
                                                         Preserver les exclusions de metriques
                                                    </p>
                                                    {getUtilityBadge(OPTION_METADATA.preserveExclusions.utility)}
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {OPTION_METADATA.preserveExclusions.timeDescription}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Maintient les checkboxes d'exclusion (EPS, CF, BV, DIV) meme apres recalcul
                                                </p>
                                                <p className="text-xs text-blue-700 mt-1 italic">
                                                     {OPTION_METADATA.preserveExclusions.utilityDescription}
                                                </p>
                                                <HelpSection 
                                                    id="preserveExclusions" 
                                                    title="Preservation des exclusions de metriques"
                                                    showHelp={showHelp}
                                                    setShowHelp={setShowHelp}
                                                >
                                                    <div className="space-y-2">
                                                        <p><strong>Comportement :</strong> Les flags d'exclusion (excludeEPS, excludeCF, excludeBV, excludeDIV) sont preserves meme si la detection d'outliers les recalculerait differemment.</p>
                                                        <p><strong>Exemple concret :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Vous avez exclu EPS manuellement (excludeEPS = true)</li>
                                                            <li>La detection d'outliers recalcule et trouve que EPS n'est plus aberrant</li>
                                                            <li>Avec cette option : excludeEPS reste true (preserve)</li>
                                                            <li>Sans cette option : excludeEPS devient false (recalcule)</li>
                                                        </ul>
                                                        <p><strong>Avantage :</strong> Vous gardez le controle sur quelles metriques utiliser pour la valorisation</p>
                                                        <p><strong>Outil :</strong> Preservation des flags <code className="bg-white px-1 rounded">excludeEPS</code>, <code className="bg-white px-1 rounded">excludeCF</code>, etc. dans <code className="bg-white px-1 rounded">finalAssumptions</code></p>
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
                                                         Recalculer la detection d'outliers
                                                    </p>
                                                    {getUtilityBadge(OPTION_METADATA.recalculateOutliers.utility)}
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {OPTION_METADATA.recalculateOutliers.timeDescription}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Identifie automatiquement les metriques qui produisent des prix cibles aberrants
                                                </p>
                                                <p className="text-xs text-blue-700 mt-1 italic">
                                                     {OPTION_METADATA.recalculateOutliers.utilityDescription}
                                                </p>
                                                <HelpSection 
                                                    id="recalculateOutliers" 
                                                    title="Recalcul de la detection d'outliers"
                                                    showHelp={showHelp}
                                                    setShowHelp={setShowHelp}
                                                >
                                                    <div className="space-y-2">
                                                          <p><strong>Comportement :</strong> Analyse chaque metrique (EPS, CF, BV, DIV) et calcule le prix cible. Si le prix cible est aberrant (negatif, {'>'} 10x le prix actuel, etc.), la metrique est automatiquement exclue.</p>
                                                        <p><strong>Exemple concret :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Prix actuel : 100$</li>
                                                            <li>Calcul prix cible EPS : -50$ (aberrant, EPS negatif ou croissance impossible)</li>
                                                            <li>Resultat : excludeEPS = true (metrique exclue automatiquement)</li>
                                                            <li>Calcul prix cible CF : 150$ (normal)</li>
                                                            <li>Resultat : excludeCF = false (metrique utilisee)</li>
                                                        </ul>
                                                        <p><strong>Criteres d'aberration :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Prix cible negatif</li>
                                                              <li>Prix cible {'>'} 10x le prix actuel</li>
                                                              <li>Prix cible {'<'} 0.1x le prix actuel</li>
                                                            <li>Donnees insuffisantes pour calculer</li>
                                                        </ul>
                                                        <p><strong>Outil :</strong> Fonction <code className="bg-white px-1 rounded">detectOutlierMetrics()</code> avec seuils configurables</p>
                                                    </div>
                                                </HelpSection>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {/* Mettre a jour prix actuel */}
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
                                                     Mettre a jour le prix actuel
                                                </p>
                                                {getUtilityBadge(OPTION_METADATA.updateCurrentPrice.utility)}
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <ClockIcon className="w-3 h-3" />
                                                    {OPTION_METADATA.updateCurrentPrice.timeDescription}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Met a jour le prix actuel depuis FMP (toujours active par defaut)
                                            </p>
                                            <p className="text-xs text-blue-700 mt-1 italic">
                                                 {OPTION_METADATA.updateCurrentPrice.utilityDescription}
                                            </p>
                                            <HelpSection 
                                                id="updateCurrentPrice" 
                                                title="Mise a jour du prix actuel"
                                                showHelp={showHelp}
                                                setShowHelp={setShowHelp}
                                            >
                                                <div className="space-y-2">
                                                    <p><strong>Comportement :</strong> Recupere le prix actuel depuis FMP API et met a jour l'assumption <code className="bg-white px-1 rounded">currentPrice</code>.</p>
                                                    <p><strong>Exemple concret :</strong></p>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li>Prix actuel dans l'app : 150.00$</li>
                                                        <li>Prix FMP : 152.50$</li>
                                                        <li>Avec cette option : 150.00$ -> 152.50$ (mis a jour)</li>
                                                        <li>Sans cette option : 150.00$ -> 150.00$ (preserve)</li>
                                                    </ul>
                                                    <p><strong>Outil :</strong> FMP API - Endpoint <code className="bg-white px-1 rounded">/api/v3/quote</code> ou <code className="bg-white px-1 rounded">/api/v3/profile</code></p>
                                                    <p><strong>Recommandation :</strong> Toujours activer pour avoir les prix a jour</p>
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
                                                    i Synchroniser les informations de profil
                                                </p>
                                                {getUtilityBadge(OPTION_METADATA.syncInfo.utility)}
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <ClockIcon className="w-3 h-3" />
                                                    {OPTION_METADATA.syncInfo.timeDescription}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Nom de l'entreprise, secteur, logo, beta, capitalisation boursiere
                                            </p>
                                            <p className="text-xs text-blue-700 mt-1 italic">
                                                 {OPTION_METADATA.syncInfo.utilityDescription}
                                            </p>
                                            <HelpSection 
                                                id="syncInfo" 
                                                title="Synchronisation des informations de profil"
                                                showHelp={showHelp}
                                                setShowHelp={setShowHelp}
                                            >
                                                <div className="space-y-2">
                                                    <p><strong>Comportement :</strong> Met a jour les informations generales de l'entreprise depuis FMP API.</p>
                                                    <p><strong>Informations synchronisees :</strong></p>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li><strong>Nom de l'entreprise</strong> : Nom complet (ex: "Apple Inc.")</li>
                                                        <li><strong>Secteur</strong> : Secteur d'activite (ex: "Technology")</li>
                                                        <li><strong>Logo</strong> : URL du logo de l'entreprise</li>
                                                        <li><strong>Beta</strong> : Coefficient beta (volatilite relative au marche)</li>
                                                        <li><strong>Capitalisation</strong> : Market Cap en USD</li>
                                                        <li><strong>Pays/Bourse</strong> : Localisation et bourse principale</li>
                                                    </ul>
                                                    <p><strong>Outil :</strong> FMP API - Endpoint <code className="bg-white px-1 rounded">/api/v3/profile</code></p>
                                                    <p><strong>Note :</strong> Les metriques ValueLine (Security Rank, Earnings Predictability) sont preservees et rechargees depuis Supabase separement.</p>
                                                </div>
                                            </HelpSection>
                                        </div>
                                    </label>
                                </div>

                                {/* Synchroniser metriques ValueLine */}
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
                                                         Synchroniser les metriques ValueLine depuis Supabase
                                                    </p>
                                                    {getUtilityBadge(OPTION_METADATA.syncValueLineMetrics.utility)}
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {OPTION_METADATA.syncValueLineMetrics.timeDescription}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Recharge Security Rank, Earnings Predictability, etc. depuis la base de donnees
                                                </p>
                                                <p className="text-xs text-blue-700 mt-1 italic">
                                                     {OPTION_METADATA.syncValueLineMetrics.utilityDescription}
                                                </p>
                                                <HelpSection 
                                                    id="syncValueLineMetrics" 
                                                    title="Synchronisation des metriques ValueLine"
                                                    showHelp={showHelp}
                                                    setShowHelp={setShowHelp}
                                                >
                                                    <div className="space-y-2">
                                                        <p><strong>Comportement :</strong> Recharge les metriques ValueLine depuis Supabase pour garantir la coherence multi-utilisateurs. Ces metriques ne sont pas disponibles dans FMP.</p>
                                                        <p><strong>Metriques ValueLine :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li><strong>Security Rank</strong> : Classement de securite (1-5, 1 = meilleur)</li>
                                                            <li><strong>Earnings Predictability</strong> : Predictibilite des benefices (A-E, A = meilleur)</li>
                                                            <li><strong>Price Growth Persistence</strong> : Persistance de la croissance du prix</li>
                                                            <li><strong>Price Stability</strong> : Stabilite du prix</li>
                                                        </ul>
                                                        <p><strong>Exemple concret :</strong></p>
                                                        <ul className="list-disc list-inside ml-2 space-y-1">
                                                            <li>Valeur locale : Security Rank = "2"</li>
                                                            <li>Valeur Supabase : Security Rank = "1" (mise a jour par un autre utilisateur)</li>
                                                            <li>Avec cette option : Security Rank devient "1" (synchronise)</li>
                                                            <li>Sans cette option : Security Rank reste "2" (local)</li>
                                                        </ul>
                                                        <p><strong>Outil :</strong> API Supabase - Table <code className="bg-white px-1 rounded">tickers</code> avec colonnes <code className="bg-white px-1 rounded">security_rank</code>, <code className="bg-white px-1 rounded">earnings_predictability</code>, etc.</p>
                                                        <p><strong>Recommandation :</strong> Toujours activer pour avoir les dernieres metriques ValueLine partagees</p>
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
                                            title="Synchronisation en masse - Details techniques"
                                            showHelp={showHelp}
                                            setShowHelp={setShowHelp}
                                        >
                                            <div className="space-y-2">
                                                <p><strong>Processus :</strong></p>
                                                <ol className="list-decimal list-inside ml-2 space-y-1">
                                                    <li>Traitement par batch de 5 tickers en parallele</li>
                                                    <li>Delai de 500ms entre chaque batch</li>
                                                    <li>Timeout de 30 secondes par ticker</li>
                                                    <li>Sauvegarde snapshot avant chaque sync (si active)</li>
                                                    <li>Appel FMP API pour chaque ticker</li>
                                                    <li>Merge intelligent des donnees</li>
                                                    <li>Recalcul des assumptions</li>
                                                    <li>Detection d'outliers</li>
                                                    <li>Sauvegarde snapshot apres sync</li>
                                                </ol>
                                                <p><strong>Exemple de timing :</strong></p>
                                                <ul className="list-disc list-inside ml-2 space-y-1">
                                                    <li>10 tickers : ~2-3 minutes</li>
                                                    <li>50 tickers : ~10-15 minutes</li>
                                                    <li>100 tickers : ~20-30 minutes</li>
                                                </ul>
                                                <p><strong>Controles disponibles :</strong> Pause, Resume, Stop pendant la synchronisation</p>
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
