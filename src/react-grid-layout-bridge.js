/**
 * React Grid Layout Bridge
 * Exposes react-grid-layout v2.x globally for Babel-transpiled scripts
 * Migration from CDN (v1.4.4) to npm package (v2.1.1)
 *
 * CRITICAL: Must export the entire module object to expose:
 * - window.ReactGridLayout.WidthProvider
 * - window.ReactGridLayout.Responsive
 */

// Import ALL exports from react-grid-layout (not just default)
import * as RGL from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Log successful initialization
console.log('✅ React Grid Layout v2.1.1 loaded:', RGL);

// Export the entire module object with WidthProvider and Responsive
export default RGL;
