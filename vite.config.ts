import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        '@': new URL('./', import.meta.url).pathname,
      },
    },

    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: ['localhost', '127.0.0.1'],

      hmr: env.DISABLE_HMR !== 'true',

      watch: env.DISABLE_HMR === 'true' ? null : {},

      proxy: {
        '/api': 'http://localhost:3001',
      },
    },
  };
});