import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Main Vite build config (no test config here — see vitest.config.ts)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
