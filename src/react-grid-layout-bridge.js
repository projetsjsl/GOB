/**
 * React Grid Layout Bridge
 * Exposes react-grid-layout v2.x globally for Babel-transpiled scripts
 * Migration from CDN (v1.4.4) to npm package (v2.1.1)
 */

// Import from legacy API for 100% backward compatibility
import ReactGridLayout from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Expose globally for vanilla JS scripts
window.ReactGridLayout = ReactGridLayout;

// Log successful initialization
console.log('✅ React Grid Layout v2.1.1 loaded (legacy API)');
