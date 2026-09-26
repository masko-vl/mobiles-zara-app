/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Enables Testing Library's automatic cleanup between tests.
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
