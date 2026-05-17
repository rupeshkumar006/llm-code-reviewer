import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  envDir: '../',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@monaco-editor') || id.includes('monaco-editor')) return 'editor';
            if (id.includes('recharts') || id.includes('d3-')) return 'charts';
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('react/')) return 'vendor';
          }
        },
      },
    },
  },
})
