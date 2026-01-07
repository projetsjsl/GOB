#!/usr/bin/env node
/**
 * Build Recharts as standalone IIFE bundle
 * Usage: node scripts/build-recharts.js
 * Output: public/js/recharts-bundle.js
 * 
 * This ensures Recharts is available as window.Recharts without CDN dependency
 */

import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔨 Building Recharts bundle...');

esbuild.build({
  entryPoints: [path.resolve(__dirname, '../node_modules/recharts/lib/index.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  globalName: 'Recharts',
  outfile: path.resolve(__dirname, '../public/js/recharts-bundle.js'),
  // Don't bundle React/ReactDOM - they're loaded separately via CDN
  external: ['react', 'react-dom', 'prop-types'],
  // Platform: browser to avoid Node.js APIs
  platform: 'browser',
  target: 'es2020',
}).then(() => {
  console.log('✅ Recharts bundle created: public/js/recharts-bundle.js');
  process.exit(0);
}).catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
