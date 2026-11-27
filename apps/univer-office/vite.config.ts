import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@univerjs/presets', '@univerjs/preset-sheets-core'],
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
  },
})