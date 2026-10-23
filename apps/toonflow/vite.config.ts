import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { jimengProxyPlugin } from './server/vite-jimeng-plugin.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), jimengProxyPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
