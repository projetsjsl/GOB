/**
 * 3P1 Tabs Configuration
 * Defines all main tabs and sub-tabs for the application
 * Implements specs T3-INT-001 through T3-INT-025
 */

import React from 'react';
import {
  ChartBarIcon,
  ChartPieIcon,
  FolderOpenIcon,
  Cog6ToothIcon,
  TableCellsIcon,
  PresentationChartBarIcon,
  CalculatorIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  CircleStackIcon,
  DocumentMagnifyingGlassIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  DocumentChartBarIcon,
  BellAlertIcon,
  ArrowDownTrayIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { TabConfig } from '../types/tabs';

// Lazy load components for better performance
const HistoricalTable = React.lazy(() => import('../components/HistoricalTable').then(m => ({ default: m.HistoricalTable })));
const ValuationCharts = React.lazy(() => import('../components/ValuationCharts').then(m => ({ default: m.ValuationCharts })));
const SensitivityTable = React.lazy(() => import('../components/SensitivityTable').then(m => ({ default: m.SensitivityTable })));
const KPIDashboard = React.lazy(() => import('../components/KPIDashboard').then(m => ({ default: m.KPIDashboard })));
const DataExplorerPanel = React.lazy(() => import('../components/DataExplorerPanel'));
const AdminDashboard = React.lazy(() => import('../components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const UnifiedSettingsPanel = React.lazy(() => import('../components/UnifiedSettingsPanel').then(m => ({ default: m.UnifiedSettingsPanel })));
const ReportsPanel = React.lazy(() => import('../components/ReportsPanel').then(m => ({ default: m.ReportsPanel })));

// Placeholder components for sub-tabs that don't exist yet
const AssumptionsView = () => (
  <div className="p-6 text-gray-300">
    <h2 className="text-xl font-bold mb-4">Assumptions</h2>
    <p>Growth rates and valuation assumptions configuration.</p>
  </div>
);

const OverviewView = () => (
  <div className="p-6 text-gray-300">
    <h2 className="text-xl font-bold mb-4">KPI Overview</h2>
    <p>Summary statistics and key performance indicators.</p>
  </div>
);

const JPEGYChartView = () => (
  <div className="p-6 text-gray-300">
    <h2 className="text-xl font-bold mb-4">JPEGY Chart</h2>
    <p>Scatter plot visualization of key metrics.</p>
  </div>
);

const ReturnsView = () => (
  <div className="p-6 text-gray-300">
    <h2 className="text-xl font-bold mb-4">Returns Distribution</h2>
    <p>Historical return distribution histogram.</p>
  </div>
);

const ComparisonView = () => (
  <div className="p-6 text-gray-300">
    <h2 className="text-xl font-bold mb-4">Comparison</h2>
    <p>Side-by-side ticker comparison.</p>
  </div>
);

const SnapshotsView = () => (
  <div className="p-6 text-gray-300">
    <h2 className="text-xl font-bold mb-4">Version History</h2>
    <p>Historical data snapshots and versions.</p>
  </div>
);

const RawDataView = () => (
  <div className="p-6 text-gray-300">
    <h2 className="text-xl font-bold mb-4">Raw Data</h2>
    <p>JSON viewer for raw data inspection.</p>
  </div>
);

const QualityView = () => (
  <div className="p-6 text-gray-300">
    <h2 className="text-xl font-bold mb-4">Data Quality</h2>
    <p>Data quality report and validation results.</p>
  </div>
);

const SyncView = () => (
  <div className="p-6 text-gray-300">
    <h2 className="text-xl font-bold mb-4">Sync Controls</h2>
    <p>Batch synchronization and data refresh controls.</p>
  </div>
);

const TickersView = () => (
  <div className="p-6 text-gray-300">
    <h2 className="text-xl font-bold mb-4">Ticker Management</h2>
    <p>Manage tickers, watchlists, and team selections.</p>
  </div>
);

const ConfigView = () => (
  <div className="p-6 text-gray-300">
    <h2 className="text-xl font-bold mb-4">Configuration</h2>
    <p>Application settings and guardrail configuration.</p>
  </div>
);

const LogsView = () => (
  <div className="p-6 text-gray-300">
    <h2 className="text-xl font-bold mb-4">Error Logs</h2>
    <p>System logs and error tracking.</p>
  </div>
);

const ProfileView = () => (
  <div className="p-6 text-gray-300">
    <h2 className="text-xl font-bold mb-4">User Profile</h2>
    <p>User profile and account settings.</p>
  </div>
);

const DisplayView = () => (
  <div className="p-6 text-gray-300">
    <h2 className="text-xl font-bold mb-4">Display Settings</h2>
    <p>Theme, layout, and visual preferences.</p>
  </div>
);

const NotificationsView = () => (
  <div className="p-6 text-gray-300">
    <h2 className="text-xl font-bold mb-4">Notifications</h2>
    <p>Alert settings and notification preferences.</p>
  </div>
);

const ExportView = () => (
  <div className="p-6 text-gray-300">
    <h2 className="text-xl font-bold mb-4">Export Options</h2>
    <p>Data export and report generation settings.</p>
  </div>
);

/**
 * T3-INT-001 to T3-INT-025: Complete 3P1 Tab Configuration
 */
export const tabs3P1Config: TabConfig[] = [
  // T3-INT-001: Analysis Tab with Sub-Tabs
  {
    id: 'analysis',
    label: 'Analysis',
    icon: ChartBarIcon,
    component: () => <div className="h-full"><HistoricalTable /></div>,
    subTabs: [
      // T3-INT-002: Data Sub-Tab
      {
        id: 'analysis-data',
        label: 'Data',
        icon: TableCellsIcon,
        component: () => <HistoricalTable />,
        parentId: 'analysis',
      },
      // T3-INT-003: Assumptions Sub-Tab
      {
        id: 'analysis-assumptions',
        label: 'Assumptions',
        icon: CalculatorIcon,
        component: AssumptionsView,
        parentId: 'analysis',
      },
      // T3-INT-004: Charts Sub-Tab
      {
        id: 'analysis-charts',
        label: 'Charts',
        icon: PresentationChartBarIcon,
        component: () => <ValuationCharts />,
        parentId: 'analysis',
      },
      // T3-INT-005: Sensitivity Sub-Tab
      {
        id: 'analysis-sensitivity',
        label: 'Sensitivity',
        icon: ArrowTrendingUpIcon,
        component: () => <SensitivityTable />,
        parentId: 'analysis',
      },
    ],
  },

  // T3-INT-006: KPI Dashboard Tab with Sub-Tabs
  {
    id: 'kpi',
    label: 'KPI Dashboard',
    icon: ChartPieIcon,
    component: () => <KPIDashboard />,
    subTabs: [
      // T3-INT-007: Overview Sub-Tab
      {
        id: 'kpi-overview',
        label: 'Overview',
        icon: DocumentTextIcon,
        component: OverviewView,
        parentId: 'kpi',
      },
      // T3-INT-008: JPEGY Chart Sub-Tab
      {
        id: 'kpi-jpegy',
        label: 'JPEGY Chart',
        icon: ChartPieIcon,
        component: JPEGYChartView,
        parentId: 'kpi',
      },
      // T3-INT-009: Returns Sub-Tab
      {
        id: 'kpi-returns',
        label: 'Returns',
        icon: ArrowTrendingUpIcon,
        component: ReturnsView,
        parentId: 'kpi',
      },
      // T3-INT-010: Table Sub-Tab
      {
        id: 'kpi-table',
        label: 'Table',
        icon: TableCellsIcon,
        component: () => <KPIDashboard />,
        parentId: 'kpi',
      },
      // T3-INT-011: Comparison Sub-Tab
      {
        id: 'kpi-comparison',
        label: 'Comparison',
        icon: DocumentChartBarIcon,
        component: ComparisonView,
        parentId: 'kpi',
      },
    ],
  },

  // T3-INT-012: Data Explorer Tab with Sub-Tabs
  {
    id: 'data-explorer',
    label: 'Data Explorer',
    icon: FolderOpenIcon,
    component: () => <DataExplorerPanel />,
    subTabs: [
      // T3-INT-013: Snapshots Sub-Tab
      {
        id: 'explorer-snapshots',
        label: 'Snapshots',
        icon: CircleStackIcon,
        component: SnapshotsView,
        parentId: 'data-explorer',
      },
      // T3-INT-014: Raw Data Sub-Tab
      {
        id: 'explorer-raw',
        label: 'Raw Data',
        icon: DocumentTextIcon,
        component: RawDataView,
        parentId: 'data-explorer',
      },
      // T3-INT-015: Quality Sub-Tab
      {
        id: 'explorer-quality',
        label: 'Quality',
        icon: DocumentMagnifyingGlassIcon,
        component: QualityView,
        parentId: 'data-explorer',
      },
    ],
  },

  // T3-INT-016: Admin Tab with Sub-Tabs
  {
    id: 'admin',
    label: 'Admin',
    icon: ShieldCheckIcon,
    component: () => <AdminDashboard />,
    permission: {
      canView: true,
      canEdit: true,
      requiresAuth: true,
      roles: ['admin', 'manager'],
    },
    subTabs: [
      // T3-INT-017: Sync Sub-Tab
      {
        id: 'admin-sync',
        label: 'Sync',
        icon: ArrowTrendingUpIcon,
        component: SyncView,
        parentId: 'admin',
      },
      // T3-INT-018: Tickers Sub-Tab
      {
        id: 'admin-tickers',
        label: 'Tickers',
        icon: UserGroupIcon,
        component: TickersView,
        parentId: 'admin',
      },
      // T3-INT-019: Config Sub-Tab
      {
        id: 'admin-config',
        label: 'Config',
        icon: WrenchScrewdriverIcon,
        component: ConfigView,
        parentId: 'admin',
      },
      // T3-INT-020: Logs Sub-Tab
      {
        id: 'admin-logs',
        label: 'Logs',
        icon: DocumentTextIcon,
        component: LogsView,
        parentId: 'admin',
      },
    ],
  },

  // T3-INT-021: Settings Tab with Sub-Tabs
  {
    id: 'settings',
    label: 'Settings',
    icon: Cog6ToothIcon,
    component: () => <UnifiedSettingsPanel />,
    subTabs: [
      // T3-INT-022: Profile Sub-Tab
      {
        id: 'settings-profile',
        label: 'Profile',
        icon: UserCircleIcon,
        component: ProfileView,
        parentId: 'settings',
      },
      // T3-INT-023: Display Sub-Tab
      {
        id: 'settings-display',
        label: 'Display',
        icon: Cog6ToothIcon,
        component: DisplayView,
        parentId: 'settings',
      },
      // T3-INT-024: Notifications Sub-Tab
      {
        id: 'settings-notifications',
        label: 'Notifications',
        icon: BellAlertIcon,
        component: NotificationsView,
        parentId: 'settings',
      },
      // T3-INT-025: Export Sub-Tab
      {
        id: 'settings-export',
        label: 'Export',
        icon: ArrowDownTrayIcon,
        component: ExportView,
        parentId: 'settings',
      },
    ],
  },
];

// Helper function to get tab by ID
export function getTabById(tabId: string): TabConfig | undefined {
  return tabs3P1Config.find(tab => tab.id === tabId);
}

// Helper function to get sub-tab by ID
export function getSubTabById(tabId: string, subTabId: string): any {
  const tab = getTabById(tabId);
  return tab?.subTabs?.find(subTab => subTab.id === subTabId);
}

// Helper function to get all tab IDs
export function getAllTabIds(): string[] {
  return tabs3P1Config.map(tab => tab.id);
}

// Helper function to get default tab (first non-disabled)
export function getDefaultTab(): string {
  const defaultTab = tabs3P1Config.find(tab => !tab.disabled);
  return defaultTab?.id || 'analysis';
}
