/**
 * TabIcon Component
 * Icon display with fallback support
 * Implements spec T1-COMP-005, T2-STYLE-009
 */

import React, { isValidElement } from 'react';
import { TabIconProps } from '../../types/tabs';

export function TabIcon({ icon, size = 20, className = '' }: TabIconProps) {
  if (!icon) return null;

  // If icon is a React element, render it directly
  if (isValidElement(icon)) {
    return (
      <span
        className={`tab-icon inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        {icon}
      </span>
    );
  }

  // If icon is a component, render it
  if (typeof icon === 'function') {
    const IconComponent = icon as React.ComponentType<any>;
    return (
      <span className={`tab-icon inline-flex items-center justify-center ${className}`}>
        <IconComponent className="w-5 h-5" style={{ width: size, height: size }} />
      </span>
    );
  }

  return null;
}
