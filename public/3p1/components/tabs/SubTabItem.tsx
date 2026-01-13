/**
 * SubTabItem Component
 * Individual sub-tab button
 * Implements spec T1-COMP-013, T2-STYLE-007
 */

import React from 'react';
import { SubTabItemProps } from '../../types/tabs';
import { TabIcon } from './TabIcon';
import { TabBadge } from './TabBadge';

export function SubTabItem({
  subTab,
  isActive,
  onClick,
  className = '',
}: SubTabItemProps) {
  // T2-STYLE-007: Sub-tab active indicator (bottom border)
  const baseClasses = `
    sub-tab-item
    relative
    flex items-center gap-2
    px-4 py-2
    font-medium text-sm
    rounded-t-md
    transition-all duration-200
    outline-none
    whitespace-nowrap
    border-b-2
  `;

  const activeClasses = isActive
    ? 'border-blue-500 text-blue-400 bg-gray-800'
    : 'border-transparent text-gray-400';

  const hoverClasses = !subTab.disabled && !isActive
    ? 'hover:border-gray-500 hover:text-gray-200 hover:bg-gray-800'
    : '';

  const focusClasses = 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900';

  const disabledClasses = subTab.disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`sub-tabpanel-${subTab.id}`}
      aria-disabled={subTab.disabled}
      aria-label={subTab.label}
      id={`sub-tab-${subTab.id}`}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      disabled={subTab.disabled}
      className={`
        ${baseClasses}
        ${activeClasses}
        ${hoverClasses}
        ${focusClasses}
        ${disabledClasses}
        ${className}
      `}
      data-subtab-id={subTab.id}
    >
      {/* Sub-tab Icon */}
      {subTab.icon && (
        <TabIcon icon={subTab.icon} size={16} />
      )}

      {/* Sub-tab Label */}
      <span className="sub-tab-label">{subTab.label}</span>

      {/* Sub-tab Badge */}
      {subTab.badge && (
        <TabBadge badge={subTab.badge} />
      )}
    </button>
  );
}
