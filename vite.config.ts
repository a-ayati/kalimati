import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        // التسجيل من main.tsx (يعيد تحميل الصفحة تلقائياً عند صدور نسخة جديدة)
        injectRegister: false,
        includeAssets: ['favicon.ico', 'favicon-64.png', 'apple-touch-icon.png', 'og.png'],
        manifest: {
          id: '/',
          name: 'كلماتي — كلماتٌ تبقى',
          short_name: 'كلماتي',
          description: 'منصة لنشر أقوال وخواطر أصلية بالفصحى والدارجة الجزائرية مع تخصيص فني وبطاقات مشاركة.',
          theme_color: '#0d0d0f',
          background_color: '#0d0d0f',
          display: 'standalone',
          orientation: 'portrait-primary',
          dir: 'rtl',
          lang: 'ar',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          // استقبال الإشعار اليومي وفتح المقولة عند النقر عليه
          importScripts: ['push-sw.js'],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
          // نسخ بطاقة المشاركة تُحمَّل عند الحاجة فقط
          globIgnores: ['**/*-gold.woff2'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          // الخادم يتولى هذه المسارات — لا يجب أن يجيب عنها التطبيق المخزّن
          navigateFallbackDenylist: [/^\/api\//, /^\/sitemap\.xml$/, /^\/robots\.txt$/],
          runtimeCaching: [
            {
              // أحدث الأقوال من الشبكة أولاً، وآخر نسخة عند انقطاع الاتصال
              urlPattern: ({ url }) => url.pathname === '/api/quotes',
              handler: 'NetworkFirst',
              options: { cacheName: 'kalimati-quotes', networkTimeoutSeconds: 4 },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // أثناء التطوير: تمرير طلبات /api إلى خادم wrangler المحلي (npm run preview)
      proxy: { '/api': 'http://localhost:8787', '/sitemap.xml': 'http://localhost:8787' },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
