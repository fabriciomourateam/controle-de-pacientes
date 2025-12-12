import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Usar polyfill customizado para @supabase/node-fetch
      '@supabase/node-fetch': path.resolve(__dirname, './src/polyfills/node-fetch-polyfill.ts'),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    mainFields: ['module', 'main', 'browser'],
    preserveSymlinks: false,
  },
  optimizeDeps: {
    include: ['@/components/InstallPWAButton'],
    exclude: ['@supabase/node-fetch'],
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api/notion-proxy': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select']
        },
        // Garantir que o código seja mais seguro
        format: 'es',
      },
      // Proteção contra erros de prototype
      onwarn(warning, warn) {
        // Ignorar avisos sobre prototype se necessário
        if (warning.code === 'THIS_IS_UNDEFINED') {
          return;
        }
        warn(warning);
      }
    }
  }
})