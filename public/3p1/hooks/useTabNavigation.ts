/**
 * useTabNavigation Hook
 * Provides keyboard navigation and URL routing for tabs
 * Implements specs T1-NAV-001 through T1-NAV-020
 */

import { useEffect, useCallback, useRef } from 'react';
import { useTab } from '../context/TabContext';
import { TabNavigationOptions, TabNavigationGuard } from '../types/tabs';

export function useTabNavigation() {
  const {
    state,
    tabs,
    setActiveTab,
    setActiveSubTab,
    goBack,
    canGoBack,
  } = useTab();

  const navigationGuardRef = useRef<TabNavigationGuard | null>(null);
  const blockNavigationRef = useRef(false);

  // T1-NAV-016: Navigate programmatically
  const navigateToTab = useCallback(
    async (tabId: string, subTabId?: string, options: TabNavigationOptions = {}) => {
      // T1-NAV-019: Check navigation guard
      if (navigationGuardRef.current && state.activeTab) {
        const canNavigate = await navigationGuardRef.current.canNavigate(
          state.activeTab,
          tabId
        );

        if (!canNavigate) {
          if (navigationGuardRef.current.message) {
            console.warn(navigationGuardRef.current.message);
          }
          return false;
        }
      }

      // T1-NAV-008: Prevent navigation to disabled tabs
      const targetTab = tabs.find(t => t.id === tabId);
      if (targetTab?.disabled) {
        return false;
      }

      // Navigate
      setActiveTab(tabId, subTabId);

      // T1-NAV-018: Execute callback after navigation
      if (options.callback) {
        setTimeout(options.callback, 0);
      }

      // T1-NAV-012: Update URL on tab change
      if (!options.preventScroll) {
        updateURL(tabId, subTabId);
      }

      return true;
    },
    [state.activeTab, tabs, setActiveTab]
  );

  // T1-NAV-010 & T1-NAV-011: URL routing
  const updateURL = useCallback((tabId: string, subTabId?: string) => {
    const path = subTabId ? `${tabId}/${subTabId}` : tabId;
    const url = new URL(window.location.href);
    url.hash = path;
    window.history.pushState({}, '', url.toString());
  }, []);

  // T1-NAV-013: Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.slice(1); // Remove #
      if (hash) {
        const [tabId, subTabId] = hash.split('/');
        setActiveTab(tabId, subTabId);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setActiveTab]);

  // T1-NAV-014: Deep link to specific sub-tab on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const [tabId, subTabId] = hash.split('/');
      if (tabs.some(t => t.id === tabId)) {
        setActiveTab(tabId, subTabId);
      }
    }
  }, []); // Run once on mount

  // T1-NAV-003: Keyboard navigation (arrow keys)
  const handleKeyboardNavigation = useCallback(
    (event: KeyboardEvent) => {
      if (blockNavigationRef.current) return;

      const currentTabIndex = tabs.findIndex(t => t.id === state.activeTab);
      if (currentTabIndex === -1) return;

      let nextIndex = currentTabIndex;

      // Arrow key navigation
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        nextIndex = (currentTabIndex + 1) % tabs.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        nextIndex = currentTabIndex === 0 ? tabs.length - 1 : currentTabIndex - 1;
      }
      // T1-NAV-006: Home/End key navigation
      else if (event.key === 'Home') {
        event.preventDefault();
        nextIndex = 0;
      } else if (event.key === 'End') {
        event.preventDefault();
        nextIndex = tabs.length - 1;
      }

      // Skip disabled tabs
      let attempts = 0;
      while (tabs[nextIndex]?.disabled && attempts < tabs.length) {
        nextIndex = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? (nextIndex === 0 ? tabs.length - 1 : nextIndex - 1)
          : (nextIndex + 1) % tabs.length;
        attempts++;
      }

      if (nextIndex !== currentTabIndex && !tabs[nextIndex]?.disabled) {
        setActiveTab(tabs[nextIndex].id);
      }
    },
    [tabs, state.activeTab, setActiveTab]
  );

  // T1-NAV-004: Keyboard activation (Enter/Space)
  const handleKeyboardActivation = useCallback(
    (event: KeyboardEvent, tabId: string) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setActiveTab(tabId);
      }
    },
    [setActiveTab]
  );

  // Set up keyboard listeners
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if focus is on tab elements or no input is focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement instanceof HTMLInputElement ||
                            activeElement instanceof HTMLTextAreaElement;

      if (!isInputFocused) {
        handleKeyboardNavigation(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyboardNavigation]);

  // Get next tab
  const getNextTab = useCallback(() => {
    const currentIndex = tabs.findIndex(t => t.id === state.activeTab);
    if (currentIndex === -1) return tabs[0];

    let nextIndex = (currentIndex + 1) % tabs.length;
    let attempts = 0;

    // Skip disabled tabs
    while (tabs[nextIndex]?.disabled && attempts < tabs.length) {
      nextIndex = (nextIndex + 1) % tabs.length;
      attempts++;
    }

    return tabs[nextIndex];
  }, [tabs, state.activeTab]);

  // Get previous tab
  const getPreviousTab = useCallback(() => {
    const currentIndex = tabs.findIndex(t => t.id === state.activeTab);
    if (currentIndex === -1) return tabs[tabs.length - 1];

    let prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    let attempts = 0;

    // Skip disabled tabs
    while (tabs[prevIndex]?.disabled && attempts < tabs.length) {
      prevIndex = prevIndex === 0 ? tabs.length - 1 : prevIndex - 1;
      attempts++;
    }

    return tabs[prevIndex];
  }, [tabs, state.activeTab]);

  // Navigate to next tab
  const goToNextTab = useCallback(() => {
    const nextTab = getNextTab();
    if (nextTab) {
      setActiveTab(nextTab.id);
    }
  }, [getNextTab, setActiveTab]);

  // Navigate to previous tab
  const goToPreviousTab = useCallback(() => {
    const prevTab = getPreviousTab();
    if (prevTab) {
      setActiveTab(prevTab.id);
    }
  }, [getPreviousTab, setActiveTab]);

  // T1-NAV-019: Set navigation guard
  const setNavigationGuard = useCallback((guard: TabNavigationGuard | null) => {
    navigationGuardRef.current = guard;
  }, []);

  // Block navigation temporarily
  const setBlockNavigation = useCallback((blocked: boolean) => {
    blockNavigationRef.current = blocked;
  }, []);

  return {
    // Navigation
    navigateToTab,
    goToNextTab,
    goToPreviousTab,
    goBack,
    canGoBack,

    // Guards
    setNavigationGuard,
    setBlockNavigation,

    // Helpers
    getNextTab,
    getPreviousTab,
    handleKeyboardActivation,
    updateURL,
  };
}
