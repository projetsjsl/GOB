/**
 * SubTabBar Component
 * Secondary navigation bar for sub-tabs
 * Implements spec T1-COMP-012, T2-STYLE-007
 */

import React from 'react';
import { SubTabBarProps } from '../../types/tabs';
import { SubTabItem } from './SubTabItem';
import { useTab } from '../../context/TabContext';

export function SubTabBar({
  subTabs,
  activeSubTabId,
  onSubTabClick,
  className = '',
}: SubTabBarProps) {
  const { setActiveSubTab } = useTab();

  if (!subTabs || subTabs.length === 0) {
    return null;
  }

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={`
        sub-tab-bar
        flex flex-row items-center gap-2
        px-4 py-3
        bg-gray-850
        border-b border-gray-700
        overflow-x-auto
        ${className}
      `}
    >
      {subTabs.map((subTab) => (
        <SubTabItem
          key={subTab.id}
          subTab={subTab}
          isActive={activeSubTabId === subTab.id}
          onClick={() => {
            if (!subTab.disabled) {
              setActiveSubTab(subTab.id);
              onSubTabClick(subTab.id);
            }
          }}
        />
      ))}
    </div>
  );
}
