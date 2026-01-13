/**
 * TabError Component
 * Error state display for tabs
 * Implements spec T1-COMP-016
 */

import React from 'react';
import { TabErrorProps } from '../../types/tabs';

export function TabError({ message, onRetry, className = '' }: TabErrorProps) {
  return (
    <div
      className={`
        tab-error
        flex flex-col items-center justify-center
        p-8
        text-center
        ${className}
      `}
      role="alert"
      aria-live="assertive"
    >
      {/* Error Icon */}
      <div className="mb-4">
        <svg
          className="w-16 h-16 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Error Message */}
      <h3 className="text-lg font-semibold text-white mb-2">
        Oops! Something went wrong
      </h3>
      <p className="text-gray-400 mb-6 max-w-md">{message}</p>

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="
            px-4 py-2
            bg-blue-600 hover:bg-blue-700
            text-white
            rounded-md
            transition-colors
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
          "
        >
          Try Again
        </button>
      )}
    </div>
  );
}
