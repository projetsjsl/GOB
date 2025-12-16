import React from 'react';
import { getRecommendationBgColor, getJpegyColor, getRatio31Color, getReturnColor } from '../utils/colors';

/**
 * Reusable status badge component for consistent styling across the app
 */

interface StatusBadgeProps {
  value: string | number | null;
  type?: 'recommendation' | 'jpegy' | 'ratio31' | 'return' | 'custom';
  customColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  value,
  type = 'custom',
  customColor,
  size = 'md',
  className = ''
}) => {
  if (value === null || value === undefined) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-gray-400 bg-gray-700/50 ${className}`}>
        N/A
      </span>
    );
  }

  let colorClass = '';
  let bgStyle: React.CSSProperties = {};

  switch (type) {
    case 'recommendation':
      colorClass = getRecommendationBgColor(String(value));
      break;
    case 'jpegy':
      const jpegyColor = getJpegyColor(Number(value));
      if (jpegyColor) {
        bgStyle = { backgroundColor: `${jpegyColor}20`, color: jpegyColor };
      }
      break;
    case 'ratio31':
      const ratioColor = getRatio31Color(Number(value));
      if (ratioColor) {
        bgStyle = { backgroundColor: `${ratioColor}20`, color: ratioColor };
      }
      break;
    case 'return':
      const returnColor = getReturnColor(Number(value));
      bgStyle = { backgroundColor: `${returnColor}20`, color: returnColor };
      break;
    case 'custom':
      if (customColor) {
        bgStyle = { backgroundColor: `${customColor}20`, color: customColor };
      }
      break;
  }

  const sizeClass = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-2.5 py-1'
  }[size];

  const displayValue = typeof value === 'number' 
    ? (type === 'return' || type === 'ratio31' ? `${value.toFixed(1)}%` : value.toFixed(2))
    : value;

  return (
    <span 
      className={`inline-flex items-center rounded font-medium ${sizeClass} ${colorClass} ${className}`}
      style={bgStyle}
    >
      {displayValue}
    </span>
  );
};

/**
 * Loading skeleton badge
 */
export const SkeletonBadge: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const widthClass = {
    sm: 'w-8',
    md: 'w-12',
    lg: 'w-16'
  }[size];

  return (
    <span className={`inline-block ${widthClass} h-5 bg-gray-700 rounded animate-pulse`} />
  );
};

/**
 * Icon button with proper accessibility
 */
interface IconButtonProps {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const IconButton: React.FC<IconButtonProps> = ({
  onClick,
  title,
  icon,
  disabled = false,
  className = '',
  variant = 'ghost'
}) => {
  const variantClass = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-500 text-white',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    ghost: 'hover:bg-gray-700 text-gray-400 hover:text-white'
  }[variant];

  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`p-2 rounded transition-colors ${variantClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {icon}
    </button>
  );
};

export default StatusBadge;
