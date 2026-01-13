/**
 * TabSkeleton Component
 * Loading placeholder for tabs
 * Implements spec T1-COMP-015
 */

import React from 'react';
import { TabSkeletonProps, TabLayout } from '../../types/tabs';

export function TabSkeleton({
  count = 4,
  layout = TabLayout.HORIZONTAL,
  className = '',
}: TabSkeletonProps) {
  const isHorizontal = layout === TabLayout.HORIZONTAL || layout === TabLayout.BOTTOM;

  return (
    <div
      className={`tab-skeleton flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-2 p-2 ${className}`}
      role="status"
      aria-label="Loading tabs"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`
            skeleton-item
            ${isHorizontal ? 'w-32' : 'w-full'}
            h-10
            bg-gray-700
            rounded-md
            animate-pulse
          `}
        />
      ))}
    </div>
  );
}
