import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onSyncAll?: () => void;
  onSyncNA?: () => void;
  onToggleNAFilter?: () => void;
  onExport?: () => void;
  onOpenSyncDialog?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onSyncAll,
  onSyncNA,
  onToggleNAFilter,
  onExport,
  onOpenSyncDialog,
  enabled = true
}: KeyboardShortcuts) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Ignorer si l'utilisateur est en train de taper dans un input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Ctrl/Cmd + Shift + S : Synchroniser tous les tickers
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      onSyncAll?.();
      return;
    }

    // Ctrl/Cmd + Shift + N : Synchroniser les N/A
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
      e.preventDefault();
      onSyncNA?.();
      return;
    }

    // Ctrl/Cmd + Shift + F : Toggle filtre N/A
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      onToggleNAFilter?.();
      return;
    }

    // Ctrl/Cmd + Shift + E : Export CSV
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      onExport?.();
      return;
    }

    // Ctrl/Cmd + Shift + D : Ouvrir dialog de synchronisation avec critères
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      onOpenSyncDialog?.();
      return;
    }
  }, [enabled, onSyncAll, onSyncNA, onToggleNAFilter, onExport, onOpenSyncDialog]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);
};










