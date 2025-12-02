/**
 * Professional Icon System
 * Replaces emojis with sophisticated SVG/image icons
 * Author: JSL AI - GOB Professional Redesign
 */

const IconSystem = {
  // Bull/Bear market indicators
  bull: ({ className = "w-6 h-6", color = "#10b981", style = {} }) => {
    return React.createElement('img', {
      src: '/images/icons/bull-pro.svg',
      alt: 'Marché haussier',
      className: className,
      style: { 
        filter: `drop-shadow(0 0 4px ${color}40)`,
        ...style
      }
    });
  },
  
  bear: ({ className = "w-6 h-6", color = "#ef4444", style = {} }) => {
    return React.createElement('img', {
      src: '/images/icons/bear-pro.svg',
      alt: 'Marché baissier',
      className: className,
      style: { 
        filter: `drop-shadow(0 0 4px ${color}40)`,
        ...style
      }
    });
  },
  
  // Analytics icons
  chart: ({ className = "w-6 h-6", style = {} }) => {
    return React.createElement('img', {
      src: '/images/icons/chart-pro.svg',
      alt: 'Graphique',
      className: className,
      style: style
    });
  },
  
  news: ({ className = "w-6 h-6", style = {} }) => {
    return React.createElement('img', {
      src: '/images/icons/news-pro.svg',
      alt: 'Actualités',
      className: className,
      style: style
    });
  },
  
  analytics: ({ className = "w-6 h-6", style = {} }) => {
    return React.createElement('img', {
      src: '/images/icons/analytics-pro.svg',
      alt: 'Analytique',
      className: className,
      style: style
    });
  },
  
  trending: ({ className = "w-6 h-6", direction = "up", style = {} }) => {
    const d = direction === 'up' 
      ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6";
    
    return React.createElement('svg', {
      className: className,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      style: style
    }, 
      React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: d
      })
    );
  },

  // Fallback for generic icons (uses Iconoir class)
  generic: ({ name, className = "w-6 h-6" }) => {
    return React.createElement('i', {
      className: `iconoir-${name} ${className}`
    });
  }
};

// Export globally
if (typeof window !== 'undefined') {
  window.IconSystem = IconSystem;
  console.log('✅ IconSystem loaded successfully');
}
