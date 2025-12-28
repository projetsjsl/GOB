/**
 * React Grid Layout Bridge
 * Exposes react-grid-layout v2.x globally for Babel-transpiled scripts
 * Migration from CDN (v1.4.4) to npm package (v2.1.1)
 *
 * CRITICAL: v2.x removed WidthProvider HOC - we create a compatibility wrapper
 * using the new useContainerWidth hook
 */

// Import ALL exports from react-grid-layout
import * as RGL from 'react-grid-layout';
import { useContainerWidth, Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Get React from window (loaded via CDN)
const React = window.React;

/**
 * WidthProvider HOC - Compatibility wrapper for v2.x
 * Replicates the v1.x WidthProvider behavior using useContainerWidth hook
 */
function WidthProvider(ComposedComponent) {
  return function WidthProviderWrapper(props) {
    const [containerRef, width] = useContainerWidth();

    // Don't render until we have a width
    if (width === undefined) {
      return React.createElement('div', { ref: containerRef, style: { width: '100%' } });
    }

    return React.createElement(
      'div',
      { ref: containerRef, style: { width: '100%' } },
      React.createElement(ComposedComponent, { ...props, width: width })
    );
  };
}

// Build export object with WidthProvider compatibility
const RGLExports = {
  ...RGL,
  WidthProvider,
  Responsive: ResponsiveGridLayout,
  ResponsiveGridLayout
};

// Log successful initialization
console.log('✅ React Grid Layout v2.1.1 loaded:', RGLExports);

// Export the module object with WidthProvider wrapper
export default RGLExports;
