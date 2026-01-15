import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top',
  delay = 300,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLElement | null>(null);

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Utiliser requestAnimationFrame pour mettre a jour la position de maniere optimale
      requestAnimationFrame(() => {
        updatePosition();
      });
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!childRef.current || !tooltipRef.current) return;

    const rect = childRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top + scrollY - tooltipRect.height - 8;
        left = rect.left + scrollX + rect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + scrollY + 8;
        left = rect.left + scrollX + rect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2 - tooltipRect.height / 2;
        left = rect.left + scrollX - tooltipRect.width - 8;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2 - tooltipRect.height / 2;
        left = rect.right + scrollX + 8;
        break;
    }

    // Ajuster si le tooltip sort de l'ecran
    const margin = 8;
    if (left < margin) left = margin;
    if (left + tooltipRect.width > window.innerWidth - margin) {
      left = window.innerWidth - tooltipRect.width - margin;
    }
    if (top < scrollY + margin) {
      top = scrollY + margin;
      // Basculer vers bottom si top ne fonctionne pas
      if (position === 'top') {
        top = rect.bottom + scrollY + 8;
      }
    }

    setTooltipPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      // Utiliser requestAnimationFrame pour la mise a jour initiale
      requestAnimationFrame(() => {
        updatePosition();
      });
      
      // Debounce les evenements scroll et resize pour eviter trop de calculs
      let rafId: number | null = null;
      const debouncedUpdate = () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(() => {
          updatePosition();
        });
      };
      
      window.addEventListener('scroll', debouncedUpdate, { passive: true });
      window.addEventListener('resize', debouncedUpdate, { passive: true });
      
      return () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        window.removeEventListener('scroll', debouncedUpdate);
        window.removeEventListener('resize', debouncedUpdate);
      };
    }
  }, [isVisible]);

  const childWithRef = React.cloneElement(children, {
    ref: (node: HTMLElement) => {
      childRef.current = node;
      // Preserve original ref if it exists
      const originalRef = (children as any).ref;
      if (typeof originalRef === 'function') {
        originalRef(node);
      } else if (originalRef) {
        originalRef.current = node;
      }
    },
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip,
  });

  return (
    <>
      {childWithRef}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-[10000] px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg pointer-events-none max-w-xs ${className}`}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          {typeof content === 'string' ? (
            <div className="whitespace-pre-wrap">{content}</div>
          ) : (
            content
          )}
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
              position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
              position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
              'left-[-4px] top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </>
  );
};

// Helper pour ajouter un tooltip simple avec title (fallback)
export const withTooltip = (element: React.ReactElement, tooltip: string) => {
  return React.cloneElement(element, {
    title: tooltip,
  });
};

