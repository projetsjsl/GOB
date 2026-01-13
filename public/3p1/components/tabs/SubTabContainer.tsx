/**
 * SubTabContainer Component
 * Wrapper for sub-tab navigation within a main tab
 * Implements spec T1-COMP-011
 */

import React from 'react';
import { SubTabContainerProps } from '../../types/tabs';
import { SubTabBar } from './SubTabBar';
import { SubTabPanel } from './SubTabPanel';
import { useTab } from '../../context/TabContext';

export function SubTabContainer({
  subTabs,
  activeSubTabId,
  onSubTabClick,
  className = '',
}: SubTabContainerProps) {
  const { state } = useTab();

  if (!subTabs || subTabs.length === 0) {
    return null;
  }

  return (
    <div className={`sub-tab-container flex flex-col h-full ${className}`}>
      {/* Sub-tab navigation bar */}
      <SubTabBar
        subTabs={subTabs}
        activeSubTabId={activeSubTabId}
        onSubTabClick={onSubTabClick}
      />

      {/* Sub-tab content panels */}
      <div className="sub-tab-panels flex-1 overflow-auto">
        {subTabs.map((subTab) => (
          <SubTabPanel
            key={subTab.id}
            subTabId={subTab.id}
            isActive={state.activeSubTab === subTab.id}
            animation="fade"
          >
            {state.activeSubTab === subTab.id && <subTab.component />}
          </SubTabPanel>
        ))}
      </div>
    </div>
  );
}
