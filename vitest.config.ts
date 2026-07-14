import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Separate Vitest config that uses vitest's bundled Vite version
// to avoid the type mismatch between vite@8 and vitest@1's bundled vite@5
export default defineConfig({
  plugins: [react() as never],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
