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
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MiB
      },
      manifest: {
        name: 'Meine App',
        short_name: 'App',
        description: 'Meine Vue PWA',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 80,
    proxy: {
      '^/api/(?!v1/socket\\.io)': {
        target: 'http://mos-test.home',
        changeOrigin: true,
      },
      '/api/v1/socket.io': {
        target: 'http://mos-test.home:998',
        changeOrigin: true,
        ws: true,
      },
      '/ws': {
        target: 'ws://mos-test.home:998',
        ws: true,
      },
      '/api/v1/notify': {
        target: 'http://mos-test.home',
        changeOrigin: true,
        ws: true,
      },
      '/api/v1/vm/vnc/ws': {
        target: 'ws://mos-test.home:998',
        changeOrigin: true,
        ws: true,
      },
      '/_plugins': {
        target: 'http://mos-test.home',
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
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: ['./reboot.html', './index.html', './shutdown.html'],
    },
  },
});
