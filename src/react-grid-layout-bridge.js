/**
 * React Grid Layout Bridge
 * Exposes react-grid-layout v2.x globally for Babel-transpiled scripts
 * Migration from CDN (v1.4.4) to npm package (v2.1.1)
 *
 * NOTE: v2.x includes WidthProvider - we use it directly
 */

// Import ALL exports from react-grid-layout
import * as RGL from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Build export object - use all RGL exports as-is (includes WidthProvider)
const RGLExports = {
  ...RGL
};

// Log successful initialization
console.log('✅ React Grid Layout v2.1.1 loaded:', Object.keys(RGLExports));

// Export the module object
export default RGLExports;
