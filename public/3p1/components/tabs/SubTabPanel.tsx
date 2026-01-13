/**
 * SubTabPanel Component
 * Content container for active sub-tab
 * Implements spec T1-COMP-014
 */

import React from 'react';
import { SubTabPanelProps } from '../../types/tabs';

export function SubTabPanel({
  subTabId,
  isActive,
  children,
  animation = 'fade',
  className = '',
}: SubTabPanelProps) {
  if (!isActive) {
    return null;
  }

  // Animation classes
  const animationClasses = animation === 'fade'
    ? 'animate-fadeIn'
    : animation === 'slide'
    ? 'animate-slideIn'
    : '';

  return (
    <div
      role="tabpanel"
      id={`sub-tabpanel-${subTabId}`}
      aria-labelledby={`sub-tab-${subTabId}`}
      tabIndex={0}
      className={`
        sub-tab-panel
        h-full
        p-4
        focus:outline-none
        ${animationClasses}
        ${className}
      `}
      data-subtab-id={subTabId}
    >
      {children}
    </div>
  );
}
