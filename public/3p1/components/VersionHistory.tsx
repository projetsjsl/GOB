import React, { useState, useEffect } from 'react';
import { ClockIcon, TrashIcon, DocumentDuplicateIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { listSnapshots, deleteSnapshot } from '../services/snapshotApi';
import { SyncDetailsDialog } from './SyncDetailsDialog';

interface Snapshot {
    id: string;
    ticker: string;
    snapshot_date: string;
    version: number;
    notes: string;
    is_current: boolean;
    created_at: string;
    sync_metadata?: any; // Métadonnées de synchronisation
}

interface VersionHistoryProps {
    ticker: string;
    currentSnapshotId?: string;
    onLoadVersion: (snapshotId: string) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
    ticker,
    currentSnapshotId,
    onLoadVersion
}) => {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSyncDetails, setSelectedSyncDetails] = useState<{ snapshot: Snapshot; details: any } | null>(null);

    // Load snapshots when ticker changes
    useEffect(() => {
        loadSnapshots();
    }, [ticker]);

    const loadSnapshots = async () => {
        if (!ticker) return;

        setLoading(true);
        setError(null);

        const result = await listSnapshots(ticker, 20);

        if (result.success) {
            setSnapshots(result.snapshots || []);
        } else {
            setError(result.error || 'Failed to load versions');
        }

        setLoading(false);
    };

    const handleDelete = async (snapshotId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!confirm('Supprimer cette version définitivement?')) {
            return;
        }

        const result = await deleteSnapshot(snapshotId);

        if (result.success) {
            // Reload list
            await loadSnapshots();
        } else {
            setError(`Erreur: ${result.error}`);
            // Clear error after 5 seconds
            setTimeout(() => setError(null), 5000);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!ticker) {
        return (
            <div className="p-4 text-center text-gray-400 text-sm">
                Sélectionnez un ticker
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        Historique
                    </h3>
                    <button
                        onClick={loadSnapshots}
                        disabled={loading}
                        className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                    >
                        {loading ? '⟳' : '↻'}
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    {ticker} • {snapshots.length} version{snapshots.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {error && (
                    <div className="p-4 bg-red-50 border-b border-red-200 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {loading && snapshots.length === 0 && (
                    <div className="p-4 text-center text-gray-400 text-sm">
                        Chargement...
                    </div>
                )}

                {!loading && snapshots.length === 0 && (
                    <div className="p-4 text-center text-gray-400 text-sm">
                        Aucune version sauvegardée
                    </div>
                )}

                <div className="divide-y divide-gray-100">
                    {snapshots.map((snapshot) => (
                        <div
                            key={snapshot.id}
                            className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${snapshot.is_current ? 'bg-blue-50' : ''
                                }`}
                            onClick={() => onLoadVersion(snapshot.id)}
                        >
                            {/* Version Info */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-semibold text-gray-900">
                                            v{snapshot.version}
                                        </span>
                                        {snapshot.is_current && (
                                            <CheckCircleIcon className="w-4 h-4 text-green-500" title="Version actuelle" />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {formatDate(snapshot.snapshot_date)}
                                    </p>
                                    {snapshot.notes && (
                                        <p className="text-xs text-gray-600 mt-1 truncate" title={snapshot.notes}>
                                            {snapshot.notes}
                                        </p>
                                    )}
                                    {snapshot.sync_metadata && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedSyncDetails({ snapshot, details: snapshot.sync_metadata });
                                            }}
                                            className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                            title="Voir les détails de synchronisation"
                                        >
                                            <InformationCircleIcon className="w-3 h-3" />
                                            Détails sync
                                        </button>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => handleDelete(snapshot.id, e)}
                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Supprimer"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer with info */}
            {snapshots.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        💡 Cliquez pour charger une version
                    </p>
                </div>
            )}

            {/* Dialog des détails de synchronisation */}
            {selectedSyncDetails && (
                <SyncDetailsDialog
                    isOpen={!!selectedSyncDetails}
                    onClose={() => setSelectedSyncDetails(null)}
                    ticker={ticker}
                    syncDetails={selectedSyncDetails.details}
                />
            )}
        </div>
    );
};
