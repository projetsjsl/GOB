import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Build config for modular dashboard bundle (IIFE) with React/ReactDOM as externals.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/dashboard-mod/entry.js'),
      name: 'GOBDashboardBundle',
      formats: ['iife'],
      fileName: () => 'js/dashboard/bundle.js'
    },
    outDir: 'public',
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production')
    }
  }
});
