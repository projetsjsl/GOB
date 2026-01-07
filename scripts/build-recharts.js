#!/usr/bin/env node
/**
 * Build Recharts as standalone UMD bundle
 * Usage: node scripts/build-recharts.js
 * Output: public/js/recharts-bundle.js
 */

import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
  // DO bundle prop-types (it's a small utility)
  external: ['react', 'react-dom'],
  // Platform: browser to avoid Node.js APIs
  platform: 'browser',
  target: 'es2020',
}).then(() => {
  // Read the built file and add explicit window exposure
  const bundlePath = path.resolve(__dirname, '../public/js/recharts-bundle.js');
  let bundleCode = fs.readFileSync(bundlePath, 'utf8');
  
  // Add explicit window exposure at the end
  const windowExposure = `\nif(typeof window !== 'undefined') window.Recharts = Recharts;\n`;
  bundleCode += windowExposure;
  
  fs.writeFileSync(bundlePath, bundleCode, 'utf8');
  
  console.log('✅ Recharts bundle created: public/js/recharts-bundle.js');
  console.log('✅ Exposed to window.Recharts');
  process.exit(0);
}).catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
