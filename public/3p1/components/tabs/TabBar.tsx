/**
 * TabBar Component
 * Horizontal/vertical tab navigation bar
 * Implements specs T1-COMP-002, T2-STYLE-001-012, T2-A11Y-001-002
 */

import React, { useRef, useState, useEffect } from 'react';
import { TabBarProps, TabLayout } from '../../types/tabs';
import { TabItem } from './TabItem';
import { useTab } from '../../context/TabContext';

export function TabBar({
  tabs,
  activeTabId,
  onTabClick,
  layout = TabLayout.HORIZONTAL,
  className = '',
  showIcons = true,
  showLabels = true,
  collapsible = false,
  overflow = 'scroll',
}: TabBarProps) {
  const { setActiveTab } = useTab();
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [showOverflow, setShowOverflow] = useState(false);

  // Check if tabs overflow container
  useEffect(() => {
    const checkOverflow = () => {
      if (tabBarRef.current && overflow === 'scroll') {
        const { scrollWidth, clientWidth } = tabBarRef.current;
        setShowOverflow(scrollWidth > clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [tabs, overflow]);

  // Layout-specific classes
  const isHorizontal = layout === TabLayout.HORIZONTAL || layout === TabLayout.BOTTOM;
  const containerClasses = isHorizontal
    ? 'flex flex-row items-center border-b border-gray-700 bg-gray-800'
    : 'flex flex-col border-r border-gray-700 bg-gray-800 min-w-[200px]';

  const scrollClasses = isHorizontal
    ? 'overflow-x-auto overflow-y-hidden'
    : 'overflow-y-auto overflow-x-hidden';

  // T2-A11Y-001: ARIA tablist role
  return (
    <div
      ref={tabBarRef}
      role="tablist"
      aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
      className={`tab-bar ${containerClasses} ${overflow === 'scroll' ? scrollClasses : ''} ${className}`}
      data-layout={layout}
    >
      <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-1 p-1`}>
        {tabs.map((tab, index) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={activeTabId === tab.id}
            onClick={() => {
              if (!tab.disabled) {
                setActiveTab(tab.id);
                onTabClick(tab.id);
              }
            }}
            showIcon={showIcons}
            showLabel={showLabels}
          />
        ))}
      </div>

      {/* Scroll indicators for overflow */}
      {showOverflow && (
        <div className="scroll-indicator absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-gray-800 to-transparent pointer-events-none" />
      )}
    </div>
  );
}
