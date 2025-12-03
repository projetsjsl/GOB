import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { listSnapshots, loadSnapshot } from '../services/snapshotApi';

interface RightSidebarProps {
  ticker: string;
  onLoadVersion: (snapshotId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

interface SnapshotAction {
  type: 'sync' | 'generated' | 'modified' | 'approved';
  date: string;
  user?: string;
}

interface SnapshotWithActions {
  id: string;
  version: number;
  date: string;
  notes?: string;
  isCurrent: boolean;
  isApproved?: boolean;
  actions?: SnapshotAction[];
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ ticker, onLoadVersion, isOpen, onToggle }) => {
  const [snapshots, setSnapshots] = useState<SnapshotWithActions[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && ticker) {
      loadSnapshots();
    }
  }, [isOpen, ticker]);

  const loadSnapshots = async () => {
    setIsLoading(true);
    try {
      const result = await listSnapshots(ticker, 50);
      if (result.success && result.snapshots) {
        // Enrichir les snapshots avec les actions (pour l'instant, on simule)
        const enriched = result.snapshots.map((snap: any) => ({
          id: snap.id,
          version: snap.version,
          date: snap.snapshot_date,
          notes: snap.notes,
          isCurrent: snap.is_current,
          isApproved: snap.is_approved || false,
          actions: extractActions(snap)
        }));
        setSnapshots(enriched);
      }
    } catch (error) {
      console.error('Error loading snapshots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractActions = (snapshot: any): SnapshotAction[] => {
    const actions: SnapshotAction[] = [];
    
    // Extraire les actions depuis les métadonnées du snapshot
    // Les métadonnées peuvent être stockées dans snapshot.metadata ou directement dans snapshot
    if (snapshot.auto_fetched) {
      actions.push({ type: 'sync', date: snapshot.snapshot_date || snapshot.created_at });
    }
    if (snapshot.created_at) {
      actions.push({ type: 'generated', date: snapshot.created_at });
    }
    if (snapshot.updated_at && snapshot.updated_at !== snapshot.created_at) {
      actions.push({ type: 'modified', date: snapshot.updated_at });
    }
    if (snapshot.is_approved || snapshot.approved_at) {
      actions.push({ type: 'approved', date: snapshot.approved_at || snapshot.snapshot_date });
    }
    
    // Si metadata contient des actions personnalisées
    if (snapshot.metadata && snapshot.metadata.actions) {
      snapshot.metadata.actions.forEach((action: any) => {
        actions.push({
          type: action.type,
          date: action.date,
          user: action.user
        });
      });
    }
    
    return actions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getActionLabel = (type: SnapshotAction['type']): string => {
    switch (type) {
      case 'sync': return 'Synchronisé le';
      case 'generated': return 'Généré le';
      case 'modified': return 'Modifié le';
      case 'approved': return 'Approuvé le';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-slate-800 text-white p-2 rounded-l-lg shadow-lg hover:bg-slate-700 transition-all ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        title={isOpen ? "Masquer l'historique" : "Afficher l'historique"}
      >
        {isOpen ? (
          <ChevronRightIcon className="w-5 h-5" />
        ) : (
          <ChevronLeftIcon className="w-5 h-5" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full bg-slate-900 text-white shadow-2xl transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: 'min(400px, 90vw)' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  Historique
                </h2>
                <p className="text-xs text-slate-500 mt-1">{ticker}</p>
              </div>
              <button
                onClick={onToggle}
                className="p-1 hover:bg-slate-800 rounded"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="text-center text-slate-500 py-8">Chargement...</div>
            ) : snapshots.length === 0 ? (
              <div className="text-center text-slate-500 py-8">Aucun historique disponible</div>
            ) : (
              snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => onLoadVersion(snapshot.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-400">v{snapshot.version}</span>
                        {snapshot.isCurrent && (
                          <span className="text-xs bg-green-600 px-2 py-0.5 rounded">Actuel</span>
                        )}
                        {snapshot.isApproved && (
                          <CheckCircleIcon className="w-4 h-4 text-green-400" title="Version approuvée" />
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{formatDate(snapshot.date)}</div>
                    </div>
                  </div>

                  {snapshot.notes && (
                    <div className="text-sm text-slate-300 mb-2 italic">{snapshot.notes}</div>
                  )}

                  {/* Actions List */}
                  {snapshot.actions && snapshot.actions.length > 0 && (
                    <div className="mt-3 space-y-1 border-t border-slate-700 pt-2">
                      {snapshot.actions.map((action, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                          <div className={`w-2 h-2 rounded-full ${
                            action.type === 'approved' ? 'bg-green-500' :
                            action.type === 'sync' ? 'bg-blue-500' :
                            action.type === 'modified' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`} />
                          <span>{getActionLabel(action.type)}</span>
                          <span className="text-slate-500">{formatDate(action.date)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

