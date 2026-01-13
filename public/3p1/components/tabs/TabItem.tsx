/**
 * TabItem Component
 * Individual clickable tab button
 * Implements specs T1-COMP-003, T2-STYLE-001-007, T2-A11Y-002-009
 */

import React from 'react';
import { TabItemProps } from '../../types/tabs';
import { TabIcon } from './TabIcon';
import { TabBadge } from './TabBadge';

export function TabItem({
  tab,
  isActive,
  onClick,
  onClose,
  onPin,
  isPinned = false,
  showIcon = true,
  showLabel = true,
  className = '',
}: TabItemProps) {
  // T2-STYLE-001-004: State-based styling
  const baseClasses = `
    tab-item
    relative
    flex items-center gap-2
    px-4 py-2.5
    font-medium text-sm
    rounded-md
    transition-all duration-200
    outline-none
    whitespace-nowrap
    min-w-[100px]
  `;

  // T2-STYLE-001: Active state
  const activeClasses = isActive
    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-500 ring-opacity-50'
    : 'bg-gray-700 text-gray-300';

  // T2-STYLE-002: Hover state
  const hoverClasses = !tab.disabled && !isActive
    ? 'hover:bg-gray-600 hover:text-white hover:shadow-md'
    : '';

  // T2-STYLE-003: Focus state (T2-A11Y-009)
  const focusClasses = 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900';

  // T2-STYLE-004: Disabled state
  const disabledClasses = tab.disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';

  // T2-A11Y-002: ARIA tab role and attributes
  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${tab.id}`}
      aria-disabled={tab.disabled}
      aria-label={tab.label}
      id={`tab-${tab.id}`}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      disabled={tab.disabled}
      className={`
        ${baseClasses}
        ${activeClasses}
        ${hoverClasses}
        ${focusClasses}
        ${disabledClasses}
        ${className}
      `}
      data-tab-id={tab.id}
    >
      {/* Pinned indicator */}
      {isPinned && (
        <span className="absolute top-1 left-1 w-1.5 h-1.5 bg-yellow-400 rounded-full" />
      )}

      {/* Tab Icon */}
      {showIcon && tab.icon && (
        <TabIcon icon={tab.icon} size={18} />
      )}

      {/* Tab Label */}
      {showLabel && (
        <span className="tab-label truncate">{tab.label}</span>
      )}

      {/* Tab Badge */}
      {tab.badge && (
        <TabBadge badge={tab.badge} />
      )}

      {/* Close button for closable tabs */}
      {tab.closable && onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="ml-2 p-0.5 hover:bg-gray-600 rounded"
          aria-label={`Close ${tab.label}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </button>
  );
}
