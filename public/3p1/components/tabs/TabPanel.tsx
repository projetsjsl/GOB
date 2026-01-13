/**
 * TabPanel Component
 * Content container for active tab
 * Implements specs T1-COMP-004, T2-ANIM-001, T2-A11Y-003
 */

import React, { useRef, useEffect, useState } from 'react';
import { TabPanelProps, TabAnimation } from '../../types/tabs';

export function TabPanel({
  tabId,
  isActive,
  children,
  animation = 'fade',
  className = '',
  lazy = true,
  keepMounted = false,
}: TabPanelProps) {
  const [hasBeenActive, setHasBeenActive] = useState(isActive);
  const [isAnimating, setIsAnimating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Track if tab has ever been active (for lazy loading)
  useEffect(() => {
    if (isActive) {
      setHasBeenActive(true);
    }
  }, [isActive]);

  // Handle animations
  useEffect(() => {
    if (isActive && animation !== 'none') {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isActive, animation]);

  // Don't render if lazy and never been active
  if (lazy && !hasBeenActive) {
    return null;
  }

  // Don't render if not active and not keeping mounted
  if (!isActive && !keepMounted && !isAnimating) {
    return null;
  }

  // Animation classes (T2-ANIM-001, T2-ANIM-007-008)
  const getAnimationClasses = () => {
    if (animation === 'none') return '';

    const baseAnimation = 'transition-all duration-300';

    if (animation === 'fade') {
      return `${baseAnimation} ${isActive ? 'opacity-100' : 'opacity-0'}`;
    }

    if (animation === 'slide') {
      return `${baseAnimation} ${
        isActive
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-4'
      }`;
    }

    return baseAnimation;
  };

  // T2-A11Y-003: ARIA tabpanel role and attributes
  return (
    <div
      ref={panelRef}
      role="tabpanel"
      id={`tabpanel-${tabId}`}
      aria-labelledby={`tab-${tabId}`}
      aria-hidden={!isActive}
      tabIndex={0}
      className={`
        tab-panel
        ${isActive ? 'block' : 'hidden'}
        ${getAnimationClasses()}
        h-full
        focus:outline-none
        ${className}
      `}
      data-tab-id={tabId}
    >
      {children}
    </div>
  );
}
