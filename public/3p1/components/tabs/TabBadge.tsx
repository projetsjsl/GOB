/**
 * TabBadge Component
 * Notification/count badge for tabs
 * Implements spec T1-COMP-007, T2-STYLE-008, T2-ANIM-004
 */

import React from 'react';
import { TabBadgeProps } from '../../types/tabs';

export function TabBadge({ badge, className = '' }: TabBadgeProps) {
  if (!badge) return null;

  // Color mapping (T2-STYLE-008)
  const colorClasses = {
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-black',
    gray: 'bg-gray-500 text-white',
  };

  const bgColor = badge.color ? colorClasses[badge.color] : colorClasses.blue;

  // T2-ANIM-004: Pulse animation
  const pulseClass = badge.pulse ? 'animate-pulse' : '';

  // Dot badge (small indicator)
  if (badge.dot) {
    return (
      <span
        className={`tab-badge-dot w-2 h-2 rounded-full ${bgColor} ${pulseClass} ${className}`}
        aria-label="Notification indicator"
      />
    );
  }

  // Count or text badge
  const content = badge.text || (badge.count !== undefined ? badge.count : '');

  if (!content && content !== 0) return null;

  return (
    <span
      className={`
        tab-badge
        inline-flex items-center justify-center
        min-w-[20px] h-5
        px-1.5
        text-xs font-semibold
        rounded-full
        ${bgColor}
        ${pulseClass}
        ${className}
      `}
      aria-label={`${content} notifications`}
    >
      {content}
    </span>
  );
}
