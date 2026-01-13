/**
 * Tab Content Wrappers
 * Wrapper components that connect existing 3P1 components to the tab system
 * These components receive data from App.tsx context and pass it to the actual components
 */

import React, { Suspense } from 'react';

// The actual components will be passed as props from App.tsx
// This allows us to integrate without modifying the existing component structure

interface TabContentProps {
  children?: React.ReactNode;
  className?: string;
}

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64 bg-gray-900">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      <span className="text-gray-400 text-sm">Chargement...</span>
    </div>
  </div>
);

// Generic tab content wrapper with Suspense
export function TabContentWrapper({ children, className = '' }: TabContentProps) {
  return (
    <div className={`tab-content-wrapper h-full overflow-auto ${className}`}>
      <Suspense fallback={<LoadingFallback />}>
        {children}
      </Suspense>
    </div>
  );
}

// Analysis tab wrappers
export function AnalysisDataView({ children }: TabContentProps) {
  return <TabContentWrapper className="p-4">{children}</TabContentWrapper>;
}

export function AnalysisAssumptionsView({ children }: TabContentProps) {
  return <TabContentWrapper className="p-4">{children}</TabContentWrapper>;
}

export function AnalysisChartsView({ children }: TabContentProps) {
  return <TabContentWrapper className="p-4">{children}</TabContentWrapper>;
}

export function AnalysisSensitivityView({ children }: TabContentProps) {
  return <TabContentWrapper className="p-4">{children}</TabContentWrapper>;
}

// KPI Dashboard wrappers
export function KPIOverviewView({ children }: TabContentProps) {
  return <TabContentWrapper>{children}</TabContentWrapper>;
}

export function KPIJPEGYView({ children }: TabContentProps) {
  return <TabContentWrapper>{children}</TabContentWrapper>;
}

export function KPIReturnsView({ children }: TabContentProps) {
  return <TabContentWrapper>{children}</TabContentWrapper>;
}

export function KPITableView({ children }: TabContentProps) {
  return <TabContentWrapper>{children}</TabContentWrapper>;
}

export function KPIComparisonView({ children }: TabContentProps) {
  return <TabContentWrapper>{children}</TabContentWrapper>;
}

// Data Explorer wrappers
export function DataExplorerSnapshotsView({ children }: TabContentProps) {
  return <TabContentWrapper className="p-4">{children}</TabContentWrapper>;
}

export function DataExplorerRawView({ children }: TabContentProps) {
  return <TabContentWrapper className="p-4">{children}</TabContentWrapper>;
}

export function DataExplorerQualityView({ children }: TabContentProps) {
  return <TabContentWrapper className="p-4">{children}</TabContentWrapper>;
}

// Admin wrappers
export function AdminSyncView({ children }: TabContentProps) {
  return <TabContentWrapper className="p-4">{children}</TabContentWrapper>;
}

export function AdminTickersView({ children }: TabContentProps) {
  return <TabContentWrapper className="p-4">{children}</TabContentWrapper>;
}

export function AdminConfigView({ children }: TabContentProps) {
  return <TabContentWrapper className="p-4">{children}</TabContentWrapper>;
}

export function AdminLogsView({ children }: TabContentProps) {
  return <TabContentWrapper className="p-4">{children}</TabContentWrapper>;
}

// Settings wrappers
export function SettingsProfileView({ children }: TabContentProps) {
  return <TabContentWrapper className="p-4">{children}</TabContentWrapper>;
}

export function SettingsDisplayView({ children }: TabContentProps) {
  return <TabContentWrapper className="p-4">{children}</TabContentWrapper>;
}

export function SettingsNotificationsView({ children }: TabContentProps) {
  return <TabContentWrapper className="p-4">{children}</TabContentWrapper>;
}

export function SettingsExportView({ children }: TabContentProps) {
  return <TabContentWrapper className="p-4">{children}</TabContentWrapper>;
}
