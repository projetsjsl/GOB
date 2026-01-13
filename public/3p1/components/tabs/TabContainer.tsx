/**
 * TabContainer Component
 * Main wrapper for the entire tab system
 * Implements specs T1-COMP-001, T2-A11Y-001, T2-RESP-001-003
 */

import React, { useEffect } from 'react';
import { TabProvider } from '../../context/TabContext';
import { TabBar } from './TabBar';
import { TabPanel } from './TabPanel';
import { TabContainerProps, TabLayout } from '../../types/tabs';

export function TabContainer({
  tabs,
  layout = TabLayout.HORIZONTAL,
  animation = 'fade',
  className = '',
  defaultTab,
  onTabChange,
}: TabContainerProps) {
  // Determine the first available non-disabled tab if no default provided
  const initialTab = defaultTab || tabs.find(t => !t.disabled)?.id;

  return (
    <TabProvider tabs={tabs} defaultTab={initialTab}>
      <TabContainerInner
        tabs={tabs}
        layout={layout}
        animation={animation}
        className={className}
        onTabChange={onTabChange}
      />
    </TabProvider>
  );
}

function TabContainerInner({
  tabs,
  layout,
  animation,
  className,
  onTabChange,
}: Omit<TabContainerProps, 'defaultTab'>) {
  const { state, activeTabConfig } = require('../../context/TabContext').useTab();

  // Notify parent of tab changes
  useEffect(() => {
    if (onTabChange && state.activeTab) {
      onTabChange(state.activeTab, state.activeSubTab || undefined);
    }
  }, [state.activeTab, state.activeSubTab, onTabChange]);

  // Layout classes based on orientation
  const layoutClasses = {
    [TabLayout.HORIZONTAL]: 'flex flex-col',
    [TabLayout.VERTICAL]: 'flex flex-row',
    [TabLayout.SIDEBAR]: 'flex flex-row',
    [TabLayout.BOTTOM]: 'flex flex-col-reverse',
  };

  return (
    <div
      className={`tab-container ${layoutClasses[layout]} w-full h-full ${className}`}
      data-layout={layout}
    >
      {/* Tab Navigation Bar */}
      <TabBar
        tabs={tabs}
        activeTabId={state.activeTab}
        onTabClick={(tabId) => {
          // Navigation handled by TabBar internally via context
        }}
        layout={layout}
        showIcons={true}
        showLabels={true}
      />

      {/* Tab Content Panels */}
      <div className="tab-panels flex-1 overflow-auto bg-gray-900">
        {tabs.map((tab) => (
          <TabPanel
            key={tab.id}
            tabId={tab.id}
            isActive={state.activeTab === tab.id}
            animation={animation}
            lazy={true}
            keepMounted={false}
          >
            {activeTabConfig?.id === tab.id && (
              <tab.component />
            )}
          </TabPanel>
        ))}
      </div>
    </div>
  );
}
