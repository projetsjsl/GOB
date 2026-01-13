/**
 * TabsWrapper Component
 * Integration wrapper for the 3P1 tab system
 * Replaces the currentView state-based navigation with proper tabs
 */

import React, { Suspense } from 'react';
import { TabContainer } from './TabContainer';
import { tabs3P1Config } from '../../config/tabsConfig';
import { TabLayout } from '../../types/tabs';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64 bg-gray-900">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      <span className="text-gray-400 text-sm">Chargement...</span>
    </div>
  </div>
);

interface TabsWrapperProps {
  className?: string;
  defaultTab?: string;
  onTabChange?: (tabId: string, subTabId?: string) => void;
}

export function TabsWrapper({
  className = '',
  defaultTab = 'analysis',
  onTabChange,
}: TabsWrapperProps) {
  return (
    <div className={`tabs-wrapper h-full ${className}`}>
      <Suspense fallback={<LoadingFallback />}>
        <TabContainer
          tabs={tabs3P1Config}
          layout={TabLayout.HORIZONTAL}
          animation="fade"
          defaultTab={defaultTab}
          onTabChange={onTabChange}
        />
      </Suspense>
    </div>
  );
}
