import React from 'react';

/**
 * Reusable Loading Skeleton Components
 * Zero dependencies, pure CSS animations
 * Safe to add - doesn't affect existing functionality
 */

// Base Skeleton Component
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-700/50 rounded ${className}`}></div>
);

// Stock Card Skeleton (for stock listings)
export const StockCardSkeleton: React.FC = () => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Logo skeleton */}
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          {/* Ticker symbol */}
          <Skeleton className="h-4 w-16" />
          {/* Company name */}
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      {/* Price area */}
      <div className="text-right space-y-2">
        <Skeleton className="h-5 w-20 ml-auto" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
    </div>
  </div>
);

// Stock Table Row Skeleton
export const StockTableRowSkeleton: React.FC = () => (
  <tr className="border-b border-gray-700">
    <td className="px-4 py-3">
      <div className="flex items-center gap-2">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    </td>
    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
  </tr>
);

// News Article Skeleton (for news cards in grid)
export const NewsArticleSkeleton: React.FC = () => (
  <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
    {/* Source and date */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-28 rounded-full" />
      <Skeleton className="h-5 w-20 rounded-md" />
    </div>
    {/* Title */}
    <div className="space-y-2">
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-4/5" />
    </div>
    {/* Description */}
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    {/* Action buttons */}
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-10 flex-1 rounded-xl" />
      <Skeleton className="h-10 flex-1 rounded-xl" />
    </div>
  </div>
);

// News List Skeleton (multiple articles)
export const NewsListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <NewsArticleSkeleton key={i} />
    ))}
  </div>
);

// Stock List Skeleton (multiple cards)
export const StockListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <StockCardSkeleton key={i} />
    ))}
  </div>
);

// Table Skeleton (with header and rows)
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-900 border-b border-gray-700">
        <tr>
          <th className="px-4 py-3 text-left">
            <Skeleton className="h-4 w-20" />
          </th>
          <th className="px-4 py-3 text-left">
            <Skeleton className="h-4 w-16" />
          </th>
          <th className="px-4 py-3 text-left">
            <Skeleton className="h-4 w-16" />
          </th>
          <th className="px-4 py-3 text-left">
            <Skeleton className="h-4 w-20" />
          </th>
          <th className="px-4 py-3 text-left">
            <Skeleton className="h-4 w-16" />
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <StockTableRowSkeleton key={i} />
        ))}
      </tbody>
    </table>
  </div>
);

// Chart/Widget Skeleton
export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-64' }) => (
  <div className={`bg-gray-800 border border-gray-700 rounded-lg p-6 ${height}`}>
    <div className="space-y-4 h-full flex flex-col">
      {/* Title */}
      <Skeleton className="h-5 w-32" />
      {/* Chart area - simulated bars */}
      <div className="flex-1 flex items-end gap-2">
        <Skeleton className="w-full h-3/4" />
        <Skeleton className="w-full h-2/3" />
        <Skeleton className="w-full h-4/5" />
        <Skeleton className="w-full h-1/2" />
        <Skeleton className="w-full h-3/5" />
        <Skeleton className="w-full h-full" />
        <Skeleton className="w-full h-2/3" />
      </div>
    </div>
  </div>
);

// Dashboard Widget Skeleton (for TradingView widgets, etc.)
export const WidgetSkeleton: React.FC<{ height?: string }> = ({ height = 'h-96' }) => (
  <div className={`bg-gray-800 border border-gray-700 rounded-lg p-6 ${height}`}>
    <div className="space-y-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      {/* Content area */}
      <div className="space-y-3 flex-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid grid-cols-3 gap-4 mt-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    </div>
  </div>
);

// Compact Card Skeleton (for smaller cards)
export const CompactCardSkeleton: React.FC = () => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-2">
    <Skeleton className="h-3 w-20" />
    <Skeleton className="h-6 w-16" />
    <Skeleton className="h-3 w-24" />
  </div>
);

// Grid of Compact Cards
export const CompactCardGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <CompactCardSkeleton key={i} />
    ))}
  </div>
);