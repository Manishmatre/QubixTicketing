import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://127.0.0.1:4060';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
      },
      '/uploads': {
        target: BACKEND_URL,
        changeOrigin: true,
      },
      '/socket.io': {
        target: BACKEND_URL,
        ws: true,
      },
    },
  },
});
