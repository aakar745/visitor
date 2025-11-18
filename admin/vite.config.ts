import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Path aliases for cleaner imports
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@store': fileURLToPath(new URL('./src/store', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@constants': fileURLToPath(new URL('./src/constants', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
    },
  },

  // Server configuration
  server: {
    port: 5173,
    host: true,
    open: true,
    cors: true,
  },

  // Build optimizations
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    cssCodeSplit: true,

    // Rollup options for code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // React core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          
          // React Router
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor';
          }
          
          // State management
          if (id.includes('node_modules/@reduxjs') || 
              id.includes('node_modules/react-redux') ||
              id.includes('node_modules/@tanstack/react-query')) {
            return 'state-vendor';
          }
          
          // Ant Design - split into smaller chunks
          if (id.includes('node_modules/antd')) {
            // Split Ant Design components by category
            if (id.includes('antd/es/form') || 
                id.includes('antd/es/input') ||
                id.includes('antd/es/select') ||
                id.includes('antd/es/date-picker')) {
              return 'antd-forms';
            }
            if (id.includes('antd/es/table') || 
                id.includes('antd/es/pagination')) {
              return 'antd-tables';
            }
            if (id.includes('antd/es/modal') || 
                id.includes('antd/es/drawer') ||
                id.includes('antd/es/notification')) {
              return 'antd-overlays';
            }
            return 'antd-core';
          }
          
          // Ant Design Icons
          if (id.includes('node_modules/@ant-design/icons')) {
            return 'antd-icons';
          }
          
          // Date libraries
          if (id.includes('node_modules/date-fns') || 
              id.includes('node_modules/dayjs')) {
            return 'date-vendor';
          }
          
          // Form libraries
          if (id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform') ||
              id.includes('node_modules/yup')) {
            return 'form-vendor';
          }
          
          // Utilities
          if (id.includes('node_modules/axios') || 
              id.includes('node_modules/js-cookie')) {
            return 'utils-vendor';
          }
          
          // All other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        
        // Asset file naming
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name || '')) {
            return `images/[name]-[hash][extname]`;
          }
          
          if (/\.(woff|woff2|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            return `fonts/[name]-[hash][extname]`;
          }
          
          return `assets/[name]-[hash][extname]`;
        },
      },
    },

    // Chunk size warning limit (increased for Ant Design)
    chunkSizeWarningLimit: 600,
  },

  // Preview server
  preview: {
    port: 4173,
    host: true,
    open: true,
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      '@tanstack/react-query',
      'antd',
      '@ant-design/icons',
    ],
    exclude: ['@vitejs/plugin-react-swc'],
  },
})
