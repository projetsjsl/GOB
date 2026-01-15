/**
 * GOB Design System - Button Component
 * 
 * Composant bouton reutilisable utilisant les tokens du design system
 * Remplace les styles inline et assure la coherence visuelle
 */

import React from 'react';
import { GOBDesignTokens } from '../tokens';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  // Base classes
  const baseClasses = 'font-medium transition-all duration-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-gob-primary text-white hover:bg-gob-primary-dark focus:ring-gob-primary',
    secondary: 'bg-gob-secondary text-white hover:bg-gob-secondary-dark focus:ring-gob-secondary',
    success: 'bg-gob-success text-white hover:bg-emerald-600 focus:ring-gob-success',
    danger: 'bg-gob-danger text-white hover:bg-red-600 focus:ring-gob-danger',
    warning: 'bg-gob-warning text-white hover:bg-amber-600 focus:ring-gob-warning',
    ghost: 'bg-transparent border border-gob-border text-gob-text-primary hover:bg-gob-bg-secondary focus:ring-gob-primary',
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Chargement...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
