/**
 * 3P1 Tab Context Provider
 * Implements specs T1-STATE-001 through T1-STATE-015
 * Provides global state management for tabs with persistence and synchronization
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  TabState,
  TabAction,
  TabContextValue,
  TabConfig,
  SubTabConfig,
  TabEvent,
  TabEventType,
  TabLayout,
  TabEventEmitter,
} from '../types/tabs';

// T1-STATE-001: Initial default tab state
const INITIAL_STATE: TabState = {
  activeTab: null,
  activeSubTab: null,
  history: [],
  collapsed: false,
  openTabs: [],
  pinnedTabs: [],
  tabOrder: [],
  lastActiveSubTabs: {},
};

// LocalStorage key for persistence (T1-STATE-002)
const STORAGE_KEY = '3p1_tab_state';
const STORAGE_DEBOUNCE_MS = 500;

// T1-STATE-008: Validate tab state on restore
function validateTabState(state: any, availableTabs: TabConfig[]): TabState {
  if (!state || typeof state !== 'object') {
    return INITIAL_STATE;
  }

  const tabIds = new Set(availableTabs.map(t => t.id));

  return {
    activeTab: tabIds.has(state.activeTab) ? state.activeTab : null,
    activeSubTab: state.activeSubTab || null,
    history: Array.isArray(state.history) ? state.history.filter((h: any) => tabIds.has(h.tabId)) : [],
    collapsed: Boolean(state.collapsed),
    openTabs: Array.isArray(state.openTabs) ? state.openTabs.filter((id: string) => tabIds.has(id)) : [],
    pinnedTabs: Array.isArray(state.pinnedTabs) ? state.pinnedTabs.filter((id: string) => tabIds.has(id)) : [],
    tabOrder: Array.isArray(state.tabOrder) ? state.tabOrder.filter((id: string) => tabIds.has(id)) : [],
    lastActiveSubTabs: state.lastActiveSubTabs || {},
  };
}

// T1-ARCH-010: Tab event emitter implementation
class TabEventEmitterImpl implements TabEventEmitter {
  private listeners: Map<TabEventType, Set<(event: TabEvent) => void>> = new Map();

  on(type: TabEventType, callback: (event: TabEvent) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Return unsubscribe function
    return () => this.off(type, callback);
  }

  off(type: TabEventType, callback: (event: TabEvent) => void): void {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event: TabEvent): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in tab event listener:', error);
        }
      });
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

// Global event emitter instance
const eventEmitter = new TabEventEmitterImpl();

// Tab state reducer
function tabReducer(state: TabState, action: TabAction): TabState {
  switch (action.type) {
    case 'SET_ACTIVE_TAB': {
      const { tabId, subTabId } = action.payload;

      // T1-STATE-004: Track navigation history
      const historyEntry = {
        tabId,
        subTabId,
        timestamp: Date.now(),
      };

      // T1-STATE-012: Track last active sub-tab per parent
      const lastActiveSubTabs = subTabId
        ? { ...state.lastActiveSubTabs, [tabId]: subTabId }
        : state.lastActiveSubTabs;

      // Emit event
      eventEmitter.emit({
        type: 'TAB_ACTIVATED',
        tabId,
        subTabId,
        timestamp: Date.now(),
      });

      return {
        ...state,
        activeTab: tabId,
        activeSubTab: subTabId || null,
        history: [...state.history, historyEntry],
        lastActiveSubTabs,
      };
    }

    case 'SET_ACTIVE_SUBTAB': {
      const { subTabId } = action.payload;

      if (!state.activeTab) return state;

      // Update last active sub-tab for current parent
      const lastActiveSubTabs = {
        ...state.lastActiveSubTabs,
        [state.activeTab]: subTabId,
      };

      // Emit event
      eventEmitter.emit({
        type: 'SUBTAB_ACTIVATED',
        tabId: state.activeTab,
        subTabId,
        timestamp: Date.now(),
      });

      return {
        ...state,
        activeSubTab: subTabId,
        lastActiveSubTabs,
      };
    }

    case 'GO_BACK': {
      if (state.history.length < 2) return state;

      const newHistory = [...state.history];
      newHistory.pop(); // Remove current
      const previous = newHistory[newHistory.length - 1];

      return {
        ...state,
        activeTab: previous.tabId,
        activeSubTab: previous.subTabId || null,
        history: newHistory,
      };
    }

    case 'GO_FORWARD': {
      // Forward navigation would require a separate forward stack
      // For now, this is a placeholder
      return state;
    }

    case 'TOGGLE_COLLAPSED': {
      return {
        ...state,
        collapsed: !state.collapsed,
      };
    }

    case 'OPEN_TAB': {
      const { tabId } = action.payload;

      if (state.openTabs.includes(tabId)) return state;

      eventEmitter.emit({
        type: 'TAB_OPENED',
        tabId,
        timestamp: Date.now(),
      });

      return {
        ...state,
        openTabs: [...state.openTabs, tabId],
      };
    }

    case 'CLOSE_TAB': {
      const { tabId } = action.payload;

      eventEmitter.emit({
        type: 'TAB_CLOSED',
        tabId,
        timestamp: Date.now(),
      });

      // If closing active tab, switch to another
      let newActiveTab = state.activeTab;
      let newActiveSubTab = state.activeSubTab;

      if (state.activeTab === tabId) {
        const openTabs = state.openTabs.filter(id => id !== tabId);
        newActiveTab = openTabs[openTabs.length - 1] || null;
        newActiveSubTab = null;
      }

      return {
        ...state,
        openTabs: state.openTabs.filter(id => id !== tabId),
        activeTab: newActiveTab,
        activeSubTab: newActiveSubTab,
      };
    }

    case 'PIN_TAB': {
      const { tabId } = action.payload;

      if (state.pinnedTabs.includes(tabId)) return state;

      eventEmitter.emit({
        type: 'TAB_PINNED',
        tabId,
        timestamp: Date.now(),
      });

      return {
        ...state,
        pinnedTabs: [...state.pinnedTabs, tabId],
      };
    }

    case 'UNPIN_TAB': {
      const { tabId } = action.payload;

      eventEmitter.emit({
        type: 'TAB_UNPINNED',
        tabId,
        timestamp: Date.now(),
      });

      return {
        ...state,
        pinnedTabs: state.pinnedTabs.filter(id => id !== tabId),
      };
    }

    case 'REORDER_TABS': {
      const { tabOrder } = action.payload;

      eventEmitter.emit({
        type: 'TAB_REORDERED',
        tabId: '',
        timestamp: Date.now(),
        data: { tabOrder },
      });

      return {
        ...state,
        tabOrder,
      };
    }

    case 'RESTORE_STATE': {
      return action.payload;
    }

    case 'RESET_STATE': {
      // T1-STATE-009: Reset to default state
      return INITIAL_STATE;
    }

    case 'CLEAR_HISTORY': {
      // T1-STATE-005: Clear history
      return {
        ...state,
        history: [],
      };
    }

    default:
      return state;
  }
}

// Context
const TabContext = createContext<TabContextValue | undefined>(undefined);

// Provider props
interface TabProviderProps {
  children: ReactNode;
  tabs: TabConfig[];
  defaultTab?: string;
  persistState?: boolean;
}

// T1-ARCH-004: Tab context provider
export function TabProvider({ children, tabs, defaultTab, persistState = true }: TabProviderProps) {
  // T1-STATE-003: Restore state from localStorage
  const getInitialState = useCallback((): TabState => {
    if (!persistState) return INITIAL_STATE;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return validateTabState(parsed, tabs);
      }
    } catch (error) {
      console.error('Failed to restore tab state:', error);
    }

    // Set default active tab
    const initialState = { ...INITIAL_STATE };
    if (defaultTab && tabs.some(t => t.id === defaultTab)) {
      initialState.activeTab = defaultTab;
      initialState.openTabs = [defaultTab];
    } else if (tabs.length > 0) {
      initialState.activeTab = tabs[0].id;
      initialState.openTabs = [tabs[0].id];
    }

    return initialState;
  }, [tabs, defaultTab, persistState]);

  const [state, dispatch] = useReducer(tabReducer, null, getInitialState);

  // T1-STATE-002 & T1-STATE-014: Persist state with debouncing
  useEffect(() => {
    if (!persistState) return;

    const timeoutId = setTimeout(() => {
      try {
        // T1-STATE-015: Handle storage quota exceeded
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error: any) {
          if (error.name === 'QuotaExceededError') {
            console.warn('Storage quota exceeded, clearing history');
            const minimalState = { ...state, history: [] };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalState));
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error('Failed to persist tab state:', error);
      }
    }, STORAGE_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [state, persistState]);

  // T1-STATE-006: Sync state across browser tabs
  useEffect(() => {
    if (!persistState) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          const validated = validateTabState(newState, tabs);
          dispatch({ type: 'RESTORE_STATE', payload: validated });
        } catch (error) {
          console.error('Failed to sync tab state:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [tabs, persistState]);

  // T1-STATE-005: Clear state on logout (listen for custom event)
  useEffect(() => {
    const handleLogout = () => {
      dispatch({ type: 'RESET_STATE' });
      if (persistState) {
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    window.addEventListener('user-logout', handleLogout);
    return () => window.removeEventListener('user-logout', handleLogout);
  }, [persistState]);

  // Helper functions
  const setActiveTab = useCallback((tabId: string, subTabId?: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: { tabId, subTabId } });
  }, []);

  const setActiveSubTab = useCallback((subTabId: string) => {
    dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: { subTabId } });
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: 'GO_BACK' });
  }, []);

  const goForward = useCallback(() => {
    dispatch({ type: 'GO_FORWARD' });
  }, []);

  const toggleCollapsed = useCallback(() => {
    dispatch({ type: 'TOGGLE_COLLAPSED' });
  }, []);

  const openTab = useCallback((tabId: string) => {
    dispatch({ type: 'OPEN_TAB', payload: { tabId } });
  }, []);

  const closeTab = useCallback((tabId: string) => {
    dispatch({ type: 'CLOSE_TAB', payload: { tabId } });
  }, []);

  const pinTab = useCallback((tabId: string) => {
    dispatch({ type: 'PIN_TAB', payload: { tabId } });
  }, []);

  const unpinTab = useCallback((tabId: string) => {
    dispatch({ type: 'UNPIN_TAB', payload: { tabId } });
  }, []);

  const reorderTabs = useCallback((tabOrder: string[]) => {
    dispatch({ type: 'REORDER_TABS', payload: { tabOrder } });
  }, []);

  const setLayout = useCallback((layout: TabLayout) => {
    dispatch({ type: 'SET_LAYOUT', payload: { layout } });
  }, []);

  // Computed values
  const activeTabConfig = useMemo(
    () => tabs.find(t => t.id === state.activeTab) || null,
    [tabs, state.activeTab]
  );

  const activeSubTabConfig = useMemo(() => {
    if (!activeTabConfig || !state.activeSubTab) return null;
    return activeTabConfig.subTabs?.find(st => st.id === state.activeSubTab) || null;
  }, [activeTabConfig, state.activeSubTab]);

  const canGoBack = state.history.length > 1;
  const canGoForward = false; // Would need forward stack

  // Event listener management
  const addEventListener = useCallback((type: TabEventType, callback: (event: TabEvent) => void) => {
    return eventEmitter.on(type, callback);
  }, []);

  const removeEventListener = useCallback((type: TabEventType, callback: (event: TabEvent) => void) => {
    eventEmitter.off(type, callback);
  }, []);

  const value: TabContextValue = {
    state,
    dispatch,
    tabs,
    activeTabConfig,
    activeSubTabConfig,
    setActiveTab,
    setActiveSubTab,
    goBack,
    goForward,
    toggleCollapsed,
    openTab,
    closeTab,
    pinTab,
    unpinTab,
    reorderTabs,
    canGoBack,
    canGoForward,
    layout: TabLayout.HORIZONTAL,
    setLayout,
    addEventListener,
    removeEventListener,
  };

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}

// T1-ARCH-005: useTab hook
export function useTab() {
  const context = useContext(TabContext);

  if (!context) {
    throw new Error('useTab must be used within a TabProvider');
  }

  return context;
}

// Export for testing and advanced use cases
export { TabContext, eventEmitter };
