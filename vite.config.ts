/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri sets TAURI_ENV_PLATFORM while it builds the desktop app.
const isDesktop = Boolean(process.env.TAURI_ENV_PLATFORM);

export default defineConfig({
  // Website: must match the GitHub repo name for GitHub Pages.
  // Desktop app: files are loaded from inside the app, so use relative paths.
  base: isDesktop ? './' : '/pit-desk/',
  plugins: [react()],
  clearScreen: false,
  server: { port: 5173, strictPort: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
