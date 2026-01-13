/**
 * 3P1 Tabs & Sub-Tabs Type Definitions
 * Complete type system for tab navigation architecture
 * Implements specs T1-ARCH-001 through T1-ARCH-015
 */

import { ReactNode, ComponentType } from 'react';

// T1-ARCH-001: TabConfig interface
export interface TabConfig {
  id: string;
  label: string;
  icon?: ReactNode | ComponentType<any>;
  component: ComponentType<any>;
  subTabs?: SubTabConfig[];
  disabled?: boolean;
  badge?: TabBadge;
  permission?: TabPermission;
  closable?: boolean;
  pinned?: boolean;
  order?: number;
}

// T1-ARCH-002: SubTabConfig interface
export interface SubTabConfig {
  id: string;
  label: string;
  icon?: ReactNode | ComponentType<any>;
  component: ComponentType<any>;
  parentId: string;
  disabled?: boolean;
  badge?: TabBadge;
  permission?: TabPermission;
}

// T1-ARCH-003: TabState type
export interface TabState {
  activeTab: string | null;
  activeSubTab: string | null;
  history: TabHistoryEntry[];
  collapsed: boolean;
  openTabs: string[];
  pinnedTabs: string[];
  tabOrder: string[];
  lastActiveSubTabs: Record<string, string>; // parentId -> subTabId
}

// T1-ARCH-009: TabEvent interface
export interface TabEvent {
  type: TabEventType;
  tabId: string;
  subTabId?: string;
  timestamp: number;
  data?: any;
}

export type TabEventType =
  | 'TAB_ACTIVATED'
  | 'TAB_CLOSED'
  | 'TAB_OPENED'
  | 'TAB_PINNED'
  | 'TAB_UNPINNED'
  | 'TAB_REORDERED'
  | 'SUBTAB_ACTIVATED'
  | 'TAB_REFRESHED'
  | 'TAB_ERROR'
  | 'TAB_LOADED';

// T1-ARCH-007: TabPermission type
export interface TabPermission {
  canView: boolean;
  canEdit?: boolean;
  requiresAuth?: boolean;
  roles?: string[];
}

// T1-ARCH-015: TabBadge interface
export interface TabBadge {
  count?: number;
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'gray';
  pulse?: boolean;
  text?: string;
  dot?: boolean;
}

// T1-ARCH-011: TabAnimation type
export type TabAnimation = 'fade' | 'slide' | 'none';

// T1-ARCH-013: TabLayout enum
export enum TabLayout {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  SIDEBAR = 'sidebar',
  BOTTOM = 'bottom',
}

// Tab history entry for back/forward navigation
export interface TabHistoryEntry {
  tabId: string;
  subTabId?: string;
  timestamp: number;
  scrollPosition?: number;
}

// Tab context action types
export type TabAction =
  | { type: 'SET_ACTIVE_TAB'; payload: { tabId: string; subTabId?: string } }
  | { type: 'SET_ACTIVE_SUBTAB'; payload: { subTabId: string } }
  | { type: 'GO_BACK' }
  | { type: 'GO_FORWARD' }
  | { type: 'TOGGLE_COLLAPSED' }
  | { type: 'OPEN_TAB'; payload: { tabId: string } }
  | { type: 'CLOSE_TAB'; payload: { tabId: string } }
  | { type: 'PIN_TAB'; payload: { tabId: string } }
  | { type: 'UNPIN_TAB'; payload: { tabId: string } }
  | { type: 'REORDER_TABS'; payload: { tabOrder: string[] } }
  | { type: 'RESTORE_STATE'; payload: TabState }
  | { type: 'RESET_STATE' }
  | { type: 'SET_LAYOUT'; payload: { layout: TabLayout } }
  | { type: 'CLEAR_HISTORY' };

// Tab context value
export interface TabContextValue {
  state: TabState;
  dispatch: React.Dispatch<TabAction>;
  tabs: TabConfig[];
  activeTabConfig: TabConfig | null;
  activeSubTabConfig: SubTabConfig | null;
  setActiveTab: (tabId: string, subTabId?: string) => void;
  setActiveSubTab: (subTabId: string) => void;
  goBack: () => void;
  goForward: () => void;
  toggleCollapsed: () => void;
  openTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  pinTab: (tabId: string) => void;
  unpinTab: (tabId: string) => void;
  reorderTabs: (tabOrder: string[]) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  layout: TabLayout;
  setLayout: (layout: TabLayout) => void;
  addEventListener: (type: TabEventType, callback: (event: TabEvent) => void) => () => void;
  removeEventListener: (type: TabEventType, callback: (event: TabEvent) => void) => void;
}

// T1-ARCH-012: TabTransition component props
export interface TabTransitionProps {
  children: ReactNode;
  animation?: TabAnimation;
  duration?: number;
  show: boolean;
}

// T1-ARCH-014: TabLayoutManager props
export interface TabLayoutManagerProps {
  layout: TabLayout;
  children: ReactNode;
}

// Component props interfaces
export interface TabContainerProps {
  tabs: TabConfig[];
  layout?: TabLayout;
  animation?: TabAnimation;
  className?: string;
  defaultTab?: string;
  onTabChange?: (tabId: string, subTabId?: string) => void;
}

export interface TabBarProps {
  tabs: TabConfig[];
  activeTabId: string | null;
  onTabClick: (tabId: string) => void;
  layout?: TabLayout;
  className?: string;
  showIcons?: boolean;
  showLabels?: boolean;
  collapsible?: boolean;
  overflow?: 'scroll' | 'dropdown';
}

export interface TabItemProps {
  tab: TabConfig;
  isActive: boolean;
  onClick: () => void;
  onClose?: () => void;
  onPin?: () => void;
  isPinned?: boolean;
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

export interface TabPanelProps {
  tabId: string;
  isActive: boolean;
  children: ReactNode;
  animation?: TabAnimation;
  className?: string;
  lazy?: boolean;
  keepMounted?: boolean;
}

export interface SubTabContainerProps {
  subTabs: SubTabConfig[];
  activeSubTabId: string | null;
  onSubTabClick: (subTabId: string) => void;
  className?: string;
}

export interface SubTabBarProps {
  subTabs: SubTabConfig[];
  activeSubTabId: string | null;
  onSubTabClick: (subTabId: string) => void;
  className?: string;
}

export interface SubTabItemProps {
  subTab: SubTabConfig;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export interface SubTabPanelProps {
  subTabId: string;
  isActive: boolean;
  children: ReactNode;
  animation?: TabAnimation;
  className?: string;
}

export interface TabIconProps {
  icon?: ReactNode | ComponentType<any>;
  size?: number;
  className?: string;
}

export interface TabBadgeProps {
  badge?: TabBadge;
  className?: string;
}

export interface TabLabelProps {
  label: string;
  truncate?: boolean;
  maxLength?: number;
  className?: string;
}

export interface TabDropdownProps {
  tabs: TabConfig[];
  activeTabId: string | null;
  onTabClick: (tabId: string) => void;
  className?: string;
}

export interface TabContextMenuProps {
  tabId: string;
  onClose?: () => void;
  onPin?: () => void;
  onDuplicate?: () => void;
  onRefresh?: () => void;
  position: { x: number; y: number };
}

export interface TabSkeletonProps {
  count?: number;
  layout?: TabLayout;
  className?: string;
}

export interface TabErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export interface TabEmptyProps {
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

// T1-ARCH-008: TabRegistry singleton type
export interface TabRegistry {
  registerTab: (tab: TabConfig) => void;
  unregisterTab: (tabId: string) => void;
  getTab: (tabId: string) => TabConfig | undefined;
  getAllTabs: () => TabConfig[];
  getTabsByPermission: (permission: TabPermission) => TabConfig[];
  clearRegistry: () => void;
}

// T1-ARCH-010: TabEventEmitter type
export interface TabEventEmitter {
  on: (type: TabEventType, callback: (event: TabEvent) => void) => () => void;
  off: (type: TabEventType, callback: (event: TabEvent) => void) => void;
  emit: (event: TabEvent) => void;
  clear: () => void;
}

// Navigation types
export interface TabNavigationOptions {
  replace?: boolean;
  callback?: () => void;
  preventScroll?: boolean;
}

export interface TabNavigationGuard {
  canNavigate: (from: string, to: string) => boolean | Promise<boolean>;
  message?: string;
}

// Data management types
export interface TabDataState<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  timestamp: number;
  stale: boolean;
}

export interface TabDataCache {
  get: <T>(key: string) => TabDataState<T> | undefined;
  set: <T>(key: string, data: TabDataState<T>) => void;
  invalidate: (key: string) => void;
  clear: () => void;
}

// Search and filter types
export interface TabSearchOptions {
  query: string;
  includeSubTabs?: boolean;
  filterByPermission?: boolean;
}

export interface TabSearchResult {
  tab: TabConfig;
  subTab?: SubTabConfig;
  score: number;
}

// Responsive breakpoints
export interface TabBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

export const DEFAULT_BREAKPOINTS: TabBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  wide: 1920,
};

// Keyboard shortcuts
export interface TabKeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

// Accessibility types
export interface TabA11yProps {
  role?: string;
  ariaLabel?: string;
  ariaSelected?: boolean;
  ariaControls?: string;
  ariaLabelledBy?: string;
  ariaDisabled?: boolean;
  tabIndex?: number;
}

// Export utility types
export type TabId = string;
export type SubTabId = string;
export type TabPath = `${TabId}` | `${TabId}/${SubTabId}`;
