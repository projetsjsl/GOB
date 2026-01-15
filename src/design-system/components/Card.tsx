/**
 * GOB Design System - Card Component
 * 
 * Composant carte reutilisable utilisant les tokens du design system
 */

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...props
}) => {
  // Base classes
  const baseClasses = 'rounded-lg transition-all duration-300';
  
  // Variant classes
  const variantClasses = {
    default: 'bg-gob-bg-secondary border border-gob-border',
    elevated: 'bg-gob-bg-secondary border border-gob-border shadow-gob-lg',
    outlined: 'bg-transparent border-2 border-gob-border',
  };
  
  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};
