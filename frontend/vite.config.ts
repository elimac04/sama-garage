import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Optimisation pour affichage < 2s
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Code splitting intelligent par vendor
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-state': ['zustand', 'axios'],
          'vendor-ui': ['lucide-react', 'clsx', 'tailwind-merge'],
          'vendor-pdf': ['jspdf'],
        },
      },
    },
    // Seuil d'avertissement pour les chunks volumineux
    chunkSizeWarningLimit: 500,
  },
  esbuild: {
    drop: ['console', 'debugger'], // Supprimer console.log et debugger en production
  },
});
