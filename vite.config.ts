import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  // La configurazione di build definisce come e dove generare il bundle
  build: {
    outDir: 'media/webview', // Dove verranno generati il bundle e gli asset
    emptyOutDir: true,        // Pulisce la cartella prima di ogni build
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/ui/templates/index.html')
      },
      output: {
        entryFileNames: 'bundle.js', // Nome del file bundle principale
      },
    },
  },
  // Imposta base a './' per percorsi relativi
  base: './'
});