import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import federation from '@originjs/vite-plugin-federation';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'mos-host',
      remotes: {},
      shared: ['vue', 'vue-router', 'vuetify'],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      }
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 80,
    proxy: {
      '^/api/(?!v1/socket\\.io)': {
        target: 'http://192.168.1.2',
        changeOrigin: true,
      },
      '/api/v1/socket.io': {
        target: 'http://192.168.1.2:3000',
        changeOrigin: true,
        ws: true,
      },
      '/ws': {
        target: 'ws://192.168.1.2:3000',
        ws: true,
      },
      '/api/v1/notify': {
        target: 'http://192.168.1.2',
        changeOrigin: true,
        ws: true,
      },
      '/api/v1/vm/vnc/ws': {
        target: 'ws://192.168.1.2:3000',
        changeOrigin: true,
        ws: true,
      },
      '/_plugins': {
        target: 'http://192.168.1.2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_plugins/, '/plugins'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
