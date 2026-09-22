import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/stajin-website/',
  plugins: [react()],
  server: {
    port: 5173,
    hmr: {
      overlay: false // Hata ekranının tarayıcıyı kilitlemesini engeller
    }
  },
  optimizeDeps: {
    entries: ['index.html', 'src/**/*.{ts,tsx,js,jsx}']
  }
})