import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Configuration du serveur de développement
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    // Proxy API requests to Vercel serverless functions
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },

  // Configuration du build
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimisations pour gros fichier
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Noms de fichiers SIMPLES sans hash aléatoire
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        manualChunks: {
          // Séparer React dans son propre chunk
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },

  // Résolution des modules
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
})
