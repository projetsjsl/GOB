/**
 * TabEmpty Component
 * Empty state display for tabs
 * Implements spec T1-COMP-017
 */

import React from 'react';
import { TabEmptyProps } from '../../types/tabs';

export function TabEmpty({
  message = 'No content available',
  icon,
  action,
  className = '',
}: TabEmptyProps) {
  return (
    <div
      className={`
        tab-empty
        flex flex-col items-center justify-center
        p-12
        text-center
        ${className}
      `}
    >
      {/* Empty State Icon */}
      <div className="mb-4">
        {icon || (
          <svg
            className="w-20 h-20 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>

      {/* Empty State Message */}
      <p className="text-gray-400 mb-6 max-w-md">{message}</p>

      {/* Optional Action */}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
