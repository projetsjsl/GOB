/**
 * useSubTab Hook
 * Provides sub-tab specific functionality and state
 * Implements spec T1-ARCH-006
 */

import { useCallback, useMemo } from 'react';
import { useTab } from '../context/TabContext';
import { SubTabConfig } from '../types/tabs';

export function useSubTab() {
  const {
    state,
    activeTabConfig,
    activeSubTabConfig,
    setActiveSubTab,
  } = useTab();

  // Get all sub-tabs for the current active tab
  const subTabs = useMemo(() => {
    return activeTabConfig?.subTabs || [];
  }, [activeTabConfig]);

  // Get active sub-tab ID
  const activeSubTabId = state.activeSubTab;

  // Check if a sub-tab is active
  const isSubTabActive = useCallback(
    (subTabId: string) => state.activeSubTab === subTabId,
    [state.activeSubTab]
  );

  // Navigate to a sub-tab
  const navigateToSubTab = useCallback(
    (subTabId: string) => {
      setActiveSubTab(subTabId);
    },
    [setActiveSubTab]
  );

  // Get sub-tab by ID
  const getSubTab = useCallback(
    (subTabId: string): SubTabConfig | undefined => {
      return subTabs.find(st => st.id === subTabId);
    },
    [subTabs]
  );

  // Get next sub-tab (for keyboard navigation)
  const getNextSubTab = useCallback((): SubTabConfig | null => {
    if (subTabs.length === 0) return null;

    const currentIndex = subTabs.findIndex(st => st.id === activeSubTabId);
    if (currentIndex === -1) return subTabs[0];

    const nextIndex = (currentIndex + 1) % subTabs.length;
    return subTabs[nextIndex];
  }, [subTabs, activeSubTabId]);

  // Get previous sub-tab (for keyboard navigation)
  const getPreviousSubTab = useCallback((): SubTabConfig | null => {
    if (subTabs.length === 0) return null;

    const currentIndex = subTabs.findIndex(st => st.id === activeSubTabId);
    if (currentIndex === -1) return subTabs[subTabs.length - 1];

    const prevIndex = currentIndex === 0 ? subTabs.length - 1 : currentIndex - 1;
    return subTabs[prevIndex];
  }, [subTabs, activeSubTabId]);

  // Navigate to next sub-tab
  const goToNextSubTab = useCallback(() => {
    const nextSubTab = getNextSubTab();
    if (nextSubTab) {
      setActiveSubTab(nextSubTab.id);
    }
  }, [getNextSubTab, setActiveSubTab]);

  // Navigate to previous sub-tab
  const goToPreviousSubTab = useCallback(() => {
    const prevSubTab = getPreviousSubTab();
    if (prevSubTab) {
      setActiveSubTab(prevSubTab.id);
    }
  }, [getPreviousSubTab, setActiveSubTab]);

  // Get last active sub-tab for a specific parent tab
  const getLastActiveSubTab = useCallback(
    (parentTabId: string): string | null => {
      return state.lastActiveSubTabs[parentTabId] || null;
    },
    [state.lastActiveSubTabs]
  );

  // Check if sub-tab is disabled
  const isSubTabDisabled = useCallback(
    (subTabId: string): boolean => {
      const subTab = getSubTab(subTabId);
      return subTab?.disabled || false;
    },
    [getSubTab]
  );

  // Check if sub-tab has permission
  const hasSubTabPermission = useCallback(
    (subTabId: string): boolean => {
      const subTab = getSubTab(subTabId);
      if (!subTab?.permission) return true;
      return subTab.permission.canView;
    },
    [getSubTab]
  );

  return {
    // State
    subTabs,
    activeSubTabId,
    activeSubTabConfig,

    // Navigation
    navigateToSubTab,
    goToNextSubTab,
    goToPreviousSubTab,

    // Queries
    isSubTabActive,
    getSubTab,
    getNextSubTab,
    getPreviousSubTab,
    getLastActiveSubTab,
    isSubTabDisabled,
    hasSubTabPermission,
  };
}
